import { getSpotByName } from "@/lib/spotService";

import type {
  AIPlanDay,
  AITravelPlan,
} from "./travelValidator";

const FULL_DAY_MINIMUM_END_MINUTES =
  15 * 60;
const DEFAULT_STAY_MINUTES = 60;

const LIMITED_SCHEDULE_PATTERNS = [
  /半日/iu,
  /午前(?:中)?のみ/iu,
  /午後のみ/iu,
  /昼まで/iu,
  /half[\s-]?day/iu,
  /morning only/iu,
  /afternoon only/iu,
  /until noon/iu,
];

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
  return LIMITED_SCHEDULE_PATTERNS.some(
    (pattern) => pattern.test(requestText)
  );
}
