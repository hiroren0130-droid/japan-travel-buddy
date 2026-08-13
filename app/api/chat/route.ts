import {
  NextRequest,
  NextResponse,
} from "next/server";

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

import {
  normalizePlanSummary,
} from "./planSummaryNormalizer";

type RequestBody = {
  message: string;
  days: number;
  specialRequest?: string;
  currentLocation?: CurrentLocation;
};

const MAX_REQUEST_BODY_BYTES =
  16 * 1024;

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_SPECIAL_REQUEST_LENGTH = 500;

function jsonResponse(
  body: object,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidCurrentLocation(
  value: unknown
): value is Exclude<CurrentLocation, null> {
  if (!isRecord(value)) {
    return false;
  }

  const { latitude, longitude } = value;

  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function validateRequestBody(
  value: unknown
):
  | {
      body: RequestBody;
    }
  | {
      error: string;
    } {
  if (!isRecord(value)) {
    return {
      error:
        "リクエスト本文はJSONオブジェクトで送信してください。",
    };
  }

  if (typeof value.message !== "string") {
    return {
      error: "messageは必須の文字列です。",
    };
  }

  const message = value.message.trim();

  if (!message) {
    return {
      error: "messageを入力してください。",
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `messageは${MAX_MESSAGE_LENGTH}文字以内で入力してください。`,
    };
  }

  if (
    value.specialRequest !== undefined &&
    typeof value.specialRequest !== "string"
  ) {
    return {
      error: "specialRequestは文字列で送信してください。",
    };
  }

  const specialRequest =
    typeof value.specialRequest === "string"
      ? value.specialRequest.trim()
      : "";

  if (
    specialRequest.length >
    MAX_SPECIAL_REQUEST_LENGTH
  ) {
    return {
      error: `specialRequestは${MAX_SPECIAL_REQUEST_LENGTH}文字以内で入力してください。`,
    };
  }

  if (
    typeof value.days !== "number" ||
    !Number.isInteger(value.days) ||
    value.days < 1 ||
    value.days > 14
  ) {
    return {
      error: "daysは1から14までの整数で指定してください。",
    };
  }

  if (
    value.currentLocation !== undefined &&
    value.currentLocation !== null &&
    !isValidCurrentLocation(
      value.currentLocation
    )
  ) {
    return {
      error:
        "currentLocationの緯度経度が不正です。",
    };
  }

  return {
    body: {
      message,
      days: value.days,
      specialRequest,
      currentLocation:
        value.currentLocation == null
          ? null
          : value.currentLocation,
    },
  };
}

export async function POST(
  request: NextRequest
) {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    contentType
      .split(";", 1)[0]
      .trim()
      .toLowerCase() !== "application/json"
  ) {
    return jsonResponse(
      {
        error:
          "Content-Typeはapplication/jsonを指定してください。",
      },
      415
    );
  }

  const contentLengthHeader =
    request.headers.get("content-length");

  if (contentLengthHeader) {
    const contentLength =
      Number(contentLengthHeader);

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_REQUEST_BODY_BYTES
    ) {
      return jsonResponse(
        {
          error:
            "リクエスト本文のサイズが上限を超えています。",
        },
        413
      );
    }
  }

  if (
    process.env.NODE_ENV === "production"
  ) {
    const origin =
      request.headers.get("origin");

    if (origin) {
      let requestOrigin: string;

      try {
        requestOrigin = new URL(origin).origin;
      } catch {
        return jsonResponse(
          {
            error:
              "許可されていないリクエストです。",
          },
          403
        );
      }

      if (
        requestOrigin !==
        request.nextUrl.origin
      ) {
        return jsonResponse(
          {
            error:
              "許可されていないリクエストです。",
          },
          403
        );
      }
    }
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(
      {
        error:
          "リクエスト本文を読み取れませんでした。",
      },
      400
    );
  }

  if (
    new TextEncoder().encode(rawBody).byteLength >
    MAX_REQUEST_BODY_BYTES
  ) {
    return jsonResponse(
      {
        error:
          "リクエスト本文のサイズが上限を超えています。",
      },
      413
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse(
      {
        error: "JSONの形式が不正です。",
      },
      400
    );
  }

  const validation =
    validateRequestBody(parsedBody);

  if ("error" in validation) {
    return jsonResponse(
      {
        error: validation.error,
      },
      400
    );
  }

  try {
    const requestStartedAt =
      performance.now();

    const {
      message,
      days: requestedDays,
      specialRequest = "",
      currentLocation = null,
    } = validation.body;

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
    const generateStartedAt =
      performance.now();

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

    console.log(
      "===== Performance: generateTravelPlan ====="
    );

    console.log(
      `${Math.round(
        performance.now() -
          generateStartedAt
      )}ms`
    );

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

      return jsonResponse(
        {
          error:
            "AIが不正な旅行プランを返しました。",
        },
        500
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

      return jsonResponse(
        {
          error:
            "指定された旅行日数でプランを生成できませんでした。",
        },
        500
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

    protectedStartSpotName:
      requestedStartSpotName,
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
    const improveStartedAt =
      performance.now();

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

    console.log(
      "===== Performance: improveTravelPlan ====="
    );

    console.log(
      `${Math.round(
        performance.now() -
          improveStartedAt
      )}ms`
    );

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

    protectedStartSpotName:
      requestedStartSpotName,
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

    const normalizedPlan =
  normalizePlanSummary(
    generatedPlan
  );

const plan =
  buildPlanResponse(
    normalizedPlan
  );

    console.log(
      "===== Performance: total ====="
    );

    console.log(
      `${Math.round(
        performance.now() -
          requestStartedAt
      )}ms`
    );

    return jsonResponse(
      {
        plan,
      },
      200
    );
  } catch (error) {
    console.error(
      "Travel plan generation error:",
      error
    );

    return jsonResponse(
      {
        error:
          "旅行プランの生成に失敗しました。",
      },
      500
    );
  }
}
