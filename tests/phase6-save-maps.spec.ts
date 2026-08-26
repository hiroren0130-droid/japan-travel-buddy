import { expect, test } from "@playwright/test";

import { buildPlanResponse } from "@/app/api/chat/planResponseBuilder";
import {
  serializeTravelPlanConditions,
  serializeTravelPlanConditionUpdates,
} from "@/lib/travelPlanConditions";
import {
  createGoogleMapsRoute,
  determineGoogleMapsTravelMode,
} from "@/lib/googleMaps";

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

test("Google Mapsは同一city内をwalking、複数cityをtransitにする", () => {
  expect(
    determineGoogleMapsTravelMode([
      { name: "清水寺", cityId: "kyoto-city" },
      { name: "錦市場", cityId: "kyoto-city" },
    ])
  ).toBe("walking");

  expect(
    determineGoogleMapsTravelMode([
      { name: "大阪城天守閣", cityId: "osaka-city" },
      { name: "道頓堀", cityId: "osaka-city" },
    ])
  ).toBe("walking");

  expect(
    determineGoogleMapsTravelMode([
      { name: "清水寺", cityId: "kyoto-city" },
      { name: "大阪城天守閣", cityId: "osaka-city" },
    ])
  ).toBe("transit");

  const crossCityUrl = new URL(
    createGoogleMapsRoute([
      { name: "清水寺", cityId: "kyoto-city" },
      { name: "大阪城天守閣", cityId: "osaka-city" },
    ])
  );
  expect(crossCityUrl.searchParams.get("travelmode")).toBe("transit");
});

test("Google Mapsは解決可能なstart/end LocationのcityIdを判定へ反映する", () => {
  const osakaRoutePoints = [
    { name: "大阪城天守閣", cityId: "osaka-city" },
  ];

  expect(
    determineGoogleMapsTravelMode(
      osakaRoutePoints,
      { startLocation: "京都駅" }
    )
  ).toBe("transit");

  expect(
    determineGoogleMapsTravelMode(
      osakaRoutePoints,
      { endLocation: "京都駅" }
    )
  ).toBe("transit");

  expect(
    determineGoogleMapsTravelMode(
      osakaRoutePoints,
      { startLocation: "  kYoTo   sTaTiOn  " }
    )
  ).toBe("transit");
});

test("Google Mapsは未解決Locationとstring入力でwalking fallbackを維持する", () => {
  const url = new URL(
    createGoogleMapsRoute(
      ["清水寺", "錦市場"],
      {
        startLocation: "Unknown Hotel",
        endLocation: "Unknown Station",
      }
    )
  );

  expect(url.searchParams.get("origin")).toBe("Unknown Hotel");
  expect(url.searchParams.get("destination")).toBe("Unknown Station");
  expect(url.searchParams.get("waypoints")).toBe("清水寺|錦市場");
  expect(url.searchParams.get("travelmode")).toBe("walking");
});

test("Google Mapsは大阪4Spotの名称と住所をPlan順のwaypointsとして使う", () => {
  const url = new URL(
    createGoogleMapsRoute(
      [
        {
          name: "大阪城天守閣",
          address: "大阪府大阪市中央区大阪城1-1",
          latitude: 34.687257,
          longitude: 135.525855,
          cityId: "osaka-city",
        },
        {
          name: "心斎橋筋商店街",
          address: "大阪府大阪市中央区心斎橋筋1丁目〜2丁目",
          latitude: 34.673385,
          longitude: 135.501244,
          cityId: "osaka-city",
        },
        {
          name: "道頓堀",
          address: "大阪府大阪市中央区道頓堀",
          latitude: 34.668723,
          longitude: 135.501295,
          cityId: "osaka-city",
        },
        {
          name: "黒門市場",
          address: "大阪府大阪市中央区日本橋2丁目4-1",
          latitude: 34.665421,
          longitude: 135.506312,
          cityId: "osaka-city",
        },
      ],
      {
        startLocation: "大阪駅",
        endLocation: "大阪駅",
      }
    )
  );

  expect(url.searchParams.get("origin")).toBe("大阪駅");
  expect(url.searchParams.get("destination")).toBe("大阪駅");
  expect(url.searchParams.get("waypoints")).toBe(
    [
      "大阪城天守閣, 大阪府大阪市中央区大阪城1-1",
      "心斎橋筋商店街, 大阪府大阪市中央区心斎橋筋1丁目〜2丁目",
      "道頓堀, 大阪府大阪市中央区道頓堀",
      "黒門市場, 大阪府大阪市中央区日本橋2丁目4-1",
    ].join("|")
  );
  expect(url.searchParams.get("travelmode")).toBe("walking");
});

test("Google Mapsは住所なしなら座標、座標もなければ名称へフォールバックする", () => {
  const url = new URL(
    createGoogleMapsRoute(
      [
        {
          name: "清水寺",
          latitude: 34.994856,
          longitude: 135.785046,
        },
        { name: "錦市場" },
        {
          name: "金閣寺",
          address: "京都府京都市北区金閣寺町1",
          latitude: 35.03937,
          longitude: 135.729243,
        },
      ],
      {
        startLocation: "京都駅",
        endLocation: "京都駅",
      }
    )
  );

  expect(url.searchParams.get("waypoints")).toBe(
    "34.994856,135.785046|錦市場|金閣寺, 京都府京都市北区金閣寺町1"
  );
  expect(url.searchParams.get("origin")).toBe("京都駅");
  expect(url.searchParams.get("destination")).toBe("京都駅");
  expect(url.searchParams.get("travelmode")).toBe("walking");
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
