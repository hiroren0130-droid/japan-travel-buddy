import type {
  AIPlanDay,
  AITravelPlan,
} from "./travelValidator";
import type { Locale } from "@/lib/locale";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import { getSpotByName } from "@/lib/spotService";

function getSpotNames(
  day: AIPlanDay,
  locale: Locale
): string[] {
  return day.items
    .map((item) => item.spot.trim())
    .filter(
      (spot) => spot.length > 0
    )
    .map((spotName) => {
      if (locale !== "en") {
        return spotName;
      }

      const spot =
        getSpotByName(spotName);

      return spot
        ? getLocalizedSpotName(spot, "en")
        : spotName;
    });
}

function createDaySummary(
  day: AIPlanDay,
  locale: Locale
): string {
  const spotNames =
    getSpotNames(day, locale);

  if (spotNames.length === 0) {
    return locale === "en"
      ? `Day ${day.day} focuses on free time.`
      : `${day.day}日目は自由時間を中心に過ごします。`;
  }

  if (spotNames.length === 1) {
    return locale === "en"
      ? `On day ${day.day}, explore ${spotNames[0]} at a relaxed pace.`
      : `${day.day}日目は${spotNames[0]}をゆっくり巡ります。`;
  }

  return locale === "en"
    ? `On day ${day.day}, visit ${spotNames.join(
        ", "
      )} in order.`
    : `${day.day}日目は${spotNames.join(
        "、"
      )}の順に巡ります。`;
}

function createSummary(
  plan: AITravelPlan,
  locale: Locale
): string {
  return plan.days
    .map((day) =>
      createDaySummary(day, locale)
    )
    .join(locale === "en" ? " " : "");
}

export function normalizePlanSummary(
  plan: AITravelPlan,
  locale: Locale
): AITravelPlan {
  return {
    ...plan,
    summary: createSummary(plan, locale),
  };
}
