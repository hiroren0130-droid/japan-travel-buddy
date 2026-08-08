import { getSpotByName } from "@/lib/spotService";

import type {
  AITravelPlan,
} from "./travelValidator";

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

/**
 * AI生成プランの軽微な重複を、
 * AI再生成前にローカルで修復します。
 *
 * 観光スポット:
 * - 旅行全体で重複を削除
 *
 * 駅・空港:
 * - 同じ日の重複だけ削除
 * - 別日での再登場は許可
 */
export function repairTravelPlan(
  plan: AITravelPlan
): AITravelPlan {
  const usedTouristSpots =
    new Set<string>();

  return {
    ...plan,

    days:
      plan.days.map((day) => {
        const usedTransitHubsToday =
          new Set<string>();

        const repairedItems =
          day.items.filter((item) => {
            const normalizedSpotName =
              normalizeSpotName(
                item.spot
              );

            if (!normalizedSpotName) {
              return true;
            }

            const spot =
              getSpotByName(
                item.spot
              );

            const isTransitHub =
              spot?.category === "駅" ||
              spot?.category === "空港";

            /*
             * 駅・空港は、
             * 同じ日だけ重複を除去します。
             */
            if (isTransitHub) {
              if (
                usedTransitHubsToday.has(
                  normalizedSpotName
                )
              ) {
                return false;
              }

              usedTransitHubsToday.add(
                normalizedSpotName
              );

              return true;
            }

            /*
             * 観光スポットは、
             * 旅行全体で重複を除去します。
             */
            if (
              usedTouristSpots.has(
                normalizedSpotName
              )
            ) {
              return false;
            }

            usedTouristSpots.add(
              normalizedSpotName
            );

            return true;
          });

        return {
          ...day,
          items:
            repairedItems,
        };
      }),
  };
}