import { expect, test } from "@playwright/test";

const creditedSpots = [
  ["osaka-castle", "Osaka Castle 2022-04-23.jpg"],
  ["arashiyama", "Aerial panorama of Arashiyama (嵐山).jpg"],
  ["dotonbori", "2021-12-11 Dōtonbori at Night.jpg"],
  ["tsutenkaku", "Shinsekai Tsutenkaku at night 2022-04-23.jpg"],
] as const;

test.beforeEach(async ({ page }) => {
  await page.route("https://maps.googleapis.com/**", async (route) => {
    await route.abort();
  });
});

test("the four priority Spots use local images without Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  for (const [spotId] of creditedSpots) {
    await page.goto(`/spots/${spotId}`);
    await expect(page.locator("main img").first()).toHaveAttribute(
      "src",
      new RegExp(`/spots/${spotId}\\.jpg$`)
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "画像クレジット", exact: true })
    ).toHaveAttribute("href", `/image-credits#${spotId}`);
  }

  expect(placesPhotoRequests).toBe(0);
});

test("Home and Osaka Discover expose the new local images", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator('img[src$="/spots/arashiyama.jpg"]').first()
  ).toBeVisible();
  await expect(
    page.locator('img[src$="/spots/osaka-castle.jpg"]').first()
  ).toBeVisible();

  await page.goto("/discover/osaka");
  await expect(
    page.locator('img[src$="/spots/osaka-castle.jpg"]').first()
  ).toBeVisible();
});

test("the image credits page contains source, license, and modification details", async ({
  page,
}) => {
  await page.goto("/image-credits");

  for (const [spotId, sourceTitle] of creditedSpots) {
    const credit = page.locator(`#${spotId}`);
    await expect(credit).toContainText(sourceTitle);
    await expect(credit).toContainText("作者");
    await expect(credit).toContainText("ライセンス");
    await expect(credit).toContainText("加工内容");
    await expect(
      credit.locator('a[href^="https://commons.wikimedia.org/wiki/File:"]')
    ).toBeVisible();
    await expect(credit.getByRole("link", { name: /^CC BY/ })).toHaveAttribute(
      "href",
      /^https:\/\/creativecommons\.org\/licenses\/by\//
    );
  }
});
