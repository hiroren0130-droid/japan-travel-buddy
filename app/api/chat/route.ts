import { NextResponse } from "next/server";

import {
  getAllSpots,
} from "@/lib/spotService";

import {
  buildCandidateSpots,
  createSpotList,
  type CurrentLocation,
} from "./spotSelector";

import {
  pruneOptionalSpots,
} from "./optionalSpotPruner";

import {
  findRequestedStartSpotName,
} from "./startPointOptimizer";

import {
  optimizeGeneratedPlan,
} from "./planOptimizer";

import {
  generateTravelPlan,
} from "./travelPlanGenerator";

import {
  improveTravelPlan,
} from "./routeImprover";

import {
  isValidAITravelPlan,
} from "./travelValidator";

import {
  logPlanEvaluation,
} from "./routeLogger";

import {
  buildPlanResponse,
} from "./planResponseBuilder";

type RequestBody = {
  message?: string;
  days?: number;
  specialRequest?: string;
  currentLocation?: CurrentLocation;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const message =
      body.message?.trim() ?? "";

    const specialRequest =
      body.specialRequest?.trim() ??
      "";

    const currentLocation =
      body.currentLocation ?? null;

    const requestedDays =
      Number.isInteger(body.days) &&
      body.days != null &&
      body.days >= 1 &&
      body.days <= 14
        ? body.days
        : 2;

    const spots =
      getAllSpots();

    const requestText = `
${message}
${specialRequest}
`;

    const requestedStartSpotName =
      findRequestedStartSpotName({
        requestText,
        spots,
      });

    /*
     * 指定スポット、nearby候補、
     * 一般候補をまとめて取得します。
     */
    const {
      mentionedSpots,
      nearbySpots,
      candidateSpots,
    } = buildCandidateSpots({
      requestText,
      spots,
      currentLocation,
      limit: 12,
    });

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "===== Mentioned Spot Data ====="
      );

      console.log(
        mentionedSpots.map(
          (spot) => ({
            id: spot.id,
            name: spot.name,
            nearby:
              spot.nearby ?? [],
          })
        )
      );

      console.log(
        "===== Required Spots ====="
      );

      console.log(
        mentionedSpots.map(
          (spot) => spot.name
        )
      );

      console.log(
        "===== Nearby Spots ====="
      );

      console.log(
        nearbySpots.map(
          (spot) => spot.name
        )
      );

      console.log(
        "===== Candidate Spots ====="
      );

      console.log(
        candidateSpots.map(
          (spot) => spot.name
        )
      );
    }

    /*
     * 候補スポットをAI用の
     * JSON文字列へ変換します。
     */
    const spotList =
      createSpotList(
        candidateSpots
      );

    /*
     * 初回生成と、
     * 問題がある場合の
     * 1回だけの再生成を行います。
     */
    const {
      generatedPlan:
        generatedPlanResult,
      didRegenerate,
    } = await generateTravelPlan({
      spotList,
      message,
      requestedDays,
      specialRequest,
      currentLocation,
      requiredSpots:
        mentionedSpots,
      requestedStartSpotName,
    });

    let generatedPlan =
      generatedPlanResult;

    /*
     * 最終的なAIレスポンスを検証します。
     */
    if (
      !isValidAITravelPlan(
        generatedPlan
      )
    ) {
      console.error(
        "Invalid AI response:",
        generatedPlan
      );

      return NextResponse.json(
        {
          error:
            "AIが不正な旅行プランを返しました。",
        },
        {
          status: 500,
        }
      );
    }

    if (
      generatedPlan.days.length !==
      requestedDays
    ) {
      console.error(
        "Travel days mismatch:",
        {
          requestedDays,
          generatedDays:
            generatedPlan.days.length,
        }
      );

      return NextResponse.json(
        {
          error:
            "指定された旅行日数でプランを生成できませんでした。",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * まずローカル処理で、
     * 任意スポットの整理と
     * ルート・時刻・日程配分を改善します。
     *
     * AI再生成より先に実行することで、
     * TypeScript側だけで改善できる場合は
     * 追加のAI呼び出しを避けます。
     */
    generatedPlan =
      pruneOptionalSpots({
        plan:
          generatedPlan,

        requiredSpotNames:
          mentionedSpots.map(
            (spot) =>
              spot.name
          ),
      });

    generatedPlan =
      optimizeGeneratedPlan({
        plan:
          generatedPlan,

        startSpotName:
          requestedStartSpotName,
      });

    /*
     * ローカル最適化後も
     * Route Scoreなどに問題が残る場合だけ、
     * AI改善生成を試します。
     */
    generatedPlan =
      await improveTravelPlan({
        plan:
          generatedPlan,

        didRegenerate,
        spotList,
        message,
        requestedDays,
        specialRequest,
        currentLocation,

        requiredSpots:
          mentionedSpots,

        requestedStartSpotName,
      });

    /*
     * AI改善を行った場合も含め、
     * 最後にもう一度ローカル最適化します。
     */
    generatedPlan =
      pruneOptionalSpots({
        plan:
          generatedPlan,

        requiredSpotNames:
          mentionedSpots.map(
            (spot) =>
              spot.name
          ),
      });

    generatedPlan =
      optimizeGeneratedPlan({
        plan:
          generatedPlan,

        startSpotName:
          requestedStartSpotName,
      });

    /*
     * 採用する旅行プランと
     * 最終評価を表示します。
     */
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "===== AI Travel Plan ====="
      );

      console.log(
        JSON.stringify(
          generatedPlan,
          null,
          2
        )
      );

      logPlanEvaluation(
        generatedPlan
      );
    }

    const plan =
      buildPlanResponse(
        generatedPlan
      );

    return NextResponse.json({
      plan,
    });
  } catch (error) {
    console.error(
      "Travel plan generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "旅行プランの生成に失敗しました。",

        detail:
          error instanceof Error
            ? error.message
            : JSON.stringify(
                error
              ),
      },
      {
        status: 500,
      }
    );
  }
}