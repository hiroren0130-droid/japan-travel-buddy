import {
  calculateBusinessHoursViolationCount,
  calculateLateEndCount,
  calculateLongDistanceMoveCount,
  calculateRouteScore,
  calculateScheduleConflictCount,
} from "./routeEvaluator";

import {
  optimizeDayImbalance,
} from "./dayImbalanceOptimizer";

import {
  optimizeTravelPlanRoute,
} from "./routeOptimizer";

import {
  optimizeTravelPlanTimes,
} from "./timeOptimizer";

import type {
  AITravelPlan,
} from "./travelValidator";

const TARGET_ROUTE_SCORE = 90;

type PlanQuality = {
  businessHoursViolationCount: number;
  scheduleConflictCount: number;
  lateEndCount: number;
  longDistanceMoveCount: number;
  score: number;
};

type PruneOptionalSpotsParams = {
  plan: AITravelPlan;
  requiredSpotNames: string[];
  protectedStartSpotName?: string | null;
};

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function containsRequiredSpotNames(
  plan: AITravelPlan,
  requiredSpotNameSet: Set<string>
): boolean {
  const planSpotNames = new Set(
    plan.days.flatMap((day) =>
      day.items.map((item) =>
        normalizeSpotName(item.spot)
      )
    )
  );

  return Array.from(
    requiredSpotNameSet
  ).every((requiredSpotName) =>
    planSpotNames.has(requiredSpotName)
  );
}

function evaluatePlan(
  plan: AITravelPlan
): PlanQuality {
  return {
    businessHoursViolationCount:
      calculateBusinessHoursViolationCount(
        plan
      ),

    scheduleConflictCount:
      calculateScheduleConflictCount(
        plan
      ),

    lateEndCount:
      calculateLateEndCount(
        plan
      ),

    longDistanceMoveCount:
      calculateLongDistanceMoveCount(
        plan
      ),

    score:
      calculateRouteScore(
        plan
      ),
  };
}

function hasCriticalIssue(
  quality: PlanQuality
): boolean {
  return (
    quality.businessHoursViolationCount >
      0 ||
    quality.scheduleConflictCount >
      0 ||
    quality.lateEndCount >
      0 ||
    quality.longDistanceMoveCount >
      0
  );
}

function shouldTryPruning(
  quality: PlanQuality
): boolean {
  return (
    hasCriticalIssue(
      quality
    ) ||
    quality.score <
      TARGET_ROUTE_SCORE
  );
}

function isBetterQuality(
  candidate: PlanQuality,
  current: PlanQuality
): boolean {
  if (
    candidate
      .businessHoursViolationCount !==
    current
      .businessHoursViolationCount
  ) {
    return (
      candidate
        .businessHoursViolationCount <
      current
        .businessHoursViolationCount
    );
  }

  if (
    candidate
      .scheduleConflictCount !==
    current
      .scheduleConflictCount
  ) {
    return (
      candidate
        .scheduleConflictCount <
      current
        .scheduleConflictCount
    );
  }

  if (
    candidate.lateEndCount !==
    current.lateEndCount
  ) {
    return (
      candidate.lateEndCount <
      current.lateEndCount
    );
  }

  if (
    candidate.longDistanceMoveCount !==
    current.longDistanceMoveCount
  ) {
    return (
      candidate.longDistanceMoveCount <
      current.longDistanceMoveCount
    );
  }

  return (
    candidate.score >
    current.score
  );
}

function removeSpotFromPlan({
  plan,
  dayIndex,
  itemIndex,
}: {
  plan: AITravelPlan;
  dayIndex: number;
  itemIndex: number;
}): AITravelPlan {
  return {
    ...plan,

    days:
      plan.days.map(
        (
          day,
          currentDayIndex
        ) => {
          if (
            currentDayIndex !==
            dayIndex
          ) {
            return day;
          }

          return {
            ...day,

            items:
              day.items.filter(
                (
                  _item,
                  currentItemIndex
                ) =>
                  currentItemIndex !==
                  itemIndex
              ),
          };
        }
      ),
  };
}

function optimizeAfterRemoval(
  plan: AITravelPlan,
  protectedStartSpotName: string | null
): AITravelPlan {
  const routeOptimizedPlan =
    optimizeTravelPlanRoute(
      plan
    );

  const timeOptimizedPlan =
    optimizeTravelPlanTimes(
      routeOptimizedPlan
    );

  return optimizeDayImbalance(
    timeOptimizedPlan,
    protectedStartSpotName
  );
}

export function pruneOptionalSpots({
  plan,
  requiredSpotNames,
  protectedStartSpotName = null,
}: PruneOptionalSpotsParams): AITravelPlan {
  const requiredSpotNameSet =
    new Set(
      requiredSpotNames
        .map(
          (spotName) =>
            normalizeSpotName(
              spotName
            )
        )
        .filter(Boolean)
    );

  let currentPlan =
    plan;

  let currentQuality =
    evaluatePlan(
      currentPlan
    );

  if (
    !shouldTryPruning(
      currentQuality
    )
  ) {
    return currentPlan;
  }

  const maximumRemovals = 3;

  for (
    let removalCount = 0;
    removalCount <
    maximumRemovals;
    removalCount += 1
  ) {
    let bestCandidatePlan:
      AITravelPlan | null = null;

    let bestCandidateQuality:
      PlanQuality | null = null;

    for (
      let dayIndex = 0;
      dayIndex <
      currentPlan.days.length;
      dayIndex += 1
    ) {
      const day =
        currentPlan.days[
          dayIndex
        ];

      if (
        day.items.length <= 1
      ) {
        continue;
      }

      for (
        let itemIndex = 0;
        itemIndex <
        day.items.length;
        itemIndex += 1
      ) {
        const item =
          day.items[
            itemIndex
          ];

        const normalizedItemSpotName =
          normalizeSpotName(
            item.spot
          );

        if (
          requiredSpotNameSet.has(
            normalizedItemSpotName
          )
        ) {
          continue;
        }

        const candidatePlan =
          optimizeAfterRemoval(
            removeSpotFromPlan({
              plan:
                currentPlan,
              dayIndex,
              itemIndex,
            }),
            protectedStartSpotName
          );

        if (
          !containsRequiredSpotNames(
            candidatePlan,
            requiredSpotNameSet
          )
        ) {
          continue;
        }

        const candidateQuality =
          evaluatePlan(
            candidatePlan
          );

        

        if (
          !isBetterQuality(
            candidateQuality,
            currentQuality
          )
        ) {
          continue;
        }

        if (
          !bestCandidateQuality ||
          isBetterQuality(
            candidateQuality,
            bestCandidateQuality
          )
        ) {
          bestCandidatePlan =
            candidatePlan;

          bestCandidateQuality =
            candidateQuality;
        }
      }
    }

    if (
      !bestCandidatePlan ||
      !bestCandidateQuality
    ) {
      break;
    }

    currentPlan =
      bestCandidatePlan;

    currentQuality =
      bestCandidateQuality;

    if (
      !shouldTryPruning(
        currentQuality
      )
    ) {
      break;
    }
  }

  return currentPlan;
}
