import { expect, test } from "@playwright/test";

type QualityTestCase = {
  name: string;
  days: number;
  specialRequest: string;
  requiredSpotIds: string[];
  minimumScore: number;
  maximumLongDistanceMoveCount: number;
  maximumBroadAreaOverloadCount: number;
};

type Evaluation = {
  score: number;
  longDistanceMoveCount: number;
  broadAreaOverloadCount: number;
  businessHoursViolationCount: number;
  scheduleConflictCount: number;
};

type PlanItem = {
  spotId: string;
};

type PlanDay = {
  items: PlanItem[];
};

type ChatResponse = {
  plan?: {
    days?: PlanDay[];
    evaluation?: Evaluation;
  };
};

const qualityTestCases: QualityTestCase[] = [
  {
    name: "京都1日 定番ルート",
    days: 1,
    specialRequest:
      "伏見稲荷大社、清水寺、八坂神社に行きたい。移動が無駄にならない効率のいいルートでお願いします。",
    requiredSpotIds: [
      "fushimi-inari",
      "kiyomizudera",
      "yasaka-shrine",
    ],
    minimumScore: 90,
    maximumLongDistanceMoveCount: 0,
    maximumBroadAreaOverloadCount: 0,
  },
  {
    name: "京都2日 東西ルート",
    days: 2,
    specialRequest:
      "伏見稲荷大社、清水寺、銀閣寺、金閣寺、嵐山に行きたい。移動が無駄にならない効率のいいルートでお願いします。",
    requiredSpotIds: [
      "fushimi-inari",
      "kiyomizudera",
      "ginkakuji",
      "kinkakuji",
      "arashiyama",
    ],
    minimumScore: 90,
    maximumLongDistanceMoveCount: 1,
    maximumBroadAreaOverloadCount: 1,
  },
  {
    name: "京都3日 主要7スポット",
    days: 3,
    specialRequest:
      "伏見稲荷大社、清水寺、銀閣寺、金閣寺、嵐山、二条城、錦市場に行きたい。移動が無駄にならない効率のいいルートでお願いします。",
    requiredSpotIds: [
      "fushimi-inari",
      "kiyomizudera",
      "ginkakuji",
      "kinkakuji",
      "arashiyama",
      "nijo-castle",
      "nishiki-market",
    ],
    minimumScore: 90,
    maximumLongDistanceMoveCount: 1,
    maximumBroadAreaOverloadCount: 0,
  },
];

test.describe("@quality AI旅行プラン品質", () => {
  test.describe.configure({ mode: "serial" });

  for (const testCase of qualityTestCases) {
    test(`@quality ${testCase.name}`, async ({ request }) => {
      test.setTimeout(180_000);

      const response = await request.post("/api/chat", {
        data: {
          message: `
行き先: 京都
日数: ${testCase.days}日
人数: 1人
予算: 指定なし
興味: 人気スポット・グルメ

その他の希望:
${testCase.specialRequest}
`,
          days: testCase.days,
          specialRequest: testCase.specialRequest,
          currentLocation: null,
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = (await response.json()) as ChatResponse;
      const plan = responseBody.plan;

      expect(plan).toBeDefined();
      expect(plan?.evaluation).toBeDefined();

      if (!plan?.evaluation) {
        throw new Error("evaluation がAPIレスポンスにありません。");
      }

      const evaluation = plan.evaluation;

      console.log(`===== ${testCase.name} =====`);
      console.log(evaluation);

      expect(evaluation.businessHoursViolationCount).toBe(0);
      expect(evaluation.scheduleConflictCount).toBe(0);
      expect(evaluation.score).toBeGreaterThanOrEqual(testCase.minimumScore);
      expect(evaluation.longDistanceMoveCount).toBeLessThanOrEqual(
        testCase.maximumLongDistanceMoveCount
      );
      expect(evaluation.broadAreaOverloadCount).toBeLessThanOrEqual(
        testCase.maximumBroadAreaOverloadCount
      );

      expect(Array.isArray(plan.days)).toBe(true);
      expect(plan.days).toHaveLength(testCase.days);

      const spotIds = (plan.days ?? [])
        .flatMap((day) => day.items)
        .map((item) => item.spotId);

      expect(spotIds).toEqual(expect.arrayContaining(testCase.requiredSpotIds));
    });
  }
});
