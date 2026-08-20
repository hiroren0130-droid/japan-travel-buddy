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
  startTime = "09:00",
  normalizeDescriptions = true,
}: OptimizeGeneratedPlanOptions): AITravelPlan {
  logSpotCount(
    "Before Optimizers",
    plan
  );

  let optimizedPlan =
    optimizeStartPoint({
      plan,
      startSpotName,
      startTime,
      locale,
    });

  logSpotCount(
    "After Start Point Optimizer",
    optimizedPlan
  );

  optimizedPlan =
    optimizeTravelPlanRoute(
      optimizedPlan
    );

  logSpotCount(
    "After Route Optimizer",
    optimizedPlan
  );

  optimizedPlan =
    optimizeTravelPlanTimes(
      optimizedPlan
    );

  logSpotCount(
    "After Time Optimizer",
    optimizedPlan
  );

  optimizedPlan =
  optimizeDayImbalance(
    optimizedPlan,
    startSpotName
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
