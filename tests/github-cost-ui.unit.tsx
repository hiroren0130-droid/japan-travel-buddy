import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ServiceCostCard from "../components/admin/ServiceCostCard";
import CostOverview from "../components/admin/CostOverview";
import { getGitHubCostSnapshot } from "../lib/costs/githubCostSnapshot";
import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";
import { monthlyCostOverview } from "../lib/costs/costData";
import type { ServiceCostSnapshot } from "../types/cost";

const env = { GITHUB_BILLING_TOKEN: "secret-sentinel", GITHUB_BILLING_USERNAME: "hiroren0130-droid" };
const row = { date: "2026-09-01", product: "private-product", sku: "private-sku", quantity: 3,
  unitType: "minutes", pricePerUnit: 4, grossAmount: 12, discountAmount: 2, netAmount: 10,
  repositoryName: "hiroren0130-droid/japan-travel-buddy" };
const read = (rows: unknown[]) => getGitHubCostSnapshot("2026-09", {
  env, fetch: async (input) => {
    assert.equal(new URL(String(input)).searchParams.get("month"), "9");
    return Response.json({ usageItems: rows });
  },
});
const card = (snapshot: ServiceCostSnapshot) => renderToStaticMarkup(<ServiceCostCard snapshot={snapshot} />);
const overview = (github: ServiceCostSnapshot) => ({ ...monthlyCostOverview, month: "2026-09",
  services: monthlyCostOverview.services.map((service) => service.service === "github" ? github : service) });

test("target JPY only enters total; other repositories and unscoped costs stay excluded", async () => {
  const github = await read([{ ...row, currency: "JPY" },
    { ...row, repositoryName: "other/repo", currency: "JPY", netAmount: 999 },
    { ...row, repositoryName: undefined, currency: "JPY", netAmount: 555 }]);
  assert.equal(github.fetchStatus, "success");
  assert.equal(github.github?.targetRecordCount, 1);
  assert.equal(github.currentMonthCost, 10);
  assert.equal(calculateCurrentMonthTotal(overview(github)), 10);
  const html = card(github);
  assert.match(html, /GitHub Billing取得成功/);
  assert.match(html, /￥10/);
  assert.doesNotMatch(html, /999|555|other\/repo|private-product|private-sku/);
  assert.equal(calculateCurrentMonthTotal({ ...overview(github), month: "2026-08" }), 0);
});

test("21 other records report successful fetch with no target usage and no zero amount", async () => {
  const github = await read(Array.from({ length: 21 }, () => ({ ...row, repositoryName: "other/repo" })));
  assert.equal(github.fetchStatus, "success");
  assert.equal(github.currentMonthCost, null);
  assert.equal(github.includedInTotal, false);
  const html = card(github);
  assert.match(html, /GitHub Billing取得成功/);
  assert.match(html, /Japan Travel Buddy対象usageなし/);
  assert.doesNotMatch(html, /￥0|¥0/);
  assert.equal(calculateCurrentMonthTotal(overview(github)), 0);
  assert.match(renderToStaticMarkup(<CostOverview overview={overview(github)} />), /GitHubの実額0円を示すものではありません/);
});

test("empty is distinct from success without project records", async () => {
  const github = await read([]);
  assert.equal(github.fetchStatus, "empty");
  assert.match(card(github), /対象月のusage recordがありません/);
  assert.doesNotMatch(card(github), /￥0|¥0/);
  assert.equal(github.currentMonthCost, null);
});

test("unknown currency and USD remain native, excluded from JPY total", async () => {
  for (const currency of [undefined, "USD"]) {
    const github = await read([{ ...row, currency }]);
    assert.equal(github.currentMonthCost, null);
    assert.equal(github.includedInTotal, false);
    assert.equal(calculateCurrentMonthTotal(overview(github)), 0);
    const html = card(github);
    assert.match(html, currency ? /\$10.00 USD/ : /10（通貨不明）/);
    assert.doesNotMatch(html, /￥|¥/);
  }
});

test("mixed native currencies preserve JPY only including actual zero and credits", async () => {
  const github = await read([{ ...row, currency: "JPY", netAmount: -2 }, { ...row, currency: "USD" }, row]);
  assert.equal(calculateCurrentMonthTotal(overview(github)), -2);
  assert.equal(github.github?.targetCosts.length, 3);
  const zero = await read([{ ...row, currency: "JPY", netAmount: 0 }]);
  assert.equal(zero.includedInTotal, true);
  assert.match(card(zero), /￥0/);
});

test("fallback and errors never expose fixture, secrets, exceptions or logs", async (t) => {
  const logs = (["log", "warn", "error", "info", "debug"] as const).map((key) => t.mock.method(console, key, () => undefined));
  const fallback = await getGitHubCostSnapshot("2026-09", { env: {}, fetch: async () => { assert.fail(); } });
  const error = await getGitHubCostSnapshot("2026-09", { env, fetch: async () => { throw new Error("Authorization secret-sentinel"); } });
  assert.equal(fallback.fetchStatus, "fallback");
  assert.equal(error.fetchStatus, "error");
  for (const snapshot of [fallback, error]) {
    assert.equal(snapshot.currentMonthCost, null);
    assert.equal(calculateCurrentMonthTotal(overview(snapshot)), 0);
    assert.match(card(snapshot), /実取得値なし/);
    assert.doesNotMatch(card(snapshot) + JSON.stringify(snapshot), /secret-sentinel|Authorization|固定データ|￥/);
  }
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});

test("other service snapshots and rendered cards remain unchanged", async () => {
  const original = structuredClone(monthlyCostOverview);
  const data = overview(await read([{ ...row, currency: "JPY" }]));
  for (const service of original.services.filter((item) => item.service !== "github")) {
    const actual = data.services.find((item) => item.service === service.service)!;
    assert.deepEqual(actual, service);
    assert.equal(card(actual), card(service));
  }
  assert.deepEqual(monthlyCostOverview, original);
});
