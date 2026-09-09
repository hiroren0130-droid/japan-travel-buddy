import assert from "node:assert/strict";
import test from "node:test";

import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";
import { monthlyCostOverview } from "../lib/costs/costData";
import {
  getGoogleCloudMonthlyCost,
  type BillingQuery,
} from "../lib/costs/googleCloudCostProvider";

const env = {
  GOOGLE_CLOUD_PROJECT_ID: "japan-travel-buddy-96590",
  GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET: "billing_export",
  GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: "gcp_billing_export_v1_019E0D_379F86_EEFC9F",
  GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION: "asia-northeast1",
};
const now = () => new Date("2026-09-06T12:00:00.000Z");
const row = {
  project_id: env.GOOGLE_CLOUD_PROJECT_ID,
  currency: "JPY",
  amount: "123.45",
  source_row_count: "3",
};
const read = (rows: unknown) => getGoogleCloudMonthlyCost({
  env, now, client: { query: async () => rows },
});

test("success: standard export, bound project filter, credits and JST month-to-date", async () => {
  const requests: BillingQuery[] = [];
  const result = await getGoogleCloudMonthlyCost({
    env, now, client: { query: async (request) => {
      requests.push(request);
      return [row];
    } },
  });
  assert.equal(result.fetchStatus, "success");
  if (result.fetchStatus !== "success") assert.fail();
  assert.equal(result.dataState, "available");
  assert.deepEqual(result.costs, [{ currency: "JPY", amount: 123.45, sourceRowCount: 3 }]);
  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.deepEqual(request.params, {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    startTime: "2026-08-31T15:00:00.000Z",
    endTime: now().toISOString(),
  });
  assert.equal(request.location, "asia-northeast1");
  assert.equal(request.useLegacySql, false);
  assert.equal(request.types.startTime, "TIMESTAMP");
  assert.match(request.query, /FROM `japan-travel-buddy-96590\.billing_export\.gcp_billing_export_v1_019E0D_379F86_EEFC9F`/);
  assert.match(request.query, /WHERE project\.id = @projectId/);
  assert.match(request.query, /usage_start_time >= @startTime/);
  assert.match(request.query, /usage_start_time < @endTime/);
  assert.match(request.query, /UNNEST\(credits\)/);
  assert.match(request.query, /GROUP BY project\.id, currency/);
  assert.doesNotMatch(request.query, /service\.|JOIN/);
});

test("empty export is distinct from an actual zero amount", async () => {
  const empty = await read([]);
  assert.equal(empty.fetchStatus, "success");
  if (empty.fetchStatus !== "success") assert.fail();
  assert.equal(empty.dataState, "empty");
  assert.equal(empty.costs, null);
  assert.equal(empty.sourceRowCount, 0);
  const zero = await read([{ ...row, amount: "0" }]);
  assert.equal(zero.fetchStatus, "success");
  if (zero.fetchStatus !== "success") assert.fail();
  assert.equal(zero.dataState, "available");
  assert.equal(zero.costs?.[0].amount, 0);
});

test("preserves currencies separately and negative credit balances", async () => {
  const result = await read([row, { ...row, currency: "USD", amount: "-1.25" }]);
  assert.equal(result.fetchStatus, "success");
  if (result.fetchStatus !== "success") assert.fail();
  assert.deepEqual(result.costs, [
    { currency: "JPY", amount: 123.45, sourceRowCount: 3 },
    { currency: "USD", amount: -1.25, sourceRowCount: 3 },
  ]);
});

test("missing configuration or adapter falls back without querying", async () => {
  const client = { query: async () => { assert.fail("Must not query"); } };
  for (const key of Object.keys(env)) {
    const result = await getGoogleCloudMonthlyCost({ env: { ...env, [key]: "" }, client });
    assert.equal(result.fetchStatus, "fallback");
    assert.equal(result.costs, null);
  }
  assert.equal((await getGoogleCloudMonthlyCost({ env })).fetchStatus, "fallback");
});

test("invalid table identifier falls back without querying", async () => {
  const result = await getGoogleCloudMonthlyCost({
    env: { ...env, GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: "gcp_billing_export_v1_bad`; SELECT 1" },
    client: { query: async () => { assert.fail("Must not query"); } },
  });
  assert.equal(result.fetchStatus, "fallback");
});

test("query failures return error without logging secrets", async (t) => {
  const logs = ["error", "warn", "log"].map((method) =>
    t.mock.method(console, method as "error" | "warn" | "log", () => undefined));
  const result = await getGoogleCloudMonthlyCost({
    env, now, client: { query: async () => { throw new Error("secret-credentials"); } },
  });
  assert.deepEqual(result, { fetchStatus: "error", reason: "query_or_response_failed", costs: null });
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

for (const invalid of [
  null,
  [{ ...row, project_id: "another-project" }],
  [{ ...row, amount: "NaN" }],
  [{ ...row, amount: null }],
  [{ ...row, currency: "" }],
  [{ ...row, source_row_count: "0" }],
  [row, row],
]) {
  test(`invalid response returns error: ${JSON.stringify(invalid)}`, async () => {
    assert.equal((await read(invalid)).fetchStatus, "error");
  });
}

test("JST January boundary selects the new year", async () => {
  const result = await getGoogleCloudMonthlyCost({
    env, now: () => new Date("2025-12-31T15:00:00.000Z"),
    client: { query: async () => [] },
  });
  if (result.fetchStatus !== "success") assert.fail();
  assert.equal(result.period.startTime, "2025-12-31T15:00:00.000Z");
});

test("Firebase remains excluded while Google Cloud is counted once", async () => {
  const original = structuredClone(monthlyCostOverview);
  const result = await read([row]);
  if (result.fetchStatus !== "success" || result.dataState !== "available") assert.fail();
  const google = monthlyCostOverview.services.find((service) => service.service === "google-cloud");
  const firebase = monthlyCostOverview.services.find((service) => service.service === "firebase");
  assert.ok(google);
  assert.ok(firebase);
  assert.equal(firebase.includedInTotal, false);
  assert.equal(calculateCurrentMonthTotal({
    month: "2026-09", reportingCurrency: "JPY", services: [
      {
        ...google,
        currentMonthCost: result.costs[0].amount,
        costs: result.costs,
        fetchStatus: "success",
        dataState: "available",
        billingMonth: "2026-09",
        includedInTotal: true,
      },
      { ...firebase, currentMonthCost: 50 },
    ],
  }), 123.45);
  assert.deepEqual(monthlyCostOverview, original);
});
