import { expect, test } from "@playwright/test";

import {
  buildPlanResponse,
} from "@/app/api/chat/planResponseBuilder";
import {
  normalizePlanTitleForTimeline,
} from "@/app/api/chat/planTitleNormalizer";
import type {
  AITravelPlan,
} from "@/app/api/chat/travelValidator";

type PlanItemInput = {
  time: string;
  spot: string;
};

function createPlan({
  title,
  days,
  summary = "Original summary",
}: {
  title: string;
  days: PlanItemInput[][];
  summary?: string;
}): AITravelPlan {
  return {
    title,
    summary,
    days: days.map(
      (items, dayIndex) => ({
        day: dayIndex + 1,
        items: items.map(
          (item, itemIndex) => ({
            ...item,
            description:
              `${item.spot}を観光します。`,
            transport:
              itemIndex === 0
                ? "徒歩"
                : "電車",
            duration:
              itemIndex === 0
                ? "0分"
                : "30分",
          })
        ),
      })
    ),
  };
}

const KYOTO_MORNING_PLAN = () =>
  createPlan({
    title: "京都午前観光",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
      ],
    ],
  });

test("日本語の午前titleは09:00開始なら維持し13:30開始ならfallbackする", () => {
  const morningPlan =
    KYOTO_MORNING_PLAN();
  const latePlan = createPlan({
    title: "京都午前観光",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      morningPlan,
      "ja"
    ).title
  ).toBe("京都午前観光");
  expect(
    normalizePlanTitleForTimeline(
      latePlan,
      "ja"
    ).title
  ).toBe("京都を巡る1日観光プラン");
});

test("English morningはword boundaryとcaseを考慮して監査する", () => {
  const validPlan = createPlan({
    title: "Kyoto Morning Tour",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
      ],
    ],
  });
  const latePlan = createPlan({
    title: "Kyoto morning tour",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });
  const unrelatedPlan = createPlan({
    title: "Kyoto Morningstar Tour",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      validPlan,
      "en"
    ).title
  ).toBe(validPlan.title);
  expect(
    normalizePlanTitleForTimeline(
      latePlan,
      "en"
    ).title
  ).toBe("One-Day Kyoto Sightseeing Plan");
  expect(
    normalizePlanTitleForTimeline(
      unrelatedPlan,
      "en"
    ).title
  ).toBe(unrelatedPlan.title);
});

test("午後titleは13:30開始と午前から午後まで続くPlanで維持する", () => {
  const afternoonOnly = createPlan({
    title: "京都午後観光",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });
  const continuesIntoAfternoon =
    createPlan({
      title: "京都午後観光",
      days: [
        [
          {
            time: "09:00",
            spot: "清水寺",
          },
          {
            time: "13:30",
            spot: "祇園",
          },
        ],
      ],
    });

  expect(
    normalizePlanTitleForTimeline(
      afternoonOnly,
      "ja"
    ).title
  ).toBe(afternoonOnly.title);
  expect(
    normalizePlanTitleForTimeline(
      continuesIntoAfternoon,
      "ja"
    ).title
  ).toBe(continuesIntoAfternoon.title);
});

test("午後titleでも午前中に終了するPlanはfallbackする", () => {
  const plan = createPlan({
    title: "京都午後観光",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      plan,
      "ja"
    ).title
  ).toBe("京都を巡る1日観光プラン");
});

test("English afternoonは13:30開始なら維持する", () => {
  const plan = createPlan({
    title: "Kyoto Afternoon Tour",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      plan,
      "en"
    ).title
  ).toBe(plan.title);
});

test("夕方titleは15:30開始なら維持し午前中終了ならfallbackする", () => {
  const eveningPlan = createPlan({
    title: "京都夕方散策",
    days: [
      [
        {
          time: "15:30",
          spot: "祇園",
        },
      ],
    ],
  });
  const morningPlan = createPlan({
    title: "京都夕方散策",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      eveningPlan,
      "ja"
    ).title
  ).toBe(eveningPlan.title);
  expect(
    normalizePlanTitleForTimeline(
      morningPlan,
      "ja"
    ).title
  ).toBe("京都を巡る1日観光プラン");
});

test("English eveningは午前中終了ならfallbackする", () => {
  const plan = createPlan({
    title: "Kyoto Evening Walk",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      plan,
      "en"
    ).title
  ).toBe("One-Day Kyoto Sightseeing Plan");
});

test("12:00はmorningに含めずafternoonに含める", () => {
  const morningTitlePlan = createPlan({
    title: "京都午前観光",
    days: [
      [
        {
          time: "12:00",
          spot: "清水寺",
        },
      ],
    ],
  });
  const afternoonTitlePlan = {
    ...morningTitlePlan,
    title: "京都午後観光",
  };

  expect(
    normalizePlanTitleForTimeline(
      morningTitlePlan,
      "ja"
    ).title
  ).toBe("京都を巡る1日観光プラン");
  expect(
    normalizePlanTitleForTimeline(
      afternoonTitlePlan,
      "ja"
    ).title
  ).toBe(afternoonTitlePlan.title);
});

test("15:00開始はafternoonに含めずeveningに含める", () => {
  const afternoonTitlePlan = createPlan({
    title: "京都午後観光",
    days: [
      [
        {
          time: "15:00",
          spot: "清水寺",
        },
      ],
    ],
  });
  const eveningTitlePlan = {
    ...afternoonTitlePlan,
    title: "京都夕方観光",
  };

  expect(
    normalizePlanTitleForTimeline(
      afternoonTitlePlan,
      "ja"
    ).title
  ).toBe("京都を巡る1日観光プラン");
  expect(
    normalizePlanTitleForTimeline(
      eveningTitlePlan,
      "ja"
    ).title
  ).toBe(eveningTitlePlan.title);
});

