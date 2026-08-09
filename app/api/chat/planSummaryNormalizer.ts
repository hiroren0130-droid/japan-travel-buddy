import type {
  AIPlanDay,
  AITravelPlan,
} from "./travelValidator";

function getSpotNames(
  day: AIPlanDay
): string[] {
  return day.items
    .map((item) => item.spot.trim())
    .filter(
      (spot) => spot.length > 0
    );
}

function createDaySummary(
  day: AIPlanDay
): string {
  const spotNames =
    getSpotNames(day);

  if (spotNames.length === 0) {
    return `${day.day}日目は自由時間を中心に過ごします。`;
  }

  if (spotNames.length === 1) {
    return `${day.day}日目は${spotNames[0]}をゆっくり巡ります。`;
  }

  return `${day.day}日目は${spotNames.join(
    "、"
  )}の順に巡ります。`;
}

function createSummary(
  plan: AITravelPlan
): string {
  return plan.days
    .map(createDaySummary)
    .join("");
}

export function normalizePlanSummary(
  plan: AITravelPlan
): AITravelPlan {
  return {
    ...plan,
    summary: createSummary(plan),
  };
}