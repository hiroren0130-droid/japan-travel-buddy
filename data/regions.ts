export const REGION_IDS = {
  KANSAI: "kansai",
} as const;

export const PREFECTURE_IDS = {
  KYOTO: "kyoto",
} as const;

export const CITY_IDS = {
  KYOTO_CITY: "kyoto-city",
} as const;

export type RegionId =
  (typeof REGION_IDS)[keyof typeof REGION_IDS];

export type PrefectureId =
  (typeof PREFECTURE_IDS)[keyof typeof PREFECTURE_IDS];

export type CityId =
  (typeof CITY_IDS)[keyof typeof CITY_IDS];

type PlacesCityContext = {
  searchContext: string;
  addressTerms: readonly string[];
};

const PLACES_CITY_CONTEXTS: Readonly<
  Record<CityId, PlacesCityContext>
> = {
  [CITY_IDS.KYOTO_CITY]: {
    searchContext: "Kyoto, Japan",
    addressTerms: ["京都", "Kyoto"],
  },
};

export function getPlacesSearchContext(
  cityId: string
): string | undefined {
  return PLACES_CITY_CONTEXTS[
    cityId as CityId
  ]?.searchContext;
}

export function getPlacesAddressTerms(
  cityId: string
): readonly string[] {
  return (
    PLACES_CITY_CONTEXTS[
      cityId as CityId
    ]?.addressTerms ?? []
  );
}
