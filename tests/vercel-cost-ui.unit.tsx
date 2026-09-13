import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ServiceCostCard from "../components/admin/ServiceCostCard";
import CostOverview from "../components/admin/CostOverview";
import { monthlyCostOverview } from "../lib/costs/costData";
import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";

test("Vercel shows no actual amount, no usage and is excluded", () => {
  const vercel = monthlyCostOverview.services.find((service) => service.service === "vercel")!;
  assert.equal(vercel.currentMonthCost, null);
  assert.equal(vercel.includedInTotal, false);
  assert.equal(vercel.dataSource, "manual");
  const html = renderToStaticMarkup(<ServiceCostCard snapshot={vercel} />);
  for (const text of ["実取得値なし", "未取得", "今月合計から除外", "手入力値も現在未設定", "表示値は確定請求額ではなく"]) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /￥|¥|今月合計に含む/);
  assert.equal(calculateCurrentMonthTotal({ ...monthlyCostOverview, services: [vercel] }), 0);
});

test("OpenAI, Google Cloud and GitHub amounts stay included and Firebase stays excluded", () => {
  const original = structuredClone(monthlyCostOverview);
  const overview = { ...monthlyCostOverview, month: "2026-09", services: monthlyCostOverview.services.map((service) => {
    if (service.service === "openai") return { ...service, fetchStatus: "success" as const, currentMonthCost: 100 };
    if (service.service === "google-cloud") return { ...service, fetchStatus: "success" as const,
      dataState: "available" as const, billingMonth: "2026-09", includedInTotal: true,
      costs: [{ currency: "JPY", amount: 200, sourceRowCount: 1 }] };
    if (service.service === "github") return { ...service, fetchStatus: "success" as const,
      billingMonth: "2026-09", github: { targetRecordCount: 1, targetCosts: [{ currency: "JPY", amount: 30 }] } };
    if (service.service === "firebase") return { ...service, currentMonthCost: 999 };
    return service;
  }) };
  assert.equal(calculateCurrentMonthTotal(overview), 330);
  assert.equal(calculateCurrentMonthTotal({ ...overview, services: overview.services.filter((s) => s.service !== "vercel") }), 330);
  const html = renderToStaticMarkup(<CostOverview overview={overview} />);
  assert.match(html, /￥330/);
  assert.match(html, /Firebaseの請求額はGoogle Cloud側に含め/);
  assert.deepEqual(monthlyCostOverview, original);
});
