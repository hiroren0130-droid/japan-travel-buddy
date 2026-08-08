import { getSpotByName } from "@/lib/spotService";

import {
  calculateBusinessHoursViolationCount,
  calculateDayImbalanceCount,
  calculateLateEndCount,
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
  score: number;
};

type MoveCandidate = {
  fromDayIndex: number;
  itemIndex: number;
  toDayIndex: number;
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
   * 日程の極端な偏りも評価します。
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
   * 上記が同じなら総合Route Scoreを比較します。
   */
  return (
    candidate.score >
    current.score
  );
}

function isMovableItem(
  item: AIPlanItem,
  itemIndex: number
): boolean {
  /*
   * 各日の先頭地点は、
   * その日の出発地点として扱われるため
   * 移動対象にしません。
   */
  if (
    itemIndex === 0
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
  plan: AITravelPlan
): AITravelPlan {
  return optimizeTravelPlanTimes(
    optimizeTravelPlanRoute(
      plan
    )
  );
}

function moveItem({
  plan,
  fromDayIndex,
  itemIndex,
  toDayIndex,
}: {
  plan: AITravelPlan;
  fromDayIndex: number;
  itemIndex: number;
  toDayIndex: number;
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
    movedPlan
  );
}

function createMoveCandidates(
  plan: AITravelPlan
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
          itemIndex
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
  plan: AITravelPlan
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
        currentPlan
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