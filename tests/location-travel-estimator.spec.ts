import { expect, test } from "@playwright/test";

import {
  estimateLocationTravel,
  resolveLocationSpot,
} from "@/app/api/chat/locationTravelEstimator";
import { filterLocationPlanItems } from "@/app/api/chat/locationPlanItemFilter";
import { optimizeGeneratedPlan } from "@/app/api/chat/planOptimizer";
import {
  calculateEndTimeViolationCount,
  getEstimatedArrivalAtEndLocationMinutes,
  getEstimatedDayEndMinutes,
} from "@/app/api/chat/planCompleteness";
import { pruneOptionalSpots } from "@/app/api/chat/optionalSpotPruner";
import { optimizeTravelPlanTimes } from "@/app/api/chat/timeOptimizer";
import type { AITravelPlan } from "@/app/api/chat/travelValidator";

function createPlan(
  days: Array<Array<{ time: string; spot: string }>>
): AITravelPlan {
  return {
    title: "Location travel test",
    summary: "Location travel test plan",
    days: days.map((items, dayIndex) => ({
      day: dayIndex + 1,
      items: items.map((item, itemIndex) => ({
        ...item,
        description: item.spot,
        transport: itemIndex === 0 ? "徒歩" : "バス",
        duration: itemIndex === 0 ? "0分" : "30分",
      })),
    })),
  };
}

test("locationはSpot DBの正式名または登録aliasの正規化完全一致だけで解決する", () => {
  expect(resolveLocationSpot(" 京都 駅 ")?.name).toBe("京都駅");
  expect(resolveLocationSpot("Kyoto Station")?.name).toBe("京都駅");
  expect(resolveLocationSpot("  kYoTo   sTaTiOn  ")?.name).toBe("京都駅");
  expect(resolveLocationSpot("大阪駅")?.id).toBe("osaka-station-city");
  expect(resolveLocationSpot("Hotel Granvia Kyoto")).toBeNull();
  expect(resolveLocationSpot("Kyoto Stat")).toBeNull();
});

test("English startLocation移動を最初のSpot時刻へ反映する", () => {
  const travel = estimateLocationTravel({
    location: "Kyoto Station",
    spotName: "錦市場",
  });
  expect(travel).not.toBeNull();

  const result = optimizeTravelPlanTimes(
    createPlan([[{ time: "09:00", spot: "錦市場" }]]),
    "09:00",
    "Kyoto Station"
  );
  const expectedFirstArrival = 9 * 60 + travel!.durationMinutes;

  expect(result.days[0].items[0].time).toBe(
    `${String(Math.floor(expectedFirstArrival / 60)).padStart(2, "0")}:${String(expectedFirstArrival % 60).padStart(2, "0")}`
  );
});

test("English endLocation移動を帰着制約へ反映する", () => {
  const plan = createPlan([[{ time: "16:00", spot: "錦市場" }]]);
  const dayEnd = getEstimatedDayEndMinutes(plan.days[0]);
  const finalArrival = getEstimatedArrivalAtEndLocationMinutes(
    plan.days[0],
    "Kyoto Station"
  );

  expect(finalArrival).toBeGreaterThan(dayEnd);
  const earlier = finalArrival - 1;
  const earlierTime = `${String(Math.floor(earlier / 60)).padStart(2, "0")}:${String(earlier % 60).padStart(2, "0")}`;
  expect(
    calculateEndTimeViolationCount(plan, earlierTime, "Kyoto Station")
  ).toBe(1);
});

test("startLocation移動は明示startTimeがあるDay 1だけに加算する", () => {
  const travel = estimateLocationTravel({
    location: "京都駅",
    spotName: "清水寺",
  });
  expect(travel).not.toBeNull();

  const result = optimizeTravelPlanTimes(
    createPlan([
      [{ time: "08:00", spot: "清水寺" }],
      [{ time: "08:30", spot: "清水寺" }],
    ]),
    "09:00",
    "京都駅"
  );

  const expectedFirstArrival = 9 * 60 + travel!.durationMinutes;
  expect(result.days[0].items[0].time).toBe(
    `${String(Math.floor(expectedFirstArrival / 60)).padStart(2, "0")}:${String(expectedFirstArrival % 60).padStart(2, "0")}`
  );
  expect(result.days[0].items[0].duration).toBe("0分");
  expect(result.days[1].items[0].time).toBe("09:00");
});

test("startLocation未指定・解決不能・startTime未指定は既存時刻へfallbackする", () => {
  const plan = createPlan([[{ time: "10:00", spot: "清水寺" }]]);

  expect(optimizeTravelPlanTimes(plan, "09:00").days[0].items[0].time).toBe("09:00");
  expect(optimizeTravelPlanTimes(plan, "09:00", "Umeda").days[0].items[0].time).toBe("09:00");
  expect(optimizeTravelPlanTimes(plan, undefined, "京都駅").days[0].items[0].time).toBe("10:00");
});

