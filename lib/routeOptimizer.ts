import { Spot } from "@/data";

export function sortByNearest(
  spots: Spot[],
  startLat: number,
  startLng: number
) {
  const remaining = [...spots];
  const result: Spot[] = [];

  let currentLat = startLat;
  let currentLng = startLng;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Number.MAX_VALUE;

    remaining.forEach((spot, index) => {
      const distance = Math.sqrt(
        Math.pow(spot.latitude - currentLat, 2) +
          Math.pow(spot.longitude - currentLng, 2)
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = remaining.splice(nearestIndex, 1)[0];

    result.push(nearest);

    currentLat = nearest.latitude;
    currentLng = nearest.longitude;
  }

  return result;
}