import { expect, test } from "@playwright/test";

import { pruneOptionalSpots } from "@/app/api/chat/optionalSpotPruner";
import {
  calculateEarlyEndCount,
  getEstimatedDayEndMinutes,
  hasLimitedScheduleRequest,
} from "@/app/api/chat/planCompleteness";
import { getSpotByName } from "@/lib/spotService";

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

function getEstimatedEndMinutes(
  plan: AITravelPlan
): number {
  const lastItem = plan.days[0]?.items.at(-1);

  if (!lastItem) {
    return 0;
  }

  const [hours, minutes] = lastItem.time
    .split(":")
    .map(Number);
  const stayMinutes = Number(
    getSpotByName(lastItem.spot)
      ?.recommendedStay.match(/\d+/)?.[0] ?? 60
  );

  return hours * 60 + minutes + stayMinutes;
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

test("Route Score改善だけで1日プランを15時前終了にしない", () => {
  const result = pruneOptionalSpots({
    plan: createPlan([
      "伏見稲荷大社",
      "清水寺",
      "八坂神社",
      "平安神宮",
      "南禅寺",
    ]),
    requiredSpotNames: [],
  });

  expect(
    getEstimatedEndMinutes(result)
  ).toBeGreaterThanOrEqual(15 * 60);
});

test("伏見稲荷から平安神宮までの13:18終了を未完了と判定する", () => {
  const plan: AITravelPlan = {
    title: "Kyoto shrines",
    summary: "Kyoto shrines",
    days: [
      {
        day: 1,
        items: [
          {
            time: "09:00",
            spot: "伏見稲荷大社",
            description: "Visit Fushimi Inari Taisha.",
            transport: "徒歩",
            duration: "0分",
          },
          {
            time: "11:01",
            spot: "八坂神社",
            description: "Visit Yasaka Shrine.",
            transport: "バス",
            duration: "31分",
          },
          {
            time: "13:18",
            spot: "平安神宮",
            description: "Visit Heian Jingu Shrine.",
            transport: "バス",
            duration: "18分",
          },
        ],
      },
    ],
  };

  expect(
    getEstimatedDayEndMinutes(
      plan.days[0]
    )
  ).toBe(14 * 60 + 18);
  expect(
    calculateEarlyEndCount(plan)
  ).toBe(1);
});

test("明示的な半日希望を通常1日の完成度判定から除外できる", () => {
  expect(
    hasLimitedScheduleRequest(
      "I only need a half-day plan."
    )
  ).toBe(true);
  expect(
    hasLimitedScheduleRequest(
      "午前のみ観光したい"
    )
  ).toBe(true);
  expect(
    hasLimitedScheduleRequest(
      "京都を1日観光したい"
    )
  ).toBe(false);
});
