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

async function generate(page: Page, title = "New generated plan") {
  await page.route("**/api/chat", (route) => route.fulfill({ json: { plan: plan(title, false) } }));
  if (!page.url().endsWith("/chat")) await page.goto("/chat");
  await page.locator("#travel-destination").fill("Kyoto");
  await page.locator("#travel-days").selectOption("1");
  await page.locator("#travel-travelers").selectOption("1");
  await page.getByRole("button", { name: /Generate|Create.*[Pp]lan/ }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

async function clickWithNotice(page: Page, button: string, message: string) {
  const notice = page.waitForEvent("dialog");
  const click = page.getByRole("button", { name: button, exact: true }).click();
  const dialog = await notice;
  expect(dialog.message()).toContain(message);
  await dialog.accept();
  await click;
}

async function changeUser(page: Page, uid: string | null) {
  await page.evaluate(({ key, uid }) => {
    const current = JSON.parse(localStorage.getItem(key)!);
    current.user = uid ? { uid } : null;
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new Event("playwright-auth-changed"));
  }, { key: stateKey, uid });
}

test("save then favorite and unfavorite updates the new document without navigation", async ({ page }) => {
  await setup(page);
  await generate(page);
  await clickWithNotice(page, "Save travel plan", "Travel plan saved.");
  const saved = (await state(page)).plans!.find((entry) => entry.title === "New generated plan")!;
  expect(saved.id).toMatch(/^mock-saved-/);
  expect(saved.favorite).toBe(false);
  await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove from favorites", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove from favorites", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add to favorites", exact: true })).toBeVisible();
  expect((await state(page)).calls?.updateTravelPlan).toEqual([
    { id: saved.id, data: { favorite: true } },
    { id: saved.id, data: { favorite: false } },
  ]);
  await expectLegacyIntact(page);
  await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove from favorites", exact: true })).toBeVisible();
  await page.goto("/favorites");
  await expect(page.getByText("New generated plan", { exact: true })).toBeVisible();
  await expectLegacyIntact(page);
});

test("failed save does not enable favorite updates", async ({ page }) => {
  await setup(page);
  await generate(page);
  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key)!);
    current.firestore = { saveReject: true };
    localStorage.setItem(key, JSON.stringify(current));
  }, stateKey);
  await clickWithNotice(page, "Save travel plan", "Could not save the travel plan.");
  await clickWithNotice(page, "Add to favorites", "Please save this plan first");
  expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
  expect((await state(page)).plans).toHaveLength(3);
  await expectLegacyIntact(page);
});

test("duplicate save failure preserves the original saved document ID", async ({ page }) => {
  await setup(page);
  await generate(page);
  await clickWithNotice(page, "Save travel plan", "Travel plan saved.");
  const saved = (await state(page)).plans!.find((entry) => entry.title === "New generated plan")!;
  await clickWithNotice(page, "Save travel plan", "Could not save the travel plan.");
  await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove from favorites", exact: true })).toBeVisible();
  expect((await state(page)).calls?.updateTravelPlan).toEqual([
    { id: saved.id, data: { favorite: true } },
  ]);
  expect((await state(page)).plans).toHaveLength(4);
  await expectLegacyIntact(page);
});

test("a newly generated plan cannot reuse the previous saved ID", async ({ page }) => {
  await setup(page);
  await generate(page);
  await clickWithNotice(page, "Save travel plan", "Travel plan saved.");
  await generate(page, "Another generated plan");
  await clickWithNotice(page, "Add to favorites", "Please save this plan first");
  expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
  await expectLegacyIntact(page);
});

for (const returnToOriginalUser of [false, true]) {
  test(`saved ID is invalidated after auth changes, return=${returnToOriginalUser}`, async ({ page }) => {
    await setup(page);
    await generate(page);
    await clickWithNotice(page, "Save travel plan", "Travel plan saved.");
    await changeUser(page, "user-2");
    if (returnToOriginalUser) await changeUser(page, "user-1");
    await clickWithNotice(page, "Add to favorites", "Please save this plan first");
    expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
    await expectLegacyIntact(page);
  });
}

test("a save completing after logout and login cannot restore the old ID", async ({ page }) => {
  await setup(page);
  await generate(page);
  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key)!);
    current.firestore = { saveDeferred: true };
    localStorage.setItem(key, JSON.stringify(current));
  }, stateKey);
  await page.getByRole("button", { name: "Save travel plan", exact: true }).click();
  await expect.poll(async () => (await state(page)).calls?.saveTravelPlan?.length).toBe(1);
  await changeUser(page, null);
  await changeUser(page, "user-1");
  await page.evaluate(() => window.dispatchEvent(new Event("playwright-release-save")));
  await expect(page.getByRole("button", { name: "Save travel plan", exact: true })).toBeEnabled();
  await clickWithNotice(page, "Add to favorites", "Please save this plan first");
  expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
  await expectLegacyIntact(page);
});
