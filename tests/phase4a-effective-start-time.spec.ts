import { expect, test } from "@playwright/test";

import {
  estimateLocationTravel,
} from "@/app/api/chat/locationTravelEstimator";
import {
  optimizeGeneratedPlan,
} from "@/app/api/chat/planOptimizer";
import {
  getLimitedScheduleIntent,
  hasLimitedScheduleRequest,
} from "@/app/api/chat/planCompleteness";
import {
  resolveEffectiveStartTime,
} from "@/app/api/chat/startTimePolicy";
import {
  optimizeTravelPlanTimes,
} from "@/app/api/chat/timeOptimizer";
import type {
  AITravelPlan,
} from "@/app/api/chat/travelValidator";

function createPlan({
  firstTime = "13:30",
  spots = ["清水寺", "祇園"],
}: {
  firstTime?: string;
  spots?: string[];
} = {}): AITravelPlan {
  return {
    title: "Phase 4A test",
    summary: "Phase 4A test plan",
    days: [
      {
        day: 1,
        items: spots.map(
          (spot, index) => ({
            time:
              index === 0
                ? firstTime
                : "15:00",
            spot,
            description: `${spot}を観光します。`,
            transport:
              index === 0
                ? "徒歩"
                : "バス",
            duration:
              index === 0
                ? "0分"
                : "20分",
          })
        ),
      },
    ],
  };
}

test("通常の全日観光はraw先頭13:30より09:00を優先する", () => {
  const plan = createPlan();
  const effectiveStartTime =
    resolveEffectiveStartTime({
      plan,
      requestText: "京都を1日観光したい",
    });
  const result = optimizeGeneratedPlan({
    plan,
    startSpotName: null,
    locale: "ja",
    startTime: effectiveStartTime,
  });

  expect(effectiveStartTime).toBe("09:00");
  expect(result.days[0].items[0].time).toBe("09:00");
});

test("午後のみとevening中心は有効なAI先頭時刻を保持する", () => {
  const plan = createPlan();

  expect(
    resolveEffectiveStartTime({
      plan,
      requestText: "午後のみ観光したい",
    })
  ).toBe("13:30");
  expect(
    resolveEffectiveStartTime({
      plan,
      requestText: "evening focused plan",
    })
  ).toBe("13:30");
});

test("方向不明のhalf-dayはAI時刻を保持しmorning onlyは09:00にする", () => {
  const plan = createPlan();

  expect(
    getLimitedScheduleIntent("half-day plan")
  ).toBe("generic");
  expect(
    getLimitedScheduleIntent("morning only")
  ).toBe("morning");
  expect(
    hasLimitedScheduleRequest("half-day plan")
  ).toBe(true);
  expect(
    resolveEffectiveStartTime({
      plan,
      requestText: "half-day plan",
    })
  ).toBe("13:30");
  expect(
    resolveEffectiveStartTime({
      plan,
      requestText: "morning only",
    })
  ).toBe("09:00");
});

test("明示startTimeはraw先頭時刻とintentより優先する", () => {
  expect(
    resolveEffectiveStartTime({
      plan: createPlan({
        firstTime: "09:00",
      }),
      requestText: "午後のみ観光したい",
      startTime: "13:30",
    })
  ).toBe("13:30");
});

test("startSpotNameはfirst Spotを固定し09:00基準を使う", () => {
  const result = optimizeGeneratedPlan({
    plan: createPlan({
      spots: ["祇園", "清水寺"],
    }),
    startSpotName: "清水寺",
    locale: "ja",
    startTime: "09:00",
  });

  expect(result.days[0].items[0]).toMatchObject({
    spot: "清水寺",
    time: "09:00",
  });
});

test("startLocation未指定時刻は09:00出発と既存移動時間を反映する", () => {
  const travel = estimateLocationTravel({
    location: "京都駅",
    spotName: "清水寺",
  });

  expect(travel).not.toBeNull();

  const result = optimizeGeneratedPlan({
    plan: createPlan({
      spots: ["清水寺"],
    }),
    startSpotName: null,
    locale: "ja",
    startTime: "09:00",
    startLocation: "京都駅",
  });
  const expectedMinutes =
    9 * 60 + travel!.durationMinutes;
  const expectedTime = `${String(
    Math.floor(expectedMinutes / 60)
  ).padStart(2, "0")}:${String(
    expectedMinutes % 60
  ).padStart(2, "0")}`;

  expect(result.days[0].items[0].time).toBe(
    expectedTime
  );
});

test("first Spotが10:00開門なら09:00基準を10:00へ遅延する", () => {
  const result = optimizeTravelPlanTimes(
    createPlan({
      firstTime: "13:30",
      spots: ["建仁寺"],
    }),
    "09:00"
  );

  expect(result.days[0].items[0].time).toBe("10:00");
});

test("Time Optimizer単体はinvalid raw timeを09:00へfallbackする", () => {
  const result = optimizeTravelPlanTimes(
    createPlan({
      firstTime: "invalid",
      spots: ["清水寺"],
    })
  );

  expect(result.days[0].items[0].time).toBe("09:00");
});
