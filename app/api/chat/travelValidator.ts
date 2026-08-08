import type { Spot } from "@/data/types";
import { getSpotByName } from "@/lib/spotService";

export type AIPlanItem = {
  time: string;
  spot: string;
  description: string;
  transport: string;
  duration: string;
};

export type AIPlanDay = {
  day: number;
  items: AIPlanItem[];
};

export type AITravelPlan = {
  title: string;
  summary: string;
  days: AIPlanDay[];
};

const ALLOWED_TRANSPORTS = new Set([
  "徒歩",
  "バス",
  "電車",
  "地下鉄",
  "JR",
  "タクシー",
]);

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function normalizeSpotName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function timeToMinutes(
  value: unknown
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function parseDurationMinutes(
  value: unknown
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    return null;
  }

  const hourMatch =
    normalizedValue.match(
      /^(\d+(?:\.\d+)?)時間(?:(\d+)分)?$/
    );

  if (hourMatch) {
    const hours =
      Number(hourMatch[1]);

    const minutes =
      hourMatch[2]
        ? Number(hourMatch[2])
        : 0;

    if (
      !Number.isFinite(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const totalMinutes =
      hours * 60 + minutes;

    return Number.isFinite(
      totalMinutes
    )
      ? Math.round(
          totalMinutes
        )
      : null;
  }

  const minuteMatch =
    normalizedValue.match(
      /^(\d+)分$/
    );

  if (!minuteMatch) {
    return null;
  }

  const minutes =
    Number(minuteMatch[1]);

  if (
    !Number.isInteger(minutes) ||
    minutes < 0
  ) {
    return null;
  }

  return minutes;
}

function getPlanItemErrors({
  value,
  dayIndex,
  itemIndex,
}: {
  value: unknown;
  dayIndex: number;
  itemIndex: number;
}): string[] {
  const errors: string[] = [];

  const itemLabel =
    `day ${dayIndex + 1}, item ${itemIndex + 1}`;

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [
      `${itemLabel}: itemがオブジェクトではありません。`,
    ];
  }

  const item =
    value as Partial<AIPlanItem>;

  if (
    timeToMinutes(
      item.time
    ) === null
  ) {
    errors.push(
      `${itemLabel}: timeがHH:mm形式ではありません。値: ${String(
        item.time
      )}`
    );
  }

  if (
    !isNonEmptyString(
      item.spot
    )
  ) {
    errors.push(
      `${itemLabel}: spotが空です。`
    );
  }

  if (
    !isNonEmptyString(
      item.description
    )
  ) {
    errors.push(
      `${itemLabel}: descriptionが空です。`
    );
  }

  if (
    typeof item.transport !==
      "string" ||
    !ALLOWED_TRANSPORTS.has(
      item.transport.trim()
    )
  ) {
    errors.push(
      `${itemLabel}: transportが許可されていません。値: ${String(
        item.transport
      )}`
    );
  }

  if (
    parseDurationMinutes(
      item.duration
    ) === null
  ) {
    errors.push(
      `${itemLabel}: durationの形式が不正です。値: ${String(
        item.duration
      )}`
    );
  }

  return errors;
}

function getPlanDayErrors({
  value,
  dayIndex,
}: {
  value: unknown;
  dayIndex: number;
}): string[] {
  const errors: string[] = [];

  const dayLabel =
    `day ${dayIndex + 1}`;

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [
      `${dayLabel}: dayがオブジェクトではありません。`,
    ];
  }

  const day =
    value as Partial<AIPlanDay>;

  if (
    typeof day.day !== "number" ||
    !Number.isInteger(day.day) ||
    day.day < 1
  ) {
    errors.push(
      `${dayLabel}: day番号が正の整数ではありません。値: ${String(
        day.day
      )}`
    );
  }

  if (
    !Array.isArray(
      day.items
    )
  ) {
    errors.push(
      `${dayLabel}: itemsが配列ではありません。`
    );

    return errors;
  }

  if (
    day.items.length === 0
  ) {
    errors.push(
      `${dayLabel}: itemsが空です。`
    );

    return errors;
  }

  day.items.forEach(
    (
      item,
      itemIndex
    ) => {
      errors.push(
        ...getPlanItemErrors({
          value: item,
          dayIndex,
          itemIndex,
        })
      );
    }
  );

  const validItems =
    day.items.filter(
      (
        item
      ): item is AIPlanItem =>
        !!item &&
        typeof item ===
          "object" &&
        timeToMinutes(
          (
            item as Partial<AIPlanItem>
          ).time
        ) !== null
    );

  if (
    validItems.length ===
    day.items.length
  ) {
    let previousTime:
      | number
      | null = null;

    for (
      let itemIndex = 0;
      itemIndex <
      validItems.length;
      itemIndex += 1
    ) {
      const item =
        validItems[itemIndex];

      const currentTime =
        timeToMinutes(
          item.time
        );

      if (
        currentTime === null
      ) {
        continue;
      }

      if (
        previousTime !== null &&
        currentTime <=
          previousTime
      ) {
        errors.push(
          `${dayLabel}: item ${itemIndex + 1}の時刻が前のitem以前です。値: ${item.time}`
        );
      }

      previousTime =
        currentTime;
    }
  }

  const firstItem =
    day.items[0] as
      | Partial<AIPlanItem>
      | undefined;

  if (
    !firstItem ||
    parseDurationMinutes(
      firstItem.duration
    ) !== 0
  ) {
    errors.push(
      `${dayLabel}: 最初のitemのdurationは0分である必要があります。値: ${String(
        firstItem?.duration
      )}`
    );
  }

  return errors;
}

