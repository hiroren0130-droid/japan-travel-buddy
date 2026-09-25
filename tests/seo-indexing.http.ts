import assert from "node:assert/strict";
import test from "node:test";

// Run against a separately started production server:
// node --test tests/seo-indexing.http.ts (Node.js 24)
const baseURL = process.env.SEO_TEST_BASE_URL ?? "http://localhost:3100";
const privateRoutes = [
  "/favorites",
  "/mypage",
  "/mypage/seo-test-plan",
  "/dashboard",
  "/history",
  "/history/seo-test-plan",
  "/history/seo-test-plan/edit",
  "/admin/costs",
  "/admin/auth-test",
  "/admin/forbidden",
];
const publicRoutes = [
  "/",
  "/chat",
  "/spots",
  "/spots/kiyomizudera",
  "/discover/kyoto",
  "/discover/osaka",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/image-credits",
  "/login",
  "/signup",
];

async function getInitialResponse(path: string, userAgent: string) {
  const response = await fetch(new URL(path, baseURL), {
    // Inspect the requested page, never a redirected login page.
    redirect: "manual",
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, path);
  return { response, html: await response.text() };
}

function robotsDirectives(html: string): string[] {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags
    .filter((tag) => /\bname=["'](?:robots|googlebot)["']/i.test(tag))
    .flatMap((tag) =>
      (tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? "")
        .toLowerCase()
        .split(/\s*,\s*/)
    );
}

for (const userAgent of ["Mozilla/5.0", "Twitterbot/1.0"]) {
  for (const path of privateRoutes) {
    test(`${userAgent}: ${path} excludes indexing in initial HTML`, async () => {
      const { html } = await getInitialResponse(path, userAgent);
      const directives = robotsDirectives(html);
      assert.ok(directives.includes("noindex"));
      assert.ok(directives.includes("nofollow"));
      assert.ok(!directives.includes("index"));
      assert.ok(!directives.includes("follow"));
    });
  }

  for (const path of publicRoutes) {
    test(`${userAgent}: ${path} remains indexable`, async () => {
      const { html, response } = await getInitialResponse(path, userAgent);
      const directives = robotsDirectives(html);
      assert.ok(directives.includes("index"));
      assert.ok(directives.includes("follow"));
      assert.ok(!directives.includes("noindex"));
      assert.ok(!directives.includes("nofollow"));
      assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex|none/i);
    });
  }
}

test("sitemap includes only the existing public entries", async () => {
  const { html } = await getInitialResponse("/sitemap.xml", "Mozilla/5.0");
  const urls = [...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1])
  );
  assert.deepEqual(urls.map((url) => url.pathname).sort(), ["/", "/chat"]);
  for (const url of urls) {
    assert.equal(url.origin, "https://japan-travel-buddy-cmuv-psi.vercel.app");
    assert.doesNotMatch(url.pathname, /^\/(favorites|mypage|dashboard|history|admin)(\/|$)/);
  }
});

test("robots.txt allows crawlers to read the noindex metadata", async () => {
  const { html } = await getInitialResponse("/robots.txt", "Mozilla/5.0");
  assert.match(html, /^Allow: \/\s*$/m);
  assert.doesNotMatch(html, /^Disallow:\s*\S/m);
  assert.match(html, /^Sitemap: https:\/\/japan-travel-buddy-cmuv-psi\.vercel\.app\/sitemap\.xml\s*$/m);
});
