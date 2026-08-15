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
import type { Locale } from "@/lib/locale";

type OptimizeGeneratedPlanOptions = {
  plan: AITravelPlan;
  startSpotName: string | null;
  locale: Locale;
  startTime?: string;
  normalizeDescriptions?: boolean;
};

export function optimizeGeneratedPlan({
  plan,
  startSpotName,
  locale,
  startTime = "09:00",
  normalizeDescriptions = true,
}: OptimizeGeneratedPlanOptions): AITravelPlan {
  let optimizedPlan =
    optimizeStartPoint({
      plan,
      startSpotName,
      startTime,
      locale,
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
    optimizedPlan,
    startSpotName
  );

  if (normalizeDescriptions) {
    optimizedPlan =
      normalizeTravelPlanDescriptions(
        optimizedPlan
      );
  }

  return optimizedPlan;
}
