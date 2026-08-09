import type {
  AIPlanDay,
  AIPlanItem,
  AITravelPlan,
} from "./travelValidator";

const LUNCH_DESCRIPTION_END_MINUTES =
  14 * 60;

const MORNING_END_MINUTES =
  12 * 60;

const EVENING_START_MINUTES =
  15 * 60;

function timeToMinutes(
  value: string
): number | null {
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

function normalizeWhitespace(
  value: string
): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function removeLateLunchExpressions(
  description: string
): string {
  return description
    .replace(
      /周辺で昼食を取りやすい(?:立地|場所|エリア)?です。?/g,
      ""
    )
    .replace(
      /昼食に立ち寄りやすい(?:立地|場所|エリア)?です。?/g,
      ""
    )
    .replace(
      /昼食は周辺の飲食店が便利です。?/g,
      ""
    )
    .replace(
      /昼食は[^。]+でどうぞ。?/g,
      ""
    )
    .replace(
      /ここで昼食を取れます。?/g,
      ""
    )
    .replace(
      /ここで昼食を取るのに便利です。?/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)で昼食を取るのに便利です。?/g,
      ""
    )
    .replace(
      /昼食と(?:街歩き|散策)に最適なエリアです。?/g,
      ""
    )
    .replace(
      /昼食後に/g,
      ""
    )
    .replace(
      /昼食後の/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)?で?\d{1,2}:\d{2}頃に昼食を取り[^。]*。?/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)?で?\d{1,2}:\d{2}前後に昼食を取[^。]*。?/g,
      ""
    )
    .replace(
      /\d{1,2}:\d{2}頃に昼食を取り[^。]*。?/g,
      ""
    )
    .replace(
      /\d{1,2}:\d{2}頃から昼食[^。]*。?/g,
      ""
    )
    .replace(
      /\d{1,2}:\d{2}頃に昼食。?/g,
      ""
    )
    .replace(
      /\d{1,2}:\d{2}\s*[〜～~\-–—]\s*\d{1,2}:\d{2}頃に昼食を取るのに便利です。?/g,
      ""
    )
    .replace(
      /\d{1,2}:\d{2}\s*[〜～~\-–—]\s*\d{1,2}:\d{2}に昼食を取るのに便利です。?/g,
      ""
    )
    .replace(
      /周辺には食事処が多く[^。]*昼食[^。]*。?/g,
      ""
    )
    .replace(
      /周辺に(?:は)?飲食店が多く[^。]*昼食[^。]*。?/g,
      ""
    )
    .replace(
      /昼食を取り[^。]*。?/g,
      ""
    )
    .replace(
      /周辺での昼食に適しています。?/g,
      ""
    )
    .replace(
      /周辺で昼食に適しています。?/g,
      ""
    )
    .replace(
      /昼食や(?:散策|買い物|休憩)を楽しめます。?/g,
      ""
    )
    .replace(
      /昼食を楽しめる[^。]*。?/g,
      ""
    )
    .replace(
      /昼食を取りつつ[^。]*。?/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)で昼食と休憩をとりやすい(?:立地|場所|エリア)?です。?/g,
      ""
    )
    .replace(
      /近隣で昼食と休憩を取りやすい(?:立地|場所|エリア)?です。?/g,
      ""
    )
    .replace(
      /周辺で昼食や[^。]*。?/g,
      ""
    )
    .replace(
      /[^。]*周辺[^。]*昼食に便利です。?/g,
      ""
    );
}

function removeMorningExpressions(
  description: string
): string {
  return description
    .replace(
      /朝一番で?/g,
      ""
    )
    .replace(
      /朝の(?:静かな|落ち着いた)時間(?:帯)?に?/g,
      ""
    )
    .replace(
      /朝の時間(?:帯)?に?/g,
      ""
    )
    .replace(
      /朝の(?=見学|参拝|散策|観光|訪問)/g,
      ""
    )
    .replace(
      /朝のうちに?/g,
      ""
    )
    .replace(
      /午前中に?/g,
      ""
    )
    .replace(
      /早朝(?:に|の)?/g,
      ""
    )
    .replace(
      /朝にゆっくり/g,
      "ゆっくり"
    )
    .replace(
      /朝に/g,
      ""
    );
}

