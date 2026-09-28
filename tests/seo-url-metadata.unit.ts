import assert from "node:assert/strict";
import test from "node:test";
import { getCanonicalUrl, getPageUrlMetadata, sharedOpenGraph, SITE_ORIGIN } from "../lib/seoMetadata";

test("canonical paths use the production origin, omit query/hash and normalize slashes", () => {
  for (const [path, expected] of [
    ["/", ""], ["/?utm_source=test#top", ""],
    ["/contact/", "/contact"], ["/discover//kyoto///?lang=en#spots", "/discover/kyoto"],
    ["/spots/osaka-castle?utm_source=preview#photo", "/spots/osaka-castle"],
  ]) assert.equal(getCanonicalUrl(path), SITE_ORIGIN + expected);
});

test("absolute URLs, protocol-relative hosts and backslash/control paths are rejected", () => {
  for (const path of ["https://example.com/", "//example.com/", "contact", "/\\example.com", "/\nexample.com"]) {
    assert.throws(() => getCanonicalUrl(path), /internal absolute path/);
  }
});

test("URL metadata retains the existing OG image and does not override indexing or titles", () => {
  const metadata = getPageUrlMetadata("/discover/kyoto");
  assert.equal(metadata.alternates?.canonical, `${SITE_ORIGIN}/discover/kyoto`);
  assert.deepEqual(metadata.openGraph, { ...sharedOpenGraph, url: `${SITE_ORIGIN}/discover/kyoto` });
  assert.deepEqual(sharedOpenGraph.images, [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Japan Travel Buddy" }]);
  assert.equal("url" in sharedOpenGraph, false);
  for (const field of ["robots", "title", "description", "twitter"]) assert.equal(field in metadata, false);
});
