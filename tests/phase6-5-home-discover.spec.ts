import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/places/photo?**", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Photo unavailable in E2E." }),
    });
  });
});

test("Homeの主CTAから京都・大阪Discoverへ進める", async ({
  page,
}) => {
  await page.goto("/");

  const primaryCta = page.getByRole("link", {
    name: "行きたい場所を見つける",
  });
  await expect(primaryCta).toHaveAttribute(
    "href",
    "#discover-regions"
  );
  await primaryCta.click();
  await expect(page).toHaveURL(/#discover-regions$/);

  const regionSection = page.locator("#discover-regions");
  const kyotoCard = regionSection
    .getByRole("heading", { name: "京都" })
    .locator("..")
    .locator("..");
  const osakaCard = regionSection
    .getByRole("heading", { name: "大阪" })
    .locator("..")
    .locator("..");

  await expect(kyotoCard.getByRole("link")).toHaveAttribute(
    "href",
    "/discover/kyoto"
  );
  await expect(osakaCard.getByRole("link")).toHaveAttribute(
    "href",
    "/discover/osaka"
  );
});

test("HomeおすすめSpotからDetailとDiscoverへ進める", async ({
  page,
}) => {
  await page.goto("/");

  const spotLink = page.locator(
    'a[href="/spots/kiyomizudera"]'
  );
  await expect(spotLink).toBeVisible();
  await spotLink.click();
  await expect(page).toHaveURL(/\/spots\/kiyomizudera$/);

  const backLink = page.getByRole("link", {
    name: /スポット一覧へ戻る/,
  });
  await expect(backLink).toHaveAttribute(
    "href",
    "/discover/kyoto"
  );
});

test("Discoverの選択をAI Planへ引き継ぐ", async ({ page }) => {
  await page.goto("/discover/osaka");

  await page
    .getByRole("button", { name: "♡ 行きたい" })
    .first()
    .click();

  const aiPlanButton = page.getByRole("button", {
    name: "選んだ1スポットでAI旅行プランを作る",
  });
  await expect(aiPlanButton).toBeEnabled();
  await aiPlanButton.click();

  await expect(page).toHaveURL(
    /\/chat\?spotId=osaka-castle$/
  );
});

test("Homeは日本語とEnglishを切り替えられる", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", {
      name: "行きたい場所を見つける",
    })
  ).toBeVisible();

  await page.getByLabel("Language / 言語").selectOption("en");

  await expect(
    page.getByRole("link", { name: "Discover places" })
  ).toBeVisible();
  const regionSection = page.locator("#discover-regions");
  await expect(
    regionSection.getByRole("heading", {
      name: "Kyoto",
      exact: true,
    })
  ).toBeVisible();
  await expect(
    regionSection.getByRole("heading", {
      name: "Osaka",
      exact: true,
    })
  ).toBeVisible();
});

test("Mobile Homeで横スクロールがなくCTAを操作できる", async ({
  page,
}) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 667 });
    await page.goto("/");

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  }

  await page.setViewportSize({ width: 375, height: 667 });

  const primaryCta = page.getByRole("link", {
    name: "行きたい場所を見つける",
  });
  await expect(primaryCta).toBeVisible();
  await primaryCta.click();
  await expect(page).toHaveURL(/#discover-regions$/);

  await expect(
    page
      .locator("#discover-regions")
      .getByRole("link", { name: "スポットを見つける" })
      .first()
  ).toBeVisible();
});
