import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { allSpots } from "../data";

// Run against a separately started production build, with no credentials.
const baseURL = process.env.SEO_TEST_BASE_URL ?? "http://127.0.0.1:3100";
const origin = "https://japan-travel-buddy-cmuv-psi.vercel.app";
const staticPaths = ["/", "/about", "/contact", "/privacy", "/terms", "/chat", "/image-credits", "/login", "/signup", "/logout-incomplete"];
const regionPaths = [...new Set(allSpots.map(spot => `/discover/${spot.prefectureId}`))];
const spotPaths = allSpots.map(spot => `/spots/${encodeURIComponent(spot.id)}`);

function tagValues(html: string, tagName: string, attribute: string, expected: string, value: string) {
  return (html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [])
    .filter(tag => tag.includes(`${attribute}="${expected}"`))
    .map(tag => tag.match(new RegExp(`\\b${value}="([^"]*)"`))?.[1]);
}

async function get(path: string, userAgent: string) {
  return fetch(new URL(path, baseURL), {
    redirect: "manual", headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(30_000),
  });
}

function checkUrls(html: string, path: string) {
  const expected = path === "/" ? origin : origin + path;
  assert.deepEqual(tagValues(html, "link", "rel", "canonical", "href"), [expected], `${path}: canonical`);
  assert.deepEqual(tagValues(html, "meta", "property", "og:url", "content"), [expected], `${path}: og:url`);
  assert.deepEqual(tagValues(html, "meta", "property", "og:image", "content"), [origin + "/og-image.jpg"]);
  assert.deepEqual(tagValues(html, "meta", "name", "twitter:image", "content"), [origin + "/og-image.jpg"]);
}

for (const userAgent of ["Mozilla/5.0", "Twitterbot/1.0"]) {
  test(`${userAgent}: every public static page, region and all ${spotPaths.length} spots have matching initial URLs`, async () => {
    for (const path of [...staticPaths, ...regionPaths, ...spotPaths]) {
      const response = await get(path, userAgent);
      assert.equal(response.status, 200, path);
      checkUrls(await response.text(), path);
    }
  });

  test(`${userAgent}: query parameters and encoded IDs do not change canonical identity`, async () => {
    for (const [requestPath, canonicalPath] of [
      ["/?utm_source=test", "/"], ["/chat?spotId=osaka-castle&lang=en", "/chat"],
      ["/discover/kyoto?lang=en", "/discover/kyoto"],
      ["/spots/%6Fsaka-castle?utm_source=test", "/spots/osaka-castle"],
    ]) {
      const response = await get(requestPath, userAgent);
      assert.equal(response.status, 200, requestPath);
      checkUrls(await response.text(), canonicalPath);
    }
  });

  test(`${userAgent}: trailing slashes redirect to the normalized route`, async () => {
    for (const path of ["/contact", "/discover/kyoto", "/spots/osaka-castle"]) {
      const response = await get(path + "/", userAgent);
      assert.equal(response.status, 308, path);
      assert.equal(new URL(response.headers.get("location")!, baseURL).pathname, path);
    }
  });

  test(`${userAgent}: missing spots/regions never inherit the home or previous page URL`, async () => {
    for (const path of ["/spots/not-a-real-spot", "/spots/OSAKA-CASTLE", "/discover/not-a-region", "/not-a-page"]) {
      const response = await get(path, userAgent);
      // A streamed Next.js not-found boundary can have a 200 transport status.
      assert.ok([200, 404].includes(response.status), path);
      const html = await response.text();
      assert.ok(tagValues(html, "meta", "name", "robots", "content").some(value => value?.includes("noindex")), path);
      assert.deepEqual(tagValues(html, "link", "rel", "canonical", "href"), [], path);
      assert.deepEqual(tagValues(html, "meta", "property", "og:url", "content"), [], path);
    }
  });

  test(`${userAgent}: /spots has only the redirect destination identity`, async () => {
    const response = await get("/spots", userAgent);
    if ([307, 308].includes(response.status)) {
      assert.equal(new URL(response.headers.get("location")!, baseURL).pathname, "/discover/kyoto");
    } else {
      assert.equal(response.status, 200);
      const html = await response.text();
      checkUrls(html, "/discover/kyoto");
      assert.ok(tagValues(html, "meta", "name", "robots", "content").some(value => value?.includes("noindex")));
    }
  });

  test(`${userAgent}: private pages keep noindex and do not inherit home URLs`, async () => {
    for (const path of ["/dashboard", "/favorites", "/history", "/history/seo-test-plan", "/mypage", "/admin/forbidden"]) {
      const response = await get(path, userAgent);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(tagValues(html, "meta", "name", "robots", "content").some(value => value?.includes("noindex")));
      assert.deepEqual(tagValues(html, "link", "rel", "canonical", "href"), []);
      assert.deepEqual(tagValues(html, "meta", "property", "og:url", "content"), []);
    }
  });
}

test("OG image remains byte-for-byte unchanged", async () => {
  const response = await get("/og-image.jpg", "Twitterbot/1.0");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /image\/jpeg/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(bytes, readFileSync("public/og-image.jpg"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "8a017f9d0eb00138c38258eee37bd2ec5319a1da9129323bdb4c837e1bcfc765");
});
