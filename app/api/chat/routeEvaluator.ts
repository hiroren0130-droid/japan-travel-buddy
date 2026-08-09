import { getSpotByName } from "@/lib/spotService";

import type { AITravelPlan } from "./travelValidator";

const MAX_RECOMMENDED_SPOTS_PER_DAY = 6;
const LATE_END_MINUTES = 18 * 60;
const LONG_WALK_MINUTES = 20;
const MAX_DAY_ITEM_DIFFERENCE = 2;

const LUNCH_START_MINUTES = 12 * 60;
const LUNCH_END_MINUTES = 13 * 60 + 30;
const MIN_LUNCH_BREAK_MINUTES = 45;

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

    return Number.isFinite(
      totalMinutes
    )
      ? Math.max(
          Math.round(totalMinutes),
          0
        )
      : 0;
  }

  const numberMatch =
    normalizedValue.match(/\d+/);

  if (!numberMatch) {
    return 0;
  }

  const parsedNumber =
    Number(numberMatch[0]);

  return Number.isFinite(
    parsedNumber
  )
    ? Math.max(parsedNumber, 0)
    : 0;
}

function timeToMinutes(
  time: string
): number | null {
  const match = time
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

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function parseBusinessHours(
  value: string | undefined
): BusinessHours | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .normalize("NFKC")
    .trim();

  if (
    !normalizedValue ||
    normalizedValue.includes("24時間")
  ) {
    return null;
  }

  const match =
    normalizedValue.match(
      /(\d{1,2}):(\d{2})\s*[〜～~\-–—]\s*(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return null;
  }

  const openHour = Number(match[1]);
  const openMinute = Number(match[2]);
  const closeHour = Number(match[3]);
  const closeMinute = Number(match[4]);

  if (
    !Number.isInteger(openHour) ||
    !Number.isInteger(openMinute) ||
    !Number.isInteger(closeHour) ||
    !Number.isInteger(closeMinute) ||
    openHour < 0 ||
    openHour > 23 ||
    closeHour < 0 ||
    closeHour > 23 ||
    openMinute < 0 ||
    openMinute > 59 ||
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

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return (
    startA < endB &&
    endA > startB
  );
}

const EARTH_RADIUS_KM = 6371;
const LONG_DISTANCE_MOVE_KM = 7;

function degreesToRadians(
  degrees: number
): number {
  return (
    degrees *
    (Math.PI / 180)
  );
}

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const latitudeDifference =
    degreesToRadians(
      latitudeB - latitudeA
    );

  const longitudeDifference =
    degreesToRadians(
      longitudeB - longitudeA
    );

  const firstLatitude =
    degreesToRadians(latitudeA);

  const secondLatitude =
    degreesToRadians(latitudeB);

  const haversineValue =
    Math.sin(
      latitudeDifference / 2
    ) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(
        longitudeDifference / 2
      ) ** 2;

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(haversineValue),
      Math.sqrt(
        1 - haversineValue
      )
    );

  return (
  EARTH_RADIUS_KM *
  centralAngle
);
}

export function calculateLongDistanceMoveCount(
  plan: AITravelPlan
): number {
  let longDistanceMoveCount = 0;

  for (const day of plan.days) {
    for (
      let index = 1;
      index < day.items.length;
      index += 1
    ) {
      const previousItem =
        day.items[index - 1];

      const currentItem =
        day.items[index];

      const previousSpot =
        getSpotByName(
          previousItem.spot
        );

      const currentSpot =
        getSpotByName(
          currentItem.spot
        );

      if (
        !previousSpot ||
        !currentSpot
      ) {
        continue;
      }

      const distanceKm =
        calculateDistanceKm(
          previousSpot.latitude,
          previousSpot.longitude,
          currentSpot.latitude,
          currentSpot.longitude
        );

      if (
        distanceKm >=
        LONG_DISTANCE_MOVE_KM
      ) {
        longDistanceMoveCount += 1;
      }
    }
  }

  return longDistanceMoveCount;
}

