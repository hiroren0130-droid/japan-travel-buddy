import { expect, test } from "@playwright/test";

type PlanItem = {
  time?: unknown;
  spotId?: unknown;
  description?: unknown;
  transport?: unknown;
  duration?: unknown;
};

type PlanDay = {
  items?: unknown;
};

type Evaluation = {
  score?: unknown;
  businessHoursViolationCount?: unknown;
  scheduleConflictCount?: unknown;
};

type Plan = {
  title?: unknown;
  summary?: unknown;
  days?: unknown;
  evaluation?: unknown;
};

type ChatResponse = {
  plan?: unknown;
};

test("@api 京都1日プランのAPI契約を満たす", async ({ request }) => {
  test.setTimeout(180_000);

  const specialRequest =
    "伏見稲荷大社、清水寺、八坂神社に行きたい。移動が無駄にならない効率のいいルートでお願いします。";

  const response = await request.post("/api/chat", {
    data: {
      message: `
行き先: 京都
日数: 1日
人数: 1人
予算: 指定なし
興味: 人気スポット・グルメ

その他の希望:
伏見稲荷大社、清水寺、八坂神社に行きたい。移動が無駄にならない効率のいいルートでお願いします。
`,
      days: 1,
      specialRequest,
      currentLocation: null,
    },
  });

  expect(response.status()).toBe(200);

  const responseBody = (await response.json()) as ChatResponse;

  expect(responseBody.plan).toBeDefined();
  expect(typeof responseBody.plan).toBe("object");
  expect(responseBody.plan).not.toBeNull();

  const plan = responseBody.plan as Plan;

  expect(typeof plan.title).toBe("string");
  expect(typeof plan.summary).toBe("string");
  expect(Array.isArray(plan.days)).toBe(true);

  const days = plan.days as PlanDay[];

  expect(days).toHaveLength(1);
  expect(Array.isArray(days[0]?.items)).toBe(true);

  const items = days[0].items as PlanItem[];

  for (const item of items) {
    expect(typeof item.time).toBe("string");
    expect(typeof item.spotId).toBe("string");
    expect(typeof item.description).toBe("string");
    expect(typeof item.transport).toBe("string");
    expect(typeof item.duration).toBe("string");
  }

  expect(plan.evaluation).toBeDefined();
  expect(typeof plan.evaluation).toBe("object");
  expect(plan.evaluation).not.toBeNull();

  const evaluation = plan.evaluation as Evaluation;

  expect(typeof evaluation.score).toBe("number");
  expect(evaluation.businessHoursViolationCount).toBe(0);
  expect(evaluation.scheduleConflictCount).toBe(0);

  const spotIds = items.map((item) => item.spotId);

  expect(spotIds).toEqual(
    expect.arrayContaining([
      "fushimi-inari",
      "kiyomizudera",
      "yasaka-shrine",
    ])
  );
});
