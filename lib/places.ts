const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

export type PlaceOpeningHours = {
  businessStatus:
    | "OPERATIONAL"
    | "CLOSED_TEMPORARILY"
    | "CLOSED_PERMANENTLY"
    | null;

  isOpenNow: boolean | null;

  weekdayDescriptions: string[];

  nextOpenTime: string | null;

  nextCloseTime: string | null;
};

export type PlaceDetails = {
  placeId: string | null;

  name: string | null;

  address: string | null;

  rating: number | null;

  userRatingCount: number | null;

  googleMapsUri: string | null;

  websiteUri: string | null;

  openingHours: PlaceOpeningHours;

  firstPhotoResourceName: string | null;
};

type GoogleOpeningHours = {
  openNow?: boolean;

  weekdayDescriptions?: string[];

  nextOpenTime?: string;

  nextCloseTime?: string;
};

type GooglePlacePhoto = {
  name?: string;
};

type GooglePlace = {
  id?: string;

  displayName?: {
    text?: string;
    languageCode?: string;
  };

  formattedAddress?: string;

  rating?: number;

  userRatingCount?: number;

  googleMapsUri?: string;

  websiteUri?: string;

  businessStatus?:
    | "OPERATIONAL"
    | "CLOSED_TEMPORARILY"
    | "CLOSED_PERMANENTLY";

  regularOpeningHours?: GoogleOpeningHours;

  currentOpeningHours?: GoogleOpeningHours;

  photos?: GooglePlacePhoto[];
};

type GooglePlacesResponse = {
  places?: GooglePlace[];

  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type CacheEntry = {
  value: PlaceDetails | null;
  expiresAt: number;
};

const CACHE_DURATION_MS =
  1000 * 60 * 60 * 6;

const placesCache = new Map<string, CacheEntry>();

function getApiKey() {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY が .env.local に設定されていません。"
    );
  }

  return apiKey;
}

function normalizeQuery(query: string) {
  return query
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getCachedPlace(
  query: string
): PlaceDetails | null | undefined {
  const cacheKey = normalizeQuery(query);

  const cached = placesCache.get(cacheKey);

  if (!cached) {
    return undefined;
  }

  if (Date.now() >= cached.expiresAt) {
    placesCache.delete(cacheKey);
    return undefined;
  }

  return cached.value;
}

function savePlaceToCache(
  query: string,
  value: PlaceDetails | null
) {
  const cacheKey = normalizeQuery(query);

  placesCache.set(cacheKey, {
    value,
    expiresAt:
      Date.now() + CACHE_DURATION_MS,
  });
}

function mapGooglePlace(
  place: GooglePlace
): PlaceDetails {
  const currentHours =
    place.currentOpeningHours;

  const regularHours =
    place.regularOpeningHours;

  return {
    placeId:
      place.id ?? null,

    name:
      place.displayName?.text ?? null,

    address:
      place.formattedAddress ?? null,

    rating:
      place.rating ?? null,

    userRatingCount:
      place.userRatingCount ?? null,

    googleMapsUri:
      place.googleMapsUri ?? null,

    websiteUri:
      place.websiteUri ?? null,

    openingHours: {
      businessStatus:
        place.businessStatus ?? null,

      isOpenNow:
        currentHours?.openNow ?? null,

      weekdayDescriptions:
        currentHours?.weekdayDescriptions ??
        regularHours?.weekdayDescriptions ??
        [],

      nextOpenTime:
        currentHours?.nextOpenTime ?? null,

      nextCloseTime:
        currentHours?.nextCloseTime ?? null,
    },

    firstPhotoResourceName:
      place.photos?.[0]?.name ?? null,
  };
}

export async function searchPlace(
  query: string
): Promise<PlaceDetails | null> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  const cached =
    getCachedPlace(normalizedQuery);

  if (cached !== undefined) {
    return cached;
  }

  const apiKey = getApiKey();

  const response = await fetch(
    PLACES_TEXT_SEARCH_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "X-Goog-Api-Key":
          apiKey,

        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.googleMapsUri",
          "places.websiteUri",
          "places.businessStatus",
          "places.regularOpeningHours",
          "places.currentOpeningHours",
          "places.photos",
        ].join(","),
      },

      body: JSON.stringify({
        textQuery:
          normalizedQuery,

        languageCode:
          "ja",

        regionCode:
          "JP",

        maxResultCount:
          1,
      }),

      cache:
        "no-store",
    }
  );

  const data =
    (await response.json()) as GooglePlacesResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `Places APIエラー: ${response.status}`
    );
  }

  const place =
    data.places?.[0];

  if (!place) {
    savePlaceToCache(
      normalizedQuery,
      null
    );

    return null;
  }

  const result =
    mapGooglePlace(place);

  savePlaceToCache(
    normalizedQuery,
    result
  );

  return result;
}

export async function getPlaceDetailsForSpot(
  spotName: string,
  area = "京都"
): Promise<PlaceDetails | null> {
  return searchPlace(
    `${spotName} ${area}`
  );
}

export async function getOpeningHoursForSpot(
  spotName: string,
  area = "京都"
): Promise<PlaceOpeningHours | null> {
  const place =
    await getPlaceDetailsForSpot(
      spotName,
      area
    );

  return place?.openingHours ?? null;
}

export async function getPlacesForSpots(
  spots: Array<{
    name: string;
    area?: string;
  }>,
  limit = 10
): Promise<
  Map<string, PlaceDetails | null>
> {
  const targetSpots =
    spots.slice(0, limit);

  const results =
    await Promise.allSettled(
      targetSpots.map(async (spot) => {
        const place =
          await getPlaceDetailsForSpot(
            spot.name,
            spot.area ?? "京都"
          );

        return {
          name: spot.name,
          place,
        };
      })
    );

  const placeMap =
    new Map<
      string,
      PlaceDetails | null
    >();

  for (const result of results) {
    if (
      result.status === "fulfilled"
    ) {
      placeMap.set(
        result.value.name,
        result.value.place
      );
    }
  }

  return placeMap;
}

export function formatOpeningHoursForPrompt(
  openingHours:
    | PlaceOpeningHours
    | null
    | undefined
) {
  if (!openingHours) {
    return "不明";
  }

  if (
    openingHours.businessStatus ===
    "CLOSED_PERMANENTLY"
  ) {
    return "閉業";
  }

  if (
    openingHours.businessStatus ===
    "CLOSED_TEMPORARILY"
  ) {
    return "臨時休業";
  }

  if (
    openingHours.weekdayDescriptions
      .length === 0
  ) {
    return "営業時間情報なし";
  }

  return openingHours
    .weekdayDescriptions
    .join(" / ");
}