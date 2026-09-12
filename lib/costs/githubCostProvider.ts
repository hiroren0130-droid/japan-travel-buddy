import "server-only";

/** https://docs.github.com/en/rest/billing/usage#get-billing-usage-report-for-a-user
 * Currency is not specified by the documented response. Never assume USD/JPY.
 */
export type GitHubBillingUsageItem = {
  date: string;
  product: string;
  sku: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  repositoryName?: string;
};
export type GitHubBillingResponse = { usageItems: GitHubBillingUsageItem[] };
export type GitHubUsage = GitHubBillingUsageItem & {
  currency: string | null;
  attribution: "project" | "other_repository" | "unattributed";
};
type Total = { currency: string | null; netAmount: number; recordCount: number };
type Period = { billingMonth: string; year: number; month: number; selectionTimeZone: "Asia/Tokyo" };
type Metadata = {
  costBasis: "usage_based";
  isFinalInvoice: false;
  subscriptionFeesIncluded: false;
  taxesIncluded: false;
  currencyConversionApplied: false;
  emptyMeansZeroBill: false;
};
export type GitHubCostResult =
  | { fetchStatus: "fallback"; reason: "not_configured" | "transport_not_configured"; costs: null }
  | { fetchStatus: "error"; reason: "invalid_month" | "invalid_response" | "timeout" | "request_failed" | "http_error" | "rate_limited"; costs: null; attempts: number; httpStatus?: number }
  | { fetchStatus: "success" | "empty"; period: Period; metadata: Metadata;
      usage: GitHubUsage[]; costs: { project: Total[]; otherRepositories: Total[]; unattributed: Total[] } | null };

export type GitHubCostOptions = {
  env?: Readonly<Record<string, string | undefined>>;
  /** Required until a separate integration explicitly supplies a transport. */
  fetch?: typeof globalThis.fetch;
  reportingMonth?: string;
  now?: () => Date;
  timeoutMs?: number;
  maxAttempts?: number;
};
const PROJECT = "hiroren0130-droid/japan-travel-buddy";

function periodFor(options: GitHubCostOptions): Period {
  const billingMonth = options.reportingMonth ?? new Date(
    (options.now ?? (() => new Date()))().getTime() + 9 * 60 * 60 * 1000,
  ).toISOString().slice(0, 7);
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(billingMonth)) throw new Error("Invalid month");
  return { billingMonth, year: Number(billingMonth.slice(0, 4)), month: Number(billingMonth.slice(5)), selectionTimeZone: "Asia/Tokyo" };
}

function parseUsage(value: unknown, period: Period): GitHubUsage[] {
  if (!value || typeof value !== "object" || !("usageItems" in value) || !Array.isArray(value.usageItems)) throw new Error("Invalid response");
  return value.usageItems.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid item");
    const row = item as Record<string, unknown>;
    const strings = ["date", "product", "sku", "unitType"] as const;
    const numbers = ["quantity", "pricePerUnit", "grossAmount", "discountAmount", "netAmount"] as const;
    for (const key of strings) if (typeof row[key] !== "string" || !row[key]) throw new Error("Invalid field");
    for (const key of numbers) if (typeof row[key] !== "number" || !Number.isFinite(row[key])) throw new Error("Invalid number");
    if (!(row.date as string).startsWith(`${period.billingMonth}-`)) throw new Error("Wrong month");
    if (row.repositoryName !== undefined && typeof row.repositoryName !== "string") throw new Error("Invalid repository");
    // Forward-compatible currency extension; absent currency remains unknown.
    if (row.currency !== undefined && (typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency))) throw new Error("Invalid currency");
    const repositoryName = row.repositoryName as string | undefined;
    return {
      date: row.date as string, product: row.product as string, sku: row.sku as string,
      unitType: row.unitType as string, quantity: row.quantity as number,
      pricePerUnit: row.pricePerUnit as number, grossAmount: row.grossAmount as number,
      discountAmount: row.discountAmount as number, netAmount: row.netAmount as number,
      repositoryName, currency: (row.currency as string | undefined) ?? null,
      attribution: !repositoryName ? "unattributed" : repositoryName.toLowerCase() === PROJECT ? "project" : "other_repository",
    };
  });
}