export function calculateAreaSwitches(
  plan: AITravelPlan
): number {
  let areaSwitches = 0;

  for (const day of plan.days) {
    let previousSpot:
  ReturnType<typeof getSpotByName> =
  undefined;

    for (const item of day.items) {
      const currentSpot =
        getSpotByName(
          item.spot
        );

      if (!currentSpot) {
        continue;
      }

      /*
       * 駅や空港は出発・到着拠点なので、
       * 観光エリアの切り替え判定には含めません。
       */
      if (
        currentSpot.category === "駅" ||
        currentSpot.category === "空港"
      ) {
        continue;
      }

      if (!previousSpot) {
        previousSpot =
          currentSpot;

        continue;
      }

      const previousArea =
        previousSpot.area.trim();

      const currentArea =
        currentSpot.area.trim();

      if (
        previousArea &&
        currentArea &&
        previousArea !== currentArea
      ) {
        const distanceKm =
          calculateDistanceKm(
            previousSpot.latitude,
            previousSpot.longitude,
            currentSpot.latitude,
            currentSpot.longitude
          );

        /*
         * routeOptimizer と同じ4kmを基準にし、
         * エリア名が違うだけの近距離移動は
         * areaSwitchとして減点しません。
         */
        if (distanceKm > 4) {
          areaSwitches += 1;
        }
      }

      previousSpot =
        currentSpot;
    }
  }

  return areaSwitches;
}

export function calculateAreaRevisitCount(
  plan: AITravelPlan
): number {
  let revisitCount = 0;

  for (const day of plan.days) {
    const visitedAreas =
      new Set<string>();

    let previousArea:
      string | null = null;

    for (const item of day.items) {
      const spot =
        getSpotByName(
          item.spot
        );

      if (!spot) {
        continue;
      }

      /*
       * 駅や空港は出発・到着拠点なので、
       * 観光エリアの再訪判定には含めません。
       */
      if (
        spot.category === "駅" ||
        spot.category === "空港"
      ) {
        continue;
      }

      const currentArea =
        spot.area.trim();

      if (!currentArea) {
        continue;
      }

      if (
        previousArea !== null &&
        currentArea !== previousArea &&
        visitedAreas.has(currentArea)
      ) {
        revisitCount += 1;
      }

      visitedAreas.add(currentArea);
      previousArea = currentArea;
    }
  }

  return revisitCount;
}

export function calculateShortStayCount(
  plan: AITravelPlan
): number {
  let shortStayCount = 0;

  for (const day of plan.days) {
    for (
      let index = 0;
      index <
      day.items.length - 1;
      index += 1
    ) {
      const currentItem =
        day.items[index];

      const nextItem =
        day.items[index + 1];

      const currentSpot =
        getSpotByName(
          currentItem.spot
        );

      if (!currentSpot) {
        continue;
      }

      const currentTime =
        timeToMinutes(
          currentItem.time
        );

      const nextTime =
        timeToMinutes(
          nextItem.time
        );

      if (
        currentTime === null ||
        nextTime === null ||
        nextTime <= currentTime
      ) {
        continue;
      }

      const travelMinutes =
        parseDurationMinutes(
          nextItem.duration
        );

      const availableStay =
        nextTime -
        currentTime -
        travelMinutes;

      const isDeparture =
        index === 0 &&
        currentSpot.category === "駅";

      const recommendedStay =
        isDeparture
          ? 0
          : parseDurationMinutes(
              currentSpot.recommendedStay
            );

      if (
        recommendedStay > 0 &&
        availableStay >= 0 &&
        availableStay <
          recommendedStay
      ) {
        shortStayCount += 1;
      }
    }
  }

  return shortStayCount;
}

