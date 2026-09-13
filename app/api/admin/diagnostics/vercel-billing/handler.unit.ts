import assert from "node:assert/strict";
import test from "node:test";
import { createVercelBillingDiagnostic } from "./handler";
import { isSameOriginRequest } from "@/lib/auth/origin";

const token = "test-secret-sentinel";
const req = (method = "POST", origin = "https://example.com") => new Request("https://example.com/api/admin/diagnostics/vercel-billing", { method, headers: { origin } });
const defaults = {
  getSession: async () => ({ uid: "admin", email: "admin@example.com", email_verified: true }),
  isAdminEmail: (email: string) => email === "admin@example.com",
  isSameOrigin: (r: Request) => isSameOriginRequest(r, { isVercel: false }),
  env: { VERCEL_BILLING_TOKEN: token },
  fetch: async () => new Response(""),
};
const row = { BillingCurrency: "USD", ChargeCategory: "Usage", BilledCost: "1.23", EffectiveCost: 0,
  ServiceName: "private-service", Tags: { ProjectId: "prj_CR4eCJFnYLtRTX2x6IQA9TPGX6lM", ProjectName: "private-name" } };

test("POST uses fixed URL, no team/slug, Bearer and exactly one request; parses JSONL", async () => {
  let calls = 0;
  const handler = createVercelBillingDiagnostic({ ...defaults, fetch: async (input, init) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, "https://api.vercel.com/v1/billing/charges");
    assert.deepEqual(Object.fromEntries(url.searchParams), { from: "2026-09-01T00:00:00.000Z", to: "2026-10-01T00:00:00.000Z" });
    assert.equal(init?.method, "GET");
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    assert.equal(new Headers(init?.headers).get("Authorization"), `Bearer ${token}`);
    return new Response([row, { ...row, Tags: { ProjectId: "other" } }, { ...row, Tags: { ProjectName: "only-name" } }].map((item) => JSON.stringify(item)).join("\r\n") + "\n\n");
  } });
  const response = await handler(req());
  assert.equal(calls, 1);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, httpStatus: 200, status: "success", dataState: "available",
    recordCount: 3, targetProjectRecordCount: 1, otherProjectRecordCount: 1, unscopedRecordCount: 1,
    currencies: ["USD"], chargeCategories: ["Usage"], billedCostPresent: true, effectiveCostPresent: true });
});

test("empty is successful with no amounts assumed", async () => {
  const result = await (await createVercelBillingDiagnostic(defaults)(req())).json();
  assert.equal(result.dataState, "empty");
  assert.equal(result.billedCostPresent, false);
  assert.equal(result.recordCount, 0);
});

for (const [status, classification] of [[401, "auth"], [403, "permission"], [404, "not_found"], [429, "rate_limit"], [500, "api"], [503, "api"]] as const) {
  test(`${status} returns safe classification without retry`, async () => {
    let calls = 0;
    const response = await createVercelBillingDiagnostic({ ...defaults, fetch: async () => { calls++; return new Response(token, { status }); } })(req());
    assert.equal(calls, 1);
    assert.deepEqual(await response.json(), { ok: false, status: classification, httpStatus: status });
  });
}

test("malformed JSONL discards partial data", async () => {
  for (const text of [JSON.stringify(row) + "\n{bad", "[]", "null", "{}", JSON.stringify({ ...row, Tags: "invalid" })]) {
    const response = await createVercelBillingDiagnostic({ ...defaults, fetch: async () => new Response(text) })(req());
    assert.deepEqual(await response.json(), { ok: false, status: "invalid_response", httpStatus: 200 });
  }
});

test("missing token, cross origin and admin rejection prevent all requests", async () => {
  const fetch = async () => { assert.fail("Network forbidden"); };
  assert.equal((await createVercelBillingDiagnostic({ ...defaults, fetch, env: {} })(req())).status, 503);
  for (const origin of ["", "null", "https://other.example"]) {
    assert.equal((await createVercelBillingDiagnostic({ ...defaults, fetch })(req("POST", origin))).status, 403);
  }
  for (const session of [null, { uid: "u", email: "other@example.com", email_verified: true },
    { uid: "u", email: "admin@example.com", email_verified: false }, { uid: "", email: "admin@example.com", email_verified: true }]) {
    const response = await createVercelBillingDiagnostic({ ...defaults, fetch, getSession: async () => session })(req());
    assert.equal(response.status, session ? 403 : 401);
  }
});

test("GET and non-POST methods cannot authenticate or fetch", async () => {
  const handler = createVercelBillingDiagnostic({ ...defaults, getSession: async () => { assert.fail(); }, fetch: async () => { assert.fail(); } });
  for (const method of ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]) assert.equal((await handler(req(method))).status, 405);
});

test("timeout bounds stalled body and aborts the request", async () => {
  let signal: AbortSignal | null | undefined;
  const response = await createVercelBillingDiagnostic({ ...defaults, timeoutMs: 5, fetch: async (_input, init) => {
    signal = init?.signal;
    return new Response(new ReadableStream({ start() {} }));
  } })(req());
  assert.equal((await response.json()).status, "timeout");
  assert.equal(signal?.aborted, true);
});

test("oversized response fails safely", async () => {
  const response = await createVercelBillingDiagnostic({ ...defaults, fetch: async () => new Response("x".repeat(5 * 1024 * 1024 + 1)) })(req());
  assert.equal((await response.json()).ok, false);
});

test("secrets in rows, headers or exceptions are never echoed or logged", async (t) => {
  const logs = (["log", "info", "error", "warn", "debug", "trace"] as const).map((key) => t.mock.method(console, key, () => undefined));
  const fetches: typeof globalThis.fetch[] = [
    async () => { throw new Error(`Authorization ${token}`); },
    async () => new Response(token, { status: 403, headers: { "x-secret": token } }),
    async () => new Response(JSON.stringify({ ...row, BillingCurrency: token, ChargeCategory: token, Tags: { ProjectId: token }, ServiceName: token })),
  ];
  for (const fetch of fetches) {
    const response = await createVercelBillingDiagnostic({ ...defaults, fetch })(req());
    assert.doesNotMatch(await response.text(), /test-secret-sentinel|Authorization|private-service|private-name|1.23/);
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
