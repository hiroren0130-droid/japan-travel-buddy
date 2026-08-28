import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAllSpots,
} from "@/lib/spotService";
import {
  normalizeLocale,
  type Locale,
} from "@/lib/locale";

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
  containsRequiredSpots,
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

import {
  getEstimatedDayEndMinutes,
  hasLimitedScheduleRequest,
} from "./planCompleteness";

import {
  getRequiredSpotsByIds,
  mergeRequiredSpots,
  validateRequiredSpotIds,
} from "./requiredSpots";

type RequestBody = {
  message: string;
  days: number;
  locale: Locale;
  specialRequest?: string;
  startLocation?: string;
  startTime?: string;
  endLocation?: string;
  endTime?: string;
  currentLocation?: CurrentLocation;
  requiredSpotIds?: string[];
};

const MAX_REQUEST_BODY_BYTES =
  16 * 1024;

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_SPECIAL_REQUEST_LENGTH = 500;
const MAX_LOCATION_LENGTH = 200;

const TIME_PATTERN =
  /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const RATE_LIMIT_WINDOW_MS =
  10 * 60 * 1_000;

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_ENTRIES = 10_000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;

const MAX_CONCURRENT_GENERATIONS = 3;
const CONCURRENCY_RETRY_AFTER_SECONDS = 10;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

/*
 * 補助防御です。Serverlessではインスタンス間で共有されず、
 * コールドスタートや再デプロイで状態が失われます。
 */
const rateLimitEntries =
  new Map<string, RateLimitEntry>();

let lastRateLimitCleanupAt = 0;
let activeGenerationCount = 0;

function jsonResponse(
  body: object,
  status: number,
  additionalHeaders: Record<
    string,
    string
  > = {}
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...additionalHeaders,
    },
  });
}

function getClientIdentifier(
  request: NextRequest
): string {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const forwardedClient =
    forwardedFor
      ?.split(",", 1)[0]
      ?.trim();

  if (forwardedClient) {
    return forwardedClient;
  }

  const realIp =
    request.headers
      .get("x-real-ip")
      ?.trim();

  return realIp || "unknown-client";
}

function cleanupRateLimitEntries(
  now: number
) {
  const cleanupIsDue =
    now - lastRateLimitCleanupAt >=
    RATE_LIMIT_CLEANUP_INTERVAL_MS;

  if (
    !cleanupIsDue &&
    rateLimitEntries.size <
      RATE_LIMIT_MAX_ENTRIES
  ) {
    return;
  }

  for (
    const [clientId, entry]
    of rateLimitEntries
  ) {
    if (entry.resetAt <= now) {
      rateLimitEntries.delete(clientId);
    }
  }

  while (
    rateLimitEntries.size >=
    RATE_LIMIT_MAX_ENTRIES
  ) {
    const oldestClientId =
      rateLimitEntries.keys().next()
        .value;

    if (typeof oldestClientId !== "string") {
      break;
    }

    rateLimitEntries.delete(
      oldestClientId
    );
  }

  lastRateLimitCleanupAt = now;
}

