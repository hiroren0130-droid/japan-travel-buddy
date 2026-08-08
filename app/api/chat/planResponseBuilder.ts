import {
  getSpotByName,
} from "@/lib/spotService";

import type {
  AITravelPlan,
} from "./travelValidator";

type PlanItem = {
  time: string;
  spotId: string;
  description: string;
  transport: string;
  duration: string;
};

export function buildPlanResponse(
  generatedPlan: AITravelPlan
) {
  return {
    ...generatedPlan,

    days: generatedPlan.days.map(
      (day, dayIndex) => {
        const usedSpotIds =
          new Set<string>();

        return {
          ...day,

          day: dayIndex + 1,

          items: day.items
            .map(
              (
                item
              ): PlanItem | null => {
                const spot =
                  getSpotByName(
                    item.spot
                  );

                if (!spot) {
                  if (
                    process.env.NODE_ENV ===
                    "development"
                  ) {
                    console.warn(
                      `Spot not found: ${item.spot}`
                    );
                  }

                  return null;
                }

                if (
                  usedSpotIds.has(
                    spot.id
                  )
                ) {
                  if (
                    process.env.NODE_ENV ===
                    "development"
                  ) {
                    console.warn(
                      `Duplicate spot removed: ${spot.name}`
                    );
                  }

                  return null;
                }

                usedSpotIds.add(
                  spot.id
                );

                return {
                  time: item.time,
                  spotId: spot.id,
                  description:
                    item.description,
                  transport:
                    item.transport,
                  duration:
                    item.duration,
                };
              }
            )
            .filter(
              (
                item
              ): item is PlanItem =>
                item !== null
            ),
        };
      }
    ),
  };
}