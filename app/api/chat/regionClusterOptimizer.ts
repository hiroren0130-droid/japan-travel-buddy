import { getSpotByName } from "@/lib/spotService";

import type {
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

type ClusterItem = {
  item: AIPlanItem;
  originalDayIndex: number;
  originalOrder: number;
};

type RegionCluster = {
  key: string;
  items: ClusterItem[];
  dayCounts: Map<number, number>;
  firstOrder: number;
};

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function getClusterKey(
  item: AIPlanItem
): string | null {
  const spot =
    getSpotByName(
      item.spot
    );

  if (
    !spot ||
    spot.category === "駅" ||
    spot.category === "空港"
  ) {
    return null;
  }

  const prefectureId =
    spot.prefectureId?.trim();
  const cityId =
    spot.cityId?.trim() ||
    prefectureId;

  if (
    !prefectureId ||
    !cityId
  ) {
    return null;
  }

  return `${prefectureId}/${cityId}`;
}

function createSpotMultiset(
  plan: AITravelPlan
): Map<string, number> {
  const multiset =
    new Map<string, number>();

  for (const day of plan.days) {
    for (const item of day.items) {
      const key =
        normalizeSpotName(
          item.spot
        );

      multiset.set(
        key,
        (multiset.get(key) ?? 0) + 1
      );
    }
  }

  return multiset;
}

function hasSameSpotMultiset(
  first: AITravelPlan,
  second: AITravelPlan
): boolean {
  const firstMultiset =
    createSpotMultiset(first);
  const secondMultiset =
    createSpotMultiset(second);

  if (
    firstMultiset.size !==
    secondMultiset.size
  ) {
    return false;
  }

  return Array.from(
    firstMultiset.entries()
  ).every(
    ([key, count]) =>
      secondMultiset.get(key) ===
      count
  );
}

function selectPreferredDay(
  cluster: RegionCluster,
  dayIndexes: number[]
): number {
  return [...dayIndexes].sort(
    (firstDayIndex, secondDayIndex) => {
      const countDifference =
        (cluster.dayCounts.get(
          secondDayIndex
        ) ?? 0) -
        (cluster.dayCounts.get(
          firstDayIndex
        ) ?? 0);

      return (
        countDifference ||
        firstDayIndex -
          secondDayIndex
      );
    }
  )[0];
}

export function optimizeRegionClusters({
  plan,
  protectedStartSpotName = null,
}: {
  plan: AITravelPlan;
  protectedStartSpotName?: string | null;
}): AITravelPlan {
  if (plan.days.length <= 1) {
    return plan;
  }

  const clusters =
    new Map<string, RegionCluster>();
  const retainedItems =
    plan.days.map(() =>
      [] as ClusterItem[]
    );
  const normalizedProtectedName =
    protectedStartSpotName
      ? normalizeSpotName(
          protectedStartSpotName
        )
      : null;
  let protectedClusterKey:
    string | null = null;
  let originalOrder = 0;

  for (
    let dayIndex = 0;
    dayIndex < plan.days.length;
    dayIndex += 1
  ) {
    for (
      const item
      of plan.days[dayIndex].items
    ) {
      const clusterItem: ClusterItem = {
        item: { ...item },
        originalDayIndex: dayIndex,
        originalOrder,
      };
      const clusterKey =
        getClusterKey(item);

      originalOrder += 1;

      if (!clusterKey) {
        retainedItems[dayIndex].push(
          clusterItem
        );
        continue;
      }

      const cluster: RegionCluster =
        clusters.get(clusterKey) ?? {
          key: clusterKey,
          items: [],
          dayCounts: new Map(),
          firstOrder:
            clusterItem.originalOrder,
        };

      cluster.items.push(clusterItem);
      cluster.dayCounts.set(
        dayIndex,
        (cluster.dayCounts.get(
          dayIndex
        ) ?? 0) + 1
      );
      clusters.set(
        clusterKey,
        cluster
      );

      if (
        normalizedProtectedName &&
        normalizeSpotName(item.spot) ===
          normalizedProtectedName
      ) {
        protectedClusterKey =
          clusterKey;
      }
    }
  }

  if (clusters.size <= 1) {
    return plan;
  }

  const orderedClusters =
    Array.from(clusters.values())
      .sort((first, second) => {
        if (
          first.key ===
          protectedClusterKey
        ) {
          return -1;
        }

        if (
          second.key ===
          protectedClusterKey
        ) {
          return 1;
        }

        return (
          second.items.length -
            first.items.length ||
          first.firstOrder -
            second.firstOrder
        );
      });
  const assignedDayByCluster =
    new Map<string, number>();
  const dayLoads =
    retainedItems.map(
      (items) => items.length
    );

  if (
    clusters.size <=
    plan.days.length
  ) {
    const availableDayIndexes =
      plan.days.map(
        (_day, dayIndex) =>
          dayIndex
      );

    for (const cluster of orderedClusters) {
      const assignedDayIndex =
        cluster.key ===
          protectedClusterKey
          ? 0
          : selectPreferredDay(
              cluster,
              availableDayIndexes
            );

      assignedDayByCluster.set(
        cluster.key,
        assignedDayIndex
      );
      dayLoads[assignedDayIndex] +=
        cluster.items.length;

      const availableIndex =
        availableDayIndexes.indexOf(
          assignedDayIndex
        );

      if (availableIndex >= 0) {
        availableDayIndexes.splice(
          availableIndex,
          1
        );
      }
    }
  } else {
    for (const cluster of orderedClusters) {
      const assignedDayIndex =
        cluster.key ===
          protectedClusterKey
          ? 0
          : plan.days
              .map(
                (_day, dayIndex) =>
                  dayIndex
              )
              .sort(
                (first, second) =>
                  dayLoads[first] -
                    dayLoads[second] ||
                  (cluster.dayCounts.get(
                    second
                  ) ?? 0) -
                    (cluster.dayCounts.get(
                      first
                    ) ?? 0) ||
                  first - second
              )[0];

      assignedDayByCluster.set(
        cluster.key,
        assignedDayIndex
      );
      dayLoads[assignedDayIndex] +=
        cluster.items.length;
    }
  }

  const itemsByDay =
    retainedItems.map((items) =>
      [...items]
    );

  for (const cluster of orderedClusters) {
    const assignedDayIndex =
      assignedDayByCluster.get(
        cluster.key
      );

    if (assignedDayIndex === undefined) {
      return plan;
    }

    itemsByDay[assignedDayIndex].push(
      ...cluster.items
    );
  }

  const optimizedPlan: AITravelPlan = {
    ...plan,
    days: plan.days.map(
      (day, dayIndex) => {
        const orderedItems =
          itemsByDay[dayIndex]
            .sort(
              (first, second) =>
                first.originalOrder -
                second.originalOrder
            );

        if (
          dayIndex === 0 &&
          normalizedProtectedName
        ) {
          const protectedIndex =
            orderedItems.findIndex(
              ({ item }) =>
                normalizeSpotName(
                  item.spot
                ) ===
                normalizedProtectedName
            );

          if (protectedIndex > 0) {
            const [protectedItem] =
              orderedItems.splice(
                protectedIndex,
                1
              );

            orderedItems.unshift(
              protectedItem
            );
          }
        }

        return {
          ...day,
          items: orderedItems.map(
            ({ item }) => item
          ),
        };
      }
    ),
  };

  return hasSameSpotMultiset(
    plan,
    optimizedPlan
  )
    ? optimizedPlan
    : plan;
}
