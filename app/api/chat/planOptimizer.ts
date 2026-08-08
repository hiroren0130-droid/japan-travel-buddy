import {
  normalizeTravelPlanDescriptions,
} from "./descriptionNormalizer";

import {
  optimizeDayImbalance,
} from "./dayImbalanceOptimizer";

import {
  optimizeTravelPlanRoute,
} from "./routeOptimizer";

import {
  optimizeStartPoint,
} from "./startPointOptimizer";

import {
  optimizeTravelPlanTimes,
} from "./timeOptimizer";

import type {
  AITravelPlan,
} from "./travelValidator";

type OptimizeGeneratedPlanOptions = {
  plan: AITravelPlan;
  startSpotName: string | null;
  startTime?: string;
  normalizeDescriptions?: boolean;
};

export function optimizeGeneratedPlan({
  plan,
  startSpotName,
  startTime = "09:00",
  normalizeDescriptions = true,
}: OptimizeGeneratedPlanOptions): AITravelPlan {
  let optimizedPlan =
    optimizeStartPoint({
      plan,
      startSpotName,
      startTime,
    });

  optimizedPlan =
    optimizeTravelPlanRoute(
      optimizedPlan
    );

  optimizedPlan =
    optimizeTravelPlanTimes(
      optimizedPlan
    );

  optimizedPlan =
    optimizeDayImbalance(
      optimizedPlan
    );

  if (normalizeDescriptions) {
    optimizedPlan =
      normalizeTravelPlanDescriptions(
        optimizedPlan
      );
  }

  return optimizedPlan;
}