test("時間帯語がないtitleと初期対象外の語は変更しない", () => {
  const plainPlan = createPlan({
    title: "京都寺社めぐり",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });
  const excludedWordsPlan = {
    ...plainPlan,
    title:
      "京都の昼と夜を楽しむ full day half day night plan",
  };

  expect(
    normalizePlanTitleForTimeline(
      plainPlan,
      "ja"
    ).title
  ).toBe(plainPlan.title);
  expect(
    normalizePlanTitleForTimeline(
      excludedWordsPlan,
      "ja"
    ).title
  ).toBe(excludedWordsPlan.title);
});

test("朝は対象phraseだけを検出し無関係なsubstringは維持する", () => {
  const targetTitles = [
    "京都朝の散策",
    "京都朝から観光",
    "京都朝観光",
    "京都朝散策",
    "京都朝プラン",
    "京都朝コース",
    "京都早朝観光",
  ];

  for (const title of targetTitles) {
    const result =
      normalizePlanTitleForTimeline(
        createPlan({
          title,
          days: [
            [
              {
                time: "13:30",
                spot: "清水寺",
              },
            ],
          ],
        }),
        "ja"
      );

    expect(result.title).toBe(
      "京都を巡る1日観光プラン"
    );
  }

  const unrelatedPlan = createPlan({
    title: "京都で朝日を望む旅",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      unrelatedPlan,
      "ja"
    ).title
  ).toBe(unrelatedPlan.title);
});

test("複数時間帯はすべて存在する場合だけtitleを維持する", () => {
  const validPlan = createPlan({
    title: "京都午前観光から大阪午後観光",
    days: [
      [
        {
          time: "09:00",
          spot: "清水寺",
        },
        {
          time: "13:30",
          spot: "大阪城天守閣",
        },
      ],
    ],
  });
  const invalidPlan = createPlan({
    title: "京都午前観光から大阪午後観光",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
        {
          time: "15:00",
          spot: "大阪城天守閣",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      validPlan,
      "ja"
    ).title
  ).toBe(validPlan.title);
  expect(
    normalizePlanTitleForTimeline(
      invalidPlan,
      "ja"
    ).title
  ).toBe(
    "京都・大阪を巡る1日観光プラン"
  );
});

test("fallbackは地域をtimeline登場順に重複排除する", () => {
  const japanesePlan = createPlan({
    title: "大阪午前観光",
    days: [
      [
        {
          time: "13:30",
          spot: "大阪城天守閣",
        },
        {
          time: "15:00",
          spot: "清水寺",
        },
        {
          time: "17:00",
          spot: "祇園",
        },
      ],
    ],
  });
  const englishPlan = {
    ...japanesePlan,
    title: "Osaka Morning Tour",
  };

  expect(
    normalizePlanTitleForTimeline(
      japanesePlan,
      "ja"
    ).title
  ).toBe(
    "大阪・京都を巡る1日観光プラン"
  );
  expect(
    normalizePlanTitleForTimeline(
      englishPlan,
      "en"
    ).title
  ).toBe(
    "One-Day Osaka and Kyoto Sightseeing Plan"
  );
});

test("複数日fallbackはlocale別の日数表現を使う", () => {
  const plan = createPlan({
    title: "京都午前観光",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
      [
        {
          time: "13:30",
          spot: "大阪城天守閣",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      plan,
      "ja"
    ).title
  ).toBe(
    "京都・大阪を巡る2日間観光プラン"
  );
  expect(
    normalizePlanTitleForTimeline(
      {
        ...plan,
        title: "Kyoto Morning Tour",
      },
      "en"
    ).title
  ).toBe(
    "2-Day Kyoto and Osaka Sightseeing Plan"
  );
});

test("地域解決不能では完全汎用fallbackを使う", () => {
  const plan = createPlan({
    title: "午前観光",
    days: [
      [
        {
          time: "13:30",
          spot: "Unknown Spot",
        },
      ],
    ],
  });

  expect(
    normalizePlanTitleForTimeline(
      plan,
      "ja"
    ).title
  ).toBe("おすすめ観光プラン");
  expect(
    normalizePlanTitleForTimeline(
      {
        ...plan,
        title: "Morning Tour",
      },
      "en"
    ).title
  ).toBe("Recommended Sightseeing Plan");
});

test("fallbackには監査対象の時間帯語を含めない", () => {
  const plan = createPlan({
    title: "Kyoto Morning Tour",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });
  const title =
    normalizePlanTitleForTimeline(
      plan,
      "en"
    ).title;

  expect(title).not.toMatch(
    /\b(?:morning|afternoon|evening)\b/iu
  );
});

test("normalizerはsummaryとdays/itemsを変更しない", () => {
  const plan = createPlan({
    title: "京都午前観光",
    summary: "Final normalized summary",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });
  const originalDays =
    structuredClone(plan.days);
  const result =
    normalizePlanTitleForTimeline(
      plan,
      "ja"
    );

  expect(result.summary).toBe(
    "Final normalized summary"
  );
  expect(result.days).toEqual(originalDays);
  expect(result.days).toBe(plan.days);
});

test("buildPlanResponse単体の旧保存Plan経路にはnormalizerを適用しない", () => {
  const savedPlan = createPlan({
    title: "京都午前観光",
    days: [
      [
        {
          time: "13:30",
          spot: "清水寺",
        },
      ],
    ],
  });

  expect(
    buildPlanResponse(savedPlan).title
  ).toBe("京都午前観光");
});
