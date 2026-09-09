import "server-only";

import type { CostCurrency, ServiceCostSnapshot } from "@/types/cost";

import {
  buildBigQueryBillingQuery,
  createGoogleCloudBigQueryClient,
  readBigQueryBillingConfig,
  type BigQueryClientConfig,
  type GoogleCloudBillingClient,
} from "./googleCloudBigQueryAdapter";

export type { BillingQuery, GoogleCloudBillingClient } from "./googleCloudBigQueryAdapter";

type Options = {
  env?: Readonly<Record<string, string | undefined>>;
  client?: GoogleCloudBillingClient;
  /** SDK-style client factory; query returns [rows, ...metadata]. */
  createClient?: (config: BigQueryClientConfig) => GoogleCloudBillingClient;
  now?: () => Date;
};

type Period = { startTime: string; endTime: string; timeZone: "Asia/Tokyo" };
type CurrencyCost = {
  currency: CostCurrency;
  amount: number;
  sourceRowCount: number;
};

/** Empty exports are successful reads, never evidence of a zero bill.
 * Usage-month totals include credits and Firebase; they are not final invoices.
 * Native aggregates are preserved when converted to an admin snapshot.
 */
export type GoogleCloudCostResult =
  | { fetchStatus: "fallback"; reason: "not_configured"; costs: null }
  | { fetchStatus: "error"; reason: "query_or_response_failed"; costs: null }
  | {
      fetchStatus: "success";
      dataState: "empty";
      costs: null;
      sourceRowCount: 0;
      period: Period;
    }
  | {
      fetchStatus: "success";
      dataState: "available";
      costs: CurrencyCost[];
      sourceRowCount: number;
      period: Period;
    };

function monthToDate(now: Date): Period {
  const time = now.getTime();
  if (!Number.isFinite(time)) throw new TypeError("Invalid date");
  const offset = 9 * 60 * 60 * 1000;
  const jst = new Date(time + offset);
  const start = new Date(0);
  start.setUTCFullYear(jst.getUTCFullYear(), jst.getUTCMonth(), 1);
  start.setUTCHours(0, 0, 0, 0);
  return {
    startTime: new Date(start.getTime() - offset).toISOString(),
    endTime: now.toISOString(),
    timeZone: "Asia/Tokyo",
  };
}

/** Admin projection: never substitute fixture amounts for missing billing data. */
export async function getGoogleCloudCostSnapshot(
  reportingMonth: string,
  options: Options = {},
): Promise<ServiceCostSnapshot> {
  const result = await getGoogleCloudMonthlyCost(options);
  const available = result.fetchStatus === "success" && result.dataState === "available";
  const costs = available ? result.costs : null;
  const jpy = costs?.find((cost) => cost.currency === "JPY");
  const billingMonth = result.fetchStatus === "success"
    ? new Date(new Date(result.period.startTime).getTime() + 9 * 60 * 60 * 1000)
      .toISOString().slice(0, 7)
    : undefined;
  return {
    service: "google-cloud",
    displayName: "Google Cloud",
    currency: "JPY",
    currentMonthCost: jpy?.amount ?? null,
    costs,
    dataState: result.fetchStatus === "success" ? result.dataState : undefined,
    billingMonth,
    estimatedCost: null,
    usageSummary: result.fetchStatus === "success"
      ? [{ label: "集計対象データ", value: result.sourceRowCount, unit: "行" }]
      : [],
    freeTierSummary: "無料枠の残量はこの集計では取得していません。",
    dataSource: "api-ready",
    fetchStatus: result.fetchStatus === "success" && result.dataState === "empty"
      ? "empty" : result.fetchStatus,
    updatedAt: result.fetchStatus === "success" ? result.period.endTime : "",
    notes: "Billing Exportの利用月別集計です。クレジットとFirebase / Firestore費用を含みます。確定請求額ではありません。"
      + (billingMonth ? ` 対象月: ${billingMonth}（JST・月初から取得時点まで）。` : "")
      + " JPY以外は円換算せず、月次合計から除外します。"
      + (billingMonth && billingMonth !== reportingMonth
        ? " 画面の対象月と異なるため、JPYも月次合計から除外します。" : ""),
    includedInTotal: jpy !== undefined && billingMonth === reportingMonth,
  };
}

function parseRows(value: unknown, projectId: string): CurrencyCost[] {
  if (!Array.isArray(value)) throw new TypeError("Invalid rows");
  const currencies = new Set<string>();
  return value.map((row: unknown) => {
    if (typeof row !== "object" || row === null) {
      throw new TypeError("Invalid row");
    }
    const record = row as Record<string, unknown>;
    const { currency, amount, source_row_count: count } = record;
    if (
      record.project_id !== projectId ||
      typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency) ||
      currencies.has(currency) ||
      !(typeof amount === "number" ||
        (typeof amount === "string" && /^-?\d+(\.\d+)?$/.test(amount))) ||
      !(typeof count === "number" ||
        (typeof count === "string" && /^\d+$/.test(count)))
    ) {
      throw new TypeError("Invalid aggregate");
    }
    const numericAmount = Number(amount);
    const sourceRowCount = Number(count);
    if (!Number.isFinite(numericAmount) ||
        !Number.isSafeInteger(sourceRowCount) || sourceRowCount <= 0) {
      throw new TypeError("Invalid aggregate numbers");
    }
    currencies.add(currency);
    // Credits/adjustments can produce a negative net amount. Do not clamp it.
    return { currency, amount: numericAmount, sourceRowCount };
  });
}

export async function getGoogleCloudMonthlyCost(
  options: Options = {}
): Promise<GoogleCloudCostResult> {
  const env = options.env ?? process.env;
  const config = readBigQueryBillingConfig(env);
  if (!config) {
    return { fetchStatus: "fallback", reason: "not_configured", costs: null };
  }
  const { projectId } = config;

  try {
    const client = options.client ?? createGoogleCloudBigQueryClient({
      env, createClient: options.createClient,
    });
    if (!client) {
      return { fetchStatus: "fallback", reason: "not_configured", costs: null };
    }
    const period = monthToDate((options.now ?? (() => new Date()))());
    const rows = await client.query(buildBigQueryBillingQuery(config, period));
    const costs = parseRows(rows, projectId);
    const sourceRowCount = costs.reduce((sum, cost) => sum + cost.sourceRowCount, 0);
    if (!Number.isSafeInteger(sourceRowCount)) throw new TypeError("Invalid count");
    return costs.length === 0
      ? { fetchStatus: "success", dataState: "empty", costs: null, sourceRowCount: 0, period }
      : { fetchStatus: "success", dataState: "available", costs, sourceRowCount, period };
  } catch {
    // Never expose/log raw exceptions, credentials, query responses or request data.
    return { fetchStatus: "error", reason: "query_or_response_failed", costs: null };
  }
}
