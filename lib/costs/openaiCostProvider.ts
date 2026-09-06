import "server-only";

import type {
  CostCurrency,
  CostFetchStatus,
  CostUsageMetric,
  ServiceCostSnapshot,
} from "@/types/cost";

const OPENAI_API_BASE_URL = "https://api.openai.com/v1/organization";
const CACHE_TTL_MS = 45 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;
const MAX_PAGES = 12;
const PAGE_LIMIT = 31;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_AFTER_MS = 8_000;

type FetchLike = typeof fetch;

type ProviderOptions = {
  env?: Readonly<Record<string, string | undefined>>;
  fetch?: FetchLike;
  now?: () => Date;
  timeoutMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

type CacheEntry = {
  expiresAt: number;
  snapshot: ServiceCostSnapshot;
};

type Period = {
  startTime: number;
  endTime: number;
};

type CostAggregate = {
  amount: number;
  currency: CostCurrency;
};

type UsageAggregate = {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  requests: number;
};

class HttpResponseError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfter: string | null
  ) {
    super(`OpenAI Admin API returned HTTP ${status}.`);
  }
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ServiceCostSnapshot>>();

function withFetchStatus(
  fixture: ServiceCostSnapshot,
  fetchStatus: CostFetchStatus
): ServiceCostSnapshot {
  return fixture.fetchStatus === fetchStatus
    ? fixture
    : { ...fixture, fetchStatus };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new TypeError(`${name} must be an object.`);
  }

  return value;
}

function requireArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array.`);
  }

  return value;
}

function requireNonNegativeNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number.`);
  }

  return value;
}

function requireCurrency(value: unknown): CostCurrency {
  if (typeof value !== "string") {
    throw new TypeError("amount.currency must be an ISO-4217 code.");
  }

  const currency = value.toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new TypeError("amount.currency must be an ISO-4217 code.");
  }

  try {
    new Intl.NumberFormat("en", { style: "currency", currency }).format(0);
  } catch {
    throw new TypeError("amount.currency must be an ISO-4217 code.");
  }

  return currency;
}

function requireProjectId(value: unknown, projectId: string): void {
  if (value !== projectId) {
    throw new TypeError("The response contains data outside the requested project.");
  }
}

function periodForMonth(month: string): Period {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) {
    throw new TypeError("month must use YYYY-MM format.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return {
    startTime: Math.floor(Date.UTC(year, monthIndex, 1) / 1000),
    endTime: Math.floor(Date.UTC(year, monthIndex + 1, 1) / 1000),
  };
}

export function getUtcMonth(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("date must be valid.");
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function retryAfterDelayMs(value: string | null, nowMs: number): number {
  if (value === null) {
    return DEFAULT_RETRY_DELAY_MS;
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    if (Number.isSafeInteger(seconds)) {
      return Math.min(seconds * 1_000, MAX_RETRY_AFTER_MS);
    }
  }

  const retryAtMs = Date.parse(trimmed);
  if (Number.isFinite(retryAtMs) && retryAtMs >= nowMs) {
    return Math.min(retryAtMs - nowMs, MAX_RETRY_AFTER_MS);
  }

  return DEFAULT_RETRY_DELAY_MS;
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof HttpResponseError)) {
    return true;
  }

  return error.status === 429 || error.status >= 500;
}

