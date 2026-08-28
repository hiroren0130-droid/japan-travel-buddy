import {
  getLimitedScheduleIntent,
} from "./planCompleteness";

import type {
  AITravelPlan,
} from "./travelValidator";

export const DEFAULT_EFFECTIVE_START_TIME =
  "09:00";

export const DEFAULT_EFFECTIVE_START_MINUTES =
  9 * 60;

const TIME_PATTERN =
  /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function getFirstPlanTime(
  plan: AITravelPlan
): string | null {
  const firstTime =
    plan.days[0]?.items[0]?.time;

  if (
    !firstTime ||
    !TIME_PATTERN.test(firstTime)
  ) {
    return null;
  }

  return firstTime;
}

export function resolveEffectiveStartTime({
  plan,
  requestText,
  startTime,
}: {
  plan: AITravelPlan;
  requestText: string;
  startTime?: string;
}): string {
  if (startTime) {
    return startTime;
  }

  const limitedScheduleIntent =
    getLimitedScheduleIntent(
      requestText
    );

  if (
    limitedScheduleIntent ===
      "afternoon" ||
    limitedScheduleIntent ===
      "evening" ||
    limitedScheduleIntent ===
      "generic"
  ) {
    return (
      getFirstPlanTime(plan) ??
      DEFAULT_EFFECTIVE_START_TIME
    );
  }

  return DEFAULT_EFFECTIVE_START_TIME;
}
