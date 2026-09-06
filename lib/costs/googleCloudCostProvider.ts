import "server-only";

import type { CostCurrency } from "@/types/cost";

export type BillingQuery = {
  query: string;
  location: string;
  useLegacySql: false;
  params: { projectId: string; startTime: string; endTime: string };
  types: { projectId: "STRING"; startTime: "TIMESTAMP"; endTime: "TIMESTAMP" };
};

/** Adapter boundary: returns rows only, not the BigQuery SDK response tuple.
 * No default client or credentials are loaded; callers must inject an adapter.
 */
export interface GoogleCloudBillingClient {
  query(request: BillingQuery): Promise<unknown>;
}

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
  const projectId = env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  const dataset = env.GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET?.trim();
  const table = env.GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE?.trim();
  const location = env.GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION?.trim();
  // Identifiers cannot be bound as query parameters: validate before interpolation.
  if (!options.client || !projectId || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) ||
      !dataset || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(dataset) ||
      !table || !/^gcp_billing_export_v1_[A-Za-z0-9_]+$/.test(table) ||
      !location || !/^[a-zA-Z0-9-]+$/.test(location)) {
    return { fetchStatus: "fallback", reason: "not_configured", costs: null };
  }

  try {
    const period = monthToDate((options.now ?? (() => new Date()))());
    const rows = await options.client.query({
      query: `SELECT
  project.id AS project_id,
  currency,
  COUNT(*) AS source_row_count,
  CAST(SUM(CAST(cost AS NUMERIC)) +
    SUM(IFNULL((SELECT SUM(CAST(credit.amount AS NUMERIC))
      FROM UNNEST(credits) AS credit), 0)) AS STRING) AS amount
FROM \`${projectId}.${dataset}.${table}\`
WHERE project.id = @projectId
  AND usage_start_time >= @startTime
  AND usage_start_time < @endTime
GROUP BY project.id, currency`,
      location,
      useLegacySql: false,
      params: { projectId, startTime: period.startTime, endTime: period.endTime },
      types: { projectId: "STRING", startTime: "TIMESTAMP", endTime: "TIMESTAMP" },
    });
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
