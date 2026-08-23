import { getSpotByName } from "@/lib/spotService";

import {
  calculateBroadAreaOverloadCount,
calculateBusinessHoursViolationCount,
  calculateCrossDayAreaSplitCount,
  calculateDayImbalanceCount,
  calculateLateEndCount,
  calculateLongDistanceMoveCount,
  calculateRouteScore,
  calculateScheduleConflictCount,
} from "./routeEvaluator";

import {
  optimizeTravelPlanRoute,
} from "./routeOptimizer";

import {
  optimizeTravelPlanTimes,
} from "./timeOptimizer";

import type {
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

type PlanQuality = {
  businessHoursViolationCount: number;
  scheduleConflictCount: number;
  lateEndCount: number;
  dayImbalanceCount: number;
  crossDayAreaSplitCount: number;
  longDistanceMoveCount: number;
broadAreaOverloadCount: number;
score: number;
};

type MoveCandidate = {
  fromDayIndex: number;
  itemIndex: number;
  toDayIndex: number;
};

type SwapCandidate = {
  firstDayIndex: number;
  firstItemIndex: number;
  secondDayIndex: number;
  secondItemIndex: number;
};

const MAXIMUM_MOVE_COUNT = 3;

function evaluatePlan(
  plan: AITravelPlan
): PlanQuality {
  return {
    businessHoursViolationCount:
      calculateBusinessHoursViolationCount(
        plan
      ),

    scheduleConflictCount:
      calculateScheduleConflictCount(
        plan
      ),

    lateEndCount:
      calculateLateEndCount(
        plan
      ),

    dayImbalanceCount:
      calculateDayImbalanceCount(
        plan
      ),

    crossDayAreaSplitCount:
      calculateCrossDayAreaSplitCount(
        plan
      ),

    longDistanceMoveCount:
      calculateLongDistanceMoveCount(
        plan
      ),

broadAreaOverloadCount:
calculateBroadAreaOverloadCount(
plan
),

    score:
      calculateRouteScore(
        plan
      ),
  };
}

function isBetterQuality(
  candidate: PlanQuality,
  current: PlanQuality
): boolean {
  /*
   * 営業時間違反を最優先で減らします。
   */
  if (
    candidate
      .businessHoursViolationCount !==
    current
      .businessHoursViolationCount
  ) {
    return (
      candidate
        .businessHoursViolationCount <
      current
        .businessHoursViolationCount
    );
  }

  /*
   * 時刻衝突を次に優先します。
   */
  if (
    candidate
      .scheduleConflictCount !==
    current
      .scheduleConflictCount
  ) {
    return (
      candidate
        .scheduleConflictCount <
      current
        .scheduleConflictCount
    );
  }

  /*
   * 18時以降まで長引く日を減らします。
   */
  if (
    candidate.lateEndCount !==
    current.lateEndCount
  ) {
    return (
      candidate.lateEndCount <
      current.lateEndCount
    );
  }

  /*
   * 日程の極端な偏りを減らします。
   */
  if (
    candidate.dayImbalanceCount !==
    current.dayImbalanceCount
  ) {
    return (
      candidate.dayImbalanceCount <
      current.dayImbalanceCount
    );
  }

  /*
   * 同じ観光エリアが複数日に分散する状態を
   * できるだけ減らします。
   */
  if (
    candidate.crossDayAreaSplitCount !==
    current.crossDayAreaSplitCount
  ) {
    return (
      candidate.crossDayAreaSplitCount <
      current.crossDayAreaSplitCount
    );
  }

  /*
   * 京都市内を大きく横断する
   * 長距離移動を減らします。
   */
  if (
    candidate.longDistanceMoveCount !==
    current.longDistanceMoveCount
  ) {
    return (
      candidate.longDistanceMoveCount <
      current.longDistanceMoveCount
    );
  }

    /*
   * 長距離移動が同じなら、
   * 1日の広域エリア過剰横断を減らします。
   */
  if (
    candidate.broadAreaOverloadCount !==
    current.broadAreaOverloadCount
  ) {
    return (
      candidate.broadAreaOverloadCount <
      current.broadAreaOverloadCount
    );
  }


  /*
   * 上記が同じなら総合Route Scoreを比較します。
   */
  return (
    candidate.score >
    current.score
  );
}

function isMovableItem(
  item: AIPlanItem,
  protectedStartSpotName: string | null
): boolean {
  /*
   * ユーザーが明示した出発地点だけは
   * 別の日へ移動させません。
   */
  if (
    protectedStartSpotName &&
    item.spot === protectedStartSpotName
  ) {
    return false;
  }

  const spot =
    getSpotByName(
      item.spot
    );

  if (!spot) {
    return false;
  }

  /*
   * 駅・空港などの交通拠点を移動すると
   * 日程構造を壊しやすいため対象外です。
   */
  if (
    spot.category === "駅" ||
    spot.category === "空港"
  ) {
    return false;
  }

  return true;
}

function clonePlan(
  plan: AITravelPlan
): AITravelPlan {
  return {
    ...plan,

    days:
      plan.days.map(
        (day) => ({
          ...day,

          items:
            day.items.map(
              (item) => ({
                ...item,
              })
            ),
        })
      ),
  };
}

function optimizeMovedPlan(
  plan: AITravelPlan,
  startTime?: string
): AITravelPlan {
  return optimizeTravelPlanTimes(
    optimizeTravelPlanRoute(
      plan,
      {
        preserveFirstItem: false,
      }
    ),
    startTime
  );
}

function moveItem({
  plan,
  fromDayIndex,
  itemIndex,
  toDayIndex,
  startTime,
}: {
  plan: AITravelPlan;
  fromDayIndex: number;
  itemIndex: number;
  toDayIndex: number;
  startTime?: string;
}): AITravelPlan | null {
  if (
    fromDayIndex ===
    toDayIndex
  ) {
    return null;
  }

  const movedPlan =
    clonePlan(plan);

  const fromDay =
    movedPlan.days[
      fromDayIndex
    ];

  const toDay =
    movedPlan.days[
      toDayIndex
    ];

  if (
    !fromDay ||
    !toDay
  ) {
    return null;
  }

  /*
   * 元の日から全スポットを消してしまう
   * 状態にはしません。
   */
  if (
    fromDay.items.length <= 1
  ) {
    return null;
  }

  const [
    movedItem,
  ] = fromDay.items.splice(
    itemIndex,
    1
  );

  if (!movedItem) {
    return null;
  }

  /*
   * 移動先の末尾へ一旦追加します。
   * その後routeOptimizerで順番を再計算します。
   */
  toDay.items.push({
    ...movedItem,

    /*
     * 移動先では最初から時間を信用せず、
     * 後段timeOptimizerで再計算します。
     */
    duration:
      movedItem.duration,
  });

  return optimizeMovedPlan(
    movedPlan,
    startTime
  );
}

function swapItems({
  plan,
  firstDayIndex,
  firstItemIndex,
  secondDayIndex,
  secondItemIndex,
  startTime,
}: {
  plan: AITravelPlan;
  firstDayIndex: number;
  firstItemIndex: number;
  secondDayIndex: number;
  secondItemIndex: number;
  startTime?: string;
}): AITravelPlan | null {
  if (
    firstDayIndex ===
    secondDayIndex
  ) {
    return null;
  }

  const swappedPlan =
    clonePlan(plan);

  const firstDay =
    swappedPlan.days[
      firstDayIndex
    ];

  const secondDay =
    swappedPlan.days[
      secondDayIndex
    ];

  if (
    !firstDay ||
    !secondDay
  ) {
    return null;
  }

  const firstItem =
    firstDay.items[
      firstItemIndex
    ];

  const secondItem =
    secondDay.items[
      secondItemIndex
    ];

  if (
    !firstItem ||
    !secondItem
  ) {
    return null;
  }

  firstDay.items[
    firstItemIndex
  ] = {
    ...secondItem,
  };

  secondDay.items[
    secondItemIndex
  ] = {
    ...firstItem,
  };

  return optimizeMovedPlan(
    swappedPlan,
    startTime
  );
}

function createSwapCandidates(
  plan: AITravelPlan,
  protectedStartSpotName: string | null
): SwapCandidate[] {
  const candidates:
    SwapCandidate[] = [];

  if (
    plan.days.length <= 1
  ) {
    return candidates;
  }

  for (
    let firstDayIndex = 0;
    firstDayIndex <
    plan.days.length;
    firstDayIndex += 1
  ) {
    const firstDay =
      plan.days[
        firstDayIndex
      ];

    for (
      let secondDayIndex =
        firstDayIndex + 1;
      secondDayIndex <
      plan.days.length;
      secondDayIndex += 1
    ) {
      const secondDay =
        plan.days[
          secondDayIndex
        ];

      for (
        let firstItemIndex = 0;
        firstItemIndex <
        firstDay.items.length;
        firstItemIndex += 1
      ) {
        const firstItem =
          firstDay.items[
            firstItemIndex
          ];

        if (
          !isMovableItem(
            firstItem,
            protectedStartSpotName
          )
        ) {
          continue;
        }

        for (
          let secondItemIndex = 0;
          secondItemIndex <
          secondDay.items.length;
          secondItemIndex += 1
        ) {
          const secondItem =
            secondDay.items[
              secondItemIndex
            ];

          if (
            !isMovableItem(
              secondItem,
              protectedStartSpotName
            )
          ) {
            continue;
          }

          candidates.push({
            firstDayIndex,
            firstItemIndex,
            secondDayIndex,
            secondItemIndex,
          });
        }
      }
    }
  }

  return candidates;
}

function createMoveCandidates(
  plan: AITravelPlan,
  protectedStartSpotName: string | null
): MoveCandidate[] {
  const candidates:
    MoveCandidate[] = [];

  if (
    plan.days.length <= 1
  ) {
    return candidates;
  }

  /*
   * すべての日 → すべての別日
   * の組み合わせを候補にします。
   *
   * これにより、
   * 「最も多い日 → 最も少ない日」
   * だけに限定されません。
   */
  for (
    let fromDayIndex = 0;
    fromDayIndex <
    plan.days.length;
    fromDayIndex += 1
  ) {
    const fromDay =
      plan.days[
        fromDayIndex
      ];

    if (
      fromDay.items.length <= 1
    ) {
      continue;
    }

    for (
      let itemIndex = 0;
      itemIndex <
      fromDay.items.length;
      itemIndex += 1
    ) {
      const item =
        fromDay.items[
          itemIndex
        ];

      if (
        !isMovableItem(
          item,
          protectedStartSpotName
        )
      ) {
        continue;
      }

      for (
        let toDayIndex = 0;
        toDayIndex <
        plan.days.length;
        toDayIndex += 1
      ) {
        if (
          toDayIndex ===
          fromDayIndex
        ) {
          continue;
        }

        candidates.push({
          fromDayIndex,
          itemIndex,
          toDayIndex,
        });
      }
    }
  }

  return candidates;
}

export function optimizeDayImbalance(
  plan: AITravelPlan,
  protectedStartSpotName: string | null = null,
  startTime?: string
): AITravelPlan {
  if (
    plan.days.length <= 1
  ) {
    return plan;
  }

  let currentPlan =
    plan;

  let currentQuality =
    evaluatePlan(
      currentPlan
    );

  /*
   * 最大3回まで、
   * 日をまたぐスポット移動を試します。
   *
   * 件数差が小さくても、
   * Route Scoreが改善するなら対象になります。
   */
  for (
    let moveCount = 0;
    moveCount <
    MAXIMUM_MOVE_COUNT;
    moveCount += 1
  ) {
    const candidates =
      createMoveCandidates(
        currentPlan,
        protectedStartSpotName
      );

    let bestCandidatePlan:
      AITravelPlan | null = null;

    let bestCandidateQuality:
      PlanQuality | null = null;

    for (
      const candidate
      of candidates
    ) {
      const candidatePlan =
        moveItem({
          plan:
            currentPlan,

          fromDayIndex:
            candidate
              .fromDayIndex,

          itemIndex:
            candidate
              .itemIndex,

          toDayIndex:
            candidate
              .toDayIndex,

          startTime,
        });

      if (!candidatePlan) {
        continue;
      }

      const candidateQuality =
        evaluatePlan(
          candidatePlan
        );

        /*
       * 現在より悪くなる移動は採用しません。
       */
      if (
        !isBetterQuality(
          candidateQuality,
          currentQuality
        )
      ) {
        continue;
      }

      /*
       * 改善候補の中から、
       * 最も品質が高いものを選びます。
       */
      if (
        !bestCandidateQuality ||
        isBetterQuality(
          candidateQuality,
          bestCandidateQuality
        )
      ) {
        bestCandidatePlan =
          candidatePlan;

        bestCandidateQuality =
          candidateQuality;
      }
    }

    const swapCandidates =
      createSwapCandidates(
        currentPlan,
        protectedStartSpotName
      );

    for (
      const swapCandidate
      of swapCandidates
    ) {
      const candidatePlan =
        swapItems({
          plan:
            currentPlan,

          firstDayIndex:
            swapCandidate
              .firstDayIndex,

          firstItemIndex:
            swapCandidate
              .firstItemIndex,

          secondDayIndex:
            swapCandidate
              .secondDayIndex,

          secondItemIndex:
            swapCandidate
              .secondItemIndex,

          startTime,
        });

      if (!candidatePlan) {
        continue;
      }

      const candidateQuality =
        evaluatePlan(
          candidatePlan
        );

      /*
       * 現在より悪くなる交換は
       * 採用しません。
       */
      if (
        !isBetterQuality(
          candidateQuality,
          currentQuality
        )
      ) {
        continue;
      }

      /*
       * 移動候補も含め、
       * 最も品質が高い候補を採用します。
       */
      if (
        !bestCandidateQuality ||
        isBetterQuality(
          candidateQuality,
          bestCandidateQuality
        )
      ) {
        bestCandidatePlan =
          candidatePlan;

        bestCandidateQuality =
          candidateQuality;
      }
    }

    /*
     * これ以上改善できる移動がなければ終了。
     */
    if (
      !bestCandidatePlan ||
      !bestCandidateQuality
    ) {
      break;
    }

    currentPlan =
      bestCandidatePlan;

    currentQuality =
      bestCandidateQuality;
  }

  return currentPlan;
}
