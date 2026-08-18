import type { Locale } from "@/lib/locale";
import type { TravelPlan } from "@/types/travel";

const exportMessages = {
  ja: {
    attribution: "Japan Travel Buddyで作成した旅行プラン",
    dayLabel: (day: number) => `${day}日目`,
    unknownSpot: "不明なスポット",
    fallbackFilename: "旅行プラン",
  },
  en: {
    attribution: "Travel plan created with Japan Travel Buddy",
    dayLabel: (day: number) => `Day ${day}`,
    unknownSpot: "Unknown spot",
    fallbackFilename: "travel-plan",
  },
} satisfies Record<
  Locale,
  {
    attribution: string;
    dayLabel: (day: number) => string;
    unknownSpot: string;
    fallbackFilename: string;
  }
>;

export function createTravelPlanShareText(
  plan: Pick<TravelPlan, "title" | "summary">,
  locale: Locale
): string {
  return [
    plan.title.trim(),
    plan.summary.trim(),
    exportMessages[locale].attribution,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function getTravelPlanExportMessages(locale: Locale) {
  return exportMessages[locale];
}

export function createTravelPlanPdfFilename(
  title: string,
  locale: Locale
): string {
  const sanitizedTitle = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .slice(0, 100);

  return `${sanitizedTitle || exportMessages[locale].fallbackFilename}.pdf`;
}
