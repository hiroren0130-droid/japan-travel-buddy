import type {
  CurrentLocation,
} from "./spotSelector";

import {
  generateAITravelPlan,
} from "./travelGenerator";

import {
  optimizeGeneratedPlan,
} from "./planOptimizer";

import {
  repairTravelPlan,
} from "./travelPlanRepairer";

import {
  getMissingRequiredSpots,
  isValidAITravelPlan,
  type AITravelPlan,
} from "./travelValidator";

import type {
  Spot,
} from "@/data/types";
import type {
  Locale,
} from "@/lib/locale";

type GenerateTravelPlanOptions = {
  spotList: string;
  message: string;
  requestedDays: number;
  locale: Locale;
  specialRequest: string;
  currentLocation: CurrentLocation | null;
  requiredSpots: Spot[];
  requestedStartSpotName: string | null;
};

function repairAndOptimizePlan({
  plan,
  requestedStartSpotName,
}: {
  plan: AITravelPlan | null;
  requestedStartSpotName: string | null;
}): AITravelPlan | null {
  if (!plan) {
    return null;
  }

  const repairedPlan =
    repairTravelPlan(
      plan
    );

  if (
    !isValidAITravelPlan(
      repairedPlan
    )
  ) {
    return null;
  }

  return optimizeGeneratedPlan({
    plan: repairedPlan,
    startSpotName:
      requestedStartSpotName,
  });
}

export async function generateTravelPlan({
  spotList,
  message,
  requestedDays,
  locale,
  specialRequest,
  currentLocation,
  requiredSpots,
  requestedStartSpotName,
}: GenerateTravelPlanOptions) {
  let generatedPlan =
    await generateAITravelPlan({
      spotList,
      message,
      days: requestedDays,
      locale,
      specialRequest,
      currentLocation,
    });

  /*
   * AI生成直後に、
   * 軽微なスポット重複を
   * ローカルで修復します。
   */
  generatedPlan =
    repairAndOptimizePlan({
      plan: generatedPlan,
      requestedStartSpotName,
    });

  const missingSpotNames =
    isValidAITravelPlan(
      generatedPlan
    )
      ? getMissingRequiredSpots(
          generatedPlan,
          requiredSpots
        ).map(
          (spot) => spot.name
        )
      : [];

  const hasValidationError =
    !isValidAITravelPlan(
      generatedPlan
    );

  const hasDayCountMismatch =
    isValidAITravelPlan(
      generatedPlan
    ) &&
    generatedPlan.days.length !==
      requestedDays;

  const shouldRegenerate =
    hasValidationError ||
    hasDayCountMismatch ||
    missingSpotNames.length > 0;

  if (!shouldRegenerate) {
    return {
      generatedPlan,
      didRegenerate: false,
    };
  }

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.warn(
      "ローカル修復後も旅行プランに問題があるため、1回だけ再生成します。",
      {
        hasValidationError,
        hasDayCountMismatch,
        missingSpotNames,
      }
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

  generatedPlan =
    await generateAITravelPlan({
      spotList,

      message: `${message}

最重要条件:
旅行日数は必ず${requestedDays}日です。
days配列は必ず${requestedDays}件にしてください。

次の指定スポットは必ずすべて含めてください。
別のスポットへ置き換えないでください。

${requiredSpotText}

次の条件をすべて守ってください。

・同じスポットを重複させないこと
・各日のday番号を1から連番にすること
・各日の最初のdurationは必ず「0分」にすること
・timeはHH:mm形式にすること
・同じ日の時刻を昇順にすること
・transportは許可された移動手段だけを使うこと
・同じ日の中で同じ駅を重複させないこと

前回不足していたスポット:
${
  missingSpotNames.length > 0
    ? missingSpotNames.join("\n")
    : "なし"
}`,

      days: requestedDays,
      locale,
      specialRequest,
      currentLocation,
    });

  /*
   * 再生成後も、
   * 軽微な重複をローカル修復してから
   * 最適化します。
   */
  generatedPlan =
    repairAndOptimizePlan({
      plan: generatedPlan,
      requestedStartSpotName,
    });

  return {
    generatedPlan,
    didRegenerate: true,
  };
}
