import {
  expect,
  test,
} from "@playwright/test";

type TravelTestCase = {
  name: string;
  days: string;
  request: string;
  requiredSpots: string[];
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

type ChatResponse = {
  plan?: {
    evaluation?: Evaluation;
  };
};

const travelTestCases:
  TravelTestCase[] = [
    {
      name:
        "京都1日 定番ルート",

      days:
        "1",

      request:
        "伏見稲荷大社、清水寺、八坂神社に行きたい。移動が無駄にならない効率のいいルートでお願いします。",

      requiredSpots: [
        "伏見稲荷大社",
        "清水寺",
        "八坂神社",
      ],

      minimumScore:
        90,

      maximumLongDistanceMoveCount:
        0,

      maximumBroadAreaOverloadCount:
        0,
    },

    {
      name:
        "京都2日 東西ルート",

      days:
        "2",

      request:
        "伏見稲荷大社、清水寺、銀閣寺、金閣寺、嵐山に行きたい。移動が無駄にならない効率のいいルートでお願いします。",

      requiredSpots: [
        "伏見稲荷大社",
        "清水寺",
        "銀閣寺",
        "金閣寺",
        "嵐山",
      ],

      minimumScore:
        90,

      maximumLongDistanceMoveCount:
        1,

      maximumBroadAreaOverloadCount:
        1,
    },

    {
      name:
        "京都3日 主要7スポット",

      days:
        "3",

      request:
        "伏見稲荷大社、清水寺、銀閣寺、金閣寺、嵐山、二条城、錦市場に行きたい。移動が無駄にならない効率のいいルートでお願いします。",

      requiredSpots: [
        "伏見稲荷大社",
        "清水寺",
        "銀閣寺",
        "金閣寺",
        "嵐山",
        "二条城",
        "錦市場",
      ],

      minimumScore:
        90,

      maximumLongDistanceMoveCount:
        1,

      maximumBroadAreaOverloadCount:
        0,
    },
  ];

test.describe(
  "Japan Travel Buddy",
  () => {
    test.setTimeout(
      180_000
    );

    for (
      const testCase
      of travelTestCases
    ) {
      test(
        testCase.name,
        async ({ page }) => {
          await page.goto(
            "/chat"
          );

          await page
            .locator(
              "#travel-destination"
            )
            .fill(
              "京都"
            );

          await page
            .locator(
              "#travel-days"
            )
            .selectOption(
              testCase.days
            );

          await page
            .locator(
              "#travel-travelers"
            )
            .selectOption(
              "1"
            );

          await page
            .locator(
              "#travel-special-request"
            )
            .fill(
              testCase.request
            );

          const submitButton =
            page.getByRole(
              "button",
              {
                name:
                  "✨ AIで旅行プランを作成",
              }
            );

          await expect(
            submitButton
          ).toBeEnabled();

          const responsePromise =
            page.waitForResponse(
              (response) =>
                response
                  .url()
                  .includes(
                    "/api/chat"
                  ) &&
                response
                  .request()
                  .method() ===
                  "POST",
              {
                timeout:
                  150_000,
              }
            );

          await submitButton.click();

          const response =
            await responsePromise;

          expect(
            response.status()
          ).toBe(
            200
          );

          const responseBody =
  (await response.json()) as ChatResponse;

          expect(
  responseBody.plan?.evaluation
).toBeDefined();

const evaluation =
  responseBody.plan?.evaluation;

          if (!evaluation) {
            throw new Error(
              "evaluation がAPIレスポンスにありません。"
            );
          }

          console.log(
            `===== ${testCase.name} =====`
          );

          console.log(
            evaluation
          );

          expect(
            evaluation.businessHoursViolationCount
          ).toBe(
            0
          );

          expect(
            evaluation.scheduleConflictCount
          ).toBe(
            0
          );

          expect(
            evaluation.score
          ).toBeGreaterThanOrEqual(
            testCase.minimumScore
          );

          expect(
            evaluation.longDistanceMoveCount
          ).toBeLessThanOrEqual(
            testCase.maximumLongDistanceMoveCount
          );

          expect(
            evaluation.broadAreaOverloadCount
          ).toBeLessThanOrEqual(
            testCase.maximumBroadAreaOverloadCount
          );

          const pageText =
            await page
              .locator(
                "body"
              )
              .innerText();

          for (
            const spot
            of testCase
              .requiredSpots
          ) {
            expect(
              pageText
            ).toContain(
              spot
            );
          }
        }
      );
    }
  }
);