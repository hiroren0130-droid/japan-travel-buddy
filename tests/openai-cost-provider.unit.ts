import assert from "node:assert/strict";
import test from "node:test";

import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";
import {
  clearOpenAICostCacheForTests,
  getOpenAICostSnapshot,
  getUtcMonth,
} from "../lib/costs/openaiCostProvider";
import type { ServiceCostSnapshot } from "../types/cost";

const fixture: ServiceCostSnapshot = {
  service: "openai",
  displayName: "OpenAI",
  currency: "JPY",
  currentMonthCost: 0,
  estimatedCost: null,
  usageSummary: [{ label: "API使用量", value: 0, unit: "未入力" }],
  freeTierSummary: "fixture",
  dataSource: "api-ready",
  fetchStatus: "fallback",
  updatedAt: "2026-08-01T00:00:00.000Z",
  notes: "fixture",
  includedInTotal: true,
};

const env = {
  OPENAI_ADMIN_KEY: "test-admin-key",
  OPENAI_PROJECT_ID: "proj_test",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function costPage(options: {
  amount?: unknown;
  currency?: unknown;
  hasMore?: boolean;
  nextPage?: string | null;
} = {}): unknown {
  return {
    object: "page",
    data: [
      {
        object: "bucket",
        start_time: 1785542400,
        end_time: 1785628800,
        results: [
          {
            object: "organization.costs.result",
            amount: {
              value: options.amount ?? 1.25,
              currency: options.currency ?? "usd",
            },
            line_item: "api usage",
            project_id: "proj_test",
          },
        ],
      },
    ],
    has_more: options.hasMore ?? false,
    next_page: options.nextPage ?? null,
  };
}

function usagePage(options: {
  inputTokens?: number;
  hasMore?: boolean;
  nextPage?: string | null;
} = {}): unknown {
  return {
    object: "page",
    data: [
      {
        object: "bucket",
        start_time: 1785542400,
        end_time: 1785628800,
        results: [
          {
            object: "organization.usage.completions.result",
            input_tokens: options.inputTokens ?? 100,
            output_tokens: 25,
            input_cached_tokens: 40,
            num_model_requests: 2,
            model: "gpt-test",
            project_id: "proj_test",
          },
        ],
      },
    ],
    has_more: options.hasMore ?? false,
    next_page: options.nextPage ?? null,
  };
}

type MockHandler = (url: URL, init?: RequestInit) => Promise<Response>;

function asFetch(handler: MockHandler): typeof fetch {
  return async (input, init) =>
    handler(new URL(input instanceof Request ? input.url : String(input)), init);
}

function successfulFetch(calls: URL[] = []): typeof fetch {
  return asFetch(async (url) => {
    calls.push(url);
    return jsonResponse(
      url.pathname.endsWith("/costs") ? costPage() : usagePage()
    );
  });
}

async function getSnapshot(
  fetchImpl: typeof fetch,
  options: {
    month?: string;
    now?: () => Date;
    sleep?: (delayMs: number) => Promise<void>;
  } = {}
): Promise<ServiceCostSnapshot> {
  return getOpenAICostSnapshot(fixture, options.month ?? "2026-08", {
    env,
    fetch: fetchImpl,
    now: options.now ?? (() => new Date("2026-08-15T12:00:00.000Z")),
    timeoutMs: 20,
    sleep: options.sleep ?? (async () => undefined),
  });
}

function assertErrorFallback(snapshot: ServiceCostSnapshot): void {
  assert.deepEqual(snapshot, {
    ...fixture,
    fetchStatus: "error",
  });
}

test.beforeEach(() => {
  clearOpenAICostCacheForTests();
});

test("uses the UTC September month regardless of local calendar time", () => {
  expectUtcMonth("2026-09", "2026-08-31T20:30:00-07:00");
  expectUtcMonth("2026-09", "2026-10-01T08:30:00+09:00");
});

test("rolls the UTC month from December into January", () => {
  expectUtcMonth("2026-12", "2026-12-31T23:59:59.999Z");
  expectUtcMonth("2027-01", "2027-01-01T00:00:00.000Z");
});

function expectUtcMonth(expected: string, value: string): void {
  assert.equal(getUtcMonth(new Date(value)), expected);
}

test("returns the exact fixture without HTTP when the admin key is missing", async () => {
  let calls = 0;
  const snapshot = await getOpenAICostSnapshot(fixture, "2026-08", {
    env: { OPENAI_PROJECT_ID: "proj_test" },
    fetch: asFetch(async () => {
      calls += 1;
      return jsonResponse({});
    }),
  });

  assert.equal(snapshot, fixture);
  assert.equal(snapshot.fetchStatus, "fallback");
  assert.equal(calls, 0);
});

test("returns the exact fixture without HTTP when the project is missing", async () => {
  let calls = 0;
  const snapshot = await getOpenAICostSnapshot(fixture, "2026-08", {
    env: { OPENAI_ADMIN_KEY: "test-admin-key" },
    fetch: asFetch(async () => {
      calls += 1;
      return jsonResponse({});
    }),
  });

  assert.equal(snapshot, fixture);
  assert.equal(snapshot.fetchStatus, "fallback");
  assert.equal(calls, 0);
});

test("aggregates one costs page and one completions usage page", async () => {
  const calls: URL[] = [];
  const snapshot = await getSnapshot(successfulFetch(calls));

  assert.equal(snapshot.currentMonthCost, 1.25);
  assert.equal(snapshot.currency, "USD");
  assert.equal(snapshot.fetchStatus, "success");
  assert.equal(snapshot.updatedAt, "2026-08-15T12:00:00.000Z");
  assert.equal(snapshot.includedInTotal, false);
  assert.deepEqual(
    snapshot.usageSummary.map((metric) => metric.value),
    [100, 25, 40, 2]
  );
  assert.equal(calls.length, 2);
  for (const url of calls) {
    assert.equal(url.searchParams.get("start_time"), "1785542400");
    assert.equal(url.searchParams.get("end_time"), "1788220800");
    assert.equal(url.searchParams.get("bucket_width"), "1d");
    assert.deepEqual(url.searchParams.getAll("project_ids[]"), ["proj_test"]);
    assert.equal(url.searchParams.get("limit"), "31");
  }
});

test("marks a successful zero-cost response as success", async () => {
  const snapshot = await getSnapshot(
    asFetch(async (url) =>
      jsonResponse(
        url.pathname.endsWith("/costs")
          ? costPage({ amount: 0 })
          : usagePage()
      )
    )
  );

  assert.equal(snapshot.currentMonthCost, 0);
  assert.equal(snapshot.fetchStatus, "success");
});

test("queries September from UTC month start to the next UTC month start", async () => {
  const calls: URL[] = [];
  await getOpenAICostSnapshot(fixture, "2026-09", {
    env,
    fetch: successfulFetch(calls),
    now: () => new Date("2026-09-15T12:00:00.000Z"),
    timeoutMs: 20,
    sleep: async () => undefined,
  });

  for (const url of calls) {
    assert.equal(
      url.searchParams.get("start_time"),
      String(Date.UTC(2026, 8, 1) / 1_000)
    );
    assert.equal(
      url.searchParams.get("end_time"),
      String(Date.UTC(2026, 9, 1) / 1_000)
    );
  }
});

test("queries December through January using UTC boundaries", async () => {
  const calls: URL[] = [];
  await getOpenAICostSnapshot(fixture, "2026-12", {
    env,
    fetch: successfulFetch(calls),
    now: () => new Date("2026-12-31T23:59:59.999Z"),
    timeoutMs: 20,
    sleep: async () => undefined,
  });

  for (const url of calls) {
    assert.equal(
      url.searchParams.get("start_time"),
      String(Date.UTC(2026, 11, 1) / 1_000)
    );
    assert.equal(
      url.searchParams.get("end_time"),
      String(Date.UTC(2027, 0, 1) / 1_000)
    );
  }
});

test("paginates costs and usage with next_page cursors", async () => {
  const seenPages: string[] = [];
  const fetchImpl = asFetch(async (url) => {
    const page = url.searchParams.get("page");
    seenPages.push(`${url.pathname}:${page ?? "first"}`);
    const isCosts = url.pathname.endsWith("/costs");
    if (page === null) {
      return jsonResponse(
        isCosts
          ? costPage({ hasMore: true, nextPage: "cost-2" })
          : usagePage({ hasMore: true, nextPage: "usage-2" })
      );
    }
    return jsonResponse(
      isCosts ? costPage({ amount: 2 }) : usagePage({ inputTokens: 300 })
    );
  });

  const snapshot = await getSnapshot(fetchImpl);
  assert.equal(snapshot.currentMonthCost, 3.25);
  assert.equal(snapshot.usageSummary[0]?.value, 400);
  assert.ok(seenPages.some((value) => value.endsWith(":cost-2")));
  assert.ok(seenPages.some((value) => value.endsWith(":usage-2")));
});

for (const status of [401, 403, 429, 500]) {
  test(`falls back atomically on HTTP ${status}`, async () => {
    const snapshot = await getSnapshot(
      asFetch(async () => jsonResponse({ error: "mock" }, status))
    );
    assertErrorFallback(snapshot);
  });
}

for (const status of [401, 403]) {
  test(`does not retry HTTP ${status}`, async () => {
    let costCalls = 0;
    const snapshot = await getSnapshot(
      asFetch(async (url) => {
        if (url.pathname.endsWith("/costs")) {
          costCalls += 1;
          return jsonResponse({}, status);
        }
        return jsonResponse(usagePage());
      })
    );

    assertErrorFallback(snapshot);
    assert.equal(costCalls, 1);
  });
}

test("retries 429 after Retry-After seconds without real sleep", async () => {
  let costCalls = 0;
  const delays: number[] = [];
  const snapshot = await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      return costCalls === 1
        ? new Response("", { status: 429, headers: { "Retry-After": "2" } })
        : jsonResponse(costPage());
    }),
    { sleep: async (delayMs) => void delays.push(delayMs) }
  );

  assert.equal(snapshot.currentMonthCost, 1.25);
  assert.equal(costCalls, 2);
  assert.deepEqual(delays, [2_000]);
});

