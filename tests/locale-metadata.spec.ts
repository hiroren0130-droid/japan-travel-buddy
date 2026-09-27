import { expect, test } from "@playwright/test";

test("home starts in Japanese and translates its existing social metadata", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('content="AIと一緒に日本旅行を計画。');
  expect(html).toContain('content="AIで、あなたに合った日本旅行のプランを作成。"');
  await page.goto("/");
  await expect(page.getByRole("link", { name: "行きたい場所を見つける" })).toBeVisible();
  await page.getByLabel("Language / 言語").selectOption("en");
  await expect(page.getByRole("link", { name: "Discover places" })).toBeVisible();
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "Create personalized Japan travel plans with AI.");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
});

test("Japanese initial HTML and English/Japanese switching retain region identity", async ({ page, request }) => {
  const html = await (await request.get("/discover/kyoto")).text();
  expect(html).toContain('<html lang="ja">');
  expect(html).toContain("京都スポットを探す | Japan Travel Buddy");
  await page.goto("/discover/kyoto");
  const language = page.getByLabel("Language / 言語");
  await expect(page).toHaveTitle("京都スポットを探す | Japan Travel Buddy");
  await language.selectOption("en");
  await expect(page).toHaveTitle("Discover Kyoto | Japan Travel Buddy");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Browse sightseeing spots in Kyoto.");
  await language.selectOption("ja");
  await expect(page).toHaveTitle("京都スポットを探す | Japan Travel Buddy");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "京都の観光スポットを一覧から探せます。");
});

for (const path of ["/chat", "/discover/kyoto"]) {
  test(`${path}: bespoke metadata, URLs, robots and images survive language changes`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByLabel("Language / 言語")).toBeVisible();
    // Model a page supplying metadata in the next SEO stage, without adding
    // metadata to production pages in this stage.
    const original = await page.evaluate(() => {
      document.title = "固有のページタイトル";
      for (const key of ["description", "og:title", "og:description", "twitter:title", "twitter:description"]) {
        const tag = document.querySelector<HTMLMetaElement>(`meta[name="${key}"], meta[property="${key}"]`)!;
        tag.content = `固有:${key}`;
      }
      const url = `https://japan-travel-buddy-cmuv-psi.vercel.app${location.pathname}`;
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content = url;
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = url;
      document.head.append(canonical);
      return Array.from(document.querySelectorAll('meta[name="robots"], meta[property^="og:image"], meta[name="twitter:image"]'), tag => tag.outerHTML);
    });
    for (const locale of ["en", "ja", "en"] as const) {
      await page.getByLabel("Language / 言語").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page).toHaveTitle("固有のページタイトル");
      for (const key of ["description", "og:title", "og:description", "twitter:title", "twitter:description"]) {
        await expect(page.locator(`meta[name="${key}"], meta[property="${key}"]`)).toHaveAttribute("content", `固有:${key}`);
      }
      const url = `https://japan-travel-buddy-cmuv-psi.vercel.app${path}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", url);
      expect(await page.locator('meta[name="robots"], meta[property^="og:image"], meta[name="twitter:image"]').evaluateAll(tags => tags.map(tag => tag.outerHTML))).toEqual(original);
    }
  });
}

test("client navigation and reload retain the selected language and destination metadata", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language / 言語").selectOption("en");
  await page.locator('footer a[href="/contact"]').click();
  await expect(page).toHaveTitle(/Contact \| Japan Travel Buddy/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Contact Japan Travel Buddy");
  await page.reload();
  await expect(page).toHaveTitle(/Contact \| Japan Travel Buddy/);
  await page.locator('footer a[href="/privacy"]').click();
  await expect(page).toHaveTitle(/Privacy Policy \| Japan Travel Buddy/);
});

test("admin noindex and server title survive a stored-language change", async ({ page }) => {
  await page.goto("/admin/forbidden");
  const title = await page.title();
  for (const locale of ["en", "ja"] as const) {
    await page.evaluate(language => {
      localStorage.setItem("japan-travel-buddy-locale", language);
      window.dispatchEvent(new Event("japan-travel-buddy-locale-change"));
    }, locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  }
});
