import assert from "node:assert/strict";
import test from "node:test";
import { createHandler } from "../app/api/diagnostics/billing-7c92e4a18f63/handler";
import { GET, POST } from "../app/api/diagnostics/billing-7c92e4a18f63/route";

const env = {
  GOOGLE_CLOUD_PROJECT_ID: "japan-travel-buddy-96590",
  GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET: "billing_export",
  GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: "gcp_billing_export_v1_019E0D_379F86_EEFC9F",
  GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION: "asia-northeast1",
  FIREBASE_ADMIN_CLIENT_EMAIL: "test@japan-travel-buddy-96590.iam.gserviceaccount.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nFAKE-SECRET\\n-----END PRIVATE KEY-----",
};
const request = (method = "POST", origin = "https://example.test") => new Request("https://example.test/api/diagnostics/billing-7c92e4a18f63", {
  method, headers: { origin, "x-forwarded-proto": "https", "x-forwarded-host": "example.test" },
});
const row = { project_id: env.GOOGLE_CLOUD_PROJECT_ID, currency: "JPY", amount: "12345", source_row_count: "2" };

test("route GET refuses without querying and POST is wired", async () => {
  assert.equal(GET, POST);
  assert.equal((await GET(request("GET"))).status, 405);
});

test("unauthorized, non-POST and cross-origin requests never create SDK", async () => {
  let authorized = 0;
  const handler = createHandler({ env, authorize: async () => { authorized++; throw new Error("secret"); },
    createSdk: () => assert.fail("Must not create SDK") });
  for (const method of ["GET", "HEAD", "PUT", "DELETE"]) assert.equal((await handler(request(method))).status, 405);
  assert.equal(authorized, 0);
  assert.equal((await handler(request("POST", "https://evil.test"))).status, 403);
  assert.equal(authorized, 0);
  assert.deepEqual(await (await handler(request())).json(), { error: "auth" });
  assert.equal(authorized, 1);
});

test("success and empty: one bounded SELECT, fixed project and JST month, no amounts", async () => {
  for (const rows of [[], [row, { ...row, currency: "USD", amount: "0" }]]) {
    let queries = 0;
    const handler = createHandler({ env, authorize: async () => ({}), createSdk: options => {
      assert.equal(options.autoRetry, false);
      assert.equal(options.maxRetries, 0);
      return { query: async query => {
        queries++;
        assert.equal(query.maximumBytesBilled, "100000000");
        assert.equal(query.location, "asia-northeast1");
        assert.match(query.query, /^SELECT/);
        assert.match(query.query, /WHERE project.id = @projectId/);
        assert.deepEqual(query.params, { projectId: env.GOOGLE_CLOUD_PROJECT_ID,
          startTime: "2026-08-31T15:00:00.000Z", endTime: "2026-09-30T15:00:00.000Z" });
        return [rows];
      } };
    } });
    const response = await handler(request());
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control")!, /no-store/);
    assert.deepEqual(await response.json(), { ok: true, rowCount: rows.length * 2,
      currencies: rows.length ? ["JPY", "USD"] : [], hasAggregate: rows.length > 0 });
    assert.equal(queries, 1);
  }
});

test("configuration failures never construct SDK", async () => {
  for (const key of Object.keys(env)) {
    const handler = createHandler({ env: { ...env, [key]: "" }, authorize: async () => ({}),
      createSdk: () => assert.fail("Must not create SDK") });
    assert.deepEqual(await (await handler(request())).json(), { error: "config" });
  }
});

test("error classifications and malformed results expose no secrets or logs", async t => {
  const logs = (["log", "warn", "error", "info", "debug"] as const).map(method => t.mock.method(console, method, () => {}));
  for (const [error, category] of [
    [{ code: 401 }, "auth"], [{ response: { data: { error: "invalid_grant" } } }, "auth"],
    [{ code: 403 }, "permission"], [{ code: 403, errors: [{ reason: "accessNotConfigured" }] }, "api"],
    [{ code: 503 }, "api"], [{ code: "ENOTFOUND" }, "api"], [{ code: 400 }, "query"], [{ code: 404 }, "config"],
  ] as const) {
    const handler = createHandler({ env, authorize: async () => ({}), createSdk: () => ({ query: async () => {
      throw { ...error, message: env.FIREBASE_ADMIN_PRIVATE_KEY, Authorization: "secret" };
    } }) });
    assert.deepEqual(await (await handler(request())).json(), { error: category });
  }
  for (const result of [null, [[{ ...row, currency: "SECRET" }]], [[{ ...row, amount: "secret" }]]]) {
    const handler = createHandler({ env, authorize: async () => ({}), createSdk: () => ({ query: async () => result }) });
    assert.deepEqual(await (await handler(request())).json(), { error: "query" });
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