test("supports an HTTP-date Retry-After value", async () => {
  let costCalls = 0;
  const delays: number[] = [];
  const now = () => new Date("2026-08-15T12:00:00.000Z");
  const snapshot = await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      return costCalls === 1
        ? new Response("", {
            status: 429,
            headers: {
              "Retry-After": new Date(now().getTime() + 3_000).toUTCString(),
            },
          })
        : jsonResponse(costPage());
    }),
    { now, sleep: async (delayMs) => void delays.push(delayMs) }
  );

  assert.equal(snapshot.currentMonthCost, 1.25);
  assert.deepEqual(delays, [3_000]);
});

for (const retryAfter of ["invalid", "-1"]) {
  test(`uses a safe default for Retry-After ${retryAfter}`, async () => {
    let costCalls = 0;
    const delays: number[] = [];
    const snapshot = await getSnapshot(
      asFetch(async (url) => {
        if (!url.pathname.endsWith("/costs")) {
          return jsonResponse(usagePage());
        }
        costCalls += 1;
        return costCalls === 1
          ? new Response("", {
              status: 429,
              headers: { "Retry-After": retryAfter },
            })
          : jsonResponse(costPage());
      }),
      { sleep: async (delayMs) => void delays.push(delayMs) }
    );

    assert.equal(snapshot.currentMonthCost, 1.25);
    assert.deepEqual(delays, [1_000]);
  });
}

