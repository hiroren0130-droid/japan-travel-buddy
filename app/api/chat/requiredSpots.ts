import type { Spot } from "@/data/types";
import { getSpotById } from "@/lib/spotService";

export function validateRequiredSpotIds(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueSpotIds = new Set<string>();

  value.forEach((spotId) => {
    if (typeof spotId !== "string") {
      return;
    }

    const normalizedSpotId = spotId.trim();

    if (
      normalizedSpotId &&
      getSpotById(normalizedSpotId)
    ) {
      uniqueSpotIds.add(normalizedSpotId);
    }
  });

  return [...uniqueSpotIds];
}

export function getRequiredSpotsByIds(
  spotIds: string[]
): Spot[] {
  return spotIds
    .map((spotId) => getSpotById(spotId))
    .filter((spot): spot is Spot => spot !== undefined);
}

export function mergeRequiredSpots(
  ...spotGroups: Spot[][]
): Spot[] {
  const spotsById = new Map<string, Spot>();

  spotGroups.flat().forEach((spot) => {
    if (!spotsById.has(spot.id)) {
      spotsById.set(spot.id, spot);
    }
  });

  return [...spotsById.values()];
}
