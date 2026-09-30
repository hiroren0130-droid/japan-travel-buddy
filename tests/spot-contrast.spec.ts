import { expect, test, type Page } from "@playwright/test";
import { getSpotById } from "../lib/spotService";
import { getLocalizedSpotAddress, getLocalizedSpotName } from "../lib/localizedSpot";
import { getSpotImageCredit } from "../lib/spotImageCredits";

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
      let backgrounds = [[255, 255, 255, 255]];
      while (ancestor) {
        const style = getComputedStyle(ancestor);
        const candidate = rgba(style.backgroundColor);
        if (candidate[3] === 255) {
          // A gradient paints over background-color. Check every color stop,
          // including the darkest endpoint, instead of only the fallback color.
          const stops = style.backgroundImage.match(/(?:oklch|oklab|lch|lab|rgba?|hsla?|color)\([^)]*\)|#[\da-f]{3,8}\b/gi) ?? [];
          backgrounds = [candidate, ...stops.map(rgba)];
          break;
        }
        ancestor = ancestor.parentElement;
      }
      const foreground = luminance(rgba(getComputedStyle(element).color));
      const ratios = backgrounds.map(background => {
        const backdrop = luminance(background);
        return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
      });
      results.push({ text, ratio: Math.min(...ratios) });
    }
    return results;
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const locale of ["ja", "en"] as const) {
    for (const width of [320, 1280]) {
      test(`${colorScheme} ${locale} ${width}px: Kyoto/Osaka lists and details meet 4.5 contrast`, async ({ page }, testInfo) => {
        test.setTimeout(90_000);
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 900 });
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        const measurements: { path: string; state: string; minimum: number }[] = [];
        const check = async (state: string) => {
          const layout = await page.locator("main").evaluate(main => {
            const surface = getComputedStyle(main).backgroundImage !== "none" ? main : main.parentElement!;
            const style = getComputedStyle(surface);
            const bounds = surface.getBoundingClientRect();
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d", { willReadFrequently: true })!;
            const rgb = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
            };
            return {
              overflow: document.documentElement.scrollWidth > window.innerWidth,
              left: bounds.left,
              width: bounds.width,
              height: bounds.height,
              background: rgb(style.backgroundColor),
              foreground: rgb(getComputedStyle(main).color),
              gradient: style.backgroundImage,
              colorScheme: style.colorScheme,
            };
          });
          expect(layout.overflow, state).toBe(false);
          expect(layout.left).toBe(0);
          expect(layout.width).toBe(width);
          expect(layout.height).toBeGreaterThanOrEqual(900);
          expect(layout.colorScheme).toBe("light");
          expect(layout.gradient).toContain("linear-gradient");
          // Blue-50 fallback remains explicit in both OS color schemes.
          expect(layout.foreground).toEqual([15, 23, 43]);
          expect(layout.background).toEqual([239, 246, 255]);
          const path = new URL(page.url()).pathname;
          const url = `https://japan-travel-buddy-cmuv-psi.vercel.app${path}`;
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
          await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", url);
          await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
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
          await expect(page.locator("article").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
          await expect.poll(() => page.locator("article img").first().evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
          await testInfo.attach(`${region}-list-top`, { body: await page.screenshot(), contentType: "image/png" });
          const card = page.locator("article").filter({ has: page.locator(`a[href="/spots/${spotId}"]`) });
          const select = card.getByRole("button");
          await select.hover();
          await check("selection hover");
          await select.focus();
          await expect(select).toBeFocused();
          await check("selection focus");
          await select.click();
          await expect(select).toHaveAttribute("aria-pressed", "true");
          await check("selected / enabled CTA");
          const createPlan = page.getByRole("button", { name: locale === "ja" ? /AI旅行プランを作る/ : /Create an AI plan/ });
          await createPlan.hover();
          await check("enabled CTA hover");
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
          await expect.poll(() => page.locator("main img").evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
          await expect(page.locator("main h1").locator("../..")).toHaveCSS("background-color", "rgb(255, 255, 255)");
          if (getSpotImageCredit(spotId)) {
            const credit = page.locator(`main a[href="/image-credits#${spotId}"]`);
            await expect(credit).toHaveText(locale === "en" ? "Photo credit" : "画像クレジット");
            await credit.hover();
            await check("photo credit hover");
            await credit.focus();
            await expect(credit).toBeFocused();
            await check("photo credit focus");
          }
          for (const link of await page.locator('main a[target="_blank"]').all()) {
            await link.hover();
            await check("detail action hover");
            await link.focus();
            await expect(link).toBeFocused();
            await check("detail action focus");
          }
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
