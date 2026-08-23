import { expect, test } from "@playwright/test";

import {
  optimizeDayImbalance,
} from "@/app/api/chat/dayImbalanceOptimizer";
import {
  optimizeRegionClusters,
} from "@/app/api/chat/regionClusterOptimizer";
import {
  calculateCrossDayCitySplitCount,
  calculateLongDistanceMoveCount,
  calculateMixedCityDayCount,
} from "@/app/api/chat/routeEvaluator";

import type {
  AIPlanItem,
  AITravelPlan,
} from "@/app/api/chat/travelValidator";

function createItem(
  spot: string,
  time: string
): AIPlanItem {
  return {
    time,
    spot,
    description: `${spot}を訪問します。`,
    transport: "徒歩",
    duration: "0分",
  };
}

function createPlan(
  days: string[][]
): AITravelPlan {
  return {
    title: "地域クラスタリングテスト",
    summary:
      "地域クラスタリング用の旅程です。",
    days: days.map(
      (spotNames, dayIndex) => ({
        day: dayIndex + 1,
        items: spotNames.map(
          (spot, itemIndex) =>
            createItem(
              spot,
              `${String(
                9 + itemIndex * 2
              ).padStart(2, "0")}:00`
            )
        ),
      })
    ),
  };
}

function getDaySpotNames(
  plan: AITravelPlan
): string[][] {
  return plan.days.map((day) =>
    day.items.map((item) =>
      item.spot
    )
  );
}

function getSortedSpotNames(
  plan: AITravelPlan
): string[] {
  return plan.days
    .flatMap((day) =>
      day.items.map((item) =>
        item.spot
      )
    )
    .sort();
}

test("単一京都Planはno-opになる", () => {
  const plan = createPlan([
    ["清水寺", "祇園"],
    ["錦市場", "渡月橋"],
  ]);

  expect(
    optimizeRegionClusters({ plan })
  ).toBe(plan);
});

test("単一大阪Planはno-opになる", () => {
  const plan = createPlan([
    ["大阪城天守閣", "道頓堀"],
    ["黒門市場", "通天閣"],
  ]);

  expect(
    optimizeRegionClusters({ plan })
  ).toBe(plan);
});

test("京都と大阪の混在をcity単位で再配置する", () => {
  const plan = createPlan([
    ["清水寺", "祇園", "錦市場"],
    [
      "大阪城天守閣",
      "渡月橋",
      "竹林の小径",
    ],
  ]);
  const originalSpotNames =
    getSortedSpotNames(plan);

  const result =
    optimizeRegionClusters({ plan });

  expect(
    getDaySpotNames(result)
  ).toEqual([
    [
      "清水寺",
      "祇園",
      "錦市場",
      "渡月橋",
      "竹林の小径",
    ],
    ["大阪城天守閣"],
  ]);
  expect(
    getSortedSpotNames(result)
  ).toEqual(originalSpotNames);
  expect(
    calculateMixedCityDayCount(result)
  ).toBe(0);
  expect(
    calculateCrossDayCitySplitCount(
      result
    )
  ).toBe(0);
  expect(
    calculateLongDistanceMoveCount(
      result
    )
  ).toBeLessThanOrEqual(
    calculateLongDistanceMoveCount(
      plan
    )
  );
});

test("required相当Spotを移動しても削除しない", () => {
  const plan = createPlan([
    ["清水寺"],
    ["大阪城天守閣", "祇園"],
  ]);

  const result =
    optimizeRegionClusters({ plan });

  expect(
    getSortedSpotNames(result)
  ).toEqual(
    getSortedSpotNames(plan)
  );
  expect(
    getSortedSpotNames(result)
  ).toContain("祇園");
});

test("protected start SpotとそのcityをDay 1へanchorする", () => {
  const plan = createPlan([
    ["清水寺", "祇園"],
    ["大阪城天守閣", "道頓堀"],
  ]);

  const result =
    optimizeRegionClusters({
      plan,
      protectedStartSpotName:
        "大阪城天守閣",
    });

  expect(
    result.days[0].items[0].spot
  ).toBe("大阪城天守閣");
  expect(
    result.days[0].items.map(
      (item) => item.spot
    )
  ).toEqual([
    "大阪城天守閣",
    "道頓堀",
  ]);
});

test("地域数が日数を超えてもSpotを保持する", () => {
  const plan = createPlan([
    [
      "清水寺",
      "大阪城天守閣",
    ],
  ]);

  const result =
    optimizeRegionClusters({ plan });

  expect(
    getSortedSpotNames(result)
  ).toEqual(
    getSortedSpotNames(plan)
  );
});

test("Day Imbalance後もcity品質を悪化させない", () => {
  const clusteredPlan =
    optimizeRegionClusters({
      plan: createPlan([
        ["清水寺", "祇園", "錦市場"],
        [
          "大阪城天守閣",
          "渡月橋",
          "竹林の小径",
        ],
      ]),
    });

  const result = optimizeDayImbalance(
    clusteredPlan,
    null,
    "09:00"
  );

  expect(
    calculateMixedCityDayCount(result)
  ).toBe(0);
  expect(
    calculateCrossDayCitySplitCount(
      result
    )
  ).toBe(0);
  expect(
    getSortedSpotNames(result)
  ).toEqual(
    getSortedSpotNames(clusteredPlan)
  );
});
