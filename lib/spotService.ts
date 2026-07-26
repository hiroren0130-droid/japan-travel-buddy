import type { Spot } from "@/data/types";
import { allSpots } from "@/data";

const normalize = (value: string): string =>
  value
    .replace(/（.*?）/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/【.*?】/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

export function getAllSpots(): Spot[] {
  return allSpots;
}

export function getSpotById(id: string): Spot | undefined {
  return allSpots.find((spot) => spot.id === id);
}

export function getSpotByName(name: string): Spot | undefined {
  if (!name.trim()) {
    return undefined;
  }

  const normalized = normalize(name);

  return allSpots.find((spot) => {
    const spotName = normalize(spot.name);

    return (
      normalized === spotName ||
      normalized.includes(spotName) ||
      spotName.includes(normalized)
    );
  });
}

export function getSpotsByArea(area: string): Spot[] {
  const normalizedArea = area.trim();

  return allSpots.filter(
    (spot) => spot.area.trim() === normalizedArea
  );
}

export function getSpotsByCategory(category: string): Spot[] {
  const normalizedCategory = category.trim();

  return allSpots.filter(
    (spot) => spot.category.trim() === normalizedCategory
  );
}