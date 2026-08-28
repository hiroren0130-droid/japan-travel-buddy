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
  optimizeRegionClusters,
} from "./regionClusterOptimizer";

import {
  optimizeStartPoint,
} from "./startPointOptimizer";

import {
  optimizeTravelPlanTimes,
} from "./timeOptimizer";

import {
  filterLocationPlanItems,
} from "./locationPlanItemFilter";

import {
  DEFAULT_EFFECTIVE_START_TIME,
} from "./startTimePolicy";

import type {
  AITravelPlan,
} from "./travelValidator";
import type { Locale } from "@/lib/locale";

type OptimizeGeneratedPlanOptions = {
  plan: AITravelPlan;
  startSpotName: string | null;
  locale: Locale;
  startTime?: string;
  startLocation?: string;
  endLocation?: string;
  requiredSpotNames?: string[];
  normalizeDescriptions?: boolean;
};

function logSpotCount(
  label: string,
  plan: AITravelPlan
): void {
  if (
    process.env.NODE_ENV !==
    "development"
  ) {
    return;
  }

  console.log(
    `===== Spot Count: ${label} =====`,
    plan.days.map(
      (day) => day.items.length
    )
  );
}

export function optimizeGeneratedPlan({
  plan,
  startSpotName,
  locale,
  startTime,
  startLocation,
  endLocation,
  requiredSpotNames = [],
  normalizeDescriptions = true,
}: OptimizeGeneratedPlanOptions): AITravelPlan {
  logSpotCount(
    "Before Optimizers",
    plan
  );

  let optimizedPlan =
    filterLocationPlanItems({
      plan,
      startLocation,
      endLocation,
      requiredSpotNames,
      protectedStartSpotName:
        startSpotName,
    });

  logSpotCount(
    "After Location Plan Item Filter",
    optimizedPlan
  );

  optimizedPlan =
    optimizeStartPoint({
      plan: optimizedPlan,
      startSpotName,
      startTime:
        startTime ??
        DEFAULT_EFFECTIVE_START_TIME,
      locale,
    });

  logSpotCount(
    "After Start Point Optimizer",
    optimizedPlan
  );

  optimizedPlan =
    optimizeRegionClusters({
      plan: optimizedPlan,
      protectedStartSpotName:
        startSpotName,
    });

  logSpotCount(
    "After Region Cluster Optimizer",
    optimizedPlan
  );

  optimizedPlan =
    optimizeTravelPlanRoute(
      optimizedPlan,
      {
        startSpotName,
        startLocation,
        endLocation,
      }
    );

  logSpotCount(
    "After Route Optimizer",
    optimizedPlan
  );

  optimizedPlan =
    optimizeTravelPlanTimes(
      optimizedPlan,
      startTime,
      startLocation
    );

  logSpotCount(
    "After Time Optimizer",
    optimizedPlan
  );

  optimizedPlan =
  optimizeDayImbalance(
    optimizedPlan,
    startSpotName,
    startTime,
    startLocation
  );

  logSpotCount(
    "After Day Imbalance Optimizer",
    optimizedPlan
  );

  if (normalizeDescriptions) {
    optimizedPlan =
      normalizeTravelPlanDescriptions(
        optimizedPlan
      );

    logSpotCount(
      "After Description Normalizer",
      optimizedPlan
    );
  }

  return optimizedPlan;
}
