import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ServiceCostCard from "../components/admin/ServiceCostCard";
import CostOverview from "../components/admin/CostOverview";
import { getGoogleCloudCostSnapshot } from "../lib/costs/googleCloudCostProvider";
import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";
import { monthlyCostOverview } from "../lib/costs/costData";
import type { ServiceCostSnapshot } from "../types/cost";

const env = {
  GOOGLE_CLOUD_PROJECT_ID: "test-billing-project",
  GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET: "billing_export",
  GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: "gcp_billing_export_v1_test",
  GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION: "US",
  FIREBASE_ADMIN_CLIENT_EMAIL: "test@test-billing-project.iam.gserviceaccount.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nTEST-ONLY\n-----END PRIVATE KEY-----",
};
const now = () => new Date("2026-09-09T03:00:00Z");
const row = { project_id: env.GOOGLE_CLOUD_PROJECT_ID, currency: "JPY", amount: "123.45", source_row_count: "2" };
const read = (rows: unknown[], month = "2026-09", clock = now) => getGoogleCloudCostSnapshot(month, {
  env, now: clock, createClient: () => ({ query: async () => [rows, { secret: "raw-metadata" }] }),
});
const overview = (google: ServiceCostSnapshot) => ({
  ...monthlyCostOverview, month: "2026-09",
  services: monthlyCostOverview.services.map((service) => service.service === "google-cloud" ? google : service),
});
const card = (snapshot: ServiceCostSnapshot) => renderToStaticMarkup(<ServiceCostCard snapshot={snapshot} />);

test("success renders native currencies, adds JPY once and leaves fixtures/OpenAI unchanged", async () => {
  const original = structuredClone(monthlyCostOverview);
  const google = await read([row, { ...row, currency: "USD", amount: "4.25" }]);
  assert.equal(google.fetchStatus, "success");
  assert.equal(google.dataState, "available");
  assert.equal(google.currentMonthCost, 123.45);
  assert.deepEqual(google.costs?.map(({ currency, amount }) => ({ currency, amount })), [
    { currency: "JPY", amount: 123.45 }, { currency: "USD", amount: 4.25 },
  ]);
  const html = card(google);
  assert.match(html, /Google Cloud取得状態: 取得成功/);
  assert.match(html, /JPY/);
  assert.match(html, /\$4.25/);
  assert.match(html, /USD/);
  assert.doesNotMatch(html, /fixture|固定データ|raw-metadata|TEST-ONLY/);
  const data = overview(google);
  data.services = data.services.map((service) => service.service === "firebase"
    ? { ...service, currentMonthCost: 999 } : service);
  assert.equal(calculateCurrentMonthTotal(data), 123.45);
  assert.deepEqual(data.services.find((s) => s.service === "openai"), original.services[0]);
  assert.deepEqual(monthlyCostOverview, original);
});

test("empty keeps costs null, displays no zero or fixture and excludes Google from total", async () => {
  const google = await read([]);
  assert.equal(google.fetchStatus, "empty");
  assert.equal(google.dataState, "empty");
  assert.equal(google.costs, null);
  assert.equal(google.currentMonthCost, null);
  assert.equal(google.includedInTotal, false);
  const html = card(google);
  assert.match(html, /取得成功・集計対象データなし（empty）/);
  assert.match(html, /data-fetch-status="empty"/);
  assert.match(html, /Billing Exportに集計対象データがありません/);
  assert.match(html, /実取得値なし/);
  assert.doesNotMatch(html, /￥0|¥0|fixture|固定データ/);
  assert.match(renderToStaticMarkup(<CostOverview overview={overview(google)} />), /Google Cloudの実額0円を示すものではありません/);
  assert.equal(calculateCurrentMonthTotal(overview(google)), 0);
});

test("actual zero is available and negative credits remain negative", async () => {
  const zero = await read([{ ...row, amount: "0" }]);
  assert.equal(zero.dataState, "available");
  assert.equal(zero.includedInTotal, true);
  assert.match(card(zero), /￥0/);
  assert.doesNotMatch(card(zero), /実取得値なし|（empty）/);
  const credit = await read([{ ...row, amount: "-12.5" }]);
  assert.equal(calculateCurrentMonthTotal(overview(credit)), -12.5);
});

