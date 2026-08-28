import {
  getPrefectureDisplayName,
} from "@/data/regions";
import type { Locale } from "@/lib/locale";
import {
  TRAVEL_PLAN_TITLE_MAX_LENGTH,
} from "@/lib/prompts/outputSchema";
import {
  getSpotByName,
} from "@/lib/spotService";

import {
  EVENING_START_MINUTES,
  MORNING_END_MINUTES,
} from "./descriptionNormalizer";
import {
  getEstimatedDayEndMinutes,
} from "./planCompleteness";
import type {
  AIPlanDay,
  AITravelPlan,
} from "./travelValidator";

type TimeOfDay =
  | "morning"
  | "afternoon"
  | "evening";

type DayTimeRange = {
  start: number;
  end: number;
};

const GENERIC_FALLBACK_TITLES = {
  ja: "おすすめ観光プラン",
  en: "Recommended Sightseeing Plan",
} as const satisfies Record<Locale, string>;

const JAPANESE_MORNING_PATTERN =
  /午前|早朝|朝(?:の|から|観光|散策|プラン|コース)/u;
const JAPANESE_AFTERNOON_PATTERN = /午後/u;
const JAPANESE_EVENING_PATTERN = /夕方/u;

const ENGLISH_MORNING_PATTERN = /\bmorning\b/iu;
const ENGLISH_AFTERNOON_PATTERN = /\bafternoon\b/iu;
const ENGLISH_EVENING_PATTERN = /\bevening\b/iu;

function timeToMinutes(
  value: string
): number | null {
  const match = value.match(
    /^([01]\d|2[0-3]):([0-5]\d)$/
  );

  if (!match) {
    return null;
  }

  return (
    Number(match[1]) * 60 +
    Number(match[2])
  );
}

function getDayTimeRange(
  day: AIPlanDay
): DayTimeRange | null {
  const firstItem = day.items[0];

  if (!firstItem) {
    return null;
  }

  const start = timeToMinutes(
    firstItem.time
  );
  const end =
    getEstimatedDayEndMinutes(day);

  if (
    start === null ||
    end === null
  ) {
    return null;
  }

  return {
    start,
    end,
  };
}

function getTimeOfDayClaims(
  title: string,
  locale: Locale
): Set<TimeOfDay> {
  const claims =
    new Set<TimeOfDay>();

  if (locale === "en") {
    if (
      ENGLISH_MORNING_PATTERN.test(title)
    ) {
      claims.add("morning");
    }

    if (
      ENGLISH_AFTERNOON_PATTERN.test(title)
    ) {
      claims.add("afternoon");
    }

    if (
      ENGLISH_EVENING_PATTERN.test(title)
    ) {
      claims.add("evening");
    }

    return claims;
  }

  if (
    JAPANESE_MORNING_PATTERN.test(title)
  ) {
    claims.add("morning");
  }

  if (
    JAPANESE_AFTERNOON_PATTERN.test(title)
  ) {
    claims.add("afternoon");
  }

  if (
    JAPANESE_EVENING_PATTERN.test(title)
  ) {
    claims.add("evening");
  }

  return claims;
}

function planContainsTimeOfDay(
  ranges: DayTimeRange[],
  timeOfDay: TimeOfDay
): boolean {
  if (timeOfDay === "morning") {
    return ranges.some(
      (range) =>
        range.start <
        MORNING_END_MINUTES
    );
  }

  if (timeOfDay === "afternoon") {
    return ranges.some(
      (range) =>
        range.start <
          EVENING_START_MINUTES &&
        range.end >
          MORNING_END_MINUTES
    );
  }

  return ranges.some(
    (range) =>
      range.end >
      EVENING_START_MINUTES
  );
}

function joinEnglishNames(
  names: string[]
): string {
  if (names.length <= 1) {
    return names[0] ?? "";
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names
    .slice(0, -1)
    .join(", ")}, and ${names.at(-1)}`;
}

function createRegionalFallbackTitle(
  plan: AITravelPlan,
  locale: Locale
): string | null {
  const prefectureNames =
    new Set<string>();
  let itemCount = 0;

  for (const day of plan.days) {
    for (const item of day.items) {
      itemCount += 1;

      const spot = getSpotByName(
        item.spot
      );

      if (!spot) {
        return null;
      }

      prefectureNames.add(
        getPrefectureDisplayName(
          spot.prefectureId,
          locale
        )
      );
    }
  }

  if (
    itemCount === 0 ||
    prefectureNames.size === 0
  ) {
    return null;
  }

  const names = [
    ...prefectureNames,
  ];
  const dayCount = plan.days.length;

  if (locale === "en") {
    const duration =
      dayCount === 1
        ? "One-Day"
        : `${dayCount}-Day`;

    return `${duration} ${joinEnglishNames(
      names
    )} Sightseeing Plan`;
  }

  const duration =
    dayCount === 1
      ? "1日"
      : `${dayCount}日間`;

  return `${names.join(
    "・"
  )}を巡る${duration}観光プラン`;
}

function createFallbackTitle(
  plan: AITravelPlan,
  locale: Locale
): string {
  const regionalTitle =
    createRegionalFallbackTitle(
      plan,
      locale
    );

  if (
    regionalTitle &&
    Array.from(regionalTitle).length <=
      TRAVEL_PLAN_TITLE_MAX_LENGTH
  ) {
    return regionalTitle;
  }

  return GENERIC_FALLBACK_TITLES[
    locale
  ];
}

export function normalizePlanTitleForTimeline(
  plan: AITravelPlan,
  locale: Locale
): AITravelPlan {
  const claims = getTimeOfDayClaims(
    plan.title,
    locale
  );

  if (claims.size === 0) {
    return plan;
  }

  const ranges = plan.days
    .map(getDayTimeRange)
    .filter(
      (
        range
      ): range is DayTimeRange =>
        range !== null
    );

  const hasContradiction = [
    ...claims,
  ].some(
    (claim) =>
      !planContainsTimeOfDay(
        ranges,
        claim
      )
  );

  if (!hasContradiction) {
    return plan;
  }

  return {
    ...plan,
    title: createFallbackTitle(
      plan,
      locale
    ),
  };
}
