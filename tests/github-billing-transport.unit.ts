import assert from "node:assert/strict";
import test from "node:test";

import { getGitHubMonthlyCost } from "../lib/costs/githubCostProvider";
import {
  getGitHubProductionMonthlyCost,
  githubBillingProductionFetch,
} from "../lib/costs/githubBillingTransport";

const env = { GITHUB_BILLING_TOKEN: "transport-test-secret", GITHUB_BILLING_USERNAME: "hiroren0130-droid" };
const options = { env, reportingMonth: "2026-09" };

test("production entry forwards provider URL, auth, version, cache, redirects and signal", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), "https://api.github.com/users/hiroren0130-droid/settings/billing/usage?year=2026&month=9");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), `Bearer ${env.GITHUB_BILLING_TOKEN}`);
    assert.equal(headers.get("Accept"), "application/vnd.github+json");
    assert.equal(headers.get("X-GitHub-Api-Version"), "2026-03-10");
    assert.equal(init?.method, "GET");
    assert.equal(init?.cache, "no-store");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ usageItems: [] });
  });
  assert.equal((await getGitHubProductionMonthlyCost(options)).fetchStatus, "empty");
  assert.equal(fetch.mock.callCount(), 1);
});

test("production entry reads environment credentials through the provider", async (t) => {
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  try {
    Object.assign(process.env, env);
    t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(new URL(String(input)).pathname, `/users/${env.GITHUB_BILLING_USERNAME}/settings/billing/usage`);
      assert.equal(new Headers(init?.headers).get("Authorization"), `Bearer ${env.GITHUB_BILLING_TOKEN}`);
      return Response.json({ usageItems: [] });
    });
    assert.equal((await getGitHubProductionMonthlyCost({ reportingMonth: "2026-09" })).fetchStatus, "empty");
  } finally {
    for (const key of Object.keys(env)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("missing token or username preserves fallback without calling global fetch", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => { assert.fail("No network permitted"); });
  for (const key of Object.keys(env)) {
    assert.deepEqual(await getGitHubProductionMonthlyCost({ ...options, env: { ...env, [key]: "" } }), {
      fetchStatus: "fallback", reason: "not_configured", costs: null,
    });
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("explicit mock fetch overrides production fetch", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { assert.fail("Must use injected fetch"); });
  let calls = 0;
  const result = await getGitHubProductionMonthlyCost({ ...options, fetch: async () => {
    calls++;
    return Response.json({ usageItems: [] });
  } });
  assert.equal(result.fetchStatus, "empty");
  assert.equal(calls, 1);
  assert.equal((await getGitHubMonthlyCost(options)).fetchStatus, "fallback");
});

test("production transport is independently injectable and passes response unchanged", async (t) => {
  const response = Response.json({ usageItems: [] });
  t.mock.method(globalThis, "fetch", async () => response);
  assert.equal((await getGitHubMonthlyCost({ ...options, fetch: githubBillingProductionFetch })).fetchStatus, "empty");
});

for (const status of [401, 403, 404, 429, 500, 503]) {
  test(`production path preserves ${status} classification and retry count`, async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response("secret response body", { status }));
    const result = await getGitHubProductionMonthlyCost(options);
    assert.deepEqual(result, {
      fetchStatus: "error", reason: status === 429 ? "rate_limited" : "http_error",
      httpStatus: status, costs: null, attempts: status >= 500 ? 3 : 1,
    });
    assert.equal(fetch.mock.callCount(), status >= 500 ? 3 : 1);
  });
}

test("403 rate limit headers survive transport unchanged", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, {
    status: 403, headers: { "x-ratelimit-remaining": "0", "retry-after": "60" },
  }));
  const result = await getGitHubProductionMonthlyCost(options);
  if (result.fetchStatus !== "error") assert.fail();
  assert.equal(result.reason, "rate_limited");
  assert.equal(fetch.mock.callCount(), 1);
});

test("timeout reaches global fetch signal without adding retries", async (t) => {
  let signal: AbortSignal | null | undefined;
  const fetch = t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    signal = init?.signal;
    return new Promise<Response>(() => undefined);
  });
  assert.deepEqual(await getGitHubProductionMonthlyCost({ ...options, timeoutMs: 5 }), {
    fetchStatus: "error", reason: "timeout", costs: null, attempts: 1,
  });
  assert.equal(signal?.aborted, true);
  assert.equal(fetch.mock.callCount(), 1);
});

test("transport and provider expose no secret logs, bodies, headers or raw exceptions", async (t) => {
  const logs = (["log", "info", "warn", "error", "debug", "trace"] as const)
    .map((key) => t.mock.method(console, key, () => undefined));
  const secret = `Authorization: Bearer ${env.GITHUB_BILLING_TOKEN}`;
  const responses: typeof globalThis.fetch[] = [
    async () => { throw new Error(secret); },
    async () => new Response(secret, { status: 401, headers: { "x-secret": secret } }),
    async () => new Response(secret, { status: 200 }),
  ];
  const fetch = t.mock.method(globalThis, "fetch", responses[0]);
  for (const response of responses) {
    fetch.mock.mockImplementation(response);
    const result = await getGitHubProductionMonthlyCost(options);
    assert.equal(result.fetchStatus, "error");
    assert.doesNotMatch(JSON.stringify(result), /transport-test-secret|Authorization|Bearer|x-secret/);
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
