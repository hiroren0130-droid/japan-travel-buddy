import { expect, test } from "@playwright/test";

test("@smoke 旅行プランを作成して結果を表示できる", async ({
  page,
}) => {
  await page.route("**/api/places/photo?**", async (route) => {
    await route.fulfill({ status: 404 });
  });

  await page.route("https://maps.googleapis.com/**", async (route) => {
    await route.abort();
  });

  await page.route("**/api/chat", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        plan: {
          title: "テスト用京都プラン",
          summary: "UIスモークテスト用の固定プランです。",
          days: [
            {
              day: 1,
              items: [
                {
                  time: "09:00",
                  spotId: "fushimi-inari",
                  description: "伏見稲荷大社を参拝します。",
                  transport: "徒歩",
                  duration: "0分",
                },
              ],
            },
          ],
        },
      }),
    });
  });

  await page.goto("/chat");

  await page.locator("#travel-destination").fill("京都");
  await page.locator("#travel-days").selectOption("1");
  await page.locator("#travel-travelers").selectOption("1");
  await page.locator("#travel-special-request").fill("テスト用");

  const submitButton = page.getByRole("button", {
    name: "✨ AIで旅行プランを作成",
  });

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(
    page.getByRole("heading", { name: "テスト用京都プラン" })
  ).toBeVisible();
  await expect(
    page.getByText("UIスモークテスト用の固定プランです。", {
      exact: true,
    }).first()
  ).toBeVisible();
  await expect(
    page.getByText("伏見稲荷大社", { exact: true }).first()
  ).toBeVisible();
});
