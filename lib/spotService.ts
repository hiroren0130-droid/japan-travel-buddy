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

export function getSpotById(
  id: string
): Spot | undefined {
  return allSpots.find(
    (spot) => spot.id === id
  );
}

export function getSpotByName(
  name: string
): Spot | undefined {
  if (!name.trim()) {
    return undefined;
  }

  const normalizedName = normalize(name);

  /*
   * 最初に正式名称の完全一致を探します。
   *
   * 「嵐山」を検索したときに、
   * 「嵐山モンキーパーク」などが先に
   * 選ばれることを防ぎます。
   */
  const exactMatch = allSpots.find(
    (spot) =>
      normalize(spot.name) ===
      normalizedName
  );

  if (exactMatch) {
    return exactMatch;
  }

  /*
   * 完全一致がない場合だけ、
   * 表記揺れに対応する部分一致を使います。
   */
  return allSpots.find((spot) => {
    const normalizedSpotName =
      normalize(spot.name);

    return (
      normalizedName.includes(
        normalizedSpotName
      ) ||
      normalizedSpotName.includes(
        normalizedName
      )
    );
  });
}

export function getNearbySpotsByName(
  name: string
): Spot[] {
  const spot = getSpotByName(name);

  if (!spot || !spot.nearby?.length) {
    return [];
  }

  return spot.nearby
    .map((nearbyName) =>
      getSpotByName(nearbyName)
    )
    .filter(
      (nearbySpot): nearbySpot is Spot =>
        nearbySpot !== undefined
    );
}

export function getSpotsByArea(
  area: string
): Spot[] {
  const normalizedArea = area.trim();

  return allSpots.filter(
    (spot) =>
      spot.area.trim() === normalizedArea
  );
}

export function getSpotsByCategory(
  category: string
): Spot[] {
  const normalizedCategory =
    category.trim();

  return allSpots.filter(
    (spot) =>
      spot.category.trim() ===
      normalizedCategory
  );
}