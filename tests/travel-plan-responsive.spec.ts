import { expect, test } from "@playwright/test";

for (const locale of ["ja", "en"] as const) {
  for (const width of [320, 375, 390, 640, 768, 1023, 1024, 1280]) {
    test(`${locale} ${width}px: generated plan remains readable and operable`, async ({ page }, testInfo) => {
      await page.context().grantPermissions(["geolocation"]);
      await page.context().setGeolocation({ latitude: 35.0116, longitude: 135.7681 });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((language) => {
        localStorage.setItem("japan-travel-buddy-locale", language);
      }, locale);
      await page.route("https://maps.googleapis.com/**", (route) => route.abort());
      const title = locale === "ja"
        ? "京都の歴史ある神社と美しい街並みをゆっくり楽しむ一日旅行プラン"
        : "A leisurely Kyoto journey through historic shrines and beautiful traditional streets";
      const summary = locale === "ja"
        ? "京都の歴史ある神社を訪れ、街並みを楽しみます。境内をゆっくり散策し、周辺の文化にも触れる旅行プランです。"
        : "Explore historic Kyoto shrines and traditional streets, taking time to enjoy their architecture and the surrounding neighborhoods.";
      await page.route("**/api/chat", (route) => route.fulfill({ json: { plan: {
        title, summary,
        days: [1, 2].map((day) => ({ day, items: ["heian-shrine", "fushimi-inari", "yasaka-shrine"].map((spotId, index) => ({
          time: `${9 + index * 2}:00`, spotId, description: summary, transport: "徒歩", duration: "30分",
        })) })),
      } } }));
      await page.goto("/chat");
      await page.locator("#travel-destination").fill("Kyoto");
      await page.locator("#travel-days").selectOption("2");
      await page.locator("#travel-travelers").selectOption("2");
      await page.locator("form button[type=submit]").click();
      const log = page.getByRole("log");
      await expect(log.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(log.getByRole("listitem")).toHaveCount(6);
      const mapLinks = log.locator('[role="listitem"] a[href*="google.com/maps"]:visible');
      await expect(mapLinks).toHaveCount(6);
      for (const link of await mapLinks.all()) {
        await link.click({ trial: true });
        await expect(link).toHaveAttribute("target", "_blank");
      }
      for (const button of await log.locator("header button").all()) {
        await button.click({ trial: true });
      }
      const layout = await log.evaluate((element) => {
        const hero = element.querySelector("header")!;
        const card = hero.parentElement!;
        const summarySection = card.querySelector("section")!;
        const summaryText = summarySection.firstElementChild!.lastElementChild!;
        const item = element.querySelector('[role="listitem"]')!;
        const spot = item.lastElementChild!;
        const info = hero.querySelector(".mt-5.grid")!;
        const fit = (node: Element) => {
          const bounds = node.getBoundingClientRect();
          let clipped = false;
          for (let parent = node.parentElement; parent && parent !== element; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            const clip = parent.getBoundingClientRect();
            if (["hidden", "clip"].includes(style.overflowX)) {
              clipped ||= bounds.left < clip.left - 1 || bounds.right > clip.right + 1;
            }
            if (["hidden", "clip"].includes(style.overflowY)) {
              clipped ||= bounds.top < clip.top - 1 || bounds.top + node.scrollHeight > clip.bottom + 1;
            }
          }
          return { text: node.textContent?.slice(0, 70), width: node.clientWidth, scroll: node.scrollWidth, clipped };
        };
        return {
          page: { width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth },
          title: fit(hero.querySelector("h1")!),
          summary: fit(summaryText),
          description: fit(spot.querySelector("p")!),
          imageWidth: spot.querySelector("img")!.getBoundingClientRect().width,
          cardPadding: getComputedStyle(card).paddingLeft,
          summaryDirection: getComputedStyle(summarySection.firstElementChild!).flexDirection,
          timelineColumns: getComputedStyle(item).gridTemplateColumns.split(" ").length,
          imageDirection: getComputedStyle(spot.firstElementChild!).flexDirection,
          dayDirection: getComputedStyle(element.querySelector('[aria-labelledby="day-1"] > div > .relative')!).flexDirection,
          items: [...element.querySelectorAll('[role="listitem"]')].map((row) => {
            const image = row.querySelector("img")!;
            const bounds = image.getBoundingClientRect();
            return { description: fit(row.querySelector("p")!), imageRatio: bounds.width / bounds.height };
          }),
          // Desktop deliberately retains the existing AREA/AI ellipsis.
          fits: [...element.querySelectorAll("h1, h2, h3, p, time"), ...info.children]
            .filter((node) => innerWidth < 1024 || getComputedStyle(node).textOverflow !== "ellipsis")
            .map(fit),
        };
      });
      expect(layout.page.scroll).toBeLessThanOrEqual(layout.page.width);
      expect(layout.title.width).toBeGreaterThanOrEqual(200);
      expect(layout.summary.width).toBeGreaterThanOrEqual(190);
      expect(layout.description.width).toBeGreaterThanOrEqual(190);
      expect(layout.imageWidth).toBeGreaterThanOrEqual(200);
      for (const region of layout.fits) {
        expect(region.scroll, JSON.stringify(region)).toBeLessThanOrEqual(region.width + 1);
        expect(region.clipped, JSON.stringify(region)).toBe(false);
      }
      expect(layout.cardPadding).toBe(width < 1024 ? "0px" : "20px");
      expect(layout.summaryDirection).toBe(width < 1024 ? "column" : "row");
      expect(layout.timelineColumns).toBe(width < 1024 ? 1 : 3);
      expect(layout.imageDirection).toBe(width < 1024 ? "column" : "row");
      expect(layout.dayDirection).toBe(width < 1024 ? "column" : "row");
      for (const item of layout.items) {
        expect(item.description.width).toBeGreaterThanOrEqual(190);
        expect(item.imageRatio).toBeGreaterThanOrEqual(1);
      }
      await testInfo.attach("layout", { body: JSON.stringify(layout, null, 2), contentType: "application/json" });
      // Hide only the sticky site chrome during element captures; layout checks above use the real page.
      const captureStyle = "header.sticky, nextjs-portal { opacity: 0 !important; }";
      await log.locator("header").screenshot({ path: testInfo.outputPath("hero.png"), style: captureStyle });
      await log.locator('[aria-labelledby="day-1"]').screenshot({ path: testInfo.outputPath("timeline.png"), style: captureStyle });

      // DOM-only stress fixture: never changes the Spot Database or generated plan.
      if (width < 1024) {
        const areas = log.locator("header .mt-5.grid > div").nth(2).locator("p").last();
        await areas.evaluate((node, value) => { node.textContent = value; }, locale === "ja"
          ? "京都市左京区・銀閣寺から岡崎周辺の歴史ある神社と文化施設エリア"
          : "Kyoto Sakyo Ward, Ginkaku-ji, Okazaki and the surrounding historic cultural district");
        const bounds = await areas.evaluate((node) => ({ width: node.clientWidth, scroll: node.scrollWidth, height: node.clientHeight, scrollHeight: node.scrollHeight }));
        expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
        expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.height + 1);
      }
    });
  }
}
