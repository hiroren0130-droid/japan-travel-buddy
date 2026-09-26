import { expect, test } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const) {
  for (const locale of ["ja", "en"] as const) {
    for (const width of [320, 1280]) {
      test(`${colorScheme} ${locale} ${width}px: readable contact and footer`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((language) => {
          localStorage.setItem("japan-travel-buddy-locale", language);
        }, locale);
        await page.goto("/contact");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "ja" ? "お問い合わせ" : "Contact");
        const email = page.getByRole("link", { name: "japantravelbuddy.support@gmail.com", exact: true });
        await expect(email).toHaveAttribute("href", "mailto:japantravelbuddy.support@gmail.com");
        for (const hovered of [false, true]) {
          if (hovered) await email.hover();
          const contrast = await page.evaluate(() => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d", { willReadFrequently: true })!;
            const rgba = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return Array.from(context.getImageData(0, 0, 1, 1).data);
            };
            const luminance = (rgb: number[]) => rgb.slice(0, 3).map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
            return Array.from(document.querySelectorAll("main h1, main h2, main p, main a, footer h2, footer p, footer a, footer .text-center")).map((element) => {
              let ancestor: Element | null = element;
              let background = [255, 255, 255, 255];
              while (ancestor) {
                const candidate = rgba(getComputedStyle(ancestor).backgroundColor);
                if (candidate[3] === 255) { background = candidate; break; }
                ancestor = ancestor.parentElement;
              }
              const foreground = luminance(rgba(getComputedStyle(element).color));
              const backdrop = luminance(background);
              return { text: element.textContent?.trim(), ratio: (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05) };
            });
          });
          for (const item of contrast) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await testInfo.attach("contact-and-footer", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      });
    }
  }
}

for (const locale of ["ja", "en"] as const) {
  test(`${locale}: contact details, footer navigation and language switching`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addInitScript((language) => {
      localStorage.setItem("japan-travel-buddy-locale", language);
    }, locale);
    const main = page.getByRole("main");
    const language = page.getByRole("combobox", { name: "Language / 言語" });
    for (const selected of [locale, locale === "ja" ? "en" : "ja"] as const) {
      await page.goto("/");
      await language.selectOption(selected);
      await page.locator('footer a[href="/contact"]').click();
      await expect(page).toHaveURL(/\/contact$/);
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(
        selected === "ja" ? "お問い合わせ" : "Contact",
      );
      await expect(main).toContainText(selected === "ja"
        ? "以下のメールアドレスへご連絡ください。"
        : "Please email us at the address below.");
      const email = main.getByRole("link", { name: "japantravelbuddy.support@gmail.com", exact: true });
      await expect(email).toBeVisible();
      await expect(email).toHaveAttribute("href", "mailto:japantravelbuddy.support@gmail.com");
      await email.click({ trial: true });
      await expect(main).not.toContainText("before the official release");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
