import { expect, test, type Locator } from "@playwright/test";

async function expectOnlyFirstImageEager(images: Locator): Promise<void> {
  await expect.poll(async () => images.evaluateAll((elements) => ({
    hasMultiple: elements.length > 1,
    first: elements[0]?.getAttribute("loading"),
    restLazy: elements.slice(1).every((image) =>
      image.getAttribute("loading") === "lazy"
    ),
  }))).toEqual({ hasMultiple: true, first: "eager", restLazy: true });
}

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
  await expect(image).toHaveAttribute("loading", "eager");
  await expect(image).toHaveAttribute(
    "src",
    /^(?:http:\/\/localhost:3000)?\/spots\/kiyomizudera\.jpg$/
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
  await expect(image).toHaveAttribute("loading", "eager");
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

  await expectOnlyFirstImageEager(
    page.locator('section[aria-labelledby="featured-places-title"] img')
  );
  await expect(page.locator('#discover-regions img').first())
    .toHaveAttribute("loading", "lazy");
  await expect(
    page.locator('#discover-regions img:not([loading="lazy"])')
  ).toHaveCount(0);

  await page.goto("/discover/osaka");
  await expect(
    page.locator(
      'img[src$="/spots/osaka-castle.jpg"]'
    ).first()
  ).toBeVisible();
  await expectOnlyFirstImageEager(page.locator('main article img'));
  expect(placesPhotoRequests).toBe(0);
});
