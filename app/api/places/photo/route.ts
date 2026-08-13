import { NextRequest, NextResponse } from "next/server";

import { getSpotById } from "@/lib/spotService";

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

type PlacesSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: {
      text?: string;
    };
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    photos?: Array<{
      name?: string;
    }>;
  }>;
};

const CACHE_CONTROL = "no-store";
const MAX_QUERY_LENGTH = 120;
const GOOGLE_API_TIMEOUT_MS = 10_000;

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f-\u009f]/;

const PHOTO_RESOURCE_NAME_PATTERN =
  /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

const SPOT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const EARTH_RADIUS_KM = 6371;
const MAX_CANDIDATE_DISTANCE_KM = 5;
const MAX_LOCATION_ONLY_DISTANCE_KM = 1.5;

class GoogleApiTimeoutError extends Error {}

type PlaceCandidate = NonNullable<
  PlacesSearchResponse["places"]
>[number];

type SearchTarget = {
  name: string;
  latitude: number | null;
  longitude: number | null;
};

function normalizePlaceName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[（）()【】\[\]]/g, "")
    .toLowerCase();
}

function degreesToRadians(
  degrees: number
): number {
  return degrees * (Math.PI / 180);
}

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const latitudeDifference =
    degreesToRadians(latitudeB - latitudeA);
  const longitudeDifference =
    degreesToRadians(longitudeB - longitudeA);
  const firstLatitude =
    degreesToRadians(latitudeA);
  const secondLatitude =
    degreesToRadians(latitudeB);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

function getCandidateScore(
  candidate: PlaceCandidate,
  target: SearchTarget
): number | null {
  const candidateName = normalizePlaceName(
    candidate.displayName?.text ?? ""
  );
  const targetName = normalizePlaceName(target.name);

  if (!candidateName || !targetName) {
    return null;
  }

  const exactNameMatch =
    candidateName === targetName;
  const partialNameMatch =
    candidateName.includes(targetName) ||
    targetName.includes(candidateName);

  const candidateLatitude =
    candidate.location?.latitude;
  const candidateLongitude =
    candidate.location?.longitude;
  const hasKyotoAddress =
    candidate.formattedAddress?.includes(
      "京都"
    ) ?? false;
  let distanceKm: number | null = null;

  if (
    target.latitude !== null &&
    target.longitude !== null
  ) {
    if (
      typeof candidateLatitude !== "number" ||
      typeof candidateLongitude !== "number"
    ) {
      return null;
    }

    distanceKm = calculateDistanceKm(
      target.latitude,
      target.longitude,
      candidateLatitude,
      candidateLongitude
    );

    if (distanceKm > MAX_CANDIDATE_DISTANCE_KM) {
      return null;
    }
  }

  if (
    !exactNameMatch &&
    !partialNameMatch &&
    !(
      distanceKm !== null &&
      distanceKm <=
        MAX_LOCATION_ONLY_DISTANCE_KM &&
      hasKyotoAddress
    )
  ) {
    return null;
  }

  let score = exactNameMatch
    ? 200
    : partialNameMatch
      ? 120
      : 20;

  if (distanceKm !== null) {
    score += Math.max(
      0,
      50 - distanceKm * 10
    );
  }

  if (hasKyotoAddress) {
    score += 20;
  }

  return score;
}

function selectBestCandidate(
  candidates: PlaceCandidate[],
  target: SearchTarget
): PlaceCandidate | null {
  let bestCandidate: PlaceCandidate | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    if (!candidate.photos?.[0]?.name) {
      continue;
    }

    const score = getCandidateScore(
      candidate,
      target
    );

    if (score !== null && score > bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  }

  return bestCandidate;
}

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

