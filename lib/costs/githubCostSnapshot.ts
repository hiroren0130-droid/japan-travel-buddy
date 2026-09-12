import "server-only";

import type { ServiceCostSnapshot } from "@/types/cost";
import { getGitHubProductionMonthlyCost } from "./githubBillingTransport";
import type { GitHubCostOptions } from "./githubCostProvider";

/** Safe admin projection: no raw usage, repository names, products or errors. */
export async function getGitHubCostSnapshot(
  reportingMonth: string,
  options: GitHubCostOptions = {},
): Promise<ServiceCostSnapshot> {
  const result = await getGitHubProductionMonthlyCost({ ...options, reportingMonth });
  const available = result.fetchStatus === "success" || result.fetchStatus === "empty";
  const target = available ? result.usage.filter((item) => item.attribution === "project") : [];
  const targetCosts: { currency: string | null; amount: number }[] = [];
  for (const item of target) {
    const existing = targetCosts.find((cost) => cost.currency === item.currency);
    if (existing) existing.amount += item.netAmount;
    else targetCosts.push({ currency: item.currency, amount: item.netAmount });
  }
  const jpy = targetCosts.find((cost) => cost.currency === "JPY");
  const billingMonth = available ? result.period.billingMonth : undefined;
  return {
    service: "github", displayName: "GitHub", currency: "JPY",
    currentMonthCost: jpy?.amount ?? null, estimatedCost: null,
    fetchStatus: result.fetchStatus,
    dataState: available ? result.fetchStatus === "empty" ? "empty" : "available" : undefined,
    billingMonth,
    github: { targetRecordCount: target.length, targetCosts },
    dataSource: "api-ready", updatedAt: "",
    includedInTotal: result.fetchStatus === "success" && billingMonth === reportingMonth && jpy !== undefined,
    usageSummary: available ? [{ label: "Japan Travel Buddy対象usage", value: target.length, unit: "件" }] : [],
    freeTierSummary: "無料枠の残量は取得していません。",
    notes: "月別のusage-based billingです。月額契約料・税・最終請求総額とは異なります。"
      + " 他リポジトリ・未所属の料金は含みません。通貨不明・非JPYは月次合計から除外し、円換算しません。"
      + (billingMonth ? ` 対象月: ${billingMonth}。` : ""),
  };
}
