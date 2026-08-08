import type { Spot } from "@/data/types";

import { calculateDistance } from "@/lib/distance";
import {
  getNearbySpotsByName,
} from "@/lib/spotService";

export type CurrentLocation = {
  latitude: number;
  longitude: number;
} | null;

type BuildCandidateSpotsParams = {
  requestText: string;
  spots: Spot[];
  currentLocation: CurrentLocation;
  limit?: number;
};

export type CandidateSpotResult = {
  mentionedSpots: Spot[];
  nearbySpots: Spot[];
  candidateSpots: Spot[];
};

const DEFAULT_CANDIDATE_LIMIT = 12;
const MAX_GENERAL_SPOTS = 30;

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/（.*?）/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/【.*?】/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(
      /[・、。,.，．!！?？「」『』"'’“”\s]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function isValidCoordinate(
  value: number
): boolean {
  return Number.isFinite(value);
}

function isValidCurrentLocation(
  currentLocation: CurrentLocation
): currentLocation is NonNullable<CurrentLocation> {
  if (!currentLocation) {
    return false;
  }

  return (
    isValidCoordinate(
      currentLocation.latitude
    ) &&
    isValidCoordinate(
      currentLocation.longitude
    ) &&
    currentLocation.latitude >= -90 &&
    currentLocation.latitude <= 90 &&
    currentLocation.longitude >= -180 &&
    currentLocation.longitude <= 180
  );
}

function normalizeLimit(
  limit: number | undefined
): number {
  if (
    typeof limit !== "number" ||
    !Number.isFinite(limit)
  ) {
    return DEFAULT_CANDIDATE_LIMIT;
  }

  return Math.max(
    Math.floor(limit),
    1
  );
}

function getSpotSearchScore(
  spot: Spot,
  normalizedRequestText: string
): number {
  if (!normalizedRequestText) {
    return 0;
  }

  const normalizedName =
    normalizeText(spot.name);

  const normalizedArea =
    normalizeText(spot.area);

  const normalizedCategory =
    normalizeText(spot.category);

  let score = 0;

  if (
    normalizedName &&
    normalizedRequestText.includes(
      normalizedName
    )
  ) {
    score += 100;
  }

  if (
    normalizedArea &&
    normalizedRequestText.includes(
      normalizedArea
    )
  ) {
    score += 30;
  }

  if (
    normalizedCategory &&
    normalizedRequestText.includes(
      normalizedCategory
    )
  ) {
    score += 20;
  }

  return score;
}

function sortByRequestRelevance(
  spots: Spot[],
  requestText: string
): Spot[] {
  const normalizedRequestText =
    normalizeText(requestText);

  if (!normalizedRequestText) {
    return [...spots];
  }

  return spots
    .map((spot, index) => ({
      spot,
      index,
      score: getSpotSearchScore(
        spot,
        normalizedRequestText
      ),
    }))
    .sort((first, second) => {
      if (
        first.score !== second.score
      ) {
        return (
          second.score -
          first.score
        );
      }

      return first.index - second.index;
    })
    .map(({ spot }) => spot);
}

export function findMentionedSpots(
  text: string,
  spots: Spot[]
): Spot[] {
  const normalizedText =
    normalizeText(text);

  if (!normalizedText) {
    return [];
  }

  return removeDuplicateSpots(
    spots
      .filter((spot) => {
        const normalizedSpotName =
          normalizeText(spot.name);

        return (
          normalizedSpotName.length > 0 &&
          normalizedText.includes(
            normalizedSpotName
          )
        );
      })
      .sort((first, second) => {
        const firstLength =
          normalizeText(
            first.name
          ).length;

        const secondLength =
          normalizeText(
            second.name
          ).length;

        return (
          secondLength -
          firstLength
        );
      })
  );
}

export function removeDuplicateSpots(
  spots: Spot[]
): Spot[] {
  const usedIds = new Set<string>();

  return spots.filter((spot) => {
    if (usedIds.has(spot.id)) {
      return false;
    }

    usedIds.add(spot.id);

    return true;
  });
}

function getGeneralSpots({
  requestText,
  spots,
  currentLocation,
}: {
  requestText: string;
  spots: Spot[];
  currentLocation: CurrentLocation;
}): Spot[] {
  const relevantSpots =
    sortByRequestRelevance(
      spots,
      requestText
    );

  if (
    !isValidCurrentLocation(
      currentLocation
    )
  ) {
    return relevantSpots.slice(
      0,
      MAX_GENERAL_SPOTS
    );
  }

  const normalizedRequestText =
    normalizeText(
      requestText
    );

  const nearestSpots =
    relevantSpots
      .filter(
        (spot) =>
          isValidCoordinate(
            spot.latitude
          ) &&
          isValidCoordinate(
            spot.longitude
          )
      )
      .map((spot) => ({
        ...spot,

        distance:
          calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            spot.latitude,
            spot.longitude
          ),

        relevanceScore:
          getSpotSearchScore(
            spot,
            normalizedRequestText
          ),
      }))
      .filter(
        (spot) =>
          Number.isFinite(
            spot.distance
          )
      )
      .sort(
        (first, second) => {
          if (
            first.relevanceScore !==
            second.relevanceScore
          ) {
            return (
              second.relevanceScore -
              first.relevanceScore
            );
          }

          return (
            first.distance -
            second.distance
          );
        }
      )
      .slice(
        0,
        MAX_GENERAL_SPOTS
      );

  return nearestSpots;
}

