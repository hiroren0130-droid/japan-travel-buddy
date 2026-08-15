import type {
  Spot,
} from "@/data/types";
import type { Locale } from "@/lib/locale";

import {
  calculateBroadAreaOverloadCount,
  calculateBusinessHoursViolationCount,
  calculateLunchBreakMissingCount,
  calculateLongDistanceMoveCount,
  calculateRouteScore,
} from "./routeEvaluator";

import {
  generateAITravelPlan,
} from "./travelGenerator";

import {
  optimizeGeneratedPlan,
} from "./planOptimizer";

import {
  logPlanEvaluation,
} from "./routeLogger";

import type {
  CurrentLocation,
} from "./spotSelector";

import {
  containsRequiredSpots,
  isValidAITravelPlan,
  type AITravelPlan,
} from "./travelValidator";

type ImproveTravelPlanOptions = {
  plan: AITravelPlan;
  didRegenerate: boolean;
  spotList: string;
  message: string;
  requestedDays: number;
  locale: Locale;
  specialRequest: string;
  currentLocation: CurrentLocation | null;
  requiredSpots: Spot[];
  requestedStartSpotName: string | null;
};

export async function improveTravelPlan({
  plan,
  didRegenerate,
  spotList,
  message,
  requestedDays,
  locale,
  specialRequest,
  currentLocation,
  requiredSpots,
  requestedStartSpotName,
}: ImproveTravelPlanOptions): Promise<AITravelPlan> {
  const initialRouteScore =
    calculateRouteScore(plan);

  const lunchBreakMissingCount =
    calculateLunchBreakMissingCount(
      plan
    );

  const businessHoursViolationCount =
    calculateBusinessHoursViolationCount(
      plan
    );

  const broadAreaOverloadCount =
    calculateBroadAreaOverloadCount(
      plan
    );

    const longDistanceMoveCount =
  calculateLongDistanceMoveCount(
    plan
  );

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    logPlanEvaluation(
      plan,
      "Initial Route Evaluation"
    );
  }

  const shouldImproveRoute =
  initialRouteScore < 84 ||
  longDistanceMoveCount > 0 ||
  broadAreaOverloadCount > 0 ||
  lunchBreakMissingCount > 0 ||
  businessHoursViolationCount > 0;

  if (
    !shouldImproveRoute ||
    didRegenerate
  ) {
    return plan;
  }

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.warn(
      `ルート評価が${initialRouteScore}点のため改善プランを生成します。`
    );
  }

  const requiredSpotText =
    requiredSpots.length > 0
      ? requiredSpots
          .map(
            (spot) => spot.name
          )
          .join("\n")
      : "指定なし";

  const improvedPlan =
    await generateAITravelPlan({
      spotList,

      message: `${message}

最重要条件:
現在の旅程は、エリア移動または滞在時間の評価が低くなっています。

次の条件を守り、より効率的な旅程へ改善してください。

・同じエリアのスポットを連続して配置すること
・一度離れたエリアへ戻る順番を避けること
・長距離の往復を避けること
・1日に複数の広域エリアを何度も跨がないこと
・各スポットのrecommendedStayを確保すること
・移動時間を滞在時間として扱わないこと
・昼食は12:00〜13:30頃に確保すること
・説明文に「昼食」と書くだけでは不可とすること
・前のスポットの観光終了から次の移動開始まで、45分以上の自由時間を確保すること
・旅行日数は必ず${requestedDays}日とすること
・同じスポットを旅程内に2回以上入れないこと
・同一名称のスポットを重複させないこと
・次の指定スポットは必ず含めること

${requiredSpotText}`,

      days: requestedDays,
      locale,
      specialRequest,
      currentLocation,
    });

  if (
    !isValidAITravelPlan(
      improvedPlan
    )
  ) {
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.warn(
        "改善プランが不正なため、元のプランを使用します。"
      );
    }

    return plan;
  }

  const optimizedImprovedPlan =
    optimizeGeneratedPlan({
      plan: improvedPlan,
      startSpotName:
        requestedStartSpotName,
      locale,
    });

  if (
    optimizedImprovedPlan.days.length !==
      requestedDays ||
    !containsRequiredSpots(
      optimizedImprovedPlan,
      requiredSpots
    )
  ) {
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.warn(
        "改善プランが日数または必須スポット条件を満たさないため、元のプランを使用します。"
      );
    }

    return plan;
  }

  const improvedRouteScore =
    calculateRouteScore(
      optimizedImprovedPlan
    );

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    logPlanEvaluation(
      optimizedImprovedPlan,
      "Improved Route Evaluation"
    );
  }

  if (
    improvedRouteScore <=
    initialRouteScore
  ) {
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        `再生成後も改善しなかったため元のプランを使用します: ${initialRouteScore}点 → ${improvedRouteScore}点`
      );
    }

    return plan;
  }

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      `改善プランを採用しました: ${initialRouteScore}点 → ${improvedRouteScore}点`
    );
  }

  return optimizedImprovedPlan;
}
