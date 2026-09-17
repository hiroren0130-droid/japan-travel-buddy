import { expect, test, type Page } from "@playwright/test";
import type { FirebaseMockState } from "./mocks/firebase-auth";

const stateKey = "playwright-firebase-mock-state";
const conditions = { startLocation: "京都駅", startTime: "08:30", endLocation: "大阪駅", endTime: "18:00" };
const labels = { startLocation: "Start location", startTime: "Start time", endLocation: "End location", endTime: "End time" };
const days = [{ day: 1, items: [{ time: "09:00", spotId: "kiyomizudera", description: "Visit" }] }];

async function setup(page: Page, values: Record<string, string> = conditions) {
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === "localhost" || host === "127.0.0.1" ? route.continue() : route.abort();
  });
  await page.addInitScript(({ stateKey, values, days }) => {
    if (!localStorage.getItem(stateKey)) {
      localStorage.setItem(stateKey, JSON.stringify({ user: { uid: "user-1" }, plans: [
        { id: "edit-plan", uid: "user-1", title: "Original", summary: "Summary", favorite: true, days, ...values },
      ], calls: {} }));
    }
    localStorage.setItem("japan-travel-buddy-locale", "en");
  }, { stateKey, values, days });
  await page.goto("/history/edit-plan/edit");
  await expect(page.locator('input[type="text"]').first()).toHaveValue("Original");
}

async function state(page: Page): Promise<FirebaseMockState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey);
}

async function save(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "💾 Save", exact: true }).click();
  await expect(page).toHaveURL(/\/history\/edit-plan$/);
  const result = await state(page);
  expect(result.plans![0].days).toEqual(days);
  expect(result.plans![0].favorite).toBe(true);
  return result;
}

test("loads all four saved conditions", async ({ page }) => {
  await setup(page);
  for (const key of Object.keys(conditions) as Array<keyof typeof conditions>) {
    await expect(page.getByLabel(labels[key], { exact: true })).toHaveValue(conditions[key]);
  }
});

for (const field of ["title", "summary"] as const) {
  test(`${field} only omits all conditions and preserves details`, async ({ page }) => {
    await setup(page);
    await page.locator(field === "title" ? 'input[type="text"]' : "textarea").first().fill("Changed");
    const result = await save(page);
    expect(result.plans![0]).toMatchObject(conditions);
    expect(result.calls?.updateTravelPlan).toEqual([{ id: "edit-plan", data: {
      title: field === "title" ? "Changed" : "Original", summary: field === "summary" ? "Changed" : "Summary",
    } }]);
    await expect(page.getByText("京都駅", { exact: true })).toBeVisible();
    await expect(page.getByText("08:30", { exact: true })).toBeVisible();
  });
}

for (const key of Object.keys(conditions) as Array<keyof typeof conditions>) {
  for (const remove of [false, true]) {
    test(`${key}: ${remove ? "explicit deletion" : "single field update"} preserves other fields`, async ({ page }) => {
      await setup(page);
      const value = remove ? "" : key.endsWith("Time") ? "10:15" : "祇園";
      await page.getByLabel(labels[key], { exact: true }).fill(value);
      const result = await save(page);
      expect(result.calls?.updateTravelPlan).toEqual([{ id: "edit-plan", data: {
        title: "Original", summary: "Summary", [key]: remove ? { __deleteField: true } : value,
      } }]);
      for (const other of Object.keys(conditions) as Array<keyof typeof conditions>) {
        if (other !== key) expect(result.plans![0][other]).toBe(conditions[other]);
      }
      if (remove) expect(result.plans![0]).not.toHaveProperty(key);
      else expect(result.plans![0][key]).toBe(value);
    });
  }
}

test("untouched blank fields omit conditions even if stored values subsequently exist", async ({ page }) => {
  await setup(page, {});
  await page.evaluate(({ stateKey, conditions }) => {
    const current = JSON.parse(localStorage.getItem(stateKey)!);
    Object.assign(current.plans[0], conditions);
    localStorage.setItem(stateKey, JSON.stringify(current));
  }, { stateKey, conditions });
  await page.locator('input[type="text"]').first().fill("Changed");
  expect((await save(page)).plans![0]).toMatchObject(conditions);
});

test("legacy document without conditions supports title and summary edits", async ({ page }) => {
  await setup(page, {});
  await page.locator('input[type="text"]').first().fill("Changed");
  await page.locator("textarea").fill("Changed summary");
  const result = await save(page);
  expect(result.calls?.updateTravelPlan![0].data).toEqual({ title: "Changed", summary: "Changed summary" });
  for (const key of Object.keys(conditions)) expect(result.plans![0]).not.toHaveProperty(key);
});

test("invalid edited time is rejected without any write", async ({ page }) => {
  await setup(page);
  const input = page.getByLabel(labels.startTime, { exact: true });
  // Inject an invalid string to exercise validation beyond native time sanitization.
  await input.evaluate((element) => element.setAttribute("type", "text"));
  await input.fill("25:00");
  const dialogPromise = page.waitForEvent("dialog");
  const click = page.getByRole("button", { name: "💾 Save", exact: true }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("HH:mm");
  await dialog.accept();
  await click;
  const result = await state(page);
  expect(result.calls?.updateTravelPlan).toBeUndefined();
  expect(result.plans![0]).toMatchObject(conditions);
});

test("native partial time input cannot be interpreted as deletion", async ({ page }) => {
  await setup(page);
  const input = page.getByLabel(labels.startTime, { exact: true });
  await input.focus();
  await input.press("ArrowLeft");
  await input.press("Home");
  await input.press("Delete");
  // Explicitly emulate the browser's invalid-input state for a partial time.
  await input.evaluate((element: HTMLInputElement) => element.setCustomValidity("Incomplete time"));
  await page.getByRole("button", { name: "💾 Save", exact: true }).click();
  expect((await state(page)).calls?.updateTravelPlan).toBeUndefined();
  expect((await state(page)).plans![0]).toMatchObject(conditions);
});
