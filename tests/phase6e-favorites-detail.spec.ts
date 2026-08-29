import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "favorite-travel-plans";
const FAVORITES_TEST_BASE_URL =
  process.env.FAVORITES_TEST_BASE_URL ?? "http://localhost:3000";

function getAppUrl(pathname: string): string {
  return new URL(pathname, FAVORITES_TEST_BASE_URL).toString();
}

const favoritePlan = {
  title: "京都 & 大阪? #旅",
  summary: "お気に入り詳細表示のテストプラン",
  days: [
    {
      day: 1,
      items: [],
    },
  ],
};

type RequestCounts = {
  firebase: number;
  openAi: number;
  places: number;
};

async function blockExternalApis(
  page: Page
): Promise<RequestCounts> {
  const counts: RequestCounts = {
    firebase: 0,
    openAi: 0,
    places: 0,
  };

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const isLocalApp =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";

    if (url.pathname.startsWith("/api/chat")) {
      counts.openAi += 1;
      await route.abort();
      return;
    }

    if (url.pathname.startsWith("/api/places/photo")) {
      counts.places += 1;
      await route.abort();
      return;
    }

    if (!isLocalApp) {
      if (
        url.hostname.includes("firebase") ||
        url.hostname.includes("firestore") ||
        url.hostname === "identitytoolkit.googleapis.com"
      ) {
        counts.firebase += 1;
      } else if (url.hostname === "api.openai.com") {
        counts.openAi += 1;
      } else if (
        url.hostname === "maps.googleapis.com" ||
        url.hostname === "places.googleapis.com"
      ) {
        counts.places += 1;
      }

      await route.abort();
      return;
    }

    await route.continue();
  });

  return counts;
}

function expectNoApiRequests(counts: RequestCounts) {
  expect(counts).toEqual({
    firebase: 0,
    openAi: 0,
    places: 0,
  });
}

test("new-format favorite opens by query, survives reload, and returns to the list", async ({
  page,
}) => {
  const requestCounts = await blockExternalApis(page);

  await page.addInitScript(
    ({ key, plan }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify([{ plan, savedAt: 1_700_000_000_000 }])
      );
    },
    { key: STORAGE_KEY, plan: favoritePlan }
  );

  await page.goto(getAppUrl("/favorites"));
  await expect(page.getByText(favoritePlan.title)).toBeVisible();

  await page.getByText(favoritePlan.title).click();

  await expect
    .poll(() => new URL(page.url()).searchParams.get("plan"))
    .toBe(favoritePlan.title);
  await expect(
    page.getByText(favoritePlan.summary).first()
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "お気に入り一覧に戻る" })
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText(favoritePlan.summary).first()
  ).toBeVisible();

  await page
    .getByRole("button", { name: "お気に入り一覧に戻る" })
    .click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByText(favoritePlan.title)).toBeVisible();

  expectNoApiRequests(requestCounts);
});

test("old-format TravelPlan array can open the existing detail UI", async ({
  page,
}) => {
  const requestCounts = await blockExternalApis(page);

  await page.addInitScript(
    ({ key, plan }) => {
      window.localStorage.setItem(key, JSON.stringify([plan]));
    },
    { key: STORAGE_KEY, plan: favoritePlan }
  );

  const searchParams = new URLSearchParams({
    plan: favoritePlan.title,
  });
  await page.goto(
    getAppUrl(`/favorites?${searchParams.toString()}`)
  );

  await expect(
    page.getByText(favoritePlan.summary).first()
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "お気に入り一覧に戻る" })
  ).toBeVisible();

  expectNoApiRequests(requestCounts);
});

test("missing favorites and invalid storage safely show the normal list", async ({
  page,
}) => {
  const requestCounts = await blockExternalApis(page);

  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "{invalid json");
  }, STORAGE_KEY);

  await page.goto(
    getAppUrl("/favorites?plan=存在しないプラン")
  );

  await expect(
    page.getByRole("heading", {
      name: "お気に入り",
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "お気に入り一覧に戻る" })
  ).toHaveCount(0);

  expectNoApiRequests(requestCounts);
});

test("remove button does not navigate to favorite details", async ({
  page,
}) => {
  const requestCounts = await blockExternalApis(page);

  await page.addInitScript(
    ({ key, plan }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify([{ plan, savedAt: 1_700_000_000_000 }])
      );
    },
    { key: STORAGE_KEY, plan: favoritePlan }
  );

  await page.goto(getAppUrl("/favorites"));
  await page.locator('button[title="お気に入り解除"]').click();

  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByText(favoritePlan.title)).toHaveCount(0);

  expectNoApiRequests(requestCounts);
});