test("caps an excessive Retry-After value", async () => {
  let costCalls = 0;
  const delays: number[] = [];
  await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      return costCalls === 1
        ? new Response("", {
            status: 429,
            headers: { "Retry-After": "999999" },
          })
        : jsonResponse(costPage());
    }),
    { sleep: async (delayMs) => void delays.push(delayMs) }
  );

  assert.deepEqual(delays, [8_000]);
});

test("falls back atomically after the bounded 429 retry fails", async () => {
  let costCalls = 0;
  const snapshot = await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      return new Response("", {
        status: 429,
        headers: { "Retry-After": "0" },
      });
    })
  );

  assertErrorFallback(snapshot);
  assert.equal(costCalls, 2);
});

test("retries a 5xx response within the existing bound", async () => {
  let costCalls = 0;
  const snapshot = await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      return jsonResponse({}, 500);
    })
  );

  assertErrorFallback(snapshot);
  assert.equal(costCalls, 2);
});

test("retries a network failure within the existing bound", async () => {
  let costCalls = 0;
  const snapshot = await getSnapshot(
    asFetch(async (url) => {
      if (!url.pathname.endsWith("/costs")) {
        return jsonResponse(usagePage());
      }
      costCalls += 1;
      throw new TypeError("mock network failure");
    })
  );

  assertErrorFallback(snapshot);
  assert.equal(costCalls, 2);
});