export function calculateScheduleConflictCount(
  plan: AITravelPlan
): number {
  let conflictCount = 0;

  for (const day of plan.days) {
    for (
      let index = 0;
      index <
      day.items.length - 1;
      index += 1
    ) {
      const currentItem =
        day.items[index];

      const nextItem =
        day.items[index + 1];

      const currentTime =
        timeToMinutes(
          currentItem.time
        );

      const nextTime =
        timeToMinutes(
          nextItem.time
        );

      if (
        currentTime === null ||
        nextTime === null
      ) {
        continue;
      }

      const currentSpot =
        getSpotByName(
          currentItem.spot
        );

      const isDeparture =
        index === 0 &&
        currentSpot?.category === "駅";

      const recommendedStay =
        isDeparture
          ? 0
          : parseDurationMinutes(
              currentSpot?.recommendedStay
            );

      const travelMinutes =
        parseDurationMinutes(
          nextItem.duration
        );

      const earliestNextArrival =
        currentTime +
        recommendedStay +
        travelMinutes;

      if (
        nextTime <
        earliestNextArrival
      ) {
        conflictCount += 1;
      }
    }
  }

  return conflictCount;
}

export function calculateBusinessHoursViolationCount(
  plan: AITravelPlan
): number {
  let violationCount = 0;

  for (const day of plan.days) {
    for (const item of day.items) {
      const spot =
        getSpotByName(
          item.spot
        );

      if (!spot) {
        continue;
      }

      const businessHours =
        parseBusinessHours(
          spot.hours
        );

      if (!businessHours) {
        continue;
      }

      const arrivalTime =
        timeToMinutes(
          item.time
        );

      if (arrivalTime === null) {
        continue;
      }

      const recommendedStay =
        parseDurationMinutes(
          spot.recommendedStay
        );

      const estimatedEndTime =
        arrivalTime +
        recommendedStay;

      if (
        arrivalTime <
          businessHours.open ||
        estimatedEndTime >
          businessHours.close
      ) {
        violationCount += 1;
      }
    }
  }

  return violationCount;
}

export function calculateLunchBreakMissingCount(
  plan: AITravelPlan
): number {
  let missingCount = 0;

  for (const day of plan.days) {
    const firstItem =
      day.items[0];

    const lastItem =
      day.items.at(-1);

    if (
      !firstItem ||
      !lastItem
    ) {
      continue;
    }

    const firstArrival =
      timeToMinutes(
        firstItem.time
      );

    const lastArrival =
      timeToMinutes(
        lastItem.time
      );

    const lastSpot =
      getSpotByName(
        lastItem.spot
      );

    const lastStay =
      parseDurationMinutes(
        lastSpot?.recommendedStay
      );

    if (
      firstArrival === null ||
      lastArrival === null
    ) {
      continue;
    }

    const estimatedDayEnd =
      lastArrival +
      lastStay;

    const dayCoversLunch =
      firstArrival <
        LUNCH_START_MINUTES &&
      estimatedDayEnd >
        LUNCH_END_MINUTES;

    if (!dayCoversLunch) {
      continue;
    }

    let hasLunchGap = false;

    for (
      let index = 0;
      index <
      day.items.length - 1;
      index += 1
    ) {
      const currentItem =
        day.items[index];

      const nextItem =
        day.items[index + 1];

      const currentArrival =
        timeToMinutes(
          currentItem.time
        );

      const nextArrival =
        timeToMinutes(
          nextItem.time
        );

      if (
        currentArrival === null ||
        nextArrival === null
      ) {
        continue;
      }

      const currentSpot =
        getSpotByName(
          currentItem.spot
        );

      const currentStay =
        parseDurationMinutes(
          currentSpot?.recommendedStay
        );

      const travelMinutes =
        parseDurationMinutes(
          nextItem.duration
        );

      const breakStart =
        currentArrival +
        currentStay;

      const breakEnd =
        nextArrival -
        travelMinutes;

      const breakMinutes =
        breakEnd -
        breakStart;

      if (
        breakMinutes >=
          MIN_LUNCH_BREAK_MINUTES &&
        rangesOverlap(
          breakStart,
          breakEnd,
          LUNCH_START_MINUTES,
          LUNCH_END_MINUTES
        )
      ) {
        hasLunchGap = true;
        break;
      }
    }

    if (!hasLunchGap) {
      missingCount += 1;
    }
  }

  return missingCount;
}

