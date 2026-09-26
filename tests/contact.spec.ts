import { expect, test } from "@playwright/test";

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
