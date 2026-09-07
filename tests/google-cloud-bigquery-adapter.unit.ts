import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBigQueryBillingQuery,
  createGoogleCloudBigQueryAdapter,
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
