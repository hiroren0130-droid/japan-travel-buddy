import type { Spot } from "@/data/types";
import { getSpotByName } from "@/lib/spotService";

import type {
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

const DEFAULT_START_TIME = "09:00";

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function clonePlan(
  plan: AITravelPlan
): AITravelPlan {
  return {
    ...plan,

    days: plan.days.map(
      (day) => ({
        ...day,

        items: day.items.map(
          (item) => ({
            ...item,
          })
        ),
      })
    ),
  };
}

function createStartDescription(
  spotName: string
): string {
  return `${spotName}を旅の出発地点として、交通案内や持ち物を確認してから観光を開始します。`;
}

function createStartItem(
  spotName: string,
  startTime: string
): AIPlanItem {
  return {
    time: startTime,
    spot: spotName,
    description:
      createStartDescription(
        spotName
      ),
    transport: "徒歩",
    duration: "0分",
  };
}

function removeStartSpotFromPlan({
  plan,
  startSpotName,
}: {
  plan: AITravelPlan;
  startSpotName: string;
}): {
  plan: AITravelPlan;
  existingItem: AIPlanItem | null;
} {
  const normalizedStartSpotName =
    normalizeText(
      startSpotName
    );

  let existingItem:
    AIPlanItem | null = null;

  const cleanedPlan =
    clonePlan(plan);

  cleanedPlan.days =
    cleanedPlan.days.map(
      (day) => ({
        ...day,

        items: day.items.filter(
          (item) => {
            const isStartSpot =
              normalizeText(
                item.spot
              ) ===
              normalizedStartSpotName;

            if (
              isStartSpot &&
              existingItem === null
            ) {
              existingItem = {
                ...item,
              };
            }

            return !isStartSpot;
          }
        ),
      })
    );

  return {
    plan: cleanedPlan,
    existingItem,
  };
}

function createOptimizedStartItem({
  existingItem,
  startSpotName,
  startTime,
}: {
  existingItem: AIPlanItem | null;
  startSpotName: string;
  startTime: string;
}): AIPlanItem {
  if (!existingItem) {
    return createStartItem(
      startSpotName,
      startTime
    );
  }

  return {
    ...existingItem,

    time: startTime,
    spot: startSpotName,
    transport: "徒歩",
    duration: "0分",

    description:
      createStartDescription(
        startSpotName
      ),
  };
}

export function findRequestedStartSpotName({
  requestText,
  spots,
}: {
  requestText: string;
  spots: Spot[];
}): string | null {
  const normalizedRequestText =
    normalizeText(
      requestText
    );

  if (!normalizedRequestText) {
    return null;
  }

  /*
   * 名前の長いスポットから確認し、
   * 部分一致による誤検出を減らします。
   */
  const sortedSpots =
    [...spots].sort(
      (first, second) =>
        second.name.length -
        first.name.length
    );

  for (const spot of sortedSpots) {
    const normalizedSpotName =
      normalizeText(
        spot.name
      );

    if (
      !normalizedRequestText.includes(
        normalizedSpotName
      )
    ) {
      continue;
    }

    const startPatterns = [
      `${normalizedSpotName}を朝`,
      `${normalizedSpotName}を午前`,
      `${normalizedSpotName}を出発`,
      `${normalizedSpotName}から出発`,
      `${normalizedSpotName}をスタート`,
      `${normalizedSpotName}からスタート`,
      `${normalizedSpotName}に集合`,
      `${normalizedSpotName}から観光`,
    ];

    const hasStartExpression =
      startPatterns.some(
        (pattern) =>
          normalizedRequestText.includes(
            pattern
          )
      );

    if (hasStartExpression) {
      return spot.name;
    }

  }

  return null;
}

export function optimizeStartPoint({
  plan,
  startSpotName,
  startTime = DEFAULT_START_TIME,
}: {
  plan: AITravelPlan;
  startSpotName: string | null;
  startTime?: string;
}): AITravelPlan {
  if (
    !startSpotName ||
    plan.days.length === 0
  ) {
    return plan;
  }

  const startSpot =
    getSpotByName(
      startSpotName
    );

  if (!startSpot) {
    return plan;
  }

  const {
    plan: cleanedPlan,
    existingItem,
  } = removeStartSpotFromPlan({
    plan,
    startSpotName:
      startSpot.name,
  });

  const firstDay =
    cleanedPlan.days[0];

  if (!firstDay) {
    return plan;
  }

  const startItem =
    createOptimizedStartItem({
      existingItem,
      startSpotName:
        startSpot.name,
      startTime,
    });

  firstDay.items.unshift(
    startItem
  );

  return cleanedPlan;
}