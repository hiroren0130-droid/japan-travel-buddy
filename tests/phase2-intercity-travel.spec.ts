import { expect, test } from "@playwright/test";

import {
  estimateLocationTravel,
  estimateTravel,
  estimateTravelBetweenSpots,
} from "@/app/api/chat/locationTravelEstimator";
import { optimizeGeneratedPlan } from "@/app/api/chat/planOptimizer";
import {
  getEstimatedArrivalAtEndLocationMinutes,
} from "@/app/api/chat/planCompleteness";
import {
  calculateLongDistanceMoveCount,
  calculateMixedCityDayCount,
} from "@/app/api/chat/routeEvaluator";
import { optimizeTravelPlanRoute } from "@/app/api/chat/routeOptimizer";
import { optimizeTravelPlanTimes } from "@/app/api/chat/timeOptimizer";
import { getSpotById } from "@/lib/spotService";

import type { Spot } from "@/data/types";
import type { AITravelPlan } from "@/app/api/chat/travelValidator";

function requireSpot(id: string): Spot {
  const spot = getSpotById(id);

  if (!spot) {
    throw new Error(`Missing test Spot: ${id}`);
  }

  return spot;
}

function createPlan(
  spotNames: string[],
  firstTime = "13:30"
): AITravelPlan {
  return {
    title: "Phase 2 intercity test",
    summary: "Phase 2 intercity test plan",
    days: [
      {
        day: 1,
        items: spotNames.map((spot, index) => ({
          time: index === 0 ? firstTime : "14:00",
          spot,
          description: `${spot}を訪問します。`,
          transport: index === 0 ? "徒歩" : "電車",
          duration: index === 0 ? "0分" : "30分",
        })),
      },
    ],
  };
}

const kiyomizudera = requireSpot("kiyomizudera");
const gion = requireSpot("gion");
const kyotoStation = requireSpot("kyoto-station");
const osakaCastle = requireSpot("osaka-castle");
const osakaStationCity = requireSpot("osaka-station-city");

test("同一cityと距離fallbackは既存の距離別ルールを維持する", () => {
  expect(estimateTravel(1.2)).toEqual({
    transport: "徒歩",
    durationMinutes: 18,
  });
  expect(estimateTravel(2)).toEqual({
    transport: "バス",
    durationMinutes: 22,
  });
  expect(estimateTravel(5)).toEqual({
    transport: "電車",
    durationMinutes: 35,
  });
  expect(
    estimateTravelBetweenSpots(
      kiyomizudera,
      gion
    )
  ).toEqual({
    transport: "バス",
    durationMinutes: 18,
  });
});

test("京都hubと大阪hubは往復とも30分になる", () => {
  expect(
    estimateTravelBetweenSpots(
      kyotoStation,
      osakaStationCity
    )
  ).toEqual({
    transport: "JR",
    durationMinutes: 30,
  });
  expect(
    estimateTravelBetweenSpots(
      osakaStationCity,
      kyotoStation
    )
  ).toEqual({
    transport: "JR",
    durationMinutes: 30,
  });
});

test("京都と大阪の観光Spot間はhub accessを加算する", () => {
  expect(
    estimateTravelBetweenSpots(
      gion,
      osakaCastle
    )
  ).toEqual({
    transport: "JR",
    durationMinutes: 84,
  });
  expect(
    estimateTravelBetweenSpots(
      kiyomizudera,
      osakaCastle
    )
  ).toEqual({
    transport: "JR",
    durationMinutes: 85,
  });
  expect(
    estimateTravelBetweenSpots(
      osakaCastle,
      gion
    )
  ).toEqual({
    transport: "JR",
    durationMinutes: 84,
  });
});

test("cityId欠落または未対応city pairは現行距離式へfallbackする", () => {
  const missingCitySpot = {
    ...gion,
    cityId: undefined,
  } as unknown as Spot;
  const unsupportedCitySpot = {
    ...gion,
    cityId: "unsupported-city",
  } as unknown as Spot;
  const currentFallback = estimateTravelBetweenSpots(
    missingCitySpot,
    osakaCastle
  );

  expect(currentFallback).toEqual({
    transport: "電車",
    durationMinutes: 183,
  });
  expect(
    estimateTravelBetweenSpots(
      unsupportedCitySpot,
      osakaCastle
    )
  ).toEqual(currentFallback);
});

test("hub Spotを取得できない場合は現行距離式へfallbackする", () => {
  expect(
    estimateTravelBetweenSpots(
      gion,
      osakaCastle,
      () => undefined
    )
  ).toEqual({
    transport: "電車",
    durationMinutes: 183,
  });
});

test("routeOptimizerは評価と採用durationへ同じ都市間推定を反映する", () => {
  const result = optimizeTravelPlanRoute(
    createPlan([
      "祇園",
      "大阪城天守閣",
    ]),
    { preserveFirstItem: true }
  );

  expect(
    result.days[0].items.map((item) => item.spot)
  ).toEqual([
    "祇園",
    "大阪城天守閣",
  ]);
  expect(result.days[0].items[1]).toMatchObject({
    transport: "JR",
    duration: "84分",
  });
});

test("timeOptimizerは都市間durationを後続arrivalへ反映する", () => {
  const routedPlan = optimizeTravelPlanRoute(
    createPlan([
      "祇園",
      "大阪城天守閣",
    ]),
    { preserveFirstItem: true }
  );
  const result = optimizeTravelPlanTimes(
    routedPlan
  );

  expect(
    result.days[0].items.map((item) => item.time)
  ).toEqual(["13:30", "15:54"]);
});

test("日本語とEnglish Locationは同じ都市間推定を利用する", () => {
  const japanese = estimateLocationTravel({
    location: "京都駅",
    spotName: "大阪城天守閣",
  });
  const english = estimateLocationTravel({
    location: "Kyoto Station",
    spotName: "大阪城天守閣",
  });

  expect(japanese).toEqual({
    transport: "JR",
    durationMinutes: 59,
  });
  expect(english).toEqual(japanese);
  expect(
    estimateLocationTravel({
      location: "Hotel Granvia Kyoto",
      spotName: "大阪城天守閣",
    })
  ).toBeNull();
});

test("endLocation帰着時間へ都市間推定を反映する", () => {
  const plan = createPlan(["祇園"], "15:00");

  expect(
    getEstimatedArrivalAtEndLocationMinutes(
      plan.days[0],
      "Osaka Station City"
    )
  ).toBe(16 * 60 + 55);
});

test("required Spot・long-distance・mixed-city評価を維持する", () => {
  const result = optimizeGeneratedPlan({
    plan: createPlan([
      "清水寺",
      "祇園",
      "大阪城天守閣",
    ]),
    startSpotName: null,
    locale: "ja",
    requiredSpotNames: [
      "清水寺",
      "大阪城天守閣",
    ],
  });
  const spotNames = result.days.flatMap((day) =>
    day.items.map((item) => item.spot)
  );

  expect(spotNames).toEqual(
    expect.arrayContaining([
      "清水寺",
      "大阪城天守閣",
    ])
  );
  expect(
    calculateLongDistanceMoveCount(result)
  ).toBeGreaterThan(0);
  expect(
    calculateMixedCityDayCount(result)
  ).toBe(1);
});
