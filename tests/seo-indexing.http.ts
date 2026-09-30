import assert from "node:assert/strict";
import test from "node:test";
import { allSpots } from "../data";
import { getLocalizedPageMetadata } from "../lib/localeMetadata";

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
  "/logout-incomplete",
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
  test(`${userAgent}: /spots redirects without becoming an independent search page`, async () => {
    const response = await fetch(new URL("/spots", baseURL), {
      redirect: "manual",
      headers: { "User-Agent": userAgent },
    });
    if (response.status === 307 || response.status === 308) {
      assert.equal(new URL(response.headers.get("location")!, baseURL).pathname, "/discover/kyoto");
      return;
    }
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /http-equiv="refresh"[^>]*url=\/discover\/kyoto/);
    assert.ok(robotsDirectives(html).includes("noindex"));
    assert.ok(!robotsDirectives(html).includes("index"));
  });
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

test("sitemap contains exactly public content, two regions and all 125 real spots", async () => {
  const { html } = await getInitialResponse("/sitemap.xml", "Mozilla/5.0");
  const urls = [...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1])
  );
  assert.equal(allSpots.length, 125);
  const expectedPaths = [
    "/", "/chat", "/about", "/contact", "/privacy", "/terms", "/image-credits",
    "/discover/kyoto", "/discover/osaka",
    ...allSpots.map(spot => `/spots/${encodeURIComponent(spot.id)}`),
  ];
  assert.equal(urls.length, 134);
  assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
  assert.deepEqual(urls.map(url => url.pathname).sort(), expectedPaths.sort());
  assert.doesNotMatch(html, /<lastmod>|hreflang=/);
  for (const url of urls) {
    assert.equal(url.origin, "https://japan-travel-buddy-cmuv-psi.vercel.app");
    assert.doesNotMatch(url.pathname, /^\/(favorites|mypage|dashboard|history|admin)(\/|$)/);
    const { html: pageHtml, response } = await getInitialResponse(url.pathname, "Twitterbot/1.0");
    assert.ok(!robotsDirectives(pageHtml).includes("noindex"), url.pathname);
    assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex|none/i);
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
  }
});

test("static page initial titles contain the brand exactly once", async () => {
  for (const userAgent of ["Mozilla/5.0", "Twitterbot/1.0"]) {
    for (const path of ["/about", "/contact", "/privacy", "/terms"]) {
      const { html } = await getInitialResponse(path, userAgent);
      const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map(match => match[1]);
      assert.deepEqual(titles, [getLocalizedPageMetadata(path, "ja")!.title], path);
      assert.equal(titles[0].split("Japan Travel Buddy").length - 1, 1, path);
    }
  }
});

test("robots.txt allows crawlers to read the noindex metadata", async () => {
  const { html } = await getInitialResponse("/robots.txt", "Mozilla/5.0");
  assert.match(html, /^Allow: \/\s*$/m);
  assert.doesNotMatch(html, /^Disallow:\s*\S/m);
  assert.match(html, /^Sitemap: https:\/\/japan-travel-buddy-cmuv-psi\.vercel\.app\/sitemap\.xml\s*$/m);
});
