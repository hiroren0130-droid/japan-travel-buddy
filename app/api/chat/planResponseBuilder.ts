import {
  getSpotByName,
} from "@/lib/spotService";

import {
  calculateBroadAreaOverloadCount,
  calculateBusinessHoursViolationCount,
  calculateLongDistanceMoveCount,
  calculateRouteScore,
  calculateScheduleConflictCount,
} from "./routeEvaluator";

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

function buildEvaluation(
  plan: AITravelPlan
) {
  return {
    score:
      calculateRouteScore(
        plan
      ),

    longDistanceMoveCount:
      calculateLongDistanceMoveCount(
        plan
      ),

    broadAreaOverloadCount:
      calculateBroadAreaOverloadCount(
        plan
      ),

    businessHoursViolationCount:
      calculateBusinessHoursViolationCount(
        plan
      ),

    scheduleConflictCount:
      calculateScheduleConflictCount(
        plan
      ),
  };
}

export function buildPlanResponse(
  generatedPlan: AITravelPlan,
  conditions: {
    startLocation?: string;
    startTime?: string;
    endLocation?: string;
    endTime?: string;
  } = {}
) {
  const response = {
    ...generatedPlan,
    startLocation:
      conditions.startLocation,
    startTime:
      conditions.startTime,
    endLocation:
      conditions.endLocation,
    endTime:
      conditions.endTime,

    days:
      generatedPlan.days.map(
        (day, dayIndex) => {
          const usedSpotIds =
            new Set<string>();

          return {
            ...day,

            day:
              dayIndex + 1,

            items:
              day.items
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
                      time:
                        item.time,

                      spotId:
                        spot.id,

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

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    return {
      ...response,

      evaluation:
        buildEvaluation(
          generatedPlan
        ),
    };
  }

  return response;
}
