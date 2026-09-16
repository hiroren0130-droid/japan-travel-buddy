import { expect, test } from "@playwright/test";

const stateKey = "playwright-firebase-mock-state";
const legacyKey = "favorite-travel-plans";
const title = "Kyoto & Osaka? #trip";
const savedPlan = (id: string) => ({
  id, uid: "user-1", title, summary: `Summary ${id}`, favorite: true,
  days: [{ day: 1, items: [] }],
});

for (const legacy of [JSON.stringify([savedPlan("legacy")]), "{invalid json"]) {
  test(`Firestore details use document ID and retain legacy storage: ${legacy[0]}`, async ({ page }) => {
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      return host === "localhost" || host === "127.0.0.1" ? route.continue() : route.abort();
    });
    await page.addInitScript(({ stateKey, legacyKey, legacy, plans }) => {
      if (!localStorage.getItem(stateKey)) {
        localStorage.setItem(stateKey, JSON.stringify({ user: { uid: "user-1" }, plans, calls: {} }));
        localStorage.setItem(legacyKey, legacy);
      }
      localStorage.setItem("japan-travel-buddy-locale", "en");
    }, { stateKey, legacyKey, legacy, plans: [savedPlan("document-1"), savedPlan("document-2")] });

    await page.goto("/favorites");
    await expect(page.getByText(title, { exact: true })).toHaveCount(2);
    await page.getByText(title, { exact: true }).nth(1).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("plan")).toBe("document-2");
    await expect(page.getByText("Summary document-2", { exact: true }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("Summary document-2", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Back to favorites" }).click();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByText(title, { exact: true })).toHaveCount(2);

    // Old title-based URLs must not associate a saved document by title.
    await page.goto(`/favorites?${new URLSearchParams({ plan: title })}`);
    await expect(page.getByText(title, { exact: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Back to favorites" })).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), legacyKey)).toBe(legacy);
  });
}
