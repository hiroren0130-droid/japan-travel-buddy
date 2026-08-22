export const REGION_IDS = {
  KANSAI: "kansai",
} as const;

export const PREFECTURE_IDS = {
  KYOTO: "kyoto",
  OSAKA: "osaka",
} as const;

export const CITY_IDS = {
  KYOTO_CITY: "kyoto-city",
  OSAKA_CITY: "osaka-city",
} as const;

export type RegionId =
  (typeof REGION_IDS)[keyof typeof REGION_IDS];

export type PrefectureId =
  (typeof PREFECTURE_IDS)[keyof typeof PREFECTURE_IDS];

export type CityId =
  (typeof CITY_IDS)[keyof typeof CITY_IDS];

const PREFECTURE_DISPLAY_NAMES = {
  [PREFECTURE_IDS.KYOTO]: {
    ja: "京都",
    en: "Kyoto",
  },
  [PREFECTURE_IDS.OSAKA]: {
    ja: "大阪",
    en: "Osaka",
  },
} as const;

type RegionDisplayLocale =
  keyof (typeof PREFECTURE_DISPLAY_NAMES)[PrefectureId];

export function isPrefectureId(
  value: string
): value is PrefectureId {
  return Object.values(
    PREFECTURE_IDS
  ).some(
    (prefectureId) =>
      prefectureId === value
  );
}

export function getPrefectureDisplayName(
  prefectureId: PrefectureId,
  locale: RegionDisplayLocale
): string {
  return PREFECTURE_DISPLAY_NAMES[
    prefectureId
  ][locale];
}

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
  [CITY_IDS.OSAKA_CITY]: {
    searchContext: "Osaka, Japan",
    addressTerms: ["大阪", "Osaka"],
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
