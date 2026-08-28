import { getSpotByName } from "@/lib/spotService";

import {
  estimateLocationTravel,
} from "./locationTravelEstimator";

import type {
  AIPlanDay,
  AITravelPlan,
} from "./travelValidator";

const FULL_DAY_MINIMUM_END_MINUTES =
  15 * 60;
const DEFAULT_STAY_MINUTES = 60;

const MORNING_SCHEDULE_PATTERNS = [
  /午前(?:中)?のみ/iu,
  /昼まで/iu,
  /morning only/iu,
  /until noon/iu,
];

const AFTERNOON_SCHEDULE_PATTERNS = [
  /午後のみ/iu,
  /午後(?:から|開始|スタート)/iu,
  /afternoon only/iu,
  /(?:from|starting in the) afternoon/iu,
];

const EVENING_SCHEDULE_PATTERNS = [
  /夕方(?:から|以降|中心|のみ)/iu,
  /夜(?:から|中心|のみ)/iu,
  /evening(?: only| focused)?/iu,
  /night(?: only| focused)?/iu,
];

const GENERIC_LIMITED_SCHEDULE_PATTERNS = [
  /半日/iu,
  /half[\s-]?day/iu,
];

export type LimitedScheduleIntent =
  | "none"
  | "morning"
  | "afternoon"
  | "evening"
  | "generic";

function matchesAnyPattern(
  requestText: string,
  patterns: RegExp[]
): boolean {
  return patterns.some(
    (pattern) => pattern.test(requestText)
  );
}

export function getLimitedScheduleIntent(
  requestText: string
): LimitedScheduleIntent {
  if (
    matchesAnyPattern(
      requestText,
      AFTERNOON_SCHEDULE_PATTERNS
    )
  ) {
    return "afternoon";
  }

  if (
    matchesAnyPattern(
      requestText,
      EVENING_SCHEDULE_PATTERNS
    )
  ) {
    return "evening";
  }

  if (
    matchesAnyPattern(
      requestText,
      MORNING_SCHEDULE_PATTERNS
    )
  ) {
    return "morning";
  }

  if (
    matchesAnyPattern(
      requestText,
      GENERIC_LIMITED_SCHEDULE_PATTERNS
    )
  ) {
    return "generic";
  }

  return "none";
}

function parseMinutes(
  value: string | undefined
): number {
  const match = value?.match(/\d+/);

  if (!match) {
    return 0;
  }

  const minutes = Number(match[0]);

  return Number.isFinite(minutes)
    ? minutes
    : 0;
}

function timeToMinutes(
  value: string
): number | null {
  const match = value.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getEstimatedDayEndMinutes(
  day: AIPlanDay
): number | null {
  const lastItem = day.items.at(-1);

  if (!lastItem) {
    return null;
  }

  const arrivalMinutes =
    timeToMinutes(lastItem.time);

  if (arrivalMinutes === null) {
    return null;
  }

  const recommendedStayMinutes =
    parseMinutes(
      getSpotByName(lastItem.spot)
        ?.recommendedStay
    ) || DEFAULT_STAY_MINUTES;

  return (
    arrivalMinutes +
    recommendedStayMinutes
  );
}

export function getEstimatedArrivalAtEndLocationMinutes(
  day: AIPlanDay,
  endLocation?: string
): number | null {
  const estimatedDayEndMinutes =
    getEstimatedDayEndMinutes(day);

  if (estimatedDayEndMinutes === null) {
    return null;
  }

  const lastItem = day.items.at(-1);

  if (!lastItem) {
    return estimatedDayEndMinutes;
  }

  const endTravelMinutes =
    estimateLocationTravel({
      location: endLocation,
      spotName: lastItem.spot,
    })?.durationMinutes ?? 0;

  return (
    estimatedDayEndMinutes +
    endTravelMinutes
  );
}

export function calculateEndTimeViolationCount(
  plan: AITravelPlan,
  endTime?: string,
  endLocation?: string
): number {
  if (!endTime) {
    return 0;
  }

  const match = endTime.match(
    /^([01]\d|2[0-3]):([0-5]\d)$/
  );

  if (!match) {
    return 0;
  }

  const endTimeMinutes =
    Number(match[1]) * 60 +
    Number(match[2]);

  return plan.days.filter(
    (day, dayIndex) => {
      const isFinalDay =
        dayIndex ===
        plan.days.length - 1;
      const estimatedEndMinutes =
        isFinalDay
          ? getEstimatedArrivalAtEndLocationMinutes(
              day,
              endLocation
            )
          : getEstimatedDayEndMinutes(
              day
            );

      return (
        estimatedEndMinutes !== null &&
        estimatedEndMinutes >
          endTimeMinutes
      );
    }
  ).length;
}

export function calculateEarlyEndCount(
  plan: AITravelPlan
): number {
  return plan.days.filter((day) => {
    const estimatedEndMinutes =
      getEstimatedDayEndMinutes(day);

    return (
      estimatedEndMinutes !== null &&
      estimatedEndMinutes <
        FULL_DAY_MINIMUM_END_MINUTES
    );
  }).length;
}

export function hasLimitedScheduleRequest(
  requestText: string
): boolean {
  return (
    getLimitedScheduleIntent(
      requestText
    ) !== "none"
  );
}
