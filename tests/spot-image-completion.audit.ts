// Explicit final audit: npm run test:spot-images:completion
// Kept outside normal *.test.ts / *.spec.ts discovery during staged image work.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { allSpots } from "../data";
import { SPOT_IMAGE_CREDITS } from "../lib/spotImageCredits";

test("final audit: every Spot has its own local image and credit", () => {
  const missing: string[] = [];
  for (const spot of allSpots) {
    assert.equal(spot.image, `/spots/${spot.id}.jpg`);
    if (!existsSync(`public${spot.image}`)) missing.push(spot.id);
    else assert.equal(
      SPOT_IMAGE_CREDITS.filter((credit) => credit.spotId === spot.id).length,
      1,
      spot.id,
    );
  }
  assert.deepEqual(missing, [], `Missing images (${missing.length}): ${missing.join(", ")}`);
});
