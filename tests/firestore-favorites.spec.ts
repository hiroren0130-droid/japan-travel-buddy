import { expect, test, type Page } from "@playwright/test";
import type { FirebaseMockState } from "./mocks/firebase-auth";

const stateKey = "playwright-firebase-mock-state";
const legacyKey = "favorite-travel-plans";
const legacyValue = JSON.stringify([{ plan: { title: "Legacy only" }, savedAt: 123 }]);
const plan = (id: string, favorite: boolean, uid = "user-1") => ({
  id: id.replaceAll(" ", "-"), uid, title: id, summary: "Saved itinerary", favorite,
  days: [{ day: 1, items: [] }],
});

async function setup(page: Page, signedIn = true) {
  await page.route("**/*", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1"
      ? route.continue() : route.abort();
  });
  await page.addInitScript(({ stateKey, legacyKey, legacyValue, signedIn, plans }) => {
    if (!localStorage.getItem(stateKey)) {
      localStorage.setItem(stateKey, JSON.stringify({ user: signedIn ? { uid: "user-1" } : null, plans, calls: {} }));
      localStorage.setItem(legacyKey, legacyValue);
      localStorage.setItem("travelFavorites", "legacy-text-sentinel");
    }
    localStorage.setItem("japan-travel-buddy-locale", "en");
    const mutations: string[] = [];
    Object.assign(window, { legacyMutations: mutations });
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    const originalClear = Storage.prototype.clear;
    Storage.prototype.setItem = function (key, value) {
      if (key === legacyKey || key === "travelFavorites") mutations.push(key);
      return originalSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (key === legacyKey || key === "travelFavorites") mutations.push(key);
      return originalRemove.call(this, key);
    };
    Storage.prototype.clear = function () {
      mutations.push("clear");
      return originalClear.call(this);
    };
  }, { stateKey, legacyKey, legacyValue, signedIn, plans: [plan("Favorite plan", true), plan("Regular plan", false), plan("Other owner", true, "user-2")] });
}

async function state(page: Page): Promise<FirebaseMockState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey);
}

async function expectLegacyIntact(page: Page) {
  expect(await page.evaluate(() => Reflect.get(window, "legacyMutations"))).toEqual([]);
  expect(await page.evaluate((key) => localStorage.getItem(key), legacyKey)).toBe(legacyValue);
  expect(await page.evaluate(() => localStorage.getItem("travelFavorites"))).toBe("legacy-text-sentinel");
}

test("favorites lists only owned Firestore favorite:true and removes by false update", async ({ page }) => {
  await setup(page);
  await page.goto("/favorites");
  await expect(page.getByText("Favorite plan", { exact: true })).toBeVisible();
  await expect(page.getByText("Regular plan", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Other owner", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Legacy only", { exact: true })).toHaveCount(0);
  await page.getByTitle("Remove from favorites", { exact: true }).click();
  await expect(page.getByText("Favorite plan", { exact: true })).toHaveCount(0);
  const result = await state(page);
  expect(result.calls?.updateTravelPlan).toEqual([{ id: "Favorite-plan", data: { favorite: false } }]);
  expect(result.plans).toHaveLength(3);
  expect(result.calls?.deleteTravelPlan).toBeUndefined();
  await expectLegacyIntact(page);
});

for (const route of ["mypage", "history"]) {
  test(`${route} detail updates favorite using the saved document ID`, async ({ page }) => {
    await setup(page);
    await page.goto(`/${route}/Regular-plan`);
    await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove from favorites", exact: true })).toBeVisible();
    expect((await state(page)).calls?.updateTravelPlan).toEqual([{ id: "Regular-plan", data: { favorite: true } }]);
    await expectLegacyIntact(page);
  });
}

test("favorites detail removal updates the parent list immediately", async ({ page }) => {
  await setup(page);
  await page.goto("/favorites");
  await page.getByText("Favorite plan", { exact: true }).click();
  await expect(page).toHaveURL(/plan=Favorite-plan/);
  await page.getByRole("button", { name: "Remove from favorites", exact: true }).click();
  await expect(page.getByText("Favorite plan", { exact: true })).toHaveCount(0);
  expect((await state(page)).calls?.updateTravelPlan).toEqual([{ id: "Favorite-plan", data: { favorite: false } }]);
  await expectLegacyIntact(page);
});

for (const signedIn of [true, false]) {
  test(`unsaved plan prompts ${signedIn ? "save first" : "login"} without changing legacy data`, async ({ page }) => {
    await setup(page, signedIn);
    await page.route("**/api/chat", (route) => route.fulfill({ json: { plan: plan("Generated plan", false) } }));
    await page.goto("/chat");
    await page.locator("#travel-destination").fill("Kyoto");
    await page.locator("#travel-days").selectOption("1");
    await page.locator("#travel-travelers").selectOption("1");
    await page.getByRole("button", { name: /Generate|Create.*[Pp]lan/ }).click();
    await expect(page.getByRole("heading", { name: "Generated plan", exact: true })).toBeVisible();
    let notice = "";
    page.once("dialog", async (dialog) => {
      notice = dialog.message();
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
    expect(notice).toContain(signedIn ? "Please save this plan first" : "Please log in");
    await expect(page.getByRole("heading", { name: "Generated plan", exact: true })).toBeVisible();
    expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
    await expectLegacyIntact(page);
  });
}

test("signed-out favorites requires login and retains legacy data", async ({ page }) => {
  await setup(page, false);
  await page.goto("/favorites");
  await expect(page).toHaveURL(/\/login$/);
  await expectLegacyIntact(page);
});