function getDuplicateSpotErrors(
  days: AIPlanDay[]
): string[] {
  const errors: string[] = [];

  const usedSpotDays =
    new Map<
      string,
      Set<number>
    >();

  const firstLocations =
    new Map<
      string,
      string
    >();

  for (
    let dayIndex = 0;
    dayIndex < days.length;
    dayIndex += 1
  ) {
    const day = days[dayIndex];

    for (
      let itemIndex = 0;
      itemIndex < day.items.length;
      itemIndex += 1
    ) {
      const item =
        day.items[itemIndex];

      const normalizedSpotName =
        normalizeSpotName(
          item.spot
        );

      if (!normalizedSpotName) {
        continue;
      }

      const currentLocation =
        `day ${dayIndex + 1}, item ${itemIndex + 1}`;

      const spot =
        getSpotByName(
          item.spot
        );

      const isTransitHub =
        spot?.category === "駅" ||
        spot?.category === "空港";

      const recordedDays =
        usedSpotDays.get(
          normalizedSpotName
        );

      if (!recordedDays) {
        usedSpotDays.set(
          normalizedSpotName,
          new Set([dayIndex])
        );

        firstLocations.set(
          normalizedSpotName,
          currentLocation
        );

        continue;
      }

      const alreadyUsedSameDay =
        recordedDays.has(
          dayIndex
        );

      if (
        isTransitHub &&
        !alreadyUsedSameDay
      ) {
        recordedDays.add(
          dayIndex
        );

        continue;
      }

      const firstLocation =
        firstLocations.get(
          normalizedSpotName
        ) ?? "位置不明";

      errors.push(
        `スポット「${item.spot}」が重複しています。${firstLocation} / ${currentLocation}`
      );
    }
  }

  return errors;
}

export function getValidationErrors(
  value: unknown
): string[] {
  const errors: string[] = [];

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [
      "旅行プランがオブジェクトではありません。",
    ];
  }

  const plan =
    value as Partial<AITravelPlan>;

  if (
    !isNonEmptyString(
      plan.title
    )
  ) {
    errors.push(
      "titleが空です。"
    );
  }

  if (
    !isNonEmptyString(
      plan.summary
    )
  ) {
    errors.push(
      "summaryが空です。"
    );
  }

  if (
    !Array.isArray(
      plan.days
    )
  ) {
    errors.push(
      "daysが配列ではありません。"
    );

    return errors;
  }

  if (
    plan.days.length === 0
  ) {
    errors.push(
      "daysが空です。"
    );

    return errors;
  }

  plan.days.forEach(
    (
      day,
      dayIndex
    ) => {
      errors.push(
        ...getPlanDayErrors({
          value: day,
          dayIndex,
        })
      );
    }
  );

  const structurallyValidDays =
    plan.days.every(
      (
        day
      ): day is AIPlanDay =>
        !!day &&
        typeof day ===
          "object" &&
        typeof (
          day as Partial<AIPlanDay>
        ).day === "number" &&
        Array.isArray(
          (
            day as Partial<AIPlanDay>
          ).items
        )
    );

  if (
    structurallyValidDays
  ) {
    const typedDays =
      plan.days as AIPlanDay[];

    typedDays.forEach(
      (
        day,
        dayIndex
      ) => {
        const expectedDay =
          dayIndex + 1;

        if (
          day.day !==
          expectedDay
        ) {
          errors.push(
            `day番号が連番ではありません。配列位置${expectedDay}件目の値: ${day.day}`
          );
        }
      }
    );

    errors.push(
      ...getDuplicateSpotErrors(
        typedDays
      )
    );
  }

  return errors;
}

export function isValidAITravelPlan(
  value: unknown
): value is AITravelPlan {
  return (
    getValidationErrors(
      value
    ).length === 0
  );
}

function getGeneratedSpotNames(
  plan: AITravelPlan
): Set<string> {
  return new Set(
    plan.days.flatMap(
      (day) =>
        day.items.map(
          (item) =>
            normalizeSpotName(
              item.spot
            )
        )
    )
  );
}

export function containsRequiredSpots(
  plan: AITravelPlan,
  requiredSpots: Spot[]
): boolean {
  const generatedSpotNames =
    getGeneratedSpotNames(
      plan
    );

  return requiredSpots.every(
    (spot) =>
      generatedSpotNames.has(
        normalizeSpotName(
          spot.name
        )
      )
  );
}

export function getMissingRequiredSpots(
  plan: AITravelPlan,
  requiredSpots: Spot[]
): Spot[] {
  const generatedSpotNames =
    getGeneratedSpotNames(
      plan
    );

  return requiredSpots.filter(
    (spot) =>
      !generatedSpotNames.has(
        normalizeSpotName(
          spot.name
        )
      )
  );
}