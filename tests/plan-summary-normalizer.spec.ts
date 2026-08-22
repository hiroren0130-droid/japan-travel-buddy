import { expect, test } from "@playwright/test";
import { normalizePlanSummary } from "../app/api/chat/planSummaryNormalizer";
import type { AITravelPlan } from "../app/api/chat/travelValidator";

const plan: AITravelPlan = {
  title: "Summary localization test",
  summary: "Original summary",
  days: [
    {
      day: 1,
      items: [
        "伏見稲荷大社",
        "清水寺",
        "祇園",
        "未登録スポット",
      ].map((spot) => ({
        time: "09:00",
        spot,
        description: "Test item",
        transport: "徒歩",
        duration: "0分",
      })),
    },
  ],
};

test("localizes known spot names in an English summary and keeps unknown names", () => {
  expect(
    normalizePlanSummary(plan, "en").summary
  ).toBe(
    "On day 1, visit Fushimi Inari Taisha, Kiyomizu-dera Temple, Gion, 未登録スポット in order."
  );
});

test("keeps the existing Japanese summary behavior", () => {
  expect(
    normalizePlanSummary(plan, "ja").summary
  ).toBe(
    "1日目は伏見稲荷大社、清水寺、祇園、未登録スポットの順に巡ります。"
  );
});
