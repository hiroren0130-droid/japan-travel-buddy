import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const STATE_KEY = "playwright-firebase-mock-state";

type MockState = {
  user: {
    uid: string;
    email?: string;
    displayName?: string | null;
  } | null;
  auth?: {
    signInReject?: boolean;
    createUserReject?: boolean;
  };
  plans?: Array<Record<string, unknown>>;
  calls?: Record<string, unknown>;
};

const user = {
  uid: "user-1",
  email: "traveler@example.com",
  displayName: "旅行者",
};

function createPlan(
  id: string,
  uid: string,
  title: string,
  summary: string
) {
  return {
    id,
    uid,
    title,
    summary,
    favorite: false,
    days: [
      {
        day: 1,
        items: [],
      },
    ],
  };
}

async function installMockState(
  page: Page,
  state: MockState
): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    },
    { key: STATE_KEY, value: state }
  );
}

async function readMockState(page: Page): Promise<MockState> {
  return page.evaluate((key) => {
    const value = window.localStorage.getItem(key);

    if (!value) {
      throw new Error("Firebase mock state is missing.");
    }

    return JSON.parse(value) as MockState;
  }, STATE_KEY);
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

test.beforeEach(async ({ page }) => {
  const externalRequests: string[] = [];
  const externalWebSockets: string[] = [];

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

  test.info().annotations.push({
    type: "external-request-counter",
    description:
      "All non-local HTTP and WebSocket requests are blocked.",
  });

  (page as Page & { externalRequests?: string[] }).externalRequests =
    externalRequests;
  (
    page as Page & { externalWebSockets?: string[] }
  ).externalWebSockets = externalWebSockets;
});

test.afterEach(async ({ page }) => {
  const externalRequests = (
    page as Page & { externalRequests?: string[] }
  ).externalRequests;
  const externalWebSockets = (
    page as Page & { externalWebSockets?: string[] }
  ).externalWebSockets;

  expect(externalRequests).toEqual([]);
  expect(externalWebSockets).toEqual([]);
});

test("Login succeeds and navigates to Dashboard", async ({ page }) => {
  await installMockState(page, {
    user: null,
    plans: [],
    calls: {},
  });
  await page.goto("/login");

  await page.getByPlaceholder("メールアドレスを入力").fill(
    "  traveler@example.com  "
  );
  await page.getByPlaceholder("パスワードを入力").fill("secret123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  const state = await readMockState(page);
  expect(state.calls?.signIn).toEqual([
    {
      email: "traveler@example.com",
      password: "secret123",
    },
  ]);
});

test("Login failure shows the existing alert and resets loading", async ({
  page,
}) => {
  await installMockState(page, {
    user: null,
    auth: { signInReject: true },
    calls: {},
  });
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレスを入力").fill(
    "traveler@example.com"
  );
  await page.getByPlaceholder("パスワードを入力").fill("wrong-password");

  let alertMessage = "";
  page.once("dialog", async (dialog) => {
    alertMessage = dialog.message();
    await dialog.accept();
  });
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect.poll(() => alertMessage).toBe(
    "メールアドレスまたはパスワードが正しくありません。"
  );

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "ログイン" })
  ).toBeEnabled();
});

test("Signup creates a profile and navigates to Dashboard", async ({
  page,
}) => {
  await installMockState(page, {
    user: null,
    plans: [],
    calls: {},
  });
  await page.goto("/signup");

  await page.getByPlaceholder("Your name").fill("  旅行者  ");
  await page.getByPlaceholder("Your email").fill(
    "  traveler@example.com  "
  );
  await page.getByPlaceholder("Password").fill("secret123");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  const state = await readMockState(page);
  expect(state.calls?.createUser).toEqual([
    {
      email: "traveler@example.com",
      password: "secret123",
    },
  ]);
  expect(state.calls?.updateProfile).toEqual([
    { displayName: "旅行者" },
  ]);
});

