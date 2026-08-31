import { expect, test, type Page } from "@playwright/test";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  getAdminSessionCookieConfig,
} from "../lib/auth/cookie-config";
import { parseAdminEmailWhitelist } from "../lib/auth/admin-whitelist";
import {
  MAX_AUTH_AGE_SECONDS,
  hasRecentAuthentication,
} from "../lib/auth/id-token";
import { isSameOriginRequest } from "../lib/auth/origin";
import {
  FIREBASE_MOCK_SENTINEL,
  resolveFirebaseMockMode,
} from "../lib/testing/firebase-mock-mode";

const BASE_URL = "http://localhost:3000";
const COOKIE_NAME = "jtb-admin-session";
const ADMIN_SECRET_SENTINEL = "cost-secret-sentinel@example.net";
const FIREBASE_STATE_KEY = "playwright-firebase-mock-state";

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

async function openLocalPage(page: Page): Promise<void> {
  await page.goto("/");
}

async function createAdminSession(
  page: Page,
  token?: string
): Promise<number> {
  return page.evaluate(async (idToken) => {
    const headers: Record<string, string> = {};

    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers,
      cache: "no-store",
    });

    return response.status;
  }, token);
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

async function getAdminCookie(page: Page) {
  const cookies = await page.context().cookies(BASE_URL);

  return cookies.find((cookie) => cookie.name === COOKIE_NAME);
}

async function installAuthenticatedState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          user: {
            uid: "admin-user",
            email: "admin@example.com",
            displayName: "管理者",
          },
          plans: [],
          calls: {},
        })
      );
    },
    { key: FIREBASE_STATE_KEY }
  );
}

async function readFirebaseMockState(page: Page) {
  return page.evaluate((key) => {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as { calls?: { signOut?: number } }) : null;
  }, FIREBASE_STATE_KEY);
}

function createOriginRequest(
  requestUrl: string,
  origin?: string,
  additionalHeaders: Record<string, string> = {}
): Request {
  const headers = new Headers(additionalHeaders);

  if (origin !== undefined) {
    headers.set("origin", origin);
  }

  return new Request(requestUrl, {
    method: "POST",
    headers,
  });
}

async function readStaticTextFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      contents.push(...(await readStaticTextFiles(entryPath)));
    } else if (/\.(?:css|html|js|json|map)$/.test(entry.name)) {
      contents.push(await readFile(entryPath, "utf8"));
    }
  }

  return contents;
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