function totals(usage: GitHubUsage[], attribution: GitHubUsage["attribution"]): Total[] {
  const result: Total[] = [];
  for (const row of usage.filter((item) => item.attribution === attribution)) {
    let total = result.find((item) => item.currency === row.currency);
    if (!total) { total = { currency: row.currency, netAmount: 0, recordCount: 0 }; result.push(total); }
    total.netAmount += row.netAmount;
    total.recordCount++;
    if (!Number.isFinite(total.netAmount)) throw new Error("Invalid total");
  }
  return result;
}

/** No logging, no implicit global fetch, no UI projection or invoice total. */
export async function getGitHubMonthlyCost(options: GitHubCostOptions = {}): Promise<GitHubCostResult> {
  const env = options.env ?? process.env;
  const token = env.GITHUB_BILLING_TOKEN?.trim();
  const username = env.GITHUB_BILLING_USERNAME?.trim();
  if (!token || !username || !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) return { fetchStatus: "fallback", reason: "not_configured", costs: null };
  const transport = options.fetch;
  if (!transport) return { fetchStatus: "fallback", reason: "transport_not_configured", costs: null };
  let period: Period;
  try { period = periodFor(options); } catch { return { fetchStatus: "error", reason: "invalid_month", costs: null, attempts: 0 }; }
  const url = new URL(`https://api.github.com/users/${encodeURIComponent(username)}/settings/billing/usage`);
  url.searchParams.set("year", String(period.year));
  url.searchParams.set("month", String(period.month));
  const bounded = (value: number | undefined, fallback: number, max: number) => Number.isFinite(value) ? Math.max(1, Math.min(max, Math.floor(value!))) : fallback;
  const attemptsLimit = bounded(options.maxAttempts, 3, 3);
  const timeoutMs = bounded(options.timeoutMs, 10_000, 30_000);
  for (let attempts = 1; attempts <= attemptsLimit; attempts++) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      const outcome = await Promise.race([
        (async () => {
          const response = await transport(url, { method: "GET", signal: controller.signal,
            cache: "no-store", redirect: "error", headers: {
              Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
              "X-GitHub-Api-Version": "2026-03-10",
            } });
          const rateLimited = response.status === 429 || (response.status === 403 &&
            (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after")));
          if (response.status !== 200) {
            void response.body?.cancel().catch(() => undefined);
            return { status: response.status, rateLimited, usage: null };
          }
          return { status: 200, rateLimited: false, usage: parseUsage(await response.json(), period) };
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => {
          timedOut = true; controller.abort(); reject(new Error("Timeout"));
        }, timeoutMs); }),
      ]);
      if (outcome.usage !== null) {
        const usage = outcome.usage;
        return { fetchStatus: usage.length ? "success" : "empty", period, usage,
          metadata: { costBasis: "usage_based", isFinalInvoice: false, subscriptionFeesIncluded: false,
            taxesIncluded: false, currencyConversionApplied: false, emptyMeansZeroBill: false },
          costs: usage.length ? { project: totals(usage, "project"), otherRepositories: totals(usage, "other_repository"), unattributed: totals(usage, "unattributed") } : null };
      }
      // Rate limits are returned to the caller; never retry before a server reset.
      if (outcome.status >= 500 && outcome.status <= 599 && attempts < attemptsLimit) {
        clearTimeout(timer);
        await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** (attempts - 1)));
        continue;
      }
      return { fetchStatus: "error", reason: outcome.rateLimited ? "rate_limited" : "http_error", httpStatus: outcome.status, costs: null, attempts };
    } catch {
      // Raw exceptions, headers and bodies must never reach logs or the result.
      return { fetchStatus: "error", reason: timedOut ? "timeout" : "request_failed", costs: null, attempts };
    } finally { clearTimeout(timer); }
  }
  return { fetchStatus: "error", reason: "request_failed", costs: null, attempts: attemptsLimit };
}