function checkRateLimit(
  clientId: string,
  now = Date.now()
): RateLimitResult {
  cleanupRateLimitEntries(now);

  const entry =
    rateLimitEntries.get(clientId);

  if (!entry || entry.resetAt <= now) {
    rateLimitEntries.set(clientId, {
      count: 1,
      resetAt:
        now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
    };
  }

  if (
    entry.count >=
    RATE_LIMIT_MAX_REQUESTS
  ) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        Math.ceil(
          (entry.resetAt - now) /
            1_000
        ),
        1
      ),
    };
  }

  entry.count += 1;
  rateLimitEntries.set(clientId, entry);

  return {
    allowed: true,
  };
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

  const normalizeOptionalLocation = (
    valueToNormalize: unknown,
    fieldName: string
  ):
    | { value?: string }
    | { error: string } => {
    if (valueToNormalize === undefined) {
      return {};
    }

    if (typeof valueToNormalize !== "string") {
      return {
        error: `${fieldName}は文字列で送信してください。`,
      };
    }

    const normalizedValue =
      valueToNormalize.trim();

    if (!normalizedValue) {
      return {};
    }

    if (
      normalizedValue.length >
      MAX_LOCATION_LENGTH
    ) {
      return {
        error: `${fieldName}は${MAX_LOCATION_LENGTH}文字以内で入力してください。`,
      };
    }

    return {
      value: normalizedValue,
    };
  };

  const normalizeOptionalTime = (
    valueToNormalize: unknown,
    fieldName: string
  ):
    | { value?: string }
    | { error: string } => {
    if (valueToNormalize === undefined) {
      return {};
    }

    if (typeof valueToNormalize !== "string") {
      return {
        error: `${fieldName}はHH:mm形式の文字列で送信してください。`,
      };
    }

    const normalizedValue =
      valueToNormalize.trim();

    if (!normalizedValue) {
      return {};
    }

    if (!TIME_PATTERN.test(normalizedValue)) {
      return {
        error: `${fieldName}はHH:mm形式の有効な時刻で入力してください。`,
      };
    }

    return {
      value: normalizedValue,
    };
  };

  const startLocationResult =
    normalizeOptionalLocation(
      value.startLocation,
      "startLocation"
    );

  if ("error" in startLocationResult) {
    return startLocationResult;
  }

  const startTimeResult =
    normalizeOptionalTime(
      value.startTime,
      "startTime"
    );

  if ("error" in startTimeResult) {
    return startTimeResult;
  }

  const endLocationResult =
    normalizeOptionalLocation(
      value.endLocation,
      "endLocation"
    );

  if ("error" in endLocationResult) {
    return endLocationResult;
  }

  const endTimeResult =
    normalizeOptionalTime(
      value.endTime,
      "endTime"
    );

  if ("error" in endTimeResult) {
    return endTimeResult;
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
      locale: normalizeLocale(
        value.locale
      ),
      specialRequest,
      startLocation:
        startLocationResult.value,
      startTime:
        startTimeResult.value,
      endLocation:
        endLocationResult.value,
      endTime:
        endTimeResult.value,
      currentLocation:
        value.currentLocation == null
          ? null
          : value.currentLocation,
      requiredSpotIds:
        validateRequiredSpotIds(
          value.requiredSpotIds
        ),
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

  if (
    process.env.NODE_ENV === "production"
  ) {
    const rateLimitResult =
      checkRateLimit(
        getClientIdentifier(request)
      );

    if (!rateLimitResult.allowed) {
      return jsonResponse(
        {
          error:
            "リクエストが多すぎます。しばらく待ってから再度お試しください。",
        },
        429,
        {
          "Retry-After": String(
            rateLimitResult
              .retryAfterSeconds
          ),
        }
      );
    }
  }

  let hasGenerationSlot = false;

  try {
    const requestStartedAt =
      performance.now();

    const {
      message,
      days: requestedDays,
      locale,
      specialRequest = "",
      startLocation,
      startTime,
      endLocation,
      endTime,
      currentLocation = null,
      requiredSpotIds = [],
    } = validation.body;

    const spots =
      getAllSpots();

    const requestText = `
${message}
${specialRequest}
`;

    const enforceFullDayCoverage =
      requestedDays === 1 &&
      !hasLimitedScheduleRequest(
        requestText
      );

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

    const discoverRequiredSpots =
      getRequiredSpotsByIds(
        requiredSpotIds
      );
    const requiredSpots =
      mergeRequiredSpots(
        discoverRequiredSpots,
        mentionedSpots
      );
    const candidateSpotsWithRequired =
      mergeRequiredSpots(
        requiredSpots,
        candidateSpots
      );

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
        requiredSpots.map(
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
        candidateSpotsWithRequired
      );

    if (
      activeGenerationCount >=
      MAX_CONCURRENT_GENERATIONS
    ) {
      return jsonResponse(
        {
          error:
            "現在リクエストが集中しています。しばらく待ってから再度お試しください。",
        },
        429,
        {
          "Retry-After": String(
            CONCURRENCY_RETRY_AFTER_SECONDS
          ),
        }
      );
    }

    activeGenerationCount += 1;
    hasGenerationSlot = true;

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
      effectiveStartTime,
    } = await generateTravelPlan({
      spotList,
      message,
      requestedDays,
      locale,
      specialRequest,
      startLocation,
      startTime,
      endLocation,
      endTime,
      currentLocation,
      requiredSpots,
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

    if (
      !containsRequiredSpots(
        generatedPlan,
        requiredSpots
      )
    ) {
      return jsonResponse(
        {
          error:
            "指定されたスポットを含む旅行プランを生成できませんでした。",
        },
        500
      );
    }

    const requiredCompletePlan =
      generatedPlan;

    /*
     * まずローカル処理で、
     * 任意スポットの整理と
     * ルート・時刻・日程配分を改善します。
     *
     * AI再生成より先に実行することで、
     * TypeScript側だけで改善できる場合は
     * 追加のAI呼び出しを避けます。
     */
    const locallyPrunedPlan =
      pruneOptionalSpots({
    plan:
      generatedPlan,

    requiredSpotNames:
      requiredSpots.map(
        (spot) =>
          spot.name
      ),

    protectedStartSpotName:
      requestedStartSpotName,
    startLocation,
    endLocation,
    startTime:
      effectiveStartTime,
    endTime,
    enforceFullDayCoverage,
      });

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "===== Spot Count: First Pruner =====",
        {
          before: generatedPlan.days.map(
            (day) => day.items.length
          ),
          after: locallyPrunedPlan.days.map(
            (day) => day.items.length
          ),
        }
      );
    }

    generatedPlan =
      containsRequiredSpots(
        locallyPrunedPlan,
        requiredSpots
      )
        ? locallyPrunedPlan
        : requiredCompletePlan;

    generatedPlan =
      optimizeGeneratedPlan({
        plan:
          generatedPlan,

        startSpotName:
          requestedStartSpotName,
        locale,
        startTime:
          effectiveStartTime,
        startLocation,
        endLocation,
        requiredSpotNames:
          requiredSpots.map(
            (spot) => spot.name
          ),
      });

    /*
     * ローカル最適化後も
     * Route Scoreなどに問題が残る場合だけ、
     * AI改善生成を試します。
     */
    const improveStartedAt =
      performance.now();

    const planBeforeAiImprovement =
      generatedPlan;

    const improvedPlan =
      await improveTravelPlan({
        plan:
          generatedPlan,

        didRegenerate,
        spotList,
        message,
        requestedDays,
        locale,
        specialRequest,
        currentLocation,

        requiredSpots,

        requestedStartSpotName,
        startLocation,
        endLocation,
        startTime:
          effectiveStartTime,
        endTime,
      });

    generatedPlan =
      containsRequiredSpots(
        improvedPlan,
        requiredSpots
      )
        ? improvedPlan
        : planBeforeAiImprovement;

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
    const finalPrunedPlan =
      pruneOptionalSpots({
    plan:
      generatedPlan,

    requiredSpotNames:
      requiredSpots.map(
        (spot) =>
          spot.name
      ),

    protectedStartSpotName:
      requestedStartSpotName,
    startLocation,
    endLocation,
    startTime:
      effectiveStartTime,
    endTime,
    enforceFullDayCoverage,
      });

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "===== Spot Count: Final Pruner =====",
        {
          before: generatedPlan.days.map(
            (day) => day.items.length
          ),
          after: finalPrunedPlan.days.map(
            (day) => day.items.length
          ),
        }
      );
    }

    generatedPlan =
      containsRequiredSpots(
        finalPrunedPlan,
        requiredSpots
      )
        ? finalPrunedPlan
        : generatedPlan;

    generatedPlan =
      optimizeGeneratedPlan({
        plan:
          generatedPlan,

        startSpotName:
          requestedStartSpotName,
        locale,
        startTime:
          effectiveStartTime,
        startLocation,
        endLocation,
        requiredSpotNames:
          requiredSpots.map(
            (spot) => spot.name
          ),
      });

    if (
      !containsRequiredSpots(
        generatedPlan,
        requiredSpots
      )
    ) {
      generatedPlan = requiredCompletePlan;
    }

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
    generatedPlan,
    locale
  );

const plan =
  buildPlanResponse(
    normalizedPlan,
    {
      startLocation,
      startTime,
      endLocation,
      endTime,
    }
  );

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "===== Final Response Audit =====",
        {
          spotCounts: plan.days.map(
            (day) => day.items.length
          ),
          estimatedEndMinutes:
            normalizedPlan.days.map(
              getEstimatedDayEndMinutes
            ),
        }
      );
    }

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
  } finally {
    if (hasGenerationSlot) {
      activeGenerationCount =
        Math.max(
          activeGenerationCount - 1,
          0
        );
    }
  }
}
