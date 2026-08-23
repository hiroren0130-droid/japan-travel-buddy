import { getSpotByName } from "@/lib/spotService";

import {
  estimateLocationTravel,
} from "./locationTravelEstimator";

import type {
  AIPlanDay,
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

const DEFAULT_START_MINUTES = 9 * 60;

const LUNCH_START_MINUTES = 12 * 60;
const LUNCH_END_MINUTES = 13 * 60 + 30;
const LUNCH_BREAK_MINUTES = 60;

const DEFAULT_STAY_MINUTES = 60;

type BusinessHours = {
  open: number;
  close: number;
};

function parseDurationMinutes(
  value: string | undefined
): number {
  if (!value) {
    return 0;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return 0;
  }

  const hourMatch =
    normalizedValue.match(
      /(\d+(?:\.\d+)?)\s*時間/
    );

  const minuteMatch =
    normalizedValue.match(
      /(\d+)\s*分/
    );

  const hours = hourMatch
    ? Number(hourMatch[1])
    : 0;

  const minutes = minuteMatch
    ? Number(minuteMatch[1])
    : 0;

  if (hourMatch || minuteMatch) {
    const totalMinutes =
      hours * 60 + minutes;

    if (!Number.isFinite(totalMinutes)) {
      return 0;
    }

    return Math.max(
      Math.round(totalMinutes),
      0
    );
  }

  const numberMatch =
    normalizedValue.match(/\d+/);

  if (!numberMatch) {
    return 0;
  }

  const parsedNumber =
    Number(numberMatch[0]);

  if (!Number.isFinite(parsedNumber)) {
    return 0;
  }

  return Math.max(
    Math.round(parsedNumber),
    0
  );
}

function timeToMinutes(
  value: string
): number | null {
  const match = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function minutesToTime(
  totalMinutes: number
): string {
  const normalizedMinutes = Math.max(
    Math.round(totalMinutes),
    0
  );

  const hour =
    Math.floor(
      normalizedMinutes / 60
    ) % 24;

  const minute =
    normalizedMinutes % 60;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

function parseBusinessHours(
  value: string | undefined
): BusinessHours | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .trim()
    .replaceAll("～", "〜")
    .replaceAll("~", "〜")
    .replaceAll("−", "-")
    .replaceAll("—", "-");

  if (
    normalizedValue.includes("24時間")
  ) {
    return {
      open: 0,
      close: 24 * 60,
    };
  }

  const match =
    normalizedValue.match(
      /(\d{1,2}):(\d{2})\s*[〜-]\s*(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return null;
  }

  const openHour = Number(match[1]);
  const openMinute = Number(match[2]);
  const closeHour = Number(match[3]);
  const closeMinute = Number(match[4]);

  if (
    openHour < 0 ||
    openHour > 23 ||
    openMinute < 0 ||
    openMinute > 59 ||
    closeHour < 0 ||
    closeHour > 24 ||
    closeMinute < 0 ||
    closeMinute > 59
  ) {
    return null;
  }

  const open =
    openHour * 60 + openMinute;

  const close =
    closeHour * 60 + closeMinute;

  if (close <= open) {
    return null;
  }

  return {
    open,
    close,
  };
}

function getRecommendedStayMinutes(
  spotName: string
): number {
  const spot =
    getSpotByName(spotName);

  const parsedStay =
    parseDurationMinutes(
      spot?.recommendedStay
    );

  if (parsedStay > 0) {
    return parsedStay;
  }

  return DEFAULT_STAY_MINUTES;
}

function getBusinessHours(
  spotName: string
): BusinessHours | null {
  const spot =
    getSpotByName(spotName);

  return parseBusinessHours(
    spot?.hours
  );
}

function isDeparturePoint(
  item: AIPlanItem,
  index: number
): boolean {
  if (index !== 0) {
    return false;
  }

  const spot =
    getSpotByName(item.spot);

  const description =
    item.description
      .trim()
      .toLowerCase();

  return (
    spot?.category === "駅" ||
    description.includes("出発地点") ||
    description.includes("集合") ||
    description.includes("出発") ||
    description.includes("start")
  );
}

function shouldInsertLunchBreak({
  previousEnd,
  nextArrivalWithoutLunch,
  nextStay,
  lunchInserted,
}: {
  previousEnd: number;
  nextArrivalWithoutLunch: number;
  nextStay: number;
  lunchInserted: boolean;
}): boolean {
  if (lunchInserted) {
    return false;
  }

  if (
    previousEnd >
    LUNCH_END_MINUTES
  ) {
    return false;
  }

  const nextSpotEnd =
    nextArrivalWithoutLunch +
    nextStay;

  return (
    nextArrivalWithoutLunch >=
      LUNCH_START_MINUTES ||
    nextSpotEnd >
      LUNCH_START_MINUTES
  );
}

function calculateNextArrival({
  previousEnd,
  travelMinutes,
  nextStay,
  lunchInserted,
}: {
  previousEnd: number;
  travelMinutes: number;
  nextStay: number;
  lunchInserted: boolean;
}): {
  arrival: number;
  insertedLunch: boolean;
} {
  const arrivalWithoutLunch =
    previousEnd + travelMinutes;

  const insertLunch =
    shouldInsertLunchBreak({
      previousEnd,
      nextArrivalWithoutLunch:
        arrivalWithoutLunch,
      nextStay,
      lunchInserted,
    });

  if (!insertLunch) {
    return {
      arrival:
        arrivalWithoutLunch,
      insertedLunch: false,
    };
  }

  const lunchStart =
    Math.max(
      previousEnd,
      LUNCH_START_MINUTES
    );

  const lunchEnd =
    lunchStart +
    LUNCH_BREAK_MINUTES;

  return {
    arrival:
      lunchEnd + travelMinutes,
    insertedLunch: true,
  };
}

function adjustArrivalToOpeningTime({
  spotName,
  arrival,
}: {
  spotName: string;
  arrival: number;
}): number {
  const businessHours =
    getBusinessHours(spotName);

  if (!businessHours) {
    return arrival;
  }

  if (arrival < businessHours.open) {
    return businessHours.open;
  }

  return arrival;
}

function optimizeDayTimes(
  day: AIPlanDay,
  startTime?: string,
  startLocation?: string
): AIPlanDay {
  if (day.items.length === 0) {
    return day;
  }

  /*
   * routeOptimizer.tsが決定した順番を
   * そのまま維持します。
   */
  const orderedItems =
    [...day.items];

  const requestedStartTime =
    startTime
      ? timeToMinutes(startTime)
      : null;

  const firstOriginalTime =
    timeToMinutes(
      orderedItems[0].time
    );

  const startTravelMinutes =
    requestedStartTime !== null
      ? estimateLocationTravel({
          location: startLocation,
          spotName:
            orderedItems[0].spot,
        })?.durationMinutes ?? 0
      : 0;

  let currentArrival =
    requestedStartTime !== null
      ? requestedStartTime +
        startTravelMinutes
      : firstOriginalTime ??
        DEFAULT_START_MINUTES;

  let lunchInserted = false;

  const optimizedItems:
    AIPlanItem[] = [];

  for (
    let index = 0;
    index < orderedItems.length;
    index += 1
  ) {
    const item =
      orderedItems[index];

    if (index === 0) {
      const adjustedFirstArrival =
        adjustArrivalToOpeningTime({
          spotName: item.spot,
          arrival: currentArrival,
        });

      currentArrival =
        adjustedFirstArrival;

      optimizedItems.push({
        ...item,
        time:
          minutesToTime(
            adjustedFirstArrival
          ),
        duration: "0分",
      });

      continue;
    }

    const previousItem =
      optimizedItems[index - 1];

    const previousArrival =
      timeToMinutes(
        previousItem.time
      );

    const previousStay =
  isDeparturePoint(
    previousItem,
    index - 1
  )
    ? 0
    : getRecommendedStayMinutes(
        previousItem.spot
      );

    const travelMinutes =
      parseDurationMinutes(
        item.duration
      );

    const nextStay =
      getRecommendedStayMinutes(
        item.spot
      );

    const previousEnd =
      (
        previousArrival ??
        currentArrival
      ) + previousStay;

    const nextArrivalResult =
      calculateNextArrival({
        previousEnd,
        travelMinutes,
        nextStay,
        lunchInserted,
      });

    const nextArrival =
      adjustArrivalToOpeningTime({
        spotName: item.spot,
        arrival:
          nextArrivalResult.arrival,
      });

    currentArrival =
      nextArrival;

    if (
      nextArrivalResult.insertedLunch
    ) {
      lunchInserted = true;
    }

    optimizedItems.push({
      ...item,
      time:
        minutesToTime(
          currentArrival
        ),
    });
  }

  return {
    ...day,
    items: optimizedItems,
  };
}

export function optimizeTravelPlanTimes(
  plan: AITravelPlan,
  startTime?: string,
  startLocation?: string
): AITravelPlan {
  return {
    ...plan,
    days:
      plan.days.map(
        (day, dayIndex) =>
          optimizeDayTimes(
            day,
            startTime,
            dayIndex === 0
              ? startLocation
              : undefined
          )
      ),
  };
}
