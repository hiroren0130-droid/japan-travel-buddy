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

import {
  calculateEarlyEndCount,
  hasLimitedScheduleRequest,
} from "./planCompleteness";

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
  startLocation?: string;
  startTime?: string;
  endLocation?: string;
  endTime?: string;
  currentLocation: CurrentLocation | null;
  requiredSpots: Spot[];
  requestedStartSpotName: string | null;
};

function repairAndOptimizePlan({
  plan,
  requestedStartSpotName,
  locale,
  startTime,
  startLocation,
  endLocation,
  requiredSpots,
}: {
  plan: AITravelPlan | null;
  requestedStartSpotName: string | null;
  locale: Locale;
  startTime?: string;
  startLocation?: string;
  endLocation?: string;
  requiredSpots: Spot[];
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
    locale,
    startTime,
    startLocation,
    endLocation,
    requiredSpotNames:
      requiredSpots.map(
        (spot) => spot.name
      ),
  });
}

export async function generateTravelPlan({
  spotList,
  message,
  requestedDays,
  locale,
  specialRequest,
  startLocation,
  startTime,
  endLocation,
  endTime,
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
      startLocation,
      startTime,
      endLocation,
      endTime,
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
      locale,
      startTime,
      startLocation,
      endLocation,
      requiredSpots,
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

  const hasLimitedSchedule =
    hasLimitedScheduleRequest(
      `${message}\n${specialRequest}`
    );

  const hasEarlyEnd =
    requestedDays === 1 &&
    !hasLimitedSchedule &&
    isValidAITravelPlan(
      generatedPlan
    ) &&
    calculateEarlyEndCount(
      generatedPlan
    ) > 0;

  const shouldRegenerate =
    hasValidationError ||
    hasDayCountMismatch ||
    missingSpotNames.length > 0 ||
    hasEarlyEnd;

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
        hasEarlyEnd,
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
・通常の1日プランは、営業時間、移動時間、昼食、recommendedStayを守りながら、近隣候補を使って午後まで自然に観光が続く構成にすること
・最終スポットの到着時刻とrecommendedStayを合わせても15:00より前に終わる日を作らないこと

前回不足していたスポット:
${
  missingSpotNames.length > 0
    ? missingSpotNames.join("\n")
    : "なし"
}`,

      days: requestedDays,
      locale,
      specialRequest,
      startLocation,
      startTime,
      endLocation,
      endTime,
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
      locale,
      startTime,
      startLocation,
      endLocation,
      requiredSpots,
    });

  return {
    generatedPlan,
    didRegenerate: true,
  };
}
