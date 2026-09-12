import assert from "node:assert/strict";
import test from "node:test";
import { getGitHubMonthlyCost, type GitHubCostOptions } from "../lib/costs/githubCostProvider";

const env = { GITHUB_BILLING_TOKEN: "test-secret-token", GITHUB_BILLING_USERNAME: "hiroren0130-droid" };
const row = { date: "2026-09-01", product: "Actions", sku: "Actions Linux", quantity: 100,
  unitType: "minutes", pricePerUnit: 0.008, grossAmount: 0.8, discountAmount: 0.1,
  netAmount: 0.7, repositoryName: "hiroren0130-droid/japan-travel-buddy" };
const options = { env, reportingMonth: "2026-09" };
const read = (usageItems: unknown[], extra: GitHubCostOptions = {}) => getGitHubMonthlyCost({
  ...options, fetch: async () => Response.json({ usageItems }), ...extra,
});

test("missing credentials or transport safely falls back without network", async () => {
  for (const key of Object.keys(env)) {
    const result = await getGitHubMonthlyCost({ ...options, env: { ...env, [key]: " " },
      fetch: async () => { assert.fail("No request allowed"); } });
    assert.equal(result.fetchStatus, "fallback");
  }
  assert.deepEqual(await getGitHubMonthlyCost(options), {
    fetchStatus: "fallback", reason: "transport_not_configured", costs: null,
  });
});

test("success constructs monthly endpoint, disables redirects/cache and retains usage", async () => {
  const result = await read([row], { fetch: async (input, init) => {
    assert.equal(String(input), "https://api.github.com/users/hiroren0130-droid/settings/billing/usage?year=2026&month=9");
    assert.equal(init?.cache, "no-store");
    assert.equal(init?.redirect, "error");
    assert.equal(new Headers(init?.headers).get("Authorization"), `Bearer ${env.GITHUB_BILLING_TOKEN}`);
    return Response.json({ usageItems: [row] });
  } });
  assert.equal(result.fetchStatus, "success");
  if (result.fetchStatus !== "success") assert.fail();
  assert.deepEqual(result.usage[0], { ...row, currency: null, attribution: "project" });
  assert.equal(result.period.billingMonth, "2026-09");
  assert.equal(result.metadata.isFinalInvoice, false);
  assert.equal(result.metadata.subscriptionFeesIncluded, false);
  assert.equal(result.metadata.taxesIncluded, false);
});

test("empty is not proof of a zero bill; actual zero usage stays success", async () => {
  const result = await read([]);
  if (result.fetchStatus !== "empty") assert.fail();
  assert.equal(result.costs, null);
  assert.equal(result.metadata.emptyMeansZeroBill, false);
  assert.equal((await read([{ ...row, netAmount: 0 }])).fetchStatus, "success");
});

test("repository attribution and currencies remain separate, with no project allocation", async () => {
  const result = await read([
    { ...row, repositoryName: row.repositoryName.toUpperCase(), currency: "USD" },
    { ...row, currency: "JPY", netAmount: 100 },
    { ...row, currency: "EUR", netAmount: -2 },
    { ...row, repositoryName: "someone/japan-travel-buddy", currency: "USD", netAmount: 99 },
    { ...row, repositoryName: undefined, currency: "USD", netAmount: 50 },
    { ...row, repositoryName: "japan-travel-buddy", netAmount: 30 },
  ]);
  if (result.fetchStatus !== "success") assert.fail();
  assert.deepEqual(result.costs?.project, [
    { currency: "USD", netAmount: 0.7, recordCount: 1 },
    { currency: "JPY", netAmount: 100, recordCount: 1 },
    { currency: "EUR", netAmount: -2, recordCount: 1 },
  ]);
  assert.deepEqual(result.costs?.unattributed, [{ currency: "USD", netAmount: 50, recordCount: 1 }]);
  assert.equal(result.costs?.otherRepositories.length, 2);
  assert.equal(result.metadata.currencyConversionApplied, false);
});