test("Signup failure shows the existing inline error", async ({ page }) => {
  await installMockState(page, {
    user: null,
    auth: { createUserReject: true },
    calls: {},
  });
  await page.goto("/signup");

  await page.getByPlaceholder("Your name").fill("旅行者");
  await page.getByPlaceholder("Your email").fill(
    "traveler@example.com"
  );
  await page.getByPlaceholder("Password").fill("secret123");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText(
    "アカウントを作成できませんでした。入力内容を確認して、もう一度お試しください。"
  )).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole("button", { name: "Create Account" })
  ).toBeEnabled();
});

test("Dashboard lists, searches, links, edits, and deletes plans", async ({
  page,
}) => {
  const kyotoPlan = createPlan(
    "kyoto-plan",
    user.uid,
    "京都文化プラン",
    "寺社を巡る一日"
  );
  const osakaPlan = createPlan(
    "osaka-plan",
    user.uid,
    "大阪グルメプラン",
    "大阪の食を楽しむ一日"
  );

  await installMockState(page, {
    user,
    plans: [kyotoPlan, osakaPlan],
    calls: {},
  });
  await page.goto("/dashboard");

  await expect(page.getByText(kyotoPlan.title)).toBeVisible();
  await expect(page.getByText(osakaPlan.title)).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: kyotoPlan.title })
  ).toHaveAttribute("href", "/history/kyoto-plan");

  await page.getByPlaceholder("旅行プランを検索...").fill("京都");
  await expect(page.getByText(kyotoPlan.title)).toBeVisible();
  await expect(page.getByText(osakaPlan.title)).toHaveCount(0);
  await page.getByPlaceholder("旅行プランを検索...").fill("");

  const kyotoCard = page
    .getByRole("heading", { name: kyotoPlan.title })
    .locator("../..");
  await kyotoCard.getByRole("button", { name: "✏️ 編集" }).click();
  await expect(page).toHaveURL(/\/history\/kyoto-plan\/edit$/);

  await page.goto("/dashboard");
  const osakaCard = page
    .getByRole("heading", { name: osakaPlan.title })
    .locator("../..");
  page.once("dialog", (dialog) => dialog.accept());
  await osakaCard.getByRole("button", { name: "🗑 削除" }).click();

  await expect(page.getByText(osakaPlan.title)).toHaveCount(0);
  const state = await readMockState(page);
  expect(state.calls?.deleteTravelPlan).toEqual(["osaka-plan"]);
});

test("History detail displays an owned plan", async ({ page }) => {
  const plan = createPlan(
    "owned-history",
    user.uid,
    "所有者の履歴プラン",
    "History詳細のfixture"
  );
  await installMockState(page, {
    user,
    plans: [plan],
    calls: {},
  });

  await page.goto("/history/owned-history");
  await expect(
    page.getByRole("heading", { name: plan.title })
  ).toBeVisible();
  await expect(page.getByText(plan.summary).first()).toBeVisible();
});

test("History detail rejects a plan owned by another user", async ({
  page,
}) => {
  const plan = createPlan(
    "foreign-history",
    "other-user",
    "他人の履歴プラン",
    "表示してはいけない"
  );
  await installMockState(page, {
    user,
    plans: [plan],
    calls: {},
  });
  page.once("dialog", (dialog) => dialog.accept());

  await page.goto("/history/foreign-history");
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText(plan.title)).toHaveCount(0);
});

test("MyPage detail displays owned data and rejects foreign data", async ({
  page,
}) => {
  const ownedPlan = createPlan(
    "owned-mypage",
    user.uid,
    "所有者のマイページプラン",
    "MyPage詳細のfixture"
  );
  const foreignPlan = createPlan(
    "foreign-mypage",
    "other-user",
    "他人のマイページプラン",
    "表示してはいけない"
  );
  await installMockState(page, {
    user,
    plans: [ownedPlan, foreignPlan],
    calls: {},
  });

  await page.goto("/mypage/owned-mypage");
  await expect(
    page.getByRole("heading", { name: ownedPlan.title })
  ).toBeVisible();
  await expect(
    page.getByText(ownedPlan.summary).first()
  ).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.goto("/mypage/foreign-mypage");
  await expect(page).toHaveURL(/\/mypage$/);
  await expect(page.getByText(foreignPlan.title)).toHaveCount(0);
});