function prioritizeNearbySpots(
  nearbySpots: Spot[],
  mentionedSpots: Spot[]
): Spot[] {
  const mentionedAreaSet =
    new Set(
      mentionedSpots.map(
        (spot) => spot.area
      )
    );

  return [...nearbySpots].sort(
    (first, second) => {
      const firstAreaMatch =
        mentionedAreaSet.has(
          first.area
        )
          ? 1
          : 0;

      const secondAreaMatch =
        mentionedAreaSet.has(
          second.area
        )
          ? 1
          : 0;

      return (
        secondAreaMatch -
        firstAreaMatch
      );
    }
  );
}

export function buildCandidateSpots({
  requestText,
  spots,
  currentLocation,
  limit,
}: BuildCandidateSpotsParams): CandidateSpotResult {
  const candidateLimit =
    normalizeLimit(limit);

  const mentionedSpots =
    findMentionedSpots(
      requestText,
      spots
    );

  const nearbySpots =
    prioritizeNearbySpots(
      removeDuplicateSpots(
        mentionedSpots.flatMap(
          (spot) =>
            getNearbySpotsByName(
              spot.name
            )
        )
      ).filter(
        (spot) =>
          !mentionedSpots.some(
            (mentionedSpot) =>
              mentionedSpot.id ===
              spot.id
          )
      ),
      mentionedSpots
    );

  const generalSpots =
    getGeneralSpots({
      requestText,
      spots,
      currentLocation,
    });

  const effectiveLimit =
    Math.max(
      candidateLimit,
      mentionedSpots.length
    );

  const candidateSpots =
    removeDuplicateSpots([
      ...mentionedSpots,
      ...nearbySpots,
      ...generalSpots,
    ]).slice(
      0,
      effectiveLimit
    );

  return {
    mentionedSpots,
    nearbySpots,
    candidateSpots,
  };
}

export function createSpotList(
  spots: Spot[]
): string {
  return JSON.stringify(
    spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      area: spot.area,
      category: spot.category,

      latitude: spot.latitude,
      longitude: spot.longitude,

      recommendedStay:
        spot.recommendedStay ??
        "60分",

      bestVisitTime:
        spot.bestVisitTime ??
        "指定なし",

      openingHours:
        spot.openingHours ??
        spot.hours ??
        "指定なし",

      closedDays:
        spot.closedDays ?? [],

      recommendedTransport:
        spot.recommendedTransport ?? [],

      mealRecommended:
        spot.mealRecommended ??
        false,

      nearby:
        spot.nearby ?? [],
    })),
    null,
    2
  );
}