import { expect, test, type Page } from "@playwright/test";

import { formatUpdatedAt } from "../components/admin/ServiceCostCard";
import { calculateCurrentMonthTotal } from "../lib/costs/costCalculations";
import { monthlyCostOverview } from "../lib/costs/costData";
import type {
  CostCurrency,
  CostServiceKey,
  MonthlyCostOverview,
  ServiceCostSnapshot,
} from "../types/cost";

const BASE_URL = "http://localhost:3000";
const COOKIE_NAME = "jtb-admin-session";
const externalRequestsByPage = new WeakMap<Page, string[]>();
const externalWebSocketsByPage = new WeakMap<Page, string[]>();

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

async function addSessionCookie(page: Page, value: string): Promise<void> {
  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value,
      url: BASE_URL,
    },
  ]);
}

function createSnapshot(
  service: CostServiceKey,
  currentMonthCost: number,
  includedInTotal: boolean,
  currency: CostCurrency = "JPY"
): ServiceCostSnapshot {
  return {
    service,
    displayName: service,
    currency,
    currentMonthCost,
    estimatedCost: null,
    usageSummary: [],
    freeTierSummary: "",
    dataSource: "manual",
    updatedAt: "2026-08-01T00:00:00.000Z",
    notes: "test fixture",
    includedInTotal,
  };
}

function createOverview(
  services: ServiceCostSnapshot[]
): MonthlyCostOverview {
  return {
    month: "2026-08",
    reportingCurrency: "JPY",
    services,
  };
}

test.beforeEach(async ({ page }) => {
  const externalRequests: string[] = [];
  const externalWebSockets: string[] = [];
  externalRequestsByPage.set(page, externalRequests);
  externalWebSocketsByPage.set(page, externalWebSockets);

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());

    if (!isLocalHostname(url.hostname)) {
      externalRequests.push(url.toString());
      await route.abort();
      return;
    }

    await route.continue();
  });

  await page.routeWebSocket("**/*", async (webSocket) => {
    const url = new URL(webSocket.url());

    if (!isLocalHostname(url.hostname)) {
      externalWebSockets.push(url.toString());
      await webSocket.close({
        code: 1008,
        reason: "External WebSocket blocked by Playwright.",
      });
      return;
    }

    webSocket.connectToServer();
  });
});

test.afterEach(async ({ page }) => {
  expect(externalRequestsByPage.get(page)).toEqual([]);
  expect(externalWebSocketsByPage.get(page)).toEqual([]);
});

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/admin/costs");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test("non-admin users are redirected to forbidden", async ({ page }) => {
  await addSessionCookie(page, "mock-user-session");
  await page.goto("/admin/costs");
  await expect(page).toHaveURL(/\/admin\/forbidden$/);
});

test("admins can view the cost control page", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(page).toHaveURL(/\/admin\/costs$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "コスト管理" })
  ).toBeVisible();
});

test("renders exactly five service cards", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(page.locator("[data-service]")).toHaveCount(5);
});

for (const serviceName of [
  "OpenAI",
  "Google Cloud",
  "Firebase / Firestore",
  "GitHub",
  "Vercel",
]) {
  test(`renders the ${serviceName} service`, async ({ page }) => {
    await addSessionCookie(page, "mock-admin-session");
    await page.goto("/admin/costs");
    await expect(
      page.getByRole("heading", { level: 2, name: serviceName, exact: true })
    ).toBeVisible();
  });
}

test("calculates the total from included services only", () => {
  const overview = createOverview([
    createSnapshot("openai", 100, true),
    createSnapshot("github", 50, true),
    createSnapshot("vercel", 25, false),
  ]);

  expect(calculateCurrentMonthTotal(overview)).toBe(150);
});

test("does not double-count Firebase costs included in Google Cloud", () => {
  const overview = createOverview([
    createSnapshot("google-cloud", 120, true),
    createSnapshot("firebase", 40, false),
  ]);

  expect(calculateCurrentMonthTotal(overview)).toBe(120);
});

test("rejects invalid or mixed-currency costs", () => {
  expect(() =>
    calculateCurrentMonthTotal(
      createOverview([createSnapshot("openai", Number.NaN, true)])
    )
  ).toThrow(RangeError);
  expect(() =>
    calculateCurrentMonthTotal(
      createOverview([createSnapshot("openai", -1, true)])
    )
  ).toThrow(RangeError);
  expect(() =>
    calculateCurrentMonthTotal(
      createOverview([createSnapshot("openai", 1, true, "USD")])
    )
  ).toThrow(TypeError);
});

test("shows the repository fixture total", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(
    page.getByRole("region", { name: "今月の合計費用" })
  ).toContainText("￥0");
  expect(calculateCurrentMonthTotal(monthlyCostOverview)).toBe(0);
});

test("shows the current UTC month", async ({ page }) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(page.getByText(`対象月: ${year}年${month}月`)).toBeVisible();
});

test("shows manual, api-ready, and future-api labels", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(page.getByText("手入力", { exact: true })).toHaveCount(3);
  await expect(page.getByText("API連携準備済み", { exact: true })).toBeVisible();
  await expect(page.getByText("将来API連携", { exact: true })).toBeVisible();
});

test("shows the fixed update date", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(page.locator('time[datetime="2026-08-01T00:00:00.000Z"]')).toHaveCount(
    5
  );
  await expect(page.getByText("2026年8月1日", { exact: true })).toHaveCount(5);
});

test("formats a valid updatedAt value with the existing UTC policy", () => {
  expect(formatUpdatedAt("2026-08-01T00:00:00.000Z")).toEqual({
    label: "2026年8月1日",
    dateTime: "2026-08-01T00:00:00.000Z",
  });
});

test("returns a safe fallback state for an invalid updatedAt value", () => {
  expect(() => formatUpdatedAt("not-a-date")).not.toThrow();
  expect(formatUpdatedAt("not-a-date")).toEqual({
    label: "更新日時不明",
    dateTime: null,
  });
});

test("returns a safe fallback state for an empty updatedAt value", () => {
  expect(() => formatUpdatedAt("")).not.toThrow();
  expect(formatUpdatedAt("")).toEqual({
    label: "更新日時不明",
    dateTime: null,
  });
});

test("explains Firebase exclusion from the total", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  const firebaseCard = page.locator('[data-service="firebase"]');
  await expect(firebaseCard).toContainText("今月合計から除外");
  await expect(firebaseCard).toContainText(
    "Google Cloud側に含まれるため、今月合計には二重加算しません"
  );
});

test("renders without external HTTP or WebSocket traffic", async ({ page }) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/costs");
  await expect(
    page.getByRole("heading", { level: 1, name: "コスト管理" })
  ).toBeVisible();
  expect(externalRequestsByPage.get(page)).toEqual([]);
  expect(externalWebSocketsByPage.get(page)).toEqual([]);
});
