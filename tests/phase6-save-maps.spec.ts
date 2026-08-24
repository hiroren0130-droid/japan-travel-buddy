import { expect, test } from "@playwright/test";

import { buildPlanResponse } from "@/app/api/chat/planResponseBuilder";
import {
  serializeTravelPlanConditions,
  serializeTravelPlanConditionUpdates,
} from "@/lib/travelPlanConditions";
import { createGoogleMapsRoute } from "@/lib/googleMaps";

import type { AITravelPlan } from "@/app/api/chat/travelValidator";

const aiPlan: AITravelPlan = {
  title: "Phase 6 test",
  summary: "Phase 6 test plan",
  days: [
    {
      day: 1,
      items: [
        {
          time: "09:00",
          spot: "清水寺",
          description: "清水寺を訪問します。",
          transport: "徒歩",
          duration: "0分",
        },
      ],
    },
  ],
};

test("API Responseは4つの旅行条件をPlan item化せず保持する", () => {
  const response = buildPlanResponse(aiPlan, {
    startLocation: "京都駅",
    startTime: "09:00",
    endLocation: "京都駅",
    endTime: "18:00",
  });

  expect(response).toMatchObject({
    startLocation: "京都駅",
    startTime: "09:00",
    endLocation: "京都駅",
    endTime: "18:00",
  });
  expect(response.days[0].items).toHaveLength(1);
  expect(response.days[0].items[0].spotId).toBe("kiyomizudera");
});

test("API Responseは条件未指定の旧Planと互換性を保つ", () => {
  const response = buildPlanResponse(aiPlan);

  expect(response.startLocation).toBeUndefined();
  expect(response.startTime).toBeUndefined();
  expect(response.endLocation).toBeUndefined();
  expect(response.endTime).toBeUndefined();
});

test("Google Mapsは境界条件に応じてorigin destination waypointsを組み立てる", () => {
  const spots = ["清水寺", "錦市場", "金閣寺"];
  const cases = [
    {
      options: {},
      origin: "清水寺",
      destination: "金閣寺",
      waypoints: "錦市場",
    },
    {
      options: { startLocation: "京都駅" },
      origin: "京都駅",
      destination: "金閣寺",
      waypoints: "清水寺|錦市場",
    },
    {
      options: { endLocation: "京都駅" },
      origin: "清水寺",
      destination: "京都駅",
      waypoints: "錦市場|金閣寺",
    },
    {
      options: {
        startLocation: "Hotel Granvia Kyoto",
        endLocation: "京都駅",
      },
      origin: "Hotel Granvia Kyoto",
      destination: "京都駅",
      waypoints: "清水寺|錦市場|金閣寺",
    },
  ];

  for (const routeCase of cases) {
    const url = new URL(
      createGoogleMapsRoute(
        spots,
        routeCase.options
      )
    );

    expect(url.searchParams.get("origin")).toBe(routeCase.origin);
    expect(url.searchParams.get("destination")).toBe(routeCase.destination);
    expect(url.searchParams.get("waypoints")).toBe(routeCase.waypoints);
    expect(url.searchParams.get("travelmode")).toBe("walking");
  }
});

test("Firestore create serializerはtrimし空値と不正時刻を保存しない", () => {
  expect(serializeTravelPlanConditions({
    startLocation: "  京都駅  ",
    startTime: "09:00",
    endLocation: "   ",
    endTime: "24:00",
  })).toEqual({
    startLocation: "京都駅",
    startTime: "09:00",
  });
});

test("Firestore update serializerは空欄を削除指定へ変換できる", () => {
  expect(serializeTravelPlanConditionUpdates({
    startLocation: "",
    startTime: undefined,
    endLocation: "大阪駅",
    endTime: "17:30",
  })).toEqual({
    startLocation: null,
    startTime: null,
    endLocation: "大阪駅",
    endTime: "17:30",
  });
});
