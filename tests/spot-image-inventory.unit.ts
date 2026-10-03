import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

import { allSpots } from "../data";
import { SPOT_IMAGE_CREDITS } from "../lib/spotImageCredits";

test("existing Spot images have exactly one credit", () => {
  for (const spot of allSpots) {
    assert.equal(spot.image, `/spots/${spot.id}.jpg`);
    const credits = SPOT_IMAGE_CREDITS.filter((credit) => credit.spotId === spot.id);
    if (existsSync(`public${spot.image}`)) assert.equal(credits.length, 1, spot.id);
  }
});

test("credited images decode fully and have unique files and complete attribution", async () => {
  const ids = new Set<string>();
  const hashes = new Set<string>();
  const sources = new Set<string>();
  for (const credit of SPOT_IMAGE_CREDITS) {
    assert.ok(allSpots.some((spot) => spot.id === credit.spotId), credit.spotId);
    assert.ok(!ids.has(credit.spotId), `Duplicate credit: ${credit.spotId}`);
    ids.add(credit.spotId);
    assert.equal(credit.localFilename, `/spots/${credit.spotId}.jpg`);
    assert.ok(credit.photographerName.trim());
    assert.ok(credit.sourceTitle.trim());
    assert.ok(credit.modifications.trim());
    assert.equal(new URL(credit.sourcePageUrl).hostname, "commons.wikimedia.org");
    if (credit.licenseUrl === null) {
      assert.equal(credit.licenseName, "Public Domain");
      assert.equal(credit.attributionRequired, false);
      assert.ok(credit.notes.includes("Own work, all rights released (Public domain)"));
    } else {
      assert.equal(new URL(credit.licenseUrl).hostname, "creativecommons.org");
    }
    assert.ok(!sources.has(credit.sourcePageUrl), `Duplicate source: ${credit.spotId}`);
    sources.add(credit.sourcePageUrl);
    if (credit.licenseName.includes("BY-SA")) {
      assert.ok(credit.notes.includes(credit.licenseName), credit.spotId);
      assert.equal(credit.attributionRequired, true);
    }
    const bytes = readFileSync(`public${credit.localFilename}`);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(!hashes.has(hash), `Duplicate image: ${credit.spotId}`);
    hashes.add(hash);
    const metadata = await sharp(bytes, { failOn: "warning" }).metadata();
    assert.equal(metadata.format, "jpeg");
    await sharp(bytes, { failOn: "warning" }).raw().toBuffer();
  }
});