test("non-JPY only stays native and is never converted or added to JPY totals", async () => {
  const google = await read([{ ...row, currency: "USD", amount: "7.5" }]);
  assert.equal(google.currentMonthCost, null);
  assert.equal(google.includedInTotal, false);
  assert.equal(calculateCurrentMonthTotal(overview(google)), 0);
  assert.match(card(google), /\$7.50/);
  assert.doesNotMatch(card(google), /￥|実取得値なし/);
});

test("fallback and error have no actual or fixture amounts and expose no exceptions or logs", async (t) => {
  const logs = (["log", "warn", "error", "info", "debug"] as const).map((method) =>
    t.mock.method(console, method, () => undefined));
  const fallback = await getGoogleCloudCostSnapshot("2026-09", { env: {} });
  const error = await getGoogleCloudCostSnapshot("2026-09", {
    env, now, createClient: () => ({ query: async () => { throw new Error("PRIVATE-KEY API-KEY raw-exception"); } }),
  });
  assert.equal(fallback.fetchStatus, "fallback");
  assert.equal(error.fetchStatus, "error");
  for (const snapshot of [fallback, error]) {
    assert.equal(snapshot.costs, null);
    assert.equal(snapshot.currentMonthCost, null);
    assert.equal(snapshot.includedInTotal, false);
    const html = card(snapshot);
    assert.match(html, /実取得値なし/);
    assert.doesNotMatch(html, /￥|fixture|PRIVATE-KEY|API-KEY|raw-exception/);
    assert.equal(calculateCurrentMonthTotal(overview(snapshot)), 0);
  }
  assert.match(card(fallback), /未設定（fallback）/);
  assert.match(card(error), /取得エラー/);
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

test("JST month boundary does not add a different month's Google data to the UTC total", async () => {
  const google = await read([row], "2026-09", () => new Date("2026-09-30T15:00:00Z"));
  assert.equal(google.billingMonth, "2026-10");
  assert.equal(google.includedInTotal, false);
  assert.equal(calculateCurrentMonthTotal(overview(google)), 0);
  assert.match(card(google), /画面の対象月と異なる/);
  assert.match(renderToStaticMarkup(<CostOverview overview={overview(google)} />), /JST対象月が画面の対象月と異なる/);
});

test("OpenAI success, zero, fallback and error rendering are preserved", () => {
  const fixture = monthlyCostOverview.services[0];
  for (const fetchStatus of ["success", "fallback", "error"] as const) {
    const html = card({ ...fixture, fetchStatus });
    assert.match(html, /OpenAI取得状態/);
    if (fetchStatus === "success") assert.match(html, /実額は0円です/);
    else {
      assert.match(html, /取得値なし/);
      assert.match(html, /固定データ: ￥0/);
    }
    assert.doesNotMatch(html, /Billing Export/);
  }
});

test("Google Cloud warnings distinguish unavailable data from a successful empty read", async () => {
  const empty = await read([]);
  const fallback = await getGoogleCloudCostSnapshot("2026-09", { env: {} });
  const error = await getGoogleCloudCostSnapshot("2026-09", {
    env, now, client: { query: async () => { throw new Error("test failure"); } },
  });
  for (const google of [empty, fallback, error]) {
    const data = overview(google);
    data.services = data.services.map((service) => service.service === "openai"
      ? { ...service, fetchStatus: "success", currentMonthCost: 250 } : service);
    const html = renderToStaticMarkup(<CostOverview overview={data} />);
    assert.equal(calculateCurrentMonthTotal(data), 250);
    if (google.fetchStatus === "empty") {
      assert.doesNotMatch(html, /今月の合計は固定データを含む参考値です/);
      assert.match(html, /Billing Exportに集計対象データがありません/);
    } else {
      assert.match(html, /今月の合計は固定データを含む参考値です/);
      assert.match(html, /実取得値は合計に含まれません/);
    }
  }
});
