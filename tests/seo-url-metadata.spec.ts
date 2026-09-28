import { expect, test, type Page } from "@playwright/test";

const origin = "https://japan-travel-buddy-cmuv-psi.vercel.app";
async function expectIdentity(page: Page, path: string) {
  const expected = path === "/" ? origin : origin + path;
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expected);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", expected);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", origin + "/og-image.jpg");
}

test("Japanese/English switching and reload preserve page URLs", async ({ page }) => {
  for (const path of ["/", "/discover/kyoto", "/discover/osaka", "/spots/kiyomizudera", "/spots/osaka-castle", "/contact"]) {
    await page.goto(path + "?utm_source=seo-test#content");
    await expectIdentity(page, path);
    for (const locale of ["en", "ja"] as const) {
      // Detail/contact pages do not all have a language selector. Exercise the
      // same persisted-locale event used by LocaleProvider there.
      const selector = page.getByLabel("Language / 言語");
      if (await selector.count()) await selector.selectOption(locale);
      else await page.evaluate(language => {
        localStorage.setItem("japan-travel-buddy-locale", language);
        window.dispatchEvent(new Event("japan-travel-buddy-locale-change"));
      }, locale);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expectIdentity(page, path);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expectIdentity(page, path);
    }
  }
});

test("client navigation replaces home/list URLs with the destination URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language / 言語").selectOption("en");
  await expectIdentity(page, "/");
  await page.locator('a[href="/spots/kiyomizudera"]').click();
  await expectIdentity(page, "/spots/kiyomizudera");
  await page.locator('main a[href="/discover/kyoto"]').click();
  await expectIdentity(page, "/discover/kyoto");
  await page.locator('footer a[href="/contact"]').click();
  await expectIdentity(page, "/contact");
  await page.goBack();
  await expectIdentity(page, "/discover/kyoto");
});
