import { expect, test } from "@playwright/test";

import { optimizeGeneratedPlan } from "@/app/api/chat/planOptimizer";
import { optimizeRegionClusters } from "@/app/api/chat/regionClusterOptimizer";
import { optimizeTravelPlanRoute } from "@/app/api/chat/routeOptimizer";
import { estimateTravelBetweenSpots } from "@/app/api/chat/locationTravelEstimator";
import { calculateRouteScore } from "@/app/api/chat/routeEvaluator";
import { getSpotById, getSpotByName } from "@/lib/spotService";

import type { AITravelPlan } from "@/app/api/chat/travelValidator";

const BASE_SPOTS = [
  "大阪城天守閣",
  "祇園",
  "清水寺",
];

function createPlan(
  spots = BASE_SPOTS,
  title = "京都・大阪Plan"
): AITravelPlan {
  return {
    title,
    summary: "明示anchorのroute評価テストです。",
    days: [
      {
        day: 1,
        items: spots.map((spot, index) => ({
          time: index === 0 ? "09:00" : "12:00",
          spot,
          description: `${spot}を訪問します。`,
          transport: index === 0 ? "徒歩" : "電車",
          duration: index === 0 ? "0分" : "30分",
        })),
      },
    ],
  };
}

function getSpotNames(plan: AITravelPlan): string[] {
  return plan.days[0].items.map((item) => item.spot);
}

function getCityIds(plan: AITravelPlan): string[] {
  return plan.days[0].items.map(
    (item) => getSpotByName(item.spot)?.cityId ?? "unknown"
  );
}

function optimizeWithLocations({
  startLocation,
  endLocation,
  startSpotName,
}: {
  startLocation?: string;
  endLocation?: string;
  startSpotName?: string | null;
} = {}): AITravelPlan {
  return optimizeTravelPlanRoute(createPlan(), {
    startLocation,
    endLocation,
    startSpotName,
  });
}

test("start/end未指定と未解決Locationは現行順序を維持する", () => {
  const baseline = optimizeWithLocations();

  expect(getSpotNames(baseline)).toEqual(BASE_SPOTS);
  expect(
    getSpotNames(
      optimizeWithLocations({
        startLocation: "Hotel Granvia Kyoto",
        endLocation: "Unknown Osaka Hotel",
      })
    )
  ).toEqual(getSpotNames(baseline));
});

test("startLocationは解決できるcity側をroute先頭で有利にする", () => {
  const fromKyoto = optimizeWithLocations({
    startLocation: "京都駅",
  });
  const fromOsaka = optimizeWithLocations({
    startLocation: "大阪ステーションシティ",
  });

  expect(getCityIds(fromKyoto)[0]).toBe("kyoto-city");
  expect(getCityIds(fromOsaka)[0]).toBe("osaka-city");
  expect(getSpotNames(fromKyoto)).toEqual([
    "清水寺",
    "祇園",
    "大阪城天守閣",
  ]);
  expect(getSpotNames(fromOsaka)).toEqual(BASE_SPOTS);
});

test("endLocationは解決できるcity側をroute末尾で有利にする", () => {
  const toKyoto = optimizeWithLocations({
    endLocation: "京都駅",
  });
  const toOsaka = optimizeWithLocations({
    endLocation: "大阪ステーションシティ",
  });

  expect(getCityIds(toKyoto).at(-1)).toBe("kyoto-city");
  expect(getCityIds(toOsaka).at(-1)).toBe("osaka-city");
  expect(getSpotNames(toKyoto)).toEqual([
    "大阪城天守閣",
    "清水寺",
    "祇園",
  ]);
  expect(getSpotNames(toOsaka)).toEqual([
    "清水寺",
    "祇園",
    "大阪城天守閣",
  ]);
});

test("start/end両方の明示anchorで地域横断方向を選ぶ", () => {
  const kyotoToOsaka = optimizeWithLocations({
    startLocation: "京都駅",
    endLocation: "大阪ステーションシティ",
  });
  const osakaToKyoto = optimizeWithLocations({
    startLocation: "大阪ステーションシティ",
    endLocation: "京都駅",
  });

  expect(getCityIds(kyotoToOsaka)).toEqual([
    "kyoto-city",
    "kyoto-city",
    "osaka-city",
  ]);
  expect(getCityIds(osakaToKyoto)).toEqual([
    "osaka-city",
    "kyoto-city",
    "kyoto-city",
  ]);
  expect(getSpotNames(kyotoToOsaka)).toEqual([
    "清水寺",
    "祇園",
    "大阪城天守閣",
  ]);
  expect(getSpotNames(osakaToKyoto)).toEqual([
    "大阪城天守閣",
    "清水寺",
    "祇園",
  ]);
});

