/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

// Explicit opt-in only. Supply credentials through the process environment.
// node scripts/checkGoogleCloudBilling.cjs --execute-once
// One SQL execution per invocation; authentication/polling can use multiple HTTP requests.
const { registerHooks } = require("node:module");

function classify(error) {
  if (!error || typeof error !== "object") return "query";
  const reasons = Array.isArray(error.errors)
    ? error.errors.map((item) => item?.reason).filter((item) => typeof item === "string")
    : [];
  const code = error.code ?? error.response?.status;
  const oauthError = error.response?.data?.error;
  if (code === 401 || reasons.includes("authError") ||
      oauthError === "invalid_grant" || oauthError === "invalid_client" ||
      (typeof code === "string" && (code.startsWith("ERR_OSSL_") || code.startsWith("ERR_CRYPTO_")))) return "auth";
  if (reasons.some((reason) => ["accessNotConfigured", "serviceDisabled", "backendError", "internalError", "rateLimitExceeded", "quotaExceeded"].includes(reason)) ||
      code === 429 || (typeof code === "number" && code >= 500)) return "api";
  if (code === 403 || reasons.includes("accessDenied")) return "permission";
  if (code === 404 || reasons.includes("notFound")) return "config";
  if (["ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(code)) return "api";
  return "query";
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-once") {
    throw new Error("config");
  }
  // Resolve Next's server-only marker for this standalone Node entry point only.
  registerHooks({ resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "server-only"
      ? "next/dist/compiled/server-only/empty.js" : specifier, context);
  } });
  require("tsx/cjs");
  const { BigQuery } = require("@google-cloud/bigquery");
  const {
    readBigQueryBillingConfig,
    buildBigQueryBillingQuery,
    createGoogleCloudBigQueryClient,
  } = require("../lib/costs/googleCloudBigQueryAdapter.ts");
  const config = readBigQueryBillingConfig();
  if (!config || config.projectId !== "japan-travel-buddy-96590" ||
      config.dataset !== "billing_export" ||
      config.table !== "gcp_billing_export_v1_019E0D_379F86_EEFC9F" ||
      config.location !== "asia-northeast1" ||
      process.env.BIGQUERY_EMULATOR_HOST) throw new Error("config");

  let failure = "query";
  let called = false;
  // No SDK diagnostics; only the fixed summary below reaches stdout/stderr.
  BigQuery.setLogFunction(() => {});
  let client;
  try {
    client = createGoogleCloudBigQueryClient({ createClient(settings) {
      const sdk = new BigQuery({ ...settings, autoRetry: false, maxRetries: 0 });
      return { async query(request) {
        if (called) throw new Error("query");
        called = true;
        try {
          return await sdk.query({
            ...request,
            maximumBytesBilled: "100000000", // 100 MB ceiling; never retry with a higher cap.
          });
        } catch (error) {
          failure = classify(error);
          throw new Error(failure);
        }
      } };
    } });
  } catch {
    throw new Error("config");
  }
  if (!client) throw new Error("config");
  let rows;
  try {
    rows = await client.query(buildBigQueryBillingQuery(config, {
      // September 2026 in JST, inclusive start and exclusive end.
      startTime: "2026-08-31T15:00:00.000Z",
      endTime: "2026-09-30T15:00:00.000Z",
    }));
  } catch {
    throw new Error(failure);
  }
  if (!Array.isArray(rows)) throw new Error("query");
  let count = 0;
  const currencies = new Set();
  for (const row of rows) {
    if (!row || row.project_id !== config.projectId ||
        typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency) ||
        currencies.has(row.currency) ||
        !/^[1-9][0-9]*$/.test(String(row.source_row_count)) ||
        !/^-?\d+(\.\d+)?$/.test(String(row.amount)) ||
        !Number.isFinite(Number(row.amount))) throw new Error("query");
    count += Number(row.source_row_count);
    if (!Number.isSafeInteger(count)) throw new Error("query");
    currencies.add(row.currency);
  }
  console.log(JSON.stringify({
    query: "success",
    sourceRowCount: count,
    currencies: [...currencies].sort(),
    hasAggregate: rows.length > 0,
  }));
}

if (require.main === module) {
  main().catch((error) => {
    const category = ["auth", "permission", "api", "query", "config"].includes(error?.message)
      ? error.message : "config";
    console.error(category);
    process.exitCode = 1;
  });
}