async function runWithTimeout<T>(
  operation: (
    signal: AbortSignal
  ) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, GOOGLE_API_TIMEOUT_MS);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (didTimeout) {
      throw new GoogleApiTimeoutError();
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  const rawQuery =
    request.nextUrl.searchParams.get("query");

  if (rawQuery === null) {
    return jsonError(
      "queryを指定してください。",
      400
    );
  }

  if (
    CONTROL_CHARACTER_PATTERN.test(
      rawQuery
    )
  ) {
    return jsonError(
      "queryに使用できない文字が含まれています。",
      400
    );
  }

  const query = rawQuery.trim();

  if (!query) {
    return jsonError(
      "queryを入力してください。",
      400
    );
  }

  if (
    Array.from(query).length >
    MAX_QUERY_LENGTH
  ) {
    return jsonError(
      `queryは${MAX_QUERY_LENGTH}文字以内で入力してください。`,
      400
    );
  }

  const spotId =
    request.nextUrl.searchParams.get("spotId");
  const databaseSpot = spotId
    ? SPOT_ID_PATTERN.test(spotId)
      ? getSpotById(spotId)
      : undefined
    : undefined;

  if (spotId && !databaseSpot) {
    return jsonError(
      "スポット情報が不正です。",
      400
    );
  }

  const rawLatitude =
    request.nextUrl.searchParams.get("latitude");
  const rawLongitude =
    request.nextUrl.searchParams.get("longitude");
  const suppliedLatitude =
    rawLatitude === null ? null : Number(rawLatitude);
  const suppliedLongitude =
    rawLongitude === null ? null : Number(rawLongitude);

  if (
    (rawLatitude !== null &&
      (!Number.isFinite(suppliedLatitude) ||
        suppliedLatitude! < -90 ||
        suppliedLatitude! > 90)) ||
    (rawLongitude !== null &&
      (!Number.isFinite(suppliedLongitude) ||
        suppliedLongitude! < -180 ||
        suppliedLongitude! > 180))
  ) {
    return jsonError(
      "位置情報が不正です。",
      400
    );
  }

  const target: SearchTarget = {
    name: databaseSpot?.name ?? query.replace(/\s+京都$/, ""),
    latitude:
      databaseSpot?.latitude ?? suppliedLatitude,
    longitude:
      databaseSpot?.longitude ?? suppliedLongitude,
  };

  const searchQuery = databaseSpot
    ? `${databaseSpot.name} ${databaseSpot.address}`
    : query;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return jsonError(
      "写真サービスを利用できません。",
      500
    );
  }

  try {
    const {
      response: searchResponse,
      data: searchData,
    } = await runWithTimeout(
      async (signal) => {
        const response = await fetch(
          PLACES_TEXT_SEARCH_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.location,places.photos",
            },
            body: JSON.stringify({
              textQuery: searchQuery,
              languageCode: "ja",
              regionCode: "JP",
              maxResultCount: 5,
            }),
            cache: "no-store",
            signal,
          }
        );

        const data =
          (await response.json()) as PlacesSearchResponse;

        return {
          response,
          data,
        };
      }
    );

    if (!searchResponse.ok) {
      return jsonError(
        "スポット検索に失敗しました。",
        502
      );
    }

    const matchedCandidate = selectBestCandidate(
      searchData.places ?? [],
      target
    );
    const resourceName =
      matchedCandidate?.photos?.[0]?.name;

    if (!resourceName) {
      return jsonError(
        `「${query}」の写真が見つかりませんでした。`,
        404
      );
    }

    if (
      !PHOTO_RESOURCE_NAME_PATTERN.test(
        resourceName
      )
    ) {
      return jsonError(
        "写真情報の形式が不正です。",
        502
      );
    }

    const photoUrl =
      `https://places.googleapis.com/v1/${resourceName}/media` +
      `?maxWidthPx=1200` +
      `&skipHttpRedirect=false`;

    const {
      response: photoResponse,
      contentType,
      data: photoData,
    } = await runWithTimeout(
      async (signal) => {
        const response = await fetch(
          photoUrl,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
            },
            cache: "no-store",
            redirect: "follow",
            signal,
          }
        );

        const responseContentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        const data = response.ok
          ? await response.arrayBuffer()
          : null;

        return {
          response,
          contentType:
            responseContentType,
          data,
        };
      }
    );

    if (!photoResponse.ok) {
      return jsonError(
        "写真の取得に失敗しました。",
        502
      );
    }

    if (
      !contentType
        .toLowerCase()
        .startsWith("image/") ||
      photoData === null
    ) {
      return jsonError(
        "写真の取得に失敗しました。",
        502
      );
    }

    return new NextResponse(photoData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    if (
      error instanceof
      GoogleApiTimeoutError
    ) {
      return jsonError(
        "写真サービスからの応答がタイムアウトしました。",
        504
      );
    }

    console.error("Place Photo API request failed.");

    return jsonError(
      "写真の取得中にエラーが発生しました。",
      502
    );
  }
}
