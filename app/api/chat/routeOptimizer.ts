import { getSpotByName } from "@/lib/spotService";

import { getKyotoAreaGroup } from "./kyotoAreaGroups";

import {
  calculateDistanceKm,
  estimateTravel,
  estimateTravelBetweenSpots,
  resolveLocationSpot,
} from "./locationTravelEstimator";

import {
  DEFAULT_EFFECTIVE_START_MINUTES,
} from "./startTimePolicy";

import type { Spot } from "@/data/types";

import type {
  AIPlanDay,
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

const DEFAULT_STAY_MINUTES = 60;

const MAX_EXHAUSTIVE_ROUTE_ITEMS = 8;

/*
 * ルート評価の重み
 */
const DISTANCE_WEIGHT = 10;

const AREA_SWITCH_PENALTY = 18;
const AREA_REVISIT_PENALTY = 120;
const BROAD_AREA_SWITCH_PENALTY = 24;

const UNKNOWN_SPOT_PENALTY = 500;
const UNKNOWN_HOURS_PENALTY = 40;

const NO_BUSINESS_HOURS_REQUIRED_CATEGORIES =
  new Set([
    "駅",
    "街並み",
    "街歩き",
    "街歩き・グルメ",
    "橋",
    "景勝地",
    "公園",
    "散策路",
    "市場",
    "自然",
    "商店街",
  ]);

const UNKNOWN_HOURS_PENALTY_EXCLUDED_SPOT_IDS =
  new Set([
    "daitokuji",
    "saihoji",
    "oharano-shrine",
    "horinji-arashiyama",
    "sagano-scenic-railway",
    "hokanji-yasaka-pagoda",
  ]);  

const BUSINESS_HOURS_VIOLATION_PENALTY = 1000;

const CLOSING_PRIORITY_DIVISOR = 15;

/*
 * 最後の区間だけ大きく離れるルートを防ぎます。
 *
 * 最終移動が2.5km以上で、
 * それまでの平均移動距離より
 * 1.5倍以上長い場合に減点します。
 */
const LONG_LAST_LEG_MIN_KM = 2.5;
const LAST_LEG_RATIO_THRESHOLD = 1.5;
const LAST_LEG_PENALTY = 80;

type BusinessHours = {
  open: number;
  close: number;
};

type RouteEvaluation = {
  score: number;
  items: AIPlanItem[];
};

function getAnchorTravelScore(
  anchor: Spot,
  spot: Spot
): number {
  const distanceKm =
    calculateDistanceKm(
      anchor.latitude,
      anchor.longitude,
      spot.latitude,
      spot.longitude
    );
  const travelEstimate =
    estimateTravelBetweenSpots(
      anchor,
      spot
    );

  return (
    distanceKm * DISTANCE_WEIGHT +
    travelEstimate.durationMinutes
  );
}

function shouldPenalizeUnknownHours(
  item: AIPlanItem
): boolean {
  const spot =
    getSpotByName(
      item.spot
    );

  if (!spot) {
    return false;
  }

  if (
    NO_BUSINESS_HOURS_REQUIRED_CATEGORIES.has(
      spot.category
    )
  ) {
    return false;
  }

  if (
    UNKNOWN_HOURS_PENALTY_EXCLUDED_SPOT_IDS.has(
      spot.id
    )
  ) {
    return false;
  }

  return true;
}

function parseDurationMinutes(
  value: string | undefined
): number {
  if (!value) {
    return 0;
  }

  const normalizedValue =
    value.trim();

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

  const hours =
    hourMatch
      ? Number(
          hourMatch[1]
        )
      : 0;

  const minutes =
    minuteMatch
      ? Number(
          minuteMatch[1]
        )
      : 0;

  if (
    hourMatch ||
    minuteMatch
  ) {
    const totalMinutes =
      hours * 60 +
      minutes;

    if (
      !Number.isFinite(
        totalMinutes
      )
    ) {
      return 0;
    }

    return Math.max(
      Math.round(
        totalMinutes
      ),
      0
    );
  }

  const numberMatch =
    normalizedValue.match(
      /\d+/
    );

  if (!numberMatch) {
    return 0;
  }

  const parsedNumber =
    Number(
      numberMatch[0]
    );

  if (
    !Number.isFinite(
      parsedNumber
    )
  ) {
    return 0;
  }

  return Math.max(
    Math.round(
      parsedNumber
    ),
    0
  );
}

function timeToMinutes(
  value: string
): number | null {
  const match =
    value
      .trim()
      .match(
        /^(\d{1,2}):(\d{2})$/
      );

  if (!match) {
    return null;
  }

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

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

  return (
    hour * 60 +
    minute
  );
}

function parseBusinessHours(
  value: string | undefined
): BusinessHours | null {
  if (!value) {
    return null;
  }

  const normalizedValue =
    value
      .trim()
      .replaceAll(
        "～",
        "〜"
      )
      .replaceAll(
        "~",
        "〜"
      )
      .replaceAll(
        "−",
        "-"
      )
      .replaceAll(
        "—",
        "-"
      );

  if (
    normalizedValue.includes(
      "24時間"
    )
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

  const openHour =
    Number(match[1]);

  const openMinute =
    Number(match[2]);

  const closeHour =
    Number(match[3]);

  const closeMinute =
    Number(match[4]);

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
    openHour * 60 +
    openMinute;

  const close =
    closeHour * 60 +
    closeMinute;

  if (
    close <= open
  ) {
    return null;
  }

  return {
    open,
    close,
  };
}

function getDistanceBetweenItems(
  fromItem: AIPlanItem,
  toItem: AIPlanItem
): number {
  const fromSpot =
    getSpotByName(
      fromItem.spot
    );

  const toSpot =
    getSpotByName(
      toItem.spot
    );

  if (
    !fromSpot ||
    !toSpot
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return calculateDistanceKm(
    fromSpot.latitude,
    fromSpot.longitude,
    toSpot.latitude,
    toSpot.longitude
  );
}

function estimateTravelBetweenItems(
  fromItem: AIPlanItem,
  toItem: AIPlanItem,
  fallbackDistanceKm: number
) {
  const fromSpot =
    getSpotByName(fromItem.spot);
  const toSpot =
    getSpotByName(toItem.spot);

  return fromSpot && toSpot
    ? estimateTravelBetweenSpots(
        fromSpot,
        toSpot
      )
    : estimateTravel(
        fallbackDistanceKm
      );
}

function getRecommendedStayMinutes(
  item: AIPlanItem
): number {
  const spot =
    getSpotByName(
      item.spot
    );

  const recommendedStay =
    parseDurationMinutes(
      spot?.recommendedStay
    );

  if (
    recommendedStay > 0
  ) {
    return recommendedStay;
  }

  return DEFAULT_STAY_MINUTES;
}

function getBusinessHours(
  item: AIPlanItem
): BusinessHours | null {
  const spot =
    getSpotByName(
      item.spot
    );

  return parseBusinessHours(
    spot?.hours
  );
}

function getRoutingArea(
  item: AIPlanItem
): string | null {
  const spot =
    getSpotByName(
      item.spot
    );

  if (!spot) {
    return null;
  }

  if (
    spot.category === "駅" ||
    spot.category === "空港"
  ) {
    return null;
  }

  const area =
    spot.area?.trim();

  return area || null;
}

function isDeparturePoint(
  item: AIPlanItem,
  index: number
): boolean {
  if (index !== 0) {
    return false;
  }

  const spot =
    getSpotByName(
      item.spot
    );

  const description =
    item.description
      .trim()
      .toLowerCase();

  return (
    spot?.category === "駅" ||
    spot?.category === "空港" ||
    description.includes(
      "出発地点"
    ) ||
    description.includes(
      "集合"
    ) ||
    description.includes(
      "出発"
    ) ||
    description.includes(
      "start"
    )
  );
}

function createPermutations(
  items: AIPlanItem[]
): AIPlanItem[][] {
  if (
    items.length <= 1
  ) {
    return [
      [...items],
    ];
  }

  const permutations:
    AIPlanItem[][] = [];

  const used =
    new Array<boolean>(
      items.length
    ).fill(false);

  const current:
    AIPlanItem[] = [];

  function build(): void {
    if (
      current.length ===
      items.length
    ) {
      permutations.push(
        [...current]
      );

      return;
    }

    for (
      let index = 0;
      index <
      items.length;
      index += 1
    ) {
      if (
        used[index]
      ) {
        continue;
      }

      used[index] = true;

      current.push(
        items[index]
      );

      build();

      current.pop();

      used[index] = false;
    }
  }

  build();

  return permutations;
}

function calculateLastLegPenalty(
  routeDistances: number[]
): number {
  if (
    routeDistances.length < 2
  ) {
    return 0;
  }

  const lastDistance =
    routeDistances[
      routeDistances.length - 1
    ];

  if (
    !Number.isFinite(
      lastDistance
    ) ||
    lastDistance <
      LONG_LAST_LEG_MIN_KM
  ) {
    return 0;
  }

  const previousDistances =
    routeDistances.slice(
      0,
      -1
    );

  const validPreviousDistances =
    previousDistances.filter(
      (distance) =>
        Number.isFinite(
          distance
        )
    );

  if (
    validPreviousDistances.length ===
    0
  ) {
    return 0;
  }

  const averagePreviousDistance =
    validPreviousDistances.reduce(
      (sum, distance) =>
        sum + distance,
      0
    ) /
    validPreviousDistances.length;

  if (
    averagePreviousDistance <= 0
  ) {
    return 0;
  }

  if (
    lastDistance <
    averagePreviousDistance *
      LAST_LEG_RATIO_THRESHOLD
  ) {
    return 0;
  }

  return LAST_LEG_PENALTY;
}

function evaluateRouteOrder({
  firstItem,
  orderedItems,
  startAnchor,
  endAnchor,
}: {
  firstItem: AIPlanItem;
  orderedItems: AIPlanItem[];
  startAnchor: Spot | null;
  endAnchor: Spot | null;
}): RouteEvaluation {
  const optimizedFirstItem:
    AIPlanItem = {
      ...firstItem,
      duration: "0分",
    };

  const optimizedItems:
    AIPlanItem[] = [
      optimizedFirstItem,
    ];

  let routeScore = 0;

  const routeDistances:
    number[] = [];

  const firstSpot =
    getSpotByName(
      optimizedFirstItem.spot
    );

  if (startAnchor && firstSpot) {
    routeScore +=
      getAnchorTravelScore(
        startAnchor,
        firstSpot
      );
  }

  const firstArrival =
    timeToMinutes(
      optimizedFirstItem.time
    ) ??
    DEFAULT_EFFECTIVE_START_MINUTES;

  const firstStay =
    isDeparturePoint(
      optimizedFirstItem,
      0
    )
      ? 0
      : getRecommendedStayMinutes(
          optimizedFirstItem
        );

  let currentEndMinutes =
    firstArrival +
    firstStay;

  let currentItem =
    optimizedFirstItem;

  const visitedAreas =
    new Set<string>();

  const firstArea =
    getRoutingArea(
      optimizedFirstItem
    );

  let previousAreaGroup =
    firstArea
      ? getKyotoAreaGroup(firstArea)
      : null;

  if (firstArea) {
    visitedAreas.add(
      firstArea
    );
  }

  for (
    let index = 0;
    index <
    orderedItems.length;
    index += 1
  ) {
    const candidate =
      orderedItems[index];

    const distanceKm =
      getDistanceBetweenItems(
        currentItem,
        candidate
      );

    routeDistances.push(
      distanceKm
    );

    const travelEstimate =
      estimateTravelBetweenItems(
        currentItem,
        candidate,
        distanceKm
      );

    if (
      Number.isFinite(
        distanceKm
      )
    ) {
      routeScore +=
        distanceKm *
        DISTANCE_WEIGHT;
    } else {
      routeScore +=
        UNKNOWN_SPOT_PENALTY;
    }

    const currentArea =
      getRoutingArea(
        currentItem
      );

    const candidateArea =
      getRoutingArea(
        candidate
      );

    if (
      currentArea &&
      candidateArea &&
      currentArea !==
        candidateArea
    ) {
      if (
        visitedAreas.has(
          candidateArea
        )
      ) {
        routeScore +=
          AREA_REVISIT_PENALTY;
      } else {
        routeScore +=
          AREA_SWITCH_PENALTY;
      }
    }

    const candidateAreaGroup = candidateArea
      ? getKyotoAreaGroup(candidateArea)
      : null;

    if (
      previousAreaGroup &&
      candidateAreaGroup &&
      previousAreaGroup !== candidateAreaGroup
    ) {
      routeScore += BROAD_AREA_SWITCH_PENALTY;
    }

    let arrivalMinutes =
      currentEndMinutes +
      travelEstimate
        .durationMinutes;

    const businessHours =
      getBusinessHours(
        candidate
      );

    if (!businessHours) {
  if (
    shouldPenalizeUnknownHours(
      candidate
    )
  ) {
    routeScore +=
      UNKNOWN_HOURS_PENALTY;
  }
} else if (
  arrivalMinutes <
  businessHours.open
) {
  arrivalMinutes =
    businessHours.open;
}

    const stayMinutes =
      getRecommendedStayMinutes(
        candidate
      );

    const endMinutes =
      arrivalMinutes +
      stayMinutes;

    if (businessHours) {
      const remainingMinutes =
        businessHours.close -
        endMinutes;

      if (
        remainingMinutes < 0
      ) {
        routeScore +=
          BUSINESS_HOURS_VIOLATION_PENALTY +
          Math.abs(
            remainingMinutes
          );
      } else {
        routeScore +=
          remainingMinutes /
          CLOSING_PRIORITY_DIVISOR;
      }
    }

    const optimizedItem:
      AIPlanItem = {
        ...candidate,

        transport:
          travelEstimate
            .transport,

        duration:
          `${travelEstimate.durationMinutes}分`,
      };

    optimizedItems.push(
      optimizedItem
    );

    currentEndMinutes =
      endMinutes;

    currentItem =
      optimizedItem;

    if (candidateArea) {
      visitedAreas.add(
        candidateArea
      );
    }

    if (candidateAreaGroup) {
      previousAreaGroup = candidateAreaGroup;
    }
  }

  routeScore +=
    calculateLastLegPenalty(
      routeDistances
    );

  const lastItem =
    optimizedItems.at(-1);
  const lastSpot = lastItem
    ? getSpotByName(
        lastItem.spot
      )
    : undefined;

  if (endAnchor && lastSpot) {
    routeScore +=
      getAnchorTravelScore(
        endAnchor,
        lastSpot
      );
  }

  return {
    score: routeScore,
    items: optimizedItems,
  };
}

function optimizeItemOrderExhaustively(
  items: AIPlanItem[],
  preserveFirstItem: boolean,
  startAnchor: Spot | null,
  endAnchor: Spot | null
): AIPlanItem[] {
  if (items.length <= 1) {
    return [
      ...items,
    ];
  }

  /*
   * 通常処理では、
   * これまで通り1件目を固定します。
   */
  if (preserveFirstItem) {
    const firstItem =
      items[0];

    const remainingItems =
      items.slice(1);

    const permutations =
      createPermutations(
        remainingItems
      );

    let bestEvaluation:
      RouteEvaluation | null = null;

    for (
      const permutation
      of permutations
    ) {
      const evaluation =
        evaluateRouteOrder({
          firstItem,
          orderedItems:
            permutation,
          startAnchor,
          endAnchor,
        });

      if (
        !bestEvaluation ||
        evaluation.score <
          bestEvaluation.score
      ) {
        bestEvaluation =
          evaluation;
      }
    }

    if (!bestEvaluation) {
      return [
        {
          ...firstItem,
          duration: "0分",
        },
        ...remainingItems,
      ];
    }

    return bestEvaluation.items;
  }

  /*
   * 先頭固定を解除する場合は、
   * 全スポットを含めた並び順を評価します。
   */
  const permutations =
    createPermutations(
      items
    );

  let bestEvaluation:
    RouteEvaluation | null = null;

  for (
    const permutation
    of permutations
  ) {
    const [
      firstItem,
      ...orderedItems
    ] = permutation;

    if (!firstItem) {
      continue;
    }

    const evaluation =
      evaluateRouteOrder({
        firstItem,
        orderedItems,
        startAnchor,
        endAnchor,
      });

    if (
      !bestEvaluation ||
      evaluation.score <
        bestEvaluation.score
    ) {
      bestEvaluation =
        evaluation;
    }
  }

  if (!bestEvaluation) {
    return [
      ...items,
    ];
  }

  return bestEvaluation.items;
}

function optimizeItemOrderGreedy(
  items: AIPlanItem[],
  preserveFirstItem: boolean,
  startAnchor: Spot | null,
  endAnchor: Spot | null
): AIPlanItem[] {
  if (
    items.length <= 1
  ) {
    return [
      ...items,
    ];
  }

  const remainingItems =
    [...items];

  const reservedEndItem =
    endAnchor &&
    remainingItems.length > 1
      ? remainingItems
          .slice(
            preserveFirstItem
              ? 1
              : 0
          )
          .reduce(
          (bestItem, item) => {
            const bestSpot =
              getSpotByName(
                bestItem.spot
              );
            const itemSpot =
              getSpotByName(item.spot);

            if (!itemSpot) {
              return bestItem;
            }

            if (!bestSpot) {
              return item;
            }

            return getAnchorTravelScore(
              endAnchor,
              itemSpot
            ) <
              getAnchorTravelScore(
                endAnchor,
                bestSpot
              )
              ? item
              : bestItem;
          }
        )
      : null;

  let firstIndex = 0;

  if (
    !preserveFirstItem &&
    remainingItems[firstIndex] ===
      reservedEndItem
  ) {
    firstIndex = 1;
  }

  if (
    !preserveFirstItem &&
    startAnchor
  ) {
    let bestScore =
      Number.POSITIVE_INFINITY;

    for (
      let index = 0;
      index < remainingItems.length;
      index += 1
    ) {
      const item = remainingItems[index];

      if (
        item === reservedEndItem &&
        remainingItems.length > 1
      ) {
        continue;
      }

      const spot =
        getSpotByName(item.spot);

      if (!spot) {
        continue;
      }

      const score =
        getAnchorTravelScore(
          startAnchor,
          spot
        );

      if (score < bestScore) {
        bestScore = score;
        firstIndex = index;
      }
    }
  }

  const [selectedFirstItem] =
    remainingItems.splice(
      firstIndex,
      1
    );
  const firstItem:
    AIPlanItem = {
      ...selectedFirstItem,
      duration: "0分",
    };

  const optimizedItems:
    AIPlanItem[] = [
      firstItem,
    ];

  let currentItem =
    firstItem;

  while (
    remainingItems.length > 0
  ) {
    if (
      reservedEndItem &&
      remainingItems.length === 1
    ) {
      const selectedItem =
        remainingItems[0];
      const distanceKm =
        getDistanceBetweenItems(
          currentItem,
          selectedItem
        );
      const travelEstimate =
        estimateTravelBetweenItems(
          currentItem,
          selectedItem,
          distanceKm
        );

      optimizedItems.push({
        ...selectedItem,
        transport:
          travelEstimate.transport,
        duration:
          `${travelEstimate.durationMinutes}分`,
      });
      break;
    }

    let bestIndex = 0;

    let bestDistance =
      Number.POSITIVE_INFINITY;

    for (
      let index = 0;
      index <
      remainingItems.length;
      index += 1
    ) {
      if (
        remainingItems[index] ===
          reservedEndItem &&
        remainingItems.length > 1
      ) {
        continue;
      }

      const distanceKm =
        getDistanceBetweenItems(
          currentItem,
          remainingItems[
            index
          ]
        );

      if (
        distanceKm <
        bestDistance
      ) {
        bestDistance =
          distanceKm;

        bestIndex =
          index;
      }
    }

    const [selectedItem] =
      remainingItems.splice(
        bestIndex,
        1
      );

    const travelEstimate =
      estimateTravelBetweenItems(
        currentItem,
        selectedItem,
        bestDistance
      );

    const optimizedItem:
      AIPlanItem = {
        ...selectedItem,

        transport:
          travelEstimate
            .transport,

        duration:
          `${travelEstimate.durationMinutes}分`,
      };

    optimizedItems.push(
      optimizedItem
    );

    currentItem =
      optimizedItem;
  }

  return optimizedItems;
}

function optimizeItemOrder(
  items: AIPlanItem[],
  preserveFirstItem: boolean,
  startAnchor: Spot | null,
  endAnchor: Spot | null
): AIPlanItem[] {
  if (
    items.length <=
    MAX_EXHAUSTIVE_ROUTE_ITEMS
  ) {
    return optimizeItemOrderExhaustively(
      items,
      preserveFirstItem,
      startAnchor,
      endAnchor
    );
  }

  /*
   * 大量スポット時は処理量を抑えるため、
   * 現時点では既存Greedy処理を使用します。
   */
  return optimizeItemOrderGreedy(
    items,
    preserveFirstItem,
    startAnchor,
    endAnchor
  );
}

type OptimizeTravelPlanRouteOptions = {
  preserveFirstItem?: boolean;
  startSpotName?: string | null;
  startLocation?: string;
  endLocation?: string;
};

function optimizeDayRoute(
  day: AIPlanDay,
  preserveFirstItem: boolean,
  startAnchor: Spot | null,
  endAnchor: Spot | null
): AIPlanDay {
  if (
    day.items.length <= 1
  ) {
    return day;
  }

  return {
    ...day,

    items:
      optimizeItemOrder(
        day.items,
        preserveFirstItem,
        startAnchor,
        endAnchor
      ),
  };
}

export function optimizeTravelPlanRoute(
  plan: AITravelPlan,
  options:
    OptimizeTravelPlanRouteOptions = {}
): AITravelPlan {
  const {
    preserveFirstItem = true,
    startSpotName = null,
    startLocation,
    endLocation,
  } = options;

  const startAnchor =
    startSpotName
      ? null
      : resolveLocationSpot(
          startLocation
        );
  const endAnchor =
    resolveLocationSpot(
      endLocation
    );
  return {
    ...plan,

    days:
      plan.days.map(
        (day, dayIndex) => {
          const dayStartAnchor =
            dayIndex === 0
              ? startAnchor
              : null;
          const dayEndAnchor =
            dayIndex ===
              plan.days.length - 1
              ? endAnchor
              : null;
          const hasDayAnchor =
            dayStartAnchor !== null ||
            dayEndAnchor !== null;
          const preserveDayFirstItem =
            startSpotName &&
            dayIndex === 0
              ? true
              : hasDayAnchor
                ? false
                : preserveFirstItem;

          return optimizeDayRoute(
            day,
            preserveDayFirstItem,
            dayStartAnchor,
            dayEndAnchor
          );
        }
      ),
  };
}