export function calculateDuplicateSpotCount(
  plan: AITravelPlan
): number {
  const usedSpotNames =
    new Map<
      string,
      number
    >();

  let duplicateCount = 0;

  for (
    let dayIndex = 0;
    dayIndex < plan.days.length;
    dayIndex += 1
  ) {
    const day = plan.days[dayIndex];

    for (const item of day.items) {
      const normalizedSpotName =
        normalizeSpotName(
          item.spot
        );

      if (!normalizedSpotName) {
        continue;
      }

      const previousDay =
        usedSpotNames.get(
          normalizedSpotName
        );

      if (
        previousDay === undefined
      ) {
        usedSpotNames.set(
          normalizedSpotName,
          dayIndex
        );

        continue;
      }

      const spot =
        getSpotByName(
          item.spot
        );

      const isStation =
        spot?.category === "駅";

      if (
        isStation &&
        previousDay !== dayIndex
      ) {
        continue;
      }

      duplicateCount += 1;
    }
  }

  return duplicateCount;
}

export function calculateInvalidTimeCount(
  plan: AITravelPlan
): number {
  let invalidTimeCount = 0;

  for (const day of plan.days) {
    let previousTime:
      | number
      | null = null;

    for (const item of day.items) {
      const currentTime =
        timeToMinutes(
          item.time
        );

      if (
        currentTime === null
      ) {
        invalidTimeCount += 1;
        continue;
      }

      if (
        previousTime !== null &&
        currentTime <=
          previousTime
      ) {
        invalidTimeCount += 1;
      }

      previousTime =
        currentTime;
    }
  }

  return invalidTimeCount;
}

export function calculateLongWalkCount(
  plan: AITravelPlan
): number {
  let longWalkCount = 0;

  for (const day of plan.days) {
    for (
      let index = 1;
      index <
      day.items.length;
      index += 1
    ) {
      const item =
        day.items[index];

      if (
        item.transport !== "徒歩"
      ) {
        continue;
      }

      const durationMinutes =
        parseDurationMinutes(
          item.duration
        );

      if (
        durationMinutes >
        LONG_WALK_MINUTES
      ) {
        longWalkCount += 1;
      }
    }
  }

  return longWalkCount;
}

export function calculateOverloadedDayCount(
  plan: AITravelPlan
): number {
  return plan.days.filter(
    (day) =>
      day.items.length >
      MAX_RECOMMENDED_SPOTS_PER_DAY
  ).length;
}

export function calculateLateEndCount(
  plan: AITravelPlan
): number {
  let lateEndCount = 0;

  for (const day of plan.days) {
    const lastItem =
      day.items.at(-1);

    if (!lastItem) {
      continue;
    }

    const arrivalTime =
      timeToMinutes(
        lastItem.time
      );

    if (
      arrivalTime === null
    ) {
      continue;
    }

    const lastSpot =
      getSpotByName(
        lastItem.spot
      );

    const recommendedStay =
      parseDurationMinutes(
        lastSpot?.recommendedStay
      );

    const estimatedEndTime =
      arrivalTime +
      recommendedStay;

    if (
      estimatedEndTime >
      LATE_END_MINUTES
    ) {
      lateEndCount += 1;
    }
  }

  return lateEndCount;
}

export function calculateFirstItemDurationErrorCount(
  plan: AITravelPlan
): number {
  let errorCount = 0;

  for (const day of plan.days) {
    const firstItem =
      day.items[0];

    if (!firstItem) {
      continue;
    }

    const durationMinutes =
      parseDurationMinutes(
        firstItem.duration
      );

    if (
      durationMinutes !== 0
    ) {
      errorCount += 1;
    }
  }

  return errorCount;
}

export function calculateDayImbalanceCount(
  plan: AITravelPlan
): number {
  const itemCounts =
    plan.days
      .map((day) =>
        day.items.filter(
          (item) => {
            const spot =
              getSpotByName(
                item.spot
              );

            if (!spot) {
              return true;
            }

            return (
              spot.category !==
                "駅" &&
              spot.category !==
                "空港"
            );
          }
        ).length
      )
      .filter(
        (itemCount) =>
          itemCount > 0
      );

  if (
    itemCounts.length <= 1
  ) {
    return 0;
  }

  const minimumCount =
    Math.min(
      ...itemCounts
    );

  const maximumCount =
    Math.max(
      ...itemCounts
    );

  return (
    maximumCount -
      minimumCount >
    MAX_DAY_ITEM_DIFFERENCE
  )
    ? 1
    : 0;
}

