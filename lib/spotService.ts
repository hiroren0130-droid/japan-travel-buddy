import type { Spot } from "@/data/types";
import { allSpots } from "@/data";

export function getAllSpots(): Spot[] {
  return allSpots;
}

export function getSpotById(id: string): Spot | undefined {
  return allSpots.find((spot) => spot.id === id);
}

export function getSpotByName(name: string): Spot | undefined {
  if (!name) return undefined;

  // AIが返す余分な文字を除去
  const normalized = name
    .replace(/（.*?）/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/【.*?】/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

  return allSpots.find((spot) => {
    const spotName = spot.name
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

    return (
      normalized === spotName ||
      normalized.includes(spotName) ||
      spotName.includes(normalized)
    );
  });
}

export function getSpotsByArea(area: string): Spot[] {
  return allSpots.filter((spot) => spot.area === area);
}

export function getSpotsByCategory(category: string): Spot[] {
  return allSpots.filter((spot) => spot.category === category);
}

