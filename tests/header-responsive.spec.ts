import { expect, test } from "@playwright/test";

const menus = {
  ja: ["ホーム", "AI旅行", "お気に入り", "マイページ"],
  en: ["Home", "AI Trip", "Favorites", "My Page"],
};
const paths = ["/", "/chat", "/favorites", "/dashboard"];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/places/photo?**", (route) => route.fulfill({ status: 404 }));
});

for (const locale of ["ja", "en"] as const) {
  for (const width of [320, 375, 390, 768, 1023, 1024, 1280]) {
    test(`${locale} ${width}px: header controls fit without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((language) => {
        localStorage.setItem("japan-travel-buddy-locale", language);
      }, locale);
      await page.goto("/");
      const header = page.getByRole("banner");
      const nav = header.getByRole("navigation");
      const select = nav.getByRole("combobox", { name: "Language / 言語" });
      await expect(select).toHaveValue(locale);
      for (let index = 0; index < paths.length; index++) {
        const link = nav.getByRole("link", { name: menus[locale][index], exact: true });
        await expect(link).toHaveAttribute("href", paths[index]);
        await link.click({ trial: true });
      }
      await select.click({ trial: true });
      const layout = await header.evaluate((element) => {
        const parent = element.firstElementChild!;
        const brand = parent.firstElementChild!.getBoundingClientRect();
        const navigation = element.querySelector("nav")!;
        const bounds = navigation.getBoundingClientRect();
        return {
          direction: getComputedStyle(parent).flexDirection,
          wrap: getComputedStyle(navigation).flexWrap,
          navWidth: navigation.clientWidth,
          navScrollWidth: navigation.scrollWidth,
          pageWidth: document.documentElement.clientWidth,
          pageScrollWidth: document.documentElement.scrollWidth,
          brandBottom: brand.bottom,
          brandRight: brand.right,
          brandCenter: (brand.top + brand.bottom) / 2,
          navTop: bounds.top,
          navLeft: bounds.left,
          navCenter: (bounds.top + bounds.bottom) / 2,
          controls: [...navigation.querySelectorAll("select, a")].map((control) => {
            const rect = control.getBoundingClientRect();
            return { left: rect.left, right: rect.right, height: rect.height };
          }),
        };
      });
      expect(layout.navScrollWidth).toBeLessThanOrEqual(layout.navWidth);
      expect(layout.pageScrollWidth).toBeLessThanOrEqual(layout.pageWidth);
      expect(layout.controls).toHaveLength(5);
      for (const control of layout.controls) {
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(width);
        expect(Math.round(control.height)).toBeGreaterThanOrEqual(44);
      }
      if (width < 1024) {
        expect(layout.direction).toBe("column");
        expect(layout.wrap).toBe("wrap");
        expect(layout.navTop).toBeGreaterThanOrEqual(layout.brandBottom);
      } else {
        expect(layout.direction).toBe("row");
        expect(layout.wrap).toBe("nowrap");
        expect(layout.navLeft - layout.brandRight).toBeGreaterThanOrEqual(23);
        expect(Math.abs(layout.navCenter - layout.brandCenter)).toBeLessThan(1);
      }
    });
  }

  for (const authenticated of [false, true]) {
    test(`${locale}: mobile language switch and all navigation destinations work (${authenticated ? "signed in" : "signed out"})`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.addInitScript((signedIn) => {
        localStorage.setItem("playwright-firebase-mock-state", JSON.stringify({
          user: signedIn ? { uid: "user-1" } : null, plans: [], calls: {},
        }));
      }, authenticated);
      await page.goto("/");
      const select = page.getByRole("banner").getByRole("combobox");
      await select.selectOption(locale === "ja" ? "en" : "ja");
      await select.selectOption(locale);
      await expect(select).toHaveValue(locale);
      for (let index = 0; index < paths.length; index++) {
        await page.goto("/");
        const nav = page.getByRole("banner").getByRole("navigation");
        await nav.getByRole("link", { name: menus[locale][index], exact: true }).click();
        const destination = paths[index] === "/dashboard" && !authenticated
          ? "/login"
          : paths[index];
        await expect(page).toHaveURL(new RegExp(`${destination}$`));
        if (paths[index] === "/dashboard" && authenticated) {
          await expect(page.getByRole("button", { name: locale === "ja" ? "ログアウト" : "Log Out", exact: true })).toBeVisible();
        }
      }
    });
  }
}