test("session endpoint rejects a missing token with 400", async ({ page }) => {
  await openLocalPage(page);

  await expect(createAdminSession(page)).resolves.toBe(400);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("session endpoint rejects invalid, expired, and revoked tokens", async ({
  page,
}) => {
  await openLocalPage(page);

  for (const token of [
    "mock-invalid-token",
    "mock-expired-token",
    "mock-revoked-token",
  ]) {
    await expect(createAdminSession(page, token)).resolves.toBe(401);
  }

  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("session endpoint rejects an unverified admin email", async ({ page }) => {
  await openLocalPage(page);

  await expect(
    createAdminSession(page, "mock-unverified-token")
  ).resolves.toBe(403);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("session endpoint rejects a verified non-admin without a cookie", async ({
  page,
}) => {
  await openLocalPage(page);

  await expect(createAdminSession(page, "mock-user-token")).resolves.toBe(403);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("session endpoint issues a secure-shape admin cookie", async ({ page }) => {
  await openLocalPage(page);

  await expect(createAdminSession(page, "mock-admin-token")).resolves.toBe(204);

  const cookie = await getAdminCookie(page);
  expect(cookie?.value).toBe("mock-admin-session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(false);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.path).toBe("/");
});

test("an unset whitelist fails closed with 500", async ({ page }) => {
  await openLocalPage(page);

  await expect(
    createAdminSession(page, "mock-admin-token-missing-whitelist")
  ).resolves.toBe(500);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
  expect(() => parseAdminEmailWhitelist(undefined)).toThrow();
});

test("an unauthenticated admin request redirects to login", async ({ page }) => {
  await page.goto("/admin/auth-test");

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test("a non-admin session redirects to the forbidden page", async ({ page }) => {
  await addSessionCookie(page, "mock-user-session");
  await page.goto("/admin/auth-test");

  await expect(page).toHaveURL(/\/admin\/forbidden$/);
  await expect(
    page.getByRole("heading", { name: "管理者権限がありません" })
  ).toBeVisible();
});

test("a verified admin session can render the protected page", async ({
  page,
}) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/auth-test");

  await expect(page).toHaveURL(/\/admin\/auth-test$/);
  await expect(
    page.getByRole("heading", { name: "管理者認証済み" })
  ).toBeVisible();
});

test("a revoked admin session redirects to login", async ({ page }) => {
  await addSessionCookie(page, "mock-revoked-session");
  await page.goto("/admin/auth-test");

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test("logout deletes the admin cookie", async ({ page }) => {
  await openLocalPage(page);
  await addSessionCookie(page, "mock-admin-session");

  const status = await page.evaluate(async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    return response.status;
  });

  expect(status).toBe(204);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("session creation overwrites a fixation cookie", async ({ page }) => {
  await openLocalPage(page);
  await addSessionCookie(page, "attacker-controlled-session");

  await expect(createAdminSession(page, "mock-admin-token")).resolves.toBe(204);
  await expect(getAdminCookie(page)).resolves.toMatchObject({
    value: "mock-admin-session",
  });
});

test("the admin whitelist sentinel is absent from HTML and static chunks", async ({
  page,
}) => {
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/admin/auth-test");

  expect(await page.content()).not.toContain(ADMIN_SECRET_SENTINEL);
  const staticDirectory = path.join(process.cwd(), ".next", "static");

  try {
    await access(staticDirectory);
  } catch {
    return;
  }

  const staticContents = await readStaticTextFiles(staticDirectory);

  expect(staticContents.join("\n")).not.toContain(ADMIN_SECRET_SENTINEL);
});

test("Firebase mocks are allowed only for a deterministic development server", () => {
  expect(
    resolveFirebaseMockMode({
      env: {
        NODE_ENV: "development",
        PLAYWRIGHT_FIREBASE_MOCKS: "1",
        PLAYWRIGHT_FIREBASE_MOCK_SENTINEL: FIREBASE_MOCK_SENTINEL,
      },
      isDevelopmentServer: true,
    })
  ).toBe(true);
});

test("Vercel Production rejects the Firebase mock flag", () => {
  expect(() =>
    resolveFirebaseMockMode({
      env: {
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "production",
        PLAYWRIGHT_FIREBASE_MOCKS: "1",
        PLAYWRIGHT_FIREBASE_MOCK_SENTINEL: FIREBASE_MOCK_SENTINEL,
      },
      isDevelopmentServer: false,
    })
  ).toThrow();
});

test("Vercel Preview rejects the Firebase mock flag", () => {
  expect(() =>
    resolveFirebaseMockMode({
      env: {
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview",
        PLAYWRIGHT_FIREBASE_MOCKS: "1",
        PLAYWRIGHT_FIREBASE_MOCK_SENTINEL: FIREBASE_MOCK_SENTINEL,
      },
      isDevelopmentServer: false,
    })
  ).toThrow();
});

test("recent auth_time creates an admin session", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-recent")
  ).resolves.toBe(204);
});

test("missing auth_time is rejected", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-missing")
  ).resolves.toBe(401);
});

test("malformed auth_time is rejected", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-malformed")
  ).resolves.toBe(401);
});

test("future auth_time is rejected", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-future")
  ).resolves.toBe(401);
});

test("expired auth_time is rejected", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-expired")
  ).resolves.toBe(401);
});

test("auth_time at the five-minute boundary is accepted", async ({ page }) => {
  await openLocalPage(page);
  await expect(
    createAdminSession(page, "mock-auth-time-boundary")
  ).resolves.toBe(204);
  expect(hasRecentAuthentication(700, 700 + MAX_AUTH_AGE_SECONDS)).toBe(true);
  expect(hasRecentAuthentication(700, 701 + MAX_AUTH_AGE_SECONDS)).toBe(false);
});

test("localhost exact Origin is accepted", () => {
  const request = createOriginRequest(BASE_URL, BASE_URL);
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(true);
});

test("missing Origin is rejected", () => {
  const request = createOriginRequest(BASE_URL);
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(false);
});

test("malformed Origin is rejected", () => {
  const request = createOriginRequest(BASE_URL, "not-an-origin");
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(false);
});

test("cross-host Origin is rejected", () => {
  const request = createOriginRequest(BASE_URL, "http://evil.example");
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(false);
});

test("cross-port Origin is rejected", () => {
  const request = createOriginRequest(BASE_URL, "http://localhost:3001");
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(false);
});

test("cross-scheme Origin is rejected", () => {
  const request = createOriginRequest(BASE_URL, "https://localhost:3000");
  expect(isSameOriginRequest(request, { isVercel: false })).toBe(false);
});

test("Vercel HTTPS forwarded Origin is accepted", () => {
  const request = createOriginRequest(
    "https://internal.invalid/api/auth/session",
    "https://preview.example.vercel.app",
    {
      "x-forwarded-host": "preview.example.vercel.app",
      "x-forwarded-proto": "https",
    }
  );

  expect(isSameOriginRequest(request, { isVercel: true })).toBe(true);
});

test("Production cookie uses the __Host secure contract", () => {
  const config = getAdminSessionCookieConfig(true);

  expect(config).toEqual({
    name: "__Host-jtb-admin-session",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    },
  });
  expect(config.options).not.toHaveProperty("domain");
});

test("development cookie is non-secure and uses the test name", () => {
  const config = getAdminSessionCookieConfig(false);

  expect(config.name).toBe("jtb-admin-session");
  expect(config.options.secure).toBe(false);
  expect(config.options.maxAge).toBe(8 * 60 * 60);
});

test("dashboard logout success clears the cookie and opens login", async ({
  page,
}) => {
  await installAuthenticatedState(page);
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
  await expect(readFirebaseMockState(page)).resolves.toMatchObject({
    calls: { signOut: 1 },
  });
});

test("logout 500 shows incomplete state and retry completes logout", async ({
  page,
}) => {
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 500 })
  );
  await installAuthenticatedState(page);
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL(/\/logout-incomplete$/);
  await expect(
    page.getByRole("heading", {
      name: "管理者セッションを削除できませんでした",
    })
  ).toBeVisible();
  await expect(getAdminCookie(page)).resolves.toMatchObject({
    value: "mock-admin-session",
  });

  await page.unroute("**/api/auth/logout");
  await page
    .getByRole("button", { name: "管理者セッションの削除を再試行" })
    .click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(getAdminCookie(page)).resolves.toBeUndefined();
});

test("logout network failure never shows normal completion", async ({ page }) => {
  await page.route("**/api/auth/logout", (route) => route.abort("failed"));
  await installAuthenticatedState(page);
  await addSessionCookie(page, "mock-admin-session");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL(/\/logout-incomplete$/);
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(getAdminCookie(page)).resolves.toMatchObject({
    value: "mock-admin-session",
  });
});
