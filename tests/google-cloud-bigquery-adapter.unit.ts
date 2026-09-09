import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBigQueryBillingQuery,
  createGoogleCloudBigQueryAdapter,
  createGoogleCloudBigQueryClient,
  readBigQueryClientConfig,
  readBigQueryBillingConfig,
  type BillingQuery,
} from "../lib/costs/googleCloudBigQueryAdapter";
import { getGoogleCloudMonthlyCost } from "../lib/costs/googleCloudCostProvider";

const env = {
  GOOGLE_CLOUD_PROJECT_ID: "japan-travel-buddy-96590",
  GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET: "billing_export",
  GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: "gcp_billing_export_v1_019E0D_379F86_EEFC9F",
  GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION: "asia-northeast1",
};
const now = () => new Date("2026-09-07T03:00:00.000Z");
const period = {
  startTime: "2026-08-31T15:00:00.000Z",
  endTime: now().toISOString(),
};
const config = readBigQueryBillingConfig(env)!;
const row = { project_id: config.projectId, currency: "JPY", amount: "0", source_row_count: "2" };

test("SQL uses configured identifiers, bound filters, credits and currency grouping", () => {
  assert.deepEqual(config, {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    dataset: env.GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET,
    table: env.GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE,
    location: env.GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION,
  });
  const request = buildBigQueryBillingQuery(config, period);
  assert.match(request.query, /FROM `japan-travel-buddy-96590\.billing_export\.gcp_billing_export_v1_019E0D_379F86_EEFC9F`/);
  assert.match(request.query, /WHERE project\.id = @projectId/);
  assert.match(request.query, /usage_start_time >= @startTime/);
  assert.match(request.query, /usage_start_time < @endTime/);
  assert.match(request.query, /COUNT\(\*\) AS source_row_count/);
  assert.match(request.query, /SUM\(CAST\(cost AS NUMERIC\)\) \+/);
  assert.match(request.query, /SUM\(IFNULL\(\(SELECT SUM\(CAST\(credit.amount AS NUMERIC\)\)/);
  assert.match(request.query, /FROM UNNEST\(credits\) AS credit\), 0\)/);
  assert.match(request.query, /GROUP BY project.id, currency/);
  assert.deepEqual(request.params, { projectId: config.projectId, ...period });
  assert.deepEqual(request.types, { projectId: "STRING", startTime: "TIMESTAMP", endTime: "TIMESTAMP" });
  assert.equal(request.location, "asia-northeast1");
  assert.equal(request.useLegacySql, false);
  assert.ok(!request.query.includes(period.startTime));
  const alternate = buildBigQueryBillingQuery({ ...config, dataset: "other_export", table: "gcp_billing_export_v1_other", location: "US" }, period);
  assert.match(alternate.query, /\.other_export\.gcp_billing_export_v1_other`/);
  assert.equal(alternate.location, "US");
});

test("missing or unsafe configuration falls back without execution", async () => {
  const client = createGoogleCloudBigQueryAdapter(async () => assert.fail("Must not query"));
  for (const key of Object.keys(env)) {
    for (const value of [undefined, "", "bad`; SELECT 'secret'"]) {
      const invalidEnv = { ...env, [key]: value };
      assert.equal(readBigQueryBillingConfig(invalidEnv), null);
      assert.equal((await getGoogleCloudMonthlyCost({ env: invalidEnv, now, client })).fetchStatus, "fallback");
    }
  }
  assert.throws(() => buildBigQueryBillingQuery({ ...config, dataset: "bad`" }, period), /Invalid billing configuration/);
});

test("provider passes JST month-to-date and adapter unwraps an empty SDK tuple", async () => {
  const requests: BillingQuery[] = [];
  const client = createGoogleCloudBigQueryAdapter(async (request) => {
    requests.push(request);
    return [[], { metadata: "ignored" }];
  });
  assert.deepEqual(await getGoogleCloudMonthlyCost({ env, now, client }), {
    fetchStatus: "success", dataState: "empty", costs: null, sourceRowCount: 0,
    period: { ...period, timeZone: "Asia/Tokyo" },
  });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], buildBigQueryBillingQuery(config, period));
});

