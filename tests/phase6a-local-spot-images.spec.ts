import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route(
    "https://maps.googleapis.com/**",
    async (route) => {
      await route.abort();
    }
  );
});

test("local Spot images render without requesting Places photos", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route(
    "**/api/places/photo?**",
    async (route) => {
      placesPhotoRequests += 1;
      await route.abort();
    }
  );

  await page.goto("/spots/kiyomizudera");

  const image = page.locator("main img").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute(
    "src",
    "/spots/kiyomizudera.jpg"
  );
  expect(placesPhotoRequests).toBe(0);
});

test("missing local Spot images fall back to the placeholder", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route(
    "**/api/places/photo?**",
    async (route) => {
      placesPhotoRequests += 1;
      await route.abort();
    }
  );

  await page.goto("/spots/umeda-sky-building");

  const image = page.locator("main img").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute(
    "src",
    /\/spots\/placeholder\.jpg$/
  );
  expect(placesPhotoRequests).toBe(0);
});

test("Home and Discover share the local-first rule", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route(
    "**/api/places/photo?**",
    async (route) => {
      placesPhotoRequests += 1;
      await route.abort();
    }
  );

  await page.goto("/");
  await expect(
    page.locator(
      'img[src$="/spots/kiyomizudera.jpg"]'
    ).first()
  ).toBeVisible();

  await page.goto("/discover/osaka");
  await expect(
    page.locator(
      'img[src$="/spots/osaka-castle.jpg"]'
    ).first()
  ).toBeVisible();
  expect(placesPhotoRequests).toBe(0);
});
