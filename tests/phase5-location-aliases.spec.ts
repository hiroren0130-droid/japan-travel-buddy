import { expect, test } from "@playwright/test";

import {
  estimateLocationTravel,
  resolveLocationSpot,
} from "@/app/api/chat/locationTravelEstimator";
import { getEstimatedArrivalAtEndLocationMinutes } from "@/app/api/chat/planCompleteness";
import { optimizeTravelPlanRoute } from "@/app/api/chat/routeOptimizer";
import type { AITravelPlan } from "@/app/api/chat/travelValidator";
import type { LocationAliasEntry } from "@/data/locationAliases";
import {
  createGoogleMapsRoute,
  createGoogleMapsRouteSegments,
  type GoogleMapsRoutePoint,
} from "@/lib/googleMaps";
import {
  normalizeLocationName,
  validateLocationAliases,
} from "@/lib/locationResolver";
import {
  getSpotById,
} from "@/lib/spotService";

const kyotoStation = getSpotById(
  "kyoto-station"
)!;
const osakaStationCity = getSpotById(
  "osaka-station-city"
)!;
const kiyomizudera = getSpotById(
  "kiyomizudera"
)!;
const gion = getSpotById("gion")!;
const osakaCastle = getSpotById(
  "osaka-castle"
)!;

function routePoint(
  spot: typeof kiyomizudera
): GoogleMapsRoutePoint {
  return {
    name: spot.name,
    address: spot.address,
    latitude: spot.latitude,
    longitude: spot.longitude,
    cityId: spot.cityId,
  };
}

function createRoutePlan(): AITravelPlan {
  return {
    title: "Phase 5 route test",
    summary: "Phase 5 route test",
    days: [
      {
        day: 1,
        items: [
          kiyomizudera,
          gion,
          osakaCastle,
        ].map((spot, index) => ({
          time: index === 0 ? "09:00" : "12:00",
          spot: spot.name,
          description: spot.name,
          transport: index === 0 ? "徒歩" : "電車",
          duration: index === 0 ? "0分" : "30分",
        })),
      },
    ],
  };
}

test("canonical names and Osaka Station aliases resolve exactly", () => {
  for (const input of [
    "京都駅",
    "Kyoto Station",
  ]) {
    expect(resolveLocationSpot(input)?.id).toBe(
      "kyoto-station"
    );
  }

  for (const input of [
    "大阪駅",
    "Osaka Station",
    "JR大阪駅",
    "JR Osaka Station",
    "大阪ステーションシティ",
    "Osaka Station City",
  ]) {
    expect(resolveLocationSpot(input)?.id).toBe(
      "osaka-station-city"
    );
  }
});

test("normalization keeps exact matching deterministic", () => {
  expect(
    normalizeLocationName(
      "  ＪＲ　Ｏｓａｋａ　Ｓｔａｔｉｏｎ  "
    )
  ).toBe("jrosakastation");
  expect(
    resolveLocationSpot(
      "  ＪＲ　Ｏｓａｋａ　Ｓｔａｔｉｏｎ  "
    )?.id
  ).toBe("osaka-station-city");
});

test("ambiguous, unsupported, partial, and unknown locations stay unresolved", () => {
  for (const input of [
    "梅田",
    "Umeda",
    "新大阪駅",
    "Shin-Osaka Station",
    "大阪",
    "Kyoto",
    "梅田スカイビル",
    "Unknown Hotel",
    "Hotel Granvia Kyoto",
    "自宅",
    "ABC Hotel",
    "関西空港",
  ]) {
    expect(resolveLocationSpot(input)).toBeNull();
  }
});

test("location alias registry is valid", () => {
  expect(validateLocationAliases()).toEqual([]);
});

