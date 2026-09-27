import { expect, test, type Page } from "@playwright/test";
import { getSpotById } from "../lib/spotService";
import { getLocalizedSpotAddress, getLocalizedSpotName } from "../lib/localizedSpot";

async function contrastAudit(page: Page) {
  return page.locator("main").evaluate(main => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const results: { text: string; ratio: number }[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      const text = node.textContent?.trim();
      if (!element || !text || !element.checkVisibility()) continue;
      let ancestor: Element | null = element;
      let background = [255, 255, 255, 255];
      while (ancestor) {
        const candidate = rgba(getComputedStyle(ancestor).backgroundColor);
        if (candidate[3] === 255) { background = candidate; break; }
        ancestor = ancestor.parentElement;
      }
      const foreground = luminance(rgba(getComputedStyle(element).color));
      const backdrop = luminance(background);
      results.push({ text, ratio: (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05) });
    }
    return results;
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const locale of ["ja", "en"] as const) {
    for (const width of [320, 1280]) {
      test(`${colorScheme} ${locale} ${width}px: Kyoto/Osaka lists and details meet 4.5 contrast`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 900 });
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        const measurements: { path: string; state: string; minimum: number }[] = [];
        const check = async (state: string) => {
          // Measure settled colors, not intermediate disabled/enabled or hover
          // transition frames. Reading animations flushes pending style changes.
          await page.locator("main").evaluate(async main => {
            await Promise.all(main.getAnimations({ subtree: true })
              .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
              .map(animation => animation.finished.catch(() => undefined)));
          });
          const results = await contrastAudit(page);
          expect(results.length).toBeGreaterThan(0);
          for (const item of results) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
          measurements.push({ path: new URL(page.url()).pathname, state, minimum: Math.min(...results.map(item => item.ratio)) });
        };
        for (const [region, spotId] of [["kyoto", "kiyomizudera"], ["osaka", "osaka-castle"]] as const) {
          const spot = getSpotById(spotId)!;
          await page.goto(`/discover/${region}`);
          await page.getByLabel("Language / 言語").selectOption(locale);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "ja"
            ? `${region === "kyoto" ? "京都" : "大阪"}スポット一覧`
            : `${region === "kyoto" ? "Kyoto" : "Osaka"} Spots`);
          await check("default");
          const card = page.locator("article").filter({ has: page.locator(`a[href="/spots/${spotId}"]`) });
          const select = card.getByRole("button");
          await select.hover();
          await check("selection hover");
          await select.click();
          await expect(select).toHaveAttribute("aria-pressed", "true");
          await check("selected / enabled CTA");
          await testInfo.attach(`${region}-list`, { body: await page.screenshot(), contentType: "image/png" });
          await card.getByRole("link").click();
          await expect(page).toHaveURL(new RegExp(`/spots/${spotId}$`));
          await expect(page.getByRole("heading", { level: 1 })).toContainText(getLocalizedSpotName(spot, locale));
          await expect(page.locator("main")).toContainText(getLocalizedSpotAddress(spot, locale));
          expect(new URL((await page.locator("main img").getAttribute("src"))!, page.url()).href)
            .toBe(new URL(spot.image, page.url()).href);
          await expect(page.locator('main a[href*="google.com/maps/search"]')).toHaveAttribute("href", `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name)}`);
          if (spot.website) await expect(page.locator(`main a[href="${spot.website}"]`)).toBeVisible();
          await check("detail");
          const back = page.locator(`main a[href="/discover/${region}"]`);
          await back.hover();
          await check("back link hover");
          await testInfo.attach(`${region}-detail`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
          await back.click();
          await expect(page).toHaveURL(new RegExp(`/discover/${region}$`));
        }
        expect(errors).toEqual([]);
        await testInfo.attach("contrast-measurements", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
      });
    }
  }
}