function buildUrl(
  endpoint: "costs" | "usage/completions",
  period: Period,
  projectId: string,
  page: string | null
): URL {
  const url = new URL(`${OPENAI_API_BASE_URL}/${endpoint}`);
  url.searchParams.set("start_time", String(period.startTime));
  url.searchParams.set("end_time", String(period.endTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.append("project_ids[]", projectId);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  url.searchParams.append("group_by[]", "project_id");
  if (endpoint === "costs") {
    url.searchParams.append("group_by[]", "line_item");
  } else {
    url.searchParams.append("group_by[]", "model");
  }
  if (page !== null) {
    url.searchParams.set("page", page);
  }

  return url;
}

async function requestJson(
  url: URL,
  adminKey: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  sleep: (delayMs: number) => Promise<void>,
  now: () => Date
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpResponseError(
          response.status,
          response.headers.get("Retry-After")
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      const hasAnotherAttempt = attempt + 1 < MAX_ATTEMPTS;
      if (!hasAnotherAttempt || !isRetryable(error)) {
        throw error;
      }

      if (error instanceof HttpResponseError && error.status === 429) {
        await sleep(retryAfterDelayMs(error.retryAfter, now().getTime()));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenAI Admin API request failed.");
}

type ParsedPage = {
  buckets: unknown[];
  nextPage: string | null;
};

function parsePage(value: unknown): ParsedPage {
  const page = requireRecord(value, "response");
  const buckets = requireArray(page.data, "response.data");
  if (typeof page.has_more !== "boolean") {
    throw new TypeError("response.has_more must be a boolean.");
  }

  if (!page.has_more) {
    if (page.next_page !== null && page.next_page !== undefined) {
      throw new TypeError("response.next_page must be empty on the last page.");
    }
    return { buckets, nextPage: null };
  }

  if (typeof page.next_page !== "string" || page.next_page.length === 0) {
    throw new TypeError("response.next_page must contain a pagination cursor.");
  }

  return { buckets, nextPage: page.next_page };
}

async function collectPages(
  endpoint: "costs" | "usage/completions",
  period: Period,
  projectId: string,
  adminKey: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  sleep: (delayMs: number) => Promise<void>,
  now: () => Date
): Promise<unknown[]> {
  const buckets: unknown[] = [];
  const cursors = new Set<string>();
  let page: string | null = null;

  for (let pageCount = 0; pageCount < MAX_PAGES; pageCount += 1) {
    const response = await requestJson(
      buildUrl(endpoint, period, projectId, page),
      adminKey,
      fetchImpl,
      timeoutMs,
      sleep,
      now
    );
    const parsed = parsePage(response);
    buckets.push(...parsed.buckets);

    if (parsed.nextPage === null) {
      return buckets;
    }
    if (cursors.has(parsed.nextPage)) {
      throw new Error("OpenAI Admin API returned a repeated pagination cursor.");
    }
    cursors.add(parsed.nextPage);
    page = parsed.nextPage;
  }

  throw new Error("OpenAI Admin API pagination exceeded the safe page limit.");
}

function aggregateCosts(buckets: unknown[], projectId: string): CostAggregate {
  let amount = 0;
  let currency: CostCurrency | null = null;

  for (const [bucketIndex, bucketValue] of buckets.entries()) {
    const bucket = requireRecord(bucketValue, `cost bucket ${bucketIndex}`);
    requireNonNegativeNumber(bucket.start_time, "cost bucket.start_time");
    const results = requireArray(bucket.results, "cost bucket.results");

    for (const resultValue of results) {
      const result = requireRecord(resultValue, "cost result");
      requireProjectId(result.project_id, projectId);
      if (result.line_item !== null && typeof result.line_item !== "string") {
        throw new TypeError("cost result.line_item is invalid.");
      }
      const amountObject = requireRecord(result.amount, "cost result.amount");
      amount += requireNonNegativeNumber(amountObject.value, "amount.value");
      const resultCurrency = requireCurrency(amountObject.currency);
      if (currency !== null && currency !== resultCurrency) {
        throw new TypeError("Cost results contain mixed currencies.");
      }
      currency = resultCurrency;
    }
  }

  if (currency === null) {
    throw new TypeError("Cost results do not contain a currency.");
  }

  return { amount, currency };
}

function aggregateUsage(buckets: unknown[], projectId: string): UsageAggregate {
  const aggregate: UsageAggregate = {
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    requests: 0,
  };

  for (const bucketValue of buckets) {
    const bucket = requireRecord(bucketValue, "usage bucket");
    requireNonNegativeNumber(bucket.start_time, "usage bucket.start_time");
    const results = requireArray(bucket.results, "usage bucket.results");

    for (const resultValue of results) {
      const result = requireRecord(resultValue, "usage result");
      requireProjectId(result.project_id, projectId);
      if (result.model !== null && typeof result.model !== "string") {
        throw new TypeError("usage result.model is invalid.");
      }
      aggregate.inputTokens += requireNonNegativeNumber(
        result.input_tokens,
        "input_tokens"
      );
      aggregate.outputTokens += requireNonNegativeNumber(
        result.output_tokens,
        "output_tokens"
      );
      aggregate.cachedInputTokens += requireNonNegativeNumber(
        result.input_cached_tokens,
        "input_cached_tokens"
      );
      aggregate.requests += requireNonNegativeNumber(
        result.num_model_requests,
        "num_model_requests"
      );
    }
  }

  return aggregate;
}

function usageSummary(usage: UsageAggregate): CostUsageMetric[] {
  return [
    { label: "入力トークン", value: usage.inputTokens, unit: "tokens" },
    { label: "出力トークン", value: usage.outputTokens, unit: "tokens" },
    {
      label: "キャッシュ済み入力",
      value: usage.cachedInputTokens,
      unit: "tokens",
    },
    { label: "モデルリクエスト", value: usage.requests, unit: "requests" },
  ];
}

async function loadSnapshot(
  fixture: ServiceCostSnapshot,
  month: string,
  projectId: string,
  adminKey: string,
  options: ProviderOptions
): Promise<ServiceCostSnapshot> {
  const period = periodForMonth(month);
  const fetchImpl = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const sleep =
    options.sleep ??
    ((delayMs: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  const now = options.now ?? (() => new Date());
  const [costBuckets, usageBuckets] = await Promise.all([
    collectPages(
      "costs",
      period,
      projectId,
      adminKey,
      fetchImpl,
      timeoutMs,
      sleep,
      now
    ),
    collectPages(
      "usage/completions",
      period,
      projectId,
      adminKey,
      fetchImpl,
      timeoutMs,
      sleep,
      now
    ),
  ]);
  const costs = aggregateCosts(costBuckets, projectId);
  const usage = aggregateUsage(usageBuckets, projectId);
  const updatedAt = now().toISOString();

  return {
    ...fixture,
    currency: costs.currency,
    currentMonthCost: costs.amount,
    estimatedCost: null,
    usageSummary: usageSummary(usage),
    freeTierSummary: "OpenAI Admin APIでは無料枠を判定していません",
    dataSource: "api-ready",
    fetchStatus: "success",
    updatedAt,
    notes: `OpenAI Admin APIから取得した${month}のプロジェクト別実績です。為替換算は行っていません。`,
    includedInTotal: false,
  };
}

export async function getOpenAICostSnapshot(
  fixture: ServiceCostSnapshot,
  month: string,
  options: ProviderOptions = {}
): Promise<ServiceCostSnapshot> {
  const env = options.env ?? process.env;
  const adminKey = env.OPENAI_ADMIN_KEY?.trim();
  const projectId = env.OPENAI_PROJECT_ID?.trim();

  if (!adminKey || !projectId) {
    return withFetchStatus(fixture, "fallback");
  }

  let period: Period;
  try {
    period = periodForMonth(month);
  } catch {
    return withFetchStatus(fixture, "fallback");
  }

  const cacheKey = `${projectId}:${period.startTime}:${period.endTime}`;
  const nowMs = (options.now ?? (() => new Date()))().getTime();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs) {
    return cached.snapshot;
  }

  const pending = inFlight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const refresh = loadSnapshot(
    fixture,
    month,
    projectId,
    adminKey,
    options
  )
    .then((snapshot) => {
      cache.set(cacheKey, {
        expiresAt: nowMs + CACHE_TTL_MS,
        snapshot,
      });
      return snapshot;
    })
    .catch(() => withFetchStatus(fixture, "error"))
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, refresh);
  return refresh;
}

export function clearOpenAICostCacheForTests(): void {
  cache.clear();
  inFlight.clear();
}
