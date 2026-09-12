import assert from "node:assert/strict";
import test from "node:test";
import { createDiagnosticHandler } from "./handler";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { getUtcMonth } from "@/lib/costs/openaiCostProvider";
import type { GitHubCostResult } from "@/lib/costs/githubCostProvider";

const request = (method = "POST", origin = "https://example.com") => new Request("https://example.com/api/admin/diagnostics/github-billing", {
  method, headers: origin ? { origin } : {},
});
const empty: GitHubCostResult = {
  fetchStatus: "empty", usage: [], costs: null,
  period: { billingMonth: "2026-09", year: 2026, month: 9, selectionTimeZone: "Asia/Tokyo" },
  metadata: { costBasis: "usage_based", isFinalInvoice: false, subscriptionFeesIncluded: false,
    taxesIncluded: false, currencyConversionApplied: false, emptyMeansZeroBill: false },
};
const defaults = {
  getSession: async () => ({ uid: "admin", email: "admin@example.com", email_verified: true }),
  isAdminEmail: (email: string) => email === "admin@example.com",
  isSameOrigin: (req: Request) => isSameOriginRequest(req, { isVercel: false }),
  currentMonth: () => getUtcMonth(new Date("2026-08-31T15:00:00Z")),
  getCost: async (): Promise<GitHubCostResult> => empty,
};

test("unauthenticated, non-admin, unverified email and invalid uid never call provider", async () => {
  for (const session of [null, { uid: "user", email: "user@example.com", email_verified: true },
    { uid: "admin", email: "admin@example.com", email_verified: false },
    { uid: "", email: "admin@example.com", email_verified: true }]) {
    let calls = 0;
    const handler = createDiagnosticHandler({ ...defaults, getSession: async () => session,
      getCost: async () => { calls++; return empty; } });
    const response = await handler(request());
    assert.equal(response.status, session ? 403 : 401);
    assert.equal(calls, 0);
  }
});

test("GET and other methods never authenticate or call provider", async () => {
  const handler = createDiagnosticHandler({ ...defaults,
    getSession: async () => { assert.fail(); }, getCost: async () => { assert.fail(); } });
  for (const method of ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]) {
    const response = await handler(request(method));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
  }
});

test("cross-origin and missing origin cannot trigger diagnosis", async () => {
  const handler = createDiagnosticHandler({ ...defaults, getCost: async () => { assert.fail(); } });
  for (const origin of ["https://other.example", "", "null"]) {
    assert.equal((await handler(request("POST", origin))).status, 403);
  }
});

test("POST executes once, disables retry and uses the admin UTC month at JST boundary", async () => {
  let calls = 0;
  const handler = createDiagnosticHandler({ ...defaults, getCost: async (options) => {
    calls++;
    assert.deepEqual(options, { reportingMonth: "2026-08", maxAttempts: 1 });
    return empty;
  } });
  const response = await handler(request());
  assert.equal(calls, 1);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, status: "empty", dataState: "empty",
    recordCount: 0, targetRepositoryRecordCount: 0, otherRepositoryRecordCount: 0,
    unscopedRecordCount: 0, currencies: [] });
});

test("success returns only safe counts and native currencies", async () => {
  const row = { date: "2026-09-01", product: "secret", sku: "secret", quantity: 1, unitType: "minutes",
    pricePerUnit: 123, grossAmount: 123, discountAmount: 0, netAmount: 123, repositoryName: "private/secret" };
  const result: GitHubCostResult = { ...empty, fetchStatus: "success", usage: [
    { ...row, attribution: "project", currency: "USD" },
    { ...row, attribution: "other_repository", currency: "USD" },
    { ...row, attribution: "unattributed", currency: null },
  ] };
  const response = await createDiagnosticHandler({ ...defaults, getCost: async () => result })(request());
  assert.deepEqual(await response.json(), { ok: true, status: "success", dataState: "available",
    recordCount: 3, targetRepositoryRecordCount: 1, otherRepositoryRecordCount: 1,
    unscopedRecordCount: 1, currencies: ["USD", null] });
});

for (const [httpStatus, classification] of [[401, "auth"], [403, "permission"], [404, "not_found"], [429, "rate_limit"], [500, "api"]] as const) {
  test(`safe classification for upstream ${httpStatus}`, async () => {
    const response = await createDiagnosticHandler({ ...defaults, getCost: async () => ({
      fetchStatus: "error", reason: "http_error", httpStatus, costs: null, attempts: 1,
    }) })(request());
    assert.deepEqual(await response.json(), { ok: false, status: classification });
  });
}

test("fallback, timeout and secondary rate limit retain safe classification", async () => {
  const cases: [GitHubCostResult, string][] = [
    [{ fetchStatus: "fallback", reason: "not_configured", costs: null }, "config"],
    [{ fetchStatus: "error", reason: "timeout", costs: null, attempts: 1 }, "timeout"],
    [{ fetchStatus: "error", reason: "rate_limited", httpStatus: 403, costs: null, attempts: 1 }, "rate_limit"],
  ];
  for (const [result, status] of cases) {
    const response = await createDiagnosticHandler({ ...defaults, getCost: async () => result })(request());
    assert.deepEqual(await response.json(), { ok: false, status });
  }
});

test("exceptions and secret-bearing results are never logged or returned raw", async (t) => {
  const logs = (["log", "info", "warn", "error", "debug", "trace"] as const).map((key) => t.mock.method(console, key, () => undefined));
  for (const stage of ["getSession", "isAdminEmail", "getCost"] as const) {
    const handler = createDiagnosticHandler({ ...defaults, [stage]: () => { throw new Error("Authorization Bearer secret-token"); } });
    const response = await handler(request());
    assert.deepEqual(await response.json(), { ok: false, status: "internal" });
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