export function calculateUnknownSpotCount(
  plan: AITravelPlan
): number {
  let unknownSpotCount = 0;

  for (const day of plan.days) {
    for (const item of day.items) {
      if (
        !getSpotByName(
          item.spot
        )
      ) {
        unknownSpotCount += 1;
      }
    }
  }

  return unknownSpotCount;
}

export function calculateTransportMismatchCount(
  plan: AITravelPlan
): number {
  let mismatchCount = 0;

  for (const day of plan.days) {
    for (
      let index = 1;
      index <
      day.items.length;
      index += 1
    ) {
      const previousItem =
        day.items[index - 1];

      const currentItem =
        day.items[index];

      const previousSpot =
        getSpotByName(
          previousItem.spot
        );

      const currentSpot =
        getSpotByName(
          currentItem.spot
        );

      if (
        !previousSpot ||
        !currentSpot
      ) {
        continue;
      }

      const distanceKm =
        calculateDistanceKm(
          previousSpot.latitude,
          previousSpot.longitude,
          currentSpot.latitude,
          currentSpot.longitude
        );

      const transport =
        currentItem.transport;

      if (
        transport === "徒歩" &&
        distanceKm >= 3
      ) {
        mismatchCount += 1;
        continue;
      }

      if (
        (
          transport === "バス" ||
          transport === "電車" ||
          transport === "地下鉄" ||
          transport === "JR"
        ) &&
        distanceKm <= 0.5
      ) {
        mismatchCount += 1;
        continue;
      }

      if (
        transport === "タクシー" &&
        distanceKm <= 1
      ) {
        mismatchCount += 1;
      }
    }
  }

  return mismatchCount;
}

export function calculateRouteScore(
  plan: AITravelPlan
): number {
  const areaSwitches =
    calculateAreaSwitches(
      plan
    );

  const areaRevisitCount =
    calculateAreaRevisitCount(
      plan
    );

  const shortStayCount =
    calculateShortStayCount(
      plan
    );

  const scheduleConflictCount =
    calculateScheduleConflictCount(
      plan
    );

  const businessHoursViolationCount =
    calculateBusinessHoursViolationCount(
      plan
    );

  const lunchBreakMissingCount =
    calculateLunchBreakMissingCount(
      plan
    );

  const duplicateSpotCount =
    calculateDuplicateSpotCount(
      plan
    );

  const invalidTimeCount =
    calculateInvalidTimeCount(
      plan
    );

  const longWalkCount =
    calculateLongWalkCount(
      plan
    );

  const overloadedDayCount =
    calculateOverloadedDayCount(
      plan
    );

  const lateEndCount =
    calculateLateEndCount(
      plan
    );

  const firstItemDurationErrorCount =
    calculateFirstItemDurationErrorCount(
      plan
    );

  const dayImbalanceCount =
    calculateDayImbalanceCount(
      plan
    );

  const unknownSpotCount =
    calculateUnknownSpotCount(
      plan
    );

  const transportMismatchCount =
    calculateTransportMismatchCount(
      plan
    );
    const longDistanceMoveCount =
  calculateLongDistanceMoveCount(
    plan
  );

  const score =
    100 -
    areaSwitches * 4 -
    areaRevisitCount * 8 -
    shortStayCount * 6 -
    scheduleConflictCount * 10 -
    businessHoursViolationCount * 12 -
    lunchBreakMissingCount * 6 -
    duplicateSpotCount * 15 -
    invalidTimeCount * 15 -
    longWalkCount * 7 -
    overloadedDayCount * 8 -
    lateEndCount * 7 -
    firstItemDurationErrorCount * 5 -
    dayImbalanceCount * 5 -
    unknownSpotCount * 20 -
    transportMismatchCount * 8 -
    longDistanceMoveCount * 4;

  return Math.min(
    Math.max(
      Math.round(score),
      0
    ),
    100
  );
}