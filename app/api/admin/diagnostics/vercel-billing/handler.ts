import "server-only";

type Dependencies = {
  getSession: () => Promise<{ uid: string; email?: string; email_verified?: boolean } | null>;
  isAdminEmail: (email: string) => boolean;
  isSameOrigin: (request: Request) => boolean;
  fetch: typeof globalThis.fetch;
  env: Readonly<Record<string, string | undefined>>;
  timeoutMs?: number;
};
const TARGET = "prj_CR4eCJFnYLtRTX2x6IQA9TPGX6lM";
const MAX_BYTES = 5 * 1024 * 1024;
const categories = new Set(["Usage", "Purchase", "Tax", "Credit", "Adjustment"]);
const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const fail = (status: string, code: number, httpStatus: number | null = null) =>
  reply({ ok: false, status, httpStatus }, code);

/** FOCUS rows stay private. Unknown categories/currencies become null, never raw text. */
function summarize(text: string) {
  let recordCount = 0, targetProjectRecordCount = 0, otherProjectRecordCount = 0, unscopedRecordCount = 0;
  let billedCostPresent = false, effectiveCostPresent = false;
  const currencies = new Set<string | null>();
  const chargeCategories = new Set<string | null>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row: unknown = JSON.parse(line);
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Invalid row");
    const r = row as Record<string, unknown>;
    if (!("BilledCost" in r || "EffectiveCost" in r || "ChargeCategory" in r || "BillingCurrency" in r)) throw new Error("Invalid row");
    if (r.Tags !== undefined && r.Tags !== null && (typeof r.Tags !== "object" || Array.isArray(r.Tags))) throw new Error("Invalid tags");
    const tags = r.Tags as Record<string, unknown> | null | undefined;
    const project = tags?.ProjectId;
    if (project === TARGET) targetProjectRecordCount++;
    else if (typeof project === "string" && project.trim()) otherProjectRecordCount++;
    else unscopedRecordCount++;
    recordCount++;
    currencies.add(typeof r.BillingCurrency === "string" && /^[A-Z]{3}$/.test(r.BillingCurrency) ? r.BillingCurrency : null);
    chargeCategories.add(typeof r.ChargeCategory === "string" && categories.has(r.ChargeCategory) ? r.ChargeCategory : null);
    billedCostPresent ||= r.BilledCost !== undefined && r.BilledCost !== null;
    effectiveCostPresent ||= r.EffectiveCost !== undefined && r.EffectiveCost !== null;
  }
  return { recordCount, targetProjectRecordCount, otherProjectRecordCount, unscopedRecordCount,
    currencies: [...currencies], chargeCategories: [...chargeCategories], billedCostPresent, effectiveCostPresent };
}

export function createVercelBillingDiagnostic(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return new Response(null, {
      status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" },
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    let httpStatus: number | null = null;
    const controller = new AbortController();
    try {
      if (!deps.isSameOrigin(request)) return fail("permission", 403);
      const session = await deps.getSession();
      if (!session) return fail("auth", 401);
      if (!session.uid || !session.email || session.email_verified !== true || !deps.isAdminEmail(session.email)) return fail("permission", 403);
      const token = deps.env.VERCEL_BILLING_TOKEN?.trim();
      if (!token) return fail("config", 503);
      const url = new URL("https://api.vercel.com/v1/billing/charges");
      url.searchParams.set("from", "2026-09-01T00:00:00.000Z");
      url.searchParams.set("to", "2026-10-01T00:00:00.000Z");
      // maxAttempts = 1: one fetch, no retries or redirect following.
      return await Promise.race([
        (async () => {
          const response = await deps.fetch(url, { method: "GET", cache: "no-store", redirect: "error",
            signal: controller.signal, headers: { Authorization: `Bearer ${token}` } });
          httpStatus = response.status;
          if (response.status !== 200) {
            void response.body?.cancel().catch(() => undefined);
            const status = response.status === 401 ? "auth" : response.status === 403 ? "permission"
              : response.status === 404 ? "not_found" : response.status === 429 ? "rate_limit" : "api";
            return fail(status, 502, response.status);
          }
          const reader = response.body?.getReader();
          let text = "", bytes = 0;
          const decoder = new TextDecoder("utf-8", { fatal: true });
          if (reader) {
            try {
              while (true) {
                const chunk = await reader.read();
                if (chunk.done) break;
                bytes += chunk.value.byteLength;
                if (bytes > MAX_BYTES) throw new Error("Response limit");
                text += decoder.decode(chunk.value, { stream: true });
              }
              text += decoder.decode();
            } finally { void reader.cancel().catch(() => undefined); }
          }
          try {
            const summary = summarize(text);
            return reply({ ok: true, httpStatus: 200, status: "success",
              dataState: summary.recordCount ? "available" : "empty", ...summary });
          } catch { return fail("invalid_response", 502, 200); }
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => {
          timedOut = true; controller.abort(); reject(new Error("Timeout"));
        }, Math.min(15_000, Math.max(1, deps.timeoutMs ?? 15_000))); }),
      ]);
    } catch {
      controller.abort();
      return fail(timedOut ? "timeout" : "internal", timedOut ? 504 : 500, httpStatus);
    } finally { clearTimeout(timer); }
  };
}
