import {
  CITY_IDS,
  type CityId,
} from "./regions";

export type CityTravelProfile = {
  cityId: CityId;
  hubSpotId: string;
};

export type IntercityTravelProfile = {
  fromCityId: CityId;
  toCityId: CityId;
  hubToHubMinutes: number;
  transport: "JR" | "電車" | "バス";
};

const CITY_TRAVEL_PROFILES: Partial<
  Record<CityId, CityTravelProfile>
> = {
  [CITY_IDS.KYOTO_CITY]: {
    cityId: CITY_IDS.KYOTO_CITY,
    hubSpotId: "kyoto-station",
  },
  [CITY_IDS.OSAKA_CITY]: {
    cityId: CITY_IDS.OSAKA_CITY,
    hubSpotId: "osaka-station-city",
  },
};

const INTERCITY_TRAVEL_PROFILES: IntercityTravelProfile[] = [
  {
    fromCityId: CITY_IDS.KYOTO_CITY,
    toCityId: CITY_IDS.OSAKA_CITY,
    hubToHubMinutes: 30,
    transport: "JR",
  },
];

export function getCityTravelProfile(
  cityId: string
): CityTravelProfile | undefined {
  return CITY_TRAVEL_PROFILES[
    cityId as CityId
  ];
}

export function getIntercityTravelProfile(
  fromCityId: string,
  toCityId: string
): IntercityTravelProfile | undefined {
  return INTERCITY_TRAVEL_PROFILES.find(
    (profile) =>
      (profile.fromCityId === fromCityId &&
        profile.toCityId === toCityId) ||
      (profile.fromCityId === toCityId &&
        profile.toCityId === fromCityId)
  );
}
