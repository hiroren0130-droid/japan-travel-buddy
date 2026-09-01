export type CostServiceKey =
  | "openai"
  | "google-cloud"
  | "firebase"
  | "github"
  | "vercel";

/** ISO-4217 currency code validated at the data-source boundary. */
export type CostCurrency = string;

export type CostDataSource = "manual" | "api-ready" | "future-api";

export interface CostUsageMetric {
  label: string;
  value: number;
  unit: string;
}

export interface ServiceCostSnapshot {
  service: CostServiceKey;
  displayName: string;
  currency: CostCurrency;
  currentMonthCost: number;
  estimatedCost: number | null;
  usageSummary: CostUsageMetric[];
  freeTierSummary: string;
  dataSource: CostDataSource;
  updatedAt: string;
  notes: string;
  includedInTotal: boolean;
}

export interface MonthlyCostOverview {
  month: string;
  reportingCurrency: CostCurrency;
  services: ServiceCostSnapshot[];
}