for (const status of [401, 403, 404, 429]) {
  test(`${status} does not retry or read error bodies`, async () => {
    let calls = 0;
    const result = await read([], { fetch: async () => { calls++; return new Response("secret body", { status }); } });
    assert.equal(calls, 1);
    assert.equal(result.fetchStatus, "error");
    if (result.fetchStatus !== "error") assert.fail();
    assert.equal(result.httpStatus, status);
    assert.equal(result.reason, status === 429 ? "rate_limited" : "http_error");
  });
}

test("403 rate limit is identified without retry", async () => {
  const result = await read([], { fetch: async () => new Response(null, { status: 403, headers: { "x-ratelimit-remaining": "0" } }) });
  if (result.fetchStatus !== "error") assert.fail();
  assert.equal(result.reason, "rate_limited");
  assert.equal(result.attempts, 1);
});

test("5xx retries are bounded to three even with excessive configuration", async () => {
  let calls = 0;
  const result = await read([], { maxAttempts: 999, fetch: async () => { calls++; return new Response(null, { status: 503 }); } });
  assert.equal(calls, 3);
  if (result.fetchStatus !== "error") assert.fail();
  assert.equal(result.attempts, 3);
});

test("transient 5xx can recover", async () => {
  let calls = 0;
  const result = await read([], { fetch: async () => ++calls === 1 ? new Response(null, { status: 500 }) : Response.json({ usageItems: [row] }) });
  assert.equal(result.fetchStatus, "success");
  assert.equal(calls, 2);
});

test("timeout aborts and bounds transports that ignore abort", async () => {
  let signal: AbortSignal | null | undefined;
  const result = await read([], { timeoutMs: 5, fetch: async (_, init) => {
    signal = init?.signal;
    return new Promise<Response>(() => undefined);
  } });
  if (result.fetchStatus !== "error") assert.fail();
  assert.equal(result.reason, "timeout");
  assert.equal(result.attempts, 1);
  assert.equal(signal?.aborted, true);
});

test("timeout includes response body reading", async () => {
  const result = await read([], { timeoutMs: 5, fetch: async () => new Response(new ReadableStream({ start() {} })) });
  if (result.fetchStatus !== "error") assert.fail();
  assert.equal(result.reason, "timeout");
});

test("JST year boundary and explicit admin month", async () => {
  const result = await read([], { reportingMonth: undefined, now: () => new Date("2025-12-31T15:00:00Z") });
  if (result.fetchStatus !== "empty") assert.fail();
  assert.equal(result.period.billingMonth, "2026-01");
  const explicit = await read([], { reportingMonth: "2025-12" });
  if (explicit.fetchStatus !== "empty") assert.fail();
  assert.equal(explicit.period.month, 12);
  assert.equal(explicit.period.year, 2025);
  assert.equal((await read([], { reportingMonth: "2026-13", fetch: async () => { assert.fail(); } })).fetchStatus, "error");
});

test("invalid responses are rejected without leaking secrets or logging", async (t) => {
  const logs = (["log", "error", "warn", "info", "debug"] as const).map((key) => t.mock.method(console, key, () => undefined));
  const transports: NonNullable<GitHubCostOptions["fetch"]>[] = [
    async () => { throw new Error(`Authorization Bearer ${env.GITHUB_BILLING_TOKEN}`); },
    async () => new Response(env.GITHUB_BILLING_TOKEN),
    async () => Response.json({ usageItems: [{ ...row, quantity: env.GITHUB_BILLING_TOKEN }] }),
    async () => Response.json({ unexpected: env.GITHUB_BILLING_TOKEN }),
  ];
  for (const fetch of transports) {
    const result = await read([], { fetch });
    assert.equal(result.fetchStatus, "error");
    assert.doesNotMatch(JSON.stringify(result), /test-secret-token|Authorization|Bearer/);
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

test("wrong month and malformed numeric or currency fields cannot become totals", async () => {
  for (const item of [{ ...row, date: "2026-08-31" }, { ...row, netAmount: null }, { ...row, currency: "invalid" }]) {
    assert.equal((await read([item])).fetchStatus, "error");
  }
});
