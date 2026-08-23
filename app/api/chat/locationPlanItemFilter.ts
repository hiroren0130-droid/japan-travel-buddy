import { getSpotByName } from "@/lib/spotService";

import { resolveLocationSpot } from "./locationTravelEstimator";

import type { AITravelPlan } from "./travelValidator";

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export function filterLocationPlanItems({
  plan,
  startLocation,
  endLocation,
  requiredSpotNames,
  protectedStartSpotName,
}: {
  plan: AITravelPlan;
  startLocation?: string;
  endLocation?: string;
  requiredSpotNames: string[];
  protectedStartSpotName: string | null;
}): AITravelPlan {
  const locationSpotIds = new Set(
    [
      resolveLocationSpot(startLocation),
      resolveLocationSpot(endLocation),
    ]
      .flatMap((spot) =>
        spot ? [spot.id] : []
      )
  );

  if (locationSpotIds.size === 0) {
    return plan;
  }

  const protectedSpotNames = new Set(
    [
      ...requiredSpotNames,
      protectedStartSpotName ?? "",
    ]
      .map(normalizeSpotName)
      .filter(Boolean)
  );

  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      items: day.items.filter((item) => {
        if (
          protectedSpotNames.has(
            normalizeSpotName(item.spot)
          )
        ) {
          return true;
        }

        const spot = getSpotByName(item.spot);

        return (
          !spot ||
          !locationSpotIds.has(spot.id)
        );
      }),
    })),
  };
}