test("日本語とEnglish localized Locationは同じ方向になる", () => {
  const japanese = optimizeWithLocations({
    startLocation: "京都駅",
    endLocation: "大阪ステーションシティ",
  });
  const english = optimizeWithLocations({
    startLocation: "Kyoto Station",
    endLocation: "Osaka Station City",
  });

  expect(getSpotNames(english)).toEqual(getSpotNames(japanese));
});

test("startSpotNameはstartLocationより優先して先頭を維持する", () => {
  const result = optimizeTravelPlanRoute(
    createPlan(["清水寺", "祇園", "大阪城天守閣"]),
    {
      startSpotName: "清水寺",
      startLocation: "大阪ステーションシティ",
      endLocation: "大阪ステーションシティ",
    }
  );

  expect(getSpotNames(result)[0]).toBe("清水寺");
});

test("required入力順とdestination文字列順はroute方向へ影響しない", () => {
  const first = optimizeGeneratedPlan({
    plan: createPlan(BASE_SPOTS, "京都・大阪"),
    startSpotName: null,
    locale: "ja",
    requiredSpotNames: ["清水寺", "大阪城天守閣"],
  });
  const second = optimizeGeneratedPlan({
    plan: createPlan(BASE_SPOTS, "大阪・京都"),
    startSpotName: null,
    locale: "ja",
    requiredSpotNames: ["大阪城天守閣", "清水寺"],
  });

  expect(getSpotNames(second)).toEqual(getSpotNames(first));
  expect(getSpotNames(second)).toEqual(BASE_SPOTS);
});

test("SpotとPlan metadataを保持しanchorを公開Route Scoreへ混入させない", () => {
  const source = createPlan();
  const anchored = optimizeTravelPlanRoute(source, {
    startLocation: "京都駅",
    endLocation: "大阪ステーションシティ",
  });

  expect(anchored.title).toBe(source.title);
  expect(anchored.summary).toBe(source.summary);
  expect(anchored.days[0].day).toBe(source.days[0].day);
  expect(getSpotNames(anchored).sort()).toEqual(
    [...BASE_SPOTS].sort()
  );
  expect(
    anchored.days[0].items
      .map((item) => item.description)
      .sort()
  ).toEqual(
    source.days[0].items
      .map((item) => item.description)
      .sort()
  );
  expect(calculateRouteScore(anchored)).toBe(
    calculateRouteScore({
      ...anchored,
      days: anchored.days.map((day) => ({
        ...day,
        items: day.items.map((item) => ({
          ...item,
        })),
      })),
    })
  );
});

test("Phase 2都市間推定と1日Region Cluster no-opを維持する", () => {
  const gion = getSpotById("gion");
  const kiyomizudera = getSpotById("kiyomizudera");
  const osakaCastle = getSpotById("osaka-castle");
  const plan = createPlan();

  expect(gion).toBeDefined();
  expect(kiyomizudera).toBeDefined();
  expect(osakaCastle).toBeDefined();
  expect(
    estimateTravelBetweenSpots(gion!, osakaCastle!)
  ).toEqual({
    transport: "JR",
    durationMinutes: 84,
  });
  expect(
    estimateTravelBetweenSpots(kiyomizudera!, osakaCastle!)
  ).toEqual({
    transport: "JR",
    durationMinutes: 85,
  });
  expect(optimizeRegionClusters({ plan })).toBe(plan);
});

test("複数日ではstartを初日、endを最終日だけに適用する", () => {
  const plan: AITravelPlan = {
    ...createPlan(),
    days: [
      createPlan(["大阪城天守閣", "清水寺"]).days[0],
      {
        ...createPlan(["清水寺", "大阪城天守閣"]).days[0],
        day: 2,
      },
    ],
  };
  const result = optimizeTravelPlanRoute(plan, {
    startLocation: "京都駅",
    endLocation: "大阪ステーションシティ",
  });

  expect(getCityIds({ ...result, days: [result.days[0]] })[0]).toBe(
    "kyoto-city"
  );
  expect(
    getCityIds({ ...result, days: [result.days[1]] }).at(-1)
  ).toBe("osaka-city");
});