test("provider preserves actual zero, separate currencies and negative net costs", async () => {
  const client = createGoogleCloudBigQueryAdapter(async () => [[row, { ...row, currency: "USD", amount: "-1.25" }]]);
  const result = await getGoogleCloudMonthlyCost({ env, now, client });
  assert.equal(result.fetchStatus, "success");
  if (result.fetchStatus !== "success") assert.fail();
  assert.equal(result.dataState, "available");
  assert.equal(result.sourceRowCount, 4);
  assert.deepEqual(result.costs, [
    { currency: "JPY", amount: 0, sourceRowCount: 2 },
    { currency: "USD", amount: -1.25, sourceRowCount: 2 },
  ]);
});

test("query failures are sanitized, not logged, and become provider errors", async (t) => {
  const logs = (["log", "warn", "error"] as const).map((method) => t.mock.method(console, method, () => undefined));
  const client = createGoogleCloudBigQueryAdapter(async () => { throw new Error("secret-credentials"); });
  await assert.rejects(client.query(buildBigQueryBillingQuery(config, period)), { message: "BigQuery billing query failed" });
  assert.deepEqual(await getGoogleCloudMonthlyCost({ env, now, client }), {
    fetchStatus: "error", reason: "query_or_response_failed", costs: null,
  });
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

test("malformed SDK tuples and invalid rows become provider errors", async () => {
  for (const response of [null, [], [null], [row], [[{ ...row, project_id: "other-project" }]]]) {
    const client = createGoogleCloudBigQueryAdapter(async () => response);
    assert.equal((await getGoogleCloudMonthlyCost({ env, now, client })).fetchStatus, "error");
  }
});

// Deliberately invalid key material: tests never authenticate or contact Google.
const authEnv = {
  ...env,
  FIREBASE_ADMIN_PROJECT_ID: "different-firebase-project",
  FIREBASE_ADMIN_CLIENT_EMAIL: "firebase-adminsdk-fbsvc@japan-travel-buddy-96590.iam.gserviceaccount.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nTEST-ONLY-NOT-A-KEY\\n-----END PRIVATE KEY-----",
};

test("client config reuses credentials, restores newlines and uses the billing project", () => {
  const settings = readBigQueryClientConfig(authEnv);
  assert.deepEqual(settings, {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    location: env.GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION,
    credentials: {
      client_email: authEnv.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: authEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });
  assert.deepEqual(readBigQueryClientConfig({
    ...authEnv, FIREBASE_ADMIN_PROJECT_ID: undefined,
    FIREBASE_ADMIN_PRIVATE_KEY: settings!.credentials.private_key,
    GOOGLE_APPLICATION_CREDENTIALS: "must-not-be-read.json",
  }), settings);
});

test("missing or invalid client configuration returns undefined and provider falls back", async () => {
  const required = [...Object.keys(env), "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"];
  for (const key of required) {
    for (const value of [undefined, "", "   "]) {
      const missing = { ...authEnv, [key]: value };
      assert.equal(readBigQueryClientConfig(missing), undefined);
      const client = createGoogleCloudBigQueryClient({
        env: missing, createClient: () => assert.fail("Must not create client"),
      });
      assert.equal(client, undefined);
      assert.equal((await getGoogleCloudMonthlyCost({ env: missing, now, client })).fetchStatus, "fallback");
    }
  }
  for (const invalid of [
    { FIREBASE_ADMIN_CLIENT_EMAIL: "not-an-email" },
    { FIREBASE_ADMIN_PRIVATE_KEY: "not-a-key" },
  ]) assert.equal(readBigQueryClientConfig({ ...authEnv, ...invalid }), undefined);
});

test("SDK factory is injectable, construction never queries, and query keeps its receiver", async () => {
  let calls = 0;
  const sdk = {
    marker: "sdk-receiver",
    async query(request: BillingQuery) {
      assert.equal(this.marker, "sdk-receiver");
      assert.deepEqual(request, buildBigQueryBillingQuery(config, period));
      calls++;
      return [[row], { metadata: "ignored" }];
    },
  };
  const client = createGoogleCloudBigQueryClient({ env: authEnv, createClient: (settings) => {
    assert.deepEqual(settings, readBigQueryClientConfig(authEnv));
    return sdk;
  } });
  assert.equal(calls, 0);
  const result = await getGoogleCloudMonthlyCost({ env: authEnv, now, client });
  assert.equal(calls, 1);
  assert.equal(result.fetchStatus, "success");
});

test("client construction failures and query failures never expose or log credentials", async (t) => {
  const logs = (["log", "warn", "error", "info", "debug"] as const).map((method) =>
    t.mock.method(console, method, () => undefined));
  const fail = () => { throw new Error(authEnv.FIREBASE_ADMIN_PRIVATE_KEY); };
  assert.throws(() => createGoogleCloudBigQueryClient({ env: authEnv, createClient: fail }), {
    message: "BigQuery billing client creation failed",
  });
  const client = createGoogleCloudBigQueryClient({ env: authEnv, createClient: () => ({ query: async () => fail() }) });
  assert.deepEqual(await getGoogleCloudMonthlyCost({ env: authEnv, now, client }), {
    fetchStatus: "error", reason: "query_or_response_failed", costs: null,
  });
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

test("provider creates the authenticated adapter from process.env and preserves the SDK receiver", async (t) => {
  for (const [key, value] of Object.entries(authEnv)) {
    const previous = process.env[key];
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
    process.env[key] = value;
  }
  let calls = 0;
  const sdk = {
    marker: "receiver",
    async query(request: BillingQuery) {
      assert.equal(this.marker, "receiver");
      assert.deepEqual(request, buildBigQueryBillingQuery(config, period));
      calls++;
      return [[], { secret: "metadata-must-not-escape" }];
    },
  };
  const result = await getGoogleCloudMonthlyCost({ now, createClient: (settings) => {
    assert.deepEqual(settings, readBigQueryClientConfig(authEnv));
    return sdk;
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result, {
    fetchStatus: "success", dataState: "empty", costs: null, sourceRowCount: 0,
    period: { ...period, timeZone: "Asia/Tokyo" },
  });
});

test("provider factory path returns only currency aggregates for real source rows", async () => {
  const result = await getGoogleCloudMonthlyCost({ env: authEnv, now,
    createClient: () => ({ query: async () => [[row, { ...row, currency: "USD", amount: "-1.25" }],
      { secret: "metadata-must-not-escape" }] }),
  });
  assert.deepEqual(result, {
    fetchStatus: "success", dataState: "available", sourceRowCount: 4,
    costs: [
      { currency: "JPY", amount: 0, sourceRowCount: 2 },
      { currency: "USD", amount: -1.25, sourceRowCount: 2 },
    ],
    period: { ...period, timeZone: "Asia/Tokyo" },
  });
});

test("provider skips SDK creation for missing configuration and prioritizes injected row clients", async () => {
  const createClient = () => assert.fail("Must not create SDK client");
  for (const key of [...Object.keys(env), "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"]) {
    assert.deepEqual(await getGoogleCloudMonthlyCost({
      env: { ...authEnv, [key]: "" }, now, createClient,
    }), { fetchStatus: "fallback", reason: "not_configured", costs: null });
  }
  const result = await getGoogleCloudMonthlyCost({
    env: authEnv, now, createClient, client: { query: async () => [row] },
  });
  assert.equal(result.fetchStatus, "success");
});

test("provider factory construction, query and response failures expose no secrets or logs", async (t) => {
  const logs = (["log", "warn", "error", "info", "debug"] as const).map((method) =>
    t.mock.method(console, method, () => undefined));
  const fail = () => { throw new Error(`${authEnv.FIREBASE_ADMIN_PRIVATE_KEY} secret-api-key`); };
  for (const createClient of [fail, () => ({ query: async () => fail() }),
    () => ({ query: async () => ({ secret: authEnv.FIREBASE_ADMIN_PRIVATE_KEY }) })]) {
    assert.deepEqual(await getGoogleCloudMonthlyCost({ env: authEnv, now, createClient }), {
      fetchStatus: "error", reason: "query_or_response_failed", costs: null,
    });
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
