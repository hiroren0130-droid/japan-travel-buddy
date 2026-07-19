import { spots, Spot } from "@/data/spots";

export function getAllSpots(): Spot[] {
  return spots;
}

export function getSpotById(id: string): Spot | undefined {
  return spots.find((spot) => spot.id === id);
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
    .trim();

  return spots.find((spot) => {
    const spotName = spot.name.replace(/\s+/g, "").trim();

    return (
      normalized === spotName ||
      normalized.includes(spotName) ||
      spotName.includes(normalized)
    );
  });
}

export function getSpotsByArea(area: string): Spot[] {
  return spots.filter((spot) => spot.area === area);
}

export function getSpotsByCategory(category: string): Spot[] {
  return spots.filter((spot) => spot.category === category);
}