test("endLocation移動は最終DayのendTime判定だけに加算する", () => {
  const plan = createPlan([
    [{ time: "16:00", spot: "清水寺" }],
    [{ time: "16:00", spot: "清水寺" }],
  ]);
  const firstDayEnd = getEstimatedDayEndMinutes(plan.days[0]);
  const finalArrival = getEstimatedArrivalAtEndLocationMinutes(
    plan.days[1],
    "京都駅"
  );

  expect(finalArrival).toBeGreaterThan(firstDayEnd);
  const boundary = `${String(Math.floor(finalArrival / 60)).padStart(2, "0")}:${String(finalArrival % 60).padStart(2, "0")}`;
  expect(calculateEndTimeViolationCount(plan, boundary, "京都駅")).toBe(0);
  expect(calculateEndTimeViolationCount(plan, boundary)).toBe(0);
  expect(calculateEndTimeViolationCount(plan, boundary, "Umeda")).toBe(0);

  const earlier = finalArrival - 1;
  const earlierTime = `${String(Math.floor(earlier / 60)).padStart(2, "0")}:${String(earlier % 60).padStart(2, "0")}`;
  expect(calculateEndTimeViolationCount(plan, earlierTime, "京都駅")).toBe(1);
});

test("厳しいendLocation制約でもrequired Spotは削除しない", () => {
  const plan = createPlan([[{ time: "17:00", spot: "清水寺" }]]);
  const result = pruneOptionalSpots({
    plan,
    requiredSpotNames: ["清水寺"],
    startLocation: "京都駅",
    endLocation: "京都駅",
    startTime: "09:00",
    endTime: "09:30",
  });

  expect(result.days[0].items.map((item) => item.spot)).toEqual(["清水寺"]);
  expect(calculateEndTimeViolationCount(result, "09:30", "京都駅")).toBe(1);
});

test("start/end Locationと一致するPlan itemだけを除外する", () => {
  const plan = createPlan([[
    { time: "09:00", spot: "京都駅" },
    { time: "10:00", spot: "錦市場" },
    { time: "12:00", spot: "清水寺" },
  ]]);
  const result = filterLocationPlanItems({
    plan,
    startLocation: "京都駅",
    endLocation: "京都駅",
    requiredSpotNames: [],
    protectedStartSpotName: null,
  });

  expect(result.days[0].items.map((item) => item.spot)).toEqual([
    "錦市場",
    "清水寺",
  ]);
});

test("Location一致でもrequired Spotとprotected start Spotを優先する", () => {
  const plan = createPlan([[
    { time: "09:00", spot: "京都駅" },
    { time: "10:00", spot: "清水寺" },
  ]]);

  expect(filterLocationPlanItems({
    plan,
    endLocation: "京都駅",
    requiredSpotNames: [" 京 都 駅 "],
    protectedStartSpotName: null,
  }).days[0].items[0].spot).toBe("京都駅");

  expect(filterLocationPlanItems({
    plan,
    startLocation: "京都駅",
    requiredSpotNames: [],
    protectedStartSpotName: "京都駅",
  }).days[0].items[0].spot).toBe("京都駅");
});

test("解決不能LocationではPlanを変更しない", () => {
  const plan = createPlan([[
    { time: "09:00", spot: "京都駅" },
    { time: "10:00", spot: "清水寺" },
  ]]);
  const result = filterLocationPlanItems({
    plan,
    startLocation: "Hotel Granvia Kyoto",
    endLocation: "Umeda",
    requiredSpotNames: [],
    protectedStartSpotName: null,
  });

  expect(result).toBe(plan);
});

test("Filter後にstartLocation移動をfirst sightseeing Spotへ反映する", () => {
  const travel = estimateLocationTravel({
    location: "京都駅",
    spotName: "清水寺",
  });
  const result = optimizeGeneratedPlan({
    plan: createPlan([[
      { time: "09:00", spot: "京都駅" },
      { time: "10:00", spot: "清水寺" },
    ]]),
    startSpotName: null,
    locale: "ja",
    startTime: "09:00",
    startLocation: "京都駅",
  });
  const arrival = 9 * 60 + travel!.durationMinutes;

  expect(result.days[0].items.map((item) => item.spot)).toEqual(["清水寺"]);
  expect(result.days[0].items[0].time).toBe(
    `${String(Math.floor(arrival / 60)).padStart(2, "0")}:${String(arrival % 60).padStart(2, "0")}`
  );
});

test("Filter後も最終観光SpotからendLocationへの制約を評価する", () => {
  const result = optimizeGeneratedPlan({
    plan: createPlan([[
      { time: "13:00", spot: "清水寺" },
      { time: "15:30", spot: "京都駅" },
    ]]),
    startSpotName: null,
    locale: "ja",
    startTime: "13:00",
    endLocation: "京都駅",
  });

  expect(result.days[0].items.map((item) => item.spot)).toEqual(["清水寺"]);
  expect(calculateEndTimeViolationCount(result, "14:55", "京都駅")).toBe(1);
});
