import "server-only";
import { BigQuery, type BigQueryOptions } from "@google-cloud/bigquery";
import { requireAdminSession } from "@/lib/auth/admin";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  buildBigQueryBillingQuery, readBigQueryBillingConfig,
  createGoogleCloudBigQueryClient, type BillingQuery,
} from "@/lib/costs/googleCloudBigQueryAdapter";

type Category = "auth" | "permission" | "api" | "query" | "config";
const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

export function classify(error: unknown): Category {
  const value = record(error);
  const response = record(value.response);
  const code = value.code ?? response.status;
  const oauth = record(response.data).error;
  const reasons = Array.isArray(value.errors) ? value.errors.map(item => record(item).reason) : [];
  if (code === 401 || reasons.includes("authError") || oauth === "invalid_grant" || oauth === "invalid_client" ||
      (typeof code === "string" && /^(ERR_OSSL_|ERR_CRYPTO_)/.test(code))) return "auth";
  if (reasons.some(reason => ["accessNotConfigured", "serviceDisabled", "backendError", "internalError", "rateLimitExceeded", "quotaExceeded"].includes(String(reason))) ||
      code === 429 || (typeof code === "number" && code >= 500) ||
      ["ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(String(code))) return "api";
  if (code === 403 || reasons.includes("accessDenied")) return "permission";
  if (code === 404 || reasons.includes("notFound")) return "config";
  return "query";
}

type Dependencies = {
  authorize: () => Promise<unknown>;
  env: Readonly<Record<string, string | undefined>>;
  createSdk: (options: BigQueryOptions) => { query(request: BillingQuery & { maximumBytesBilled: string }): Promise<unknown> };
};
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store, max-age=0" },
});

// Temporary diagnostic: delete this directory after the production check.
export function createHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    // GET/HEAD never verify credentials or construct a BigQuery client.
    if (request.method !== "POST") return json({ error: "query" }, 405);
    if (!isSameOriginRequest(request)) return json({ error: "auth" }, 403);
    try { await deps.authorize(); } catch { return json({ error: "auth" }, 401); }
    const config = readBigQueryBillingConfig(deps.env);
    if (!config || config.projectId !== "japan-travel-buddy-96590" || config.dataset !== "billing_export" ||
        config.table !== "gcp_billing_export_v1_019E0D_379F86_EEFC9F" || config.location !== "asia-northeast1" ||
        deps.env.BIGQUERY_EMULATOR_HOST) return json({ error: "config" }, 500);
    let failure: Category = "config";
    let called = false;
    try {
      const client = createGoogleCloudBigQueryClient({ env: deps.env, createClient(settings) {
        const sdk = deps.createSdk({ ...settings, autoRetry: false, maxRetries: 0 });
        return { async query(query) {
          if (called) throw new Error("query");
          called = true;
          failure = "query";
          try { return await sdk.query({ ...query, maximumBytesBilled: "100000000" }); }
          catch (error) { failure = classify(error); throw new Error(failure); }
        } };
      } });
      if (!client) return json({ error: "config" }, 500);
      const rows = await client.query(buildBigQueryBillingQuery(config, {
        startTime: "2026-08-31T15:00:00.000Z", endTime: "2026-09-30T15:00:00.000Z",
      }));
      if (!Array.isArray(rows)) throw new Error("query");
      let rowCount = 0;
      const currencies = new Set<string>();
      for (const item of rows) {
        const row = record(item);
        if (row.project_id !== config.projectId || typeof row.currency !== "string" ||
            !/^[A-Z]{3}$/.test(row.currency) || currencies.has(row.currency) ||
            !/^[1-9][0-9]*$/.test(String(row.source_row_count)) ||
            !/^-?\d+(\.\d+)?$/.test(String(row.amount)) || !Number.isFinite(Number(row.amount))) throw new Error("query");
        rowCount += Number(row.source_row_count);
        if (!Number.isSafeInteger(rowCount)) throw new Error("query");
        currencies.add(row.currency);
      }
      return json({ ok: true, rowCount, currencies: [...currencies].sort(), hasAggregate: rows.length > 0 });
    } catch { return json({ error: failure }, 500); }
  };
}

export const handle = createHandler({
  authorize: () => requireAdminSession(), env: process.env,
  createSdk: options => new BigQuery(options),
});