test("falls back on timeout", async () => {
  const fetchImpl = asFetch(
    async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })
  );

  assertErrorFallback(await getSnapshot(fetchImpl));
});

test("falls back on malformed JSON", async () => {
  const fetchImpl = asFetch(async () => new Response("{", { status: 200 }));
  assertErrorFallback(await getSnapshot(fetchImpl));
});

test("falls back on an invalid currency", async () => {
  const fetchImpl = asFetch(async (url) =>
    jsonResponse(
      url.pathname.endsWith("/costs")
        ? costPage({ currency: "US" })
        : usagePage()
    )
  );
  assertErrorFallback(await getSnapshot(fetchImpl));
});

for (const amount of [-1, Number.NaN, "1.00"]) {
  test(`falls back on invalid amount ${String(amount)}`, async () => {
    const fetchImpl = asFetch(async (url) =>
      jsonResponse(
        url.pathname.endsWith("/costs") ? costPage({ amount }) : usagePage()
      )
    );
    assertErrorFallback(await getSnapshot(fetchImpl));
  });
}

test("discards partial values when a later page fails", async () => {
  const fetchImpl = asFetch(async (url) => {
    if (!url.pathname.endsWith("/costs")) {
      return jsonResponse(usagePage());
    }
    if (url.searchParams.get("page") === null) {
      return jsonResponse(costPage({ hasMore: true, nextPage: "cost-2" }));
    }
    return jsonResponse({ error: "mock" }, 500);
  });

  const snapshot = await getSnapshot(fetchImpl);
  assertErrorFallback(snapshot);
  assert.equal(snapshot.currentMonthCost, 0);
});

test("falls back when pagination exceeds the maximum page count", async () => {
  let costPageNumber = 0;
  const fetchImpl = asFetch(async (url) => {
    if (!url.pathname.endsWith("/costs")) {
      return jsonResponse(usagePage());
    }
    costPageNumber += 1;
    return jsonResponse(
      costPage({ hasMore: true, nextPage: `cost-${costPageNumber + 1}` })
    );
  });

  assertErrorFallback(await getSnapshot(fetchImpl));
  assert.equal(costPageNumber, 12);
});

test("reuses a fresh cache entry and coalesces concurrent refreshes", async () => {
  let calls = 0;
  const fetchImpl = asFetch(async (url) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 1));
    return jsonResponse(
      url.pathname.endsWith("/costs") ? costPage() : usagePage()
    );
  });

  const [first, concurrent] = await Promise.all([
    getSnapshot(fetchImpl),
    getSnapshot(fetchImpl),
  ]);
  const cached = await getSnapshot(fetchImpl);
  assert.equal(first, concurrent);
  assert.equal(first, cached);
  assert.equal(calls, 2);
});

test("does not add a non-JPY OpenAI snapshot to the JPY total", async () => {
  const snapshot = await getSnapshot(successfulFetch());
  assert.equal(
    calculateCurrentMonthTotal({
      month: "2026-08",
      reportingCurrency: "JPY",
      services: [snapshot],
    }),
    0
  );
});
