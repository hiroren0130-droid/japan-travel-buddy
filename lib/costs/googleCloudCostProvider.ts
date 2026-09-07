import "server-only";

import type { CostCurrency } from "@/types/cost";

import {
  buildBigQueryBillingQuery,
  readBigQueryBillingConfig,
  type GoogleCloudBillingClient,
} from "./googleCloudBigQueryAdapter";

export type { BillingQuery, GoogleCloudBillingClient } from "./googleCloudBigQueryAdapter";

type Options = {
  env?: Readonly<Record<string, string | undefined>>;
  client?: GoogleCloudBillingClient;
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
 * Kept separate from ServiceCostSnapshot until UI/total integration is designed.
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
  if (!options.client || !config) {
    return { fetchStatus: "fallback", reason: "not_configured", costs: null };
  }
  const { projectId } = config;

  try {
    const period = monthToDate((options.now ?? (() => new Date()))());
    const rows = await options.client.query(buildBigQueryBillingQuery(config, period));
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