function removeEveningExpressions(
  description: string
): string {
  return description
    .replace(
      /夕方の/g,
      ""
    )
    .replace(
      /夕景を楽しめます。?/g,
      "景色を楽しめます。"
    )
    .replace(
      /夜景を楽しめます。?/g,
      "景色を楽しめます。"
    )
    .replace(
      /夜の/g,
      ""
    )
    .replace(
      /午後の(?:落ち着いた|静かな)?時間帯/g,
      ""
    )
    .replace(
      /午後に/g,
      ""
    );
}

function removeCrowdExpressions(
  description: string
): string {
  return description
    .replace(
      /混雑前の/g,
      ""
    )
    .replace(
      /混雑を避けて/g,
      ""
    )
    .replace(
      /比較的空いている/g,
      ""
    )
    .replace(
      /空いている/g,
      ""
    );
}

function removeRouteReferenceExpressions(
  description: string
): string {
  return description
    .replace(
      /[^。]*から(?:徒歩|バス|電車|地下鉄|JR|タクシー)で移動[^。]*。?/g,
      ""
    )
    .replace(
      /[^。]*から(?:徒歩|バス|電車|地下鉄|JR|タクシー)でアクセス[^。]*。?/g,
      ""
    )
    .replace(
      /[^。]*から短時間で移動できます。?/g,
      ""
    )
    .replace(
      /[^。]*から近く移動負担が小さいです。?/g,
      ""
    );
}

function cleanDanglingDescriptionEnding(
  description: string
): string {
  return description
    .replace(
      /[、,]\s*(?:周辺|近隣)で\s*$/g,
      ""
    )
    .replace(
      /[、,]\s*(?:周辺|近隣)の\s*$/g,
      ""
    )
    .replace(
      /[、,]\s*$/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)で\s*$/g,
      ""
    )
    .replace(
      /(?:周辺|近隣)の\s*$/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function createFallbackDescription(
  item: AIPlanItem
): string {
  return `${item.spot}の見どころを無理のないペースで巡り、周辺の雰囲気も楽しめます。`;
}

function normalizeItemDescription(
  item: AIPlanItem
): AIPlanItem {
  const arrivalMinutes =
    timeToMinutes(item.time);

  if (arrivalMinutes === null) {
    return {
      ...item,
      description:
        normalizeWhitespace(
          item.description
        ),
    };
  }

  let description =
    normalizeWhitespace(
      item.description
    );

  description =
    description.replace(
      /早朝の(?=神社|寺院|寺|スポット|名所|場所|境内)/g,
      ""
    );

  description =
    removeCrowdExpressions(
      description
    );

  description =
    removeRouteReferenceExpressions(
      description
    );

  description =
    description
      .replace(
        /\d{1,2}:\d{2}(?:頃|前後)?に昼食を取[^。]*。?/g,
        ""
      )
      .replace(
        /\d{1,2}:\d{2}(?:頃|前後)?から昼食[^。]*。?/g,
        ""
      );

  if (
    arrivalMinutes >=
    LUNCH_DESCRIPTION_END_MINUTES
  ) {
    description =
      removeLateLunchExpressions(
        description
      );
  }

  if (
    arrivalMinutes >=
    MORNING_END_MINUTES
  ) {
    description =
      removeMorningExpressions(
        description
      );
  }

  if (
    arrivalMinutes <
    EVENING_START_MINUTES
  ) {
    description =
      removeEveningExpressions(
        description
      );
  }

  description =
    normalizeWhitespace(
      description
        .replace(/。。+/g, "。")
        .replace(/、。/g, "。")
        .replace(/^。+/, "")
    );

  description =
    cleanDanglingDescriptionEnding(
      description
    );

  if (
    description.length < 15
  ) {
    description =
      createFallbackDescription(
        item
      );
  }

  return {
    ...item,
    description,
  };
}

function normalizeDayDescriptions(
  day: AIPlanDay
): AIPlanDay {
  return {
    ...day,
    items:
      day.items.map(
        normalizeItemDescription
      ),
  };
}

export function normalizeTravelPlanDescriptions(
  plan: AITravelPlan
): AITravelPlan {
  return {
    ...plan,
    days:
      plan.days.map(
        normalizeDayDescriptions
      ),
  };
}