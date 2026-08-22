import assert from "node:assert/strict";
import test from "node:test";

import { allSpots } from "@/data";

import {
  containsRequiredSpots,
  type AITravelPlan,
} from "./travelValidator";
import {
  getRequiredSpotsByIds,
  mergeRequiredSpots,
  validateRequiredSpotIds,
} from "./requiredSpots";

const [firstSpot, secondSpot, thirdSpot] = allSpots;

function createPlanWithSpots(
  spotNames: string[]
): AITravelPlan {
  return {
    title: "Test plan",
    summary: "Test summary",
    days: [
      {
        day: 1,
        items: spotNames.map((spot, index) => ({
          time: `${String(9 + index).padStart(2, "0")}:00`,
          spot,
          description: "Test description",
          transport: index === 0 ? "徒歩" : "電車",
          duration: index === 0 ? "0分" : "30分",
        })),
      },
    ],
  };
}

test("validates one required spot ID", () => {
  assert.deepEqual(
    validateRequiredSpotIds([firstSpot.id]),
    [firstSpot.id]
  );
});

test("validates multiple required spot IDs", () => {
  assert.deepEqual(
    validateRequiredSpotIds([
      firstSpot.id,
      secondSpot.id,
    ]),
    [firstSpot.id, secondSpot.id]
  );
});

test("removes duplicate required spot IDs", () => {
  assert.deepEqual(
    validateRequiredSpotIds([
      firstSpot.id,
      firstSpot.id,
    ]),
    [firstSpot.id]
  );
});

test("removes empty, non-string, and unknown IDs", () => {
  assert.deepEqual(
    validateRequiredSpotIds([
      "",
      "   ",
      123,
      null,
      "unknown-spot-id",
      ` ${firstSpot.id} `,
    ]),
    [firstSpot.id]
  );
});

test("returns no required IDs when the field is absent", () => {
  assert.deepEqual(
    validateRequiredSpotIds(undefined),
    []
  );
});

test("merges Discover and mentioned spots by spot ID", () => {
  const discoverRequiredSpots =
    getRequiredSpotsByIds([
      firstSpot.id,
      secondSpot.id,
    ]);
  const requiredSpots = mergeRequiredSpots(
    discoverRequiredSpots,
    [secondSpot, thirdSpot]
  );

  assert.deepEqual(
    requiredSpots.map((spot) => spot.id),
    [firstSpot.id, secondSpot.id, thirdSpot.id]
  );
});

test("keeps Discover required spots in a completed plan", () => {
  const discoverRequiredSpots =
    getRequiredSpotsByIds([
      firstSpot.id,
      secondSpot.id,
    ]);
  const plan = createPlanWithSpots(
    discoverRequiredSpots.map((spot) => spot.name)
  );

  assert.equal(
    containsRequiredSpots(plan, discoverRequiredSpots),
    true
  );
});

test("preserves existing mentioned spot validation", () => {
  const mentionedSpots = [firstSpot, thirdSpot];
  const plan = createPlanWithSpots(
    mentionedSpots.map((spot) => spot.name)
  );

  assert.equal(
    containsRequiredSpots(plan, mentionedSpots),
    true
  );
});
