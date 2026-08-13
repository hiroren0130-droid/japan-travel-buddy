import { expect, test } from "@playwright/test";

import { pruneOptionalSpots } from "@/app/api/chat/optionalSpotPruner";

import type { AITravelPlan } from "@/app/api/chat/travelValidator";

function createPlan(
  spotNames: string[]
): AITravelPlan {
  return {
    title: "必須スポット保持テスト",
    summary: "必須スポット保持テスト用の旅行プランです。",
    days: [
      {
        day: 1,
        items: spotNames.map(
          (spot, index) => ({
            time: `${String(9 + index).padStart(2, "0")}:00`,
            spot,
            description: `${spot}を訪問します。`,
            transport:
              index === 0 ? "徒歩" : "バス",
            duration:
              index === 0 ? "0分" : "30分",
          })
        ),
      },
    ],
  };
}

function getSpotNames(
  plan: AITravelPlan
): Set<string> {
  return new Set(
    plan.days.flatMap((day) =>
      day.items.map((item) => item.spot)
    )
  );
}

test("requiredの5スポットをpruneしない", () => {
  const requiredSpotNames = [
    "伏見稲荷大社",
    "八坂神社",
    "平安神宮",
    "下鴨神社",
    "晴明神社",
  ];

  const result = pruneOptionalSpots({
    plan: createPlan(requiredSpotNames),
    requiredSpotNames,
  });
  const resultSpotNames = getSpotNames(result);

  for (const requiredSpotName of requiredSpotNames) {
    expect(resultSpotNames).toContain(
      requiredSpotName
    );
  }
});

test("optional候補があってもrequiredをpruneしない", () => {
  const originalSpotNames = [
    "清水寺",
    "高台寺",
    "八坂神社",
    "祇園",
  ];
  const requiredSpotNames = [
    "清水寺",
    "八坂神社",
  ];

  const result = pruneOptionalSpots({
    plan: createPlan(originalSpotNames),
    requiredSpotNames,
  });
  const resultSpotNames = getSpotNames(result);

  for (const requiredSpotName of requiredSpotNames) {
    expect(resultSpotNames).toContain(
      requiredSpotName
    );
  }

  const removedSpotNames = originalSpotNames.filter(
    (spotName) => !resultSpotNames.has(spotName)
  );

  expect(removedSpotNames).not.toContain("清水寺");
  expect(removedSpotNames).not.toContain("八坂神社");
});