test("registry validation rejects missing targets, invalid coordinates, duplicates, and canonical conflicts", () => {
  const missingTarget: LocationAliasEntry[] = [
    {
      spotId: "missing-station",
      aliases: ["Missing Station"],
    },
  ];
  expect(
    validateLocationAliases(missingTarget)
  ).toContain(
    "Location alias target Spot does not exist: missing-station"
  );

  const invalidCoordinateSpot = {
    ...osakaStationCity,
    latitude: Number.NaN,
  };
  expect(
    validateLocationAliases(
      [
        {
          spotId: osakaStationCity.id,
          aliases: ["Osaka Terminal"],
        },
      ],
      [invalidCoordinateSpot]
    )
  ).toContain(
    `Location alias target Spot has invalid coordinates: ${osakaStationCity.id}`
  );

  const duplicateAliases: LocationAliasEntry[] = [
    {
      spotId: osakaStationCity.id,
      aliases: ["JR Osaka", "ＪＲ　Ｏｓａｋａ"],
    },
  ];
  expect(
    validateLocationAliases(duplicateAliases)
  ).toContain(
    `Duplicate normalized location alias: ＪＲ　Ｏｓａｋａ (${osakaStationCity.id}, ${osakaStationCity.id})`
  );

  const canonicalConflict: LocationAliasEntry[] = [
    {
      spotId: osakaStationCity.id,
      aliases: [kyotoStation.name],
    },
  ];
  expect(
    validateLocationAliases(canonicalConflict)
  ).toContain(
    `Location alias conflicts with canonical name: ${kyotoStation.name} (${osakaStationCity.id} -> ${kyotoStation.id})`
  );
});

test("start alias has the same route anchor and travel estimate as the canonical name", () => {
  const canonical = optimizeTravelPlanRoute(
    createRoutePlan(),
    { startLocation: osakaStationCity.name }
  );
  const alias = optimizeTravelPlanRoute(
    createRoutePlan(),
    { startLocation: "大阪駅" }
  );

  expect(
    alias.days[0].items.map((item) => item.spot)
  ).toEqual(
    canonical.days[0].items.map(
      (item) => item.spot
    )
  );
  expect(
    estimateLocationTravel({
      location: "大阪駅",
      spotName: osakaCastle.name,
    })
  ).toEqual(
    estimateLocationTravel({
      location: osakaStationCity.name,
      spotName: osakaCastle.name,
    })
  );
});

test("end alias has the same route anchor and end travel as the canonical name", () => {
  const canonical = optimizeTravelPlanRoute(
    createRoutePlan(),
    { endLocation: osakaStationCity.name }
  );
  const alias = optimizeTravelPlanRoute(
    createRoutePlan(),
    { endLocation: "Osaka Station" }
  );

  expect(
    alias.days[0].items.map((item) => item.spot)
  ).toEqual(
    canonical.days[0].items.map(
      (item) => item.spot
    )
  );
  expect(
    getEstimatedArrivalAtEndLocationMinutes(
      alias.days[0],
      "Osaka Station"
    )
  ).toBe(
    getEstimatedArrivalAtEndLocationMinutes(
      canonical.days[0],
      osakaStationCity.name
    )
  );
});

test("Maps uses canonical location data for resolved aliases and keeps raw labels", () => {
  const segments = createGoogleMapsRouteSegments(
    [routePoint(osakaCastle)],
    { startLocation: "JR大阪駅" }
  );
  const url = new URL(segments[0].url);

  expect(segments[0].origin).toBe("JR大阪駅");
  expect(url.searchParams.get("origin")).toBe(
    `${osakaStationCity.name}, ${osakaStationCity.address}`
  );
  expect(segments[0].travelMode).toBe("walking");

  const routeUrl = new URL(
    createGoogleMapsRoute(
      [routePoint(kiyomizudera)],
      {
        startLocation: "Osaka Station",
        endLocation: "Kyoto Station",
      }
    )
  );
  expect(routeUrl.searchParams.get("origin")).toBe(
    `${osakaStationCity.name}, ${osakaStationCity.address}`
  );
  expect(
    routeUrl.searchParams.get("destination")
  ).toBe(
    `${kyotoStation.name}, ${kyotoStation.address}`
  );
  expect(routeUrl.searchParams.get("travelmode")).toBe(
    "transit"
  );
});

test("Maps keeps unresolved location text as the raw URL query", () => {
  const options = {
    startLocation: "Unknown Hotel",
    endLocation: "Shin-Osaka Station",
  };
  const url = new URL(
    createGoogleMapsRoute(
      [routePoint(kiyomizudera)],
      options
    )
  );

  expect(url.searchParams.get("origin")).toBe(
    options.startLocation
  );
  expect(url.searchParams.get("destination")).toBe(
    options.endLocation
  );
  expect(options).toEqual({
    startLocation: "Unknown Hotel",
    endLocation: "Shin-Osaka Station",
  });
});
