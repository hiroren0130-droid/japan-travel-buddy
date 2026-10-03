import { expect, test, type Page } from "@playwright/test";

import { allSpots } from "../data";
import { spotTranslationsEn } from "../data/locales/en";
import { SPOT_IMAGE_CREDITS } from "../lib/spotImageCredits";

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
}

for (const locale of ["ja", "en"] as const) {
  for (const width of [320, 1280]) {
    test.describe(`${locale} ${width}px Spot image coverage`, () => {
      test.use({ viewport: { width, height: 900 } });
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          localStorage.setItem("japan-travel-buddy-locale", value);
        }, locale);
        await page.route("https://maps.googleapis.com/**", (route) => route.abort());
      });

      for (const prefecture of ["kyoto", "osaka"]) {
        test(`${prefecture} registered listing images decode`, async ({ page }) => {
          await page.goto(`/discover/${prefecture}`);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          const expected = allSpots.filter((spot) => spot.prefectureId === prefecture);
          await expect(page.locator("main article img")).toHaveCount(expected.length);
          for (const spot of expected) {
            if (!SPOT_IMAGE_CREDITS.some((credit) => credit.spotId === spot.id)) continue;
            const image = page.locator(`main img[src$="${spot.image}"]`);
            await expect(image, spot.id).toHaveCount(1);
            await image.evaluate((element: HTMLImageElement) => {
              element.loading = "eager";
              return element.decode();
            });
          }
          await expectNoHorizontalOverflow(page);
          await page.screenshot({ path: `playwright-report/spot-images-${prefecture}-${locale}-${width}.png` });
        });

        test(`${prefecture} credited detail images and attribution links`, async ({ page }) => {
          test.setTimeout(180_000);
          const expected = allSpots.filter((spot) =>
            spot.prefectureId === prefecture &&
            SPOT_IMAGE_CREDITS.some((credit) => credit.spotId === spot.id)
          );
          for (const spot of expected) {
            await page.goto(`/spots/${spot.id}`);
            await expect(page.locator("html")).toHaveAttribute("lang", locale);
            const name = locale === "en" ? spotTranslationsEn[spot.id].name : spot.name;
            await expect(page.locator("main h1")).toContainText(name);
            const image = page.locator("main img").first();
            expect(new URL(await image.getAttribute("src") ?? "", page.url()).pathname).toBe(spot.image);
            await image.evaluate((element: HTMLImageElement) => element.decode());
            await expect(page.locator(`main a[href="/image-credits#${spot.id}"]`)).toBeVisible();
            await expectNoHorizontalOverflow(page);
          }
          await page.screenshot({ path: `playwright-report/spot-detail-${prefecture}-${locale}-${width}.png` });
        });
      }

      test("all credits show source, author, license and modifications", async ({ page }) => {
        await page.goto("/image-credits");
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main article")).toHaveCount(SPOT_IMAGE_CREDITS.length);
        for (const credit of SPOT_IMAGE_CREDITS) {
          const article = page.locator(`article[id="${credit.spotId}"]`);
          await expect(article.locator("h2")).toHaveText(locale === "en" ? credit.spotNameEn : credit.spotNameJa);
          await expect(article).toContainText(credit.photographerName);
          await expect(article).toContainText(credit.modifications);
          const links = await article.locator("a").evaluateAll((elements) =>
            elements.map((element) => element.getAttribute("href"))
          );
          expect(links).toContain(credit.sourcePageUrl);
          if (credit.licenseUrl) {
            expect(links).toContain(credit.licenseUrl);
          } else {
            await expect(article).toContainText("Public Domain");
            await expect(article.getByRole("link", { name: "Public Domain", exact: true })).toHaveCount(0);
          }
        }
        await expectNoHorizontalOverflow(page);
        await page.screenshot({ path: `playwright-report/spot-credits-${locale}-${width}.png` });
      });
    });
  }
}
