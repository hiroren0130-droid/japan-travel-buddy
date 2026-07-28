import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import {
  getSpotByName,
  getAllSpots,
} from "@/lib/spotService";

import { calculateDistance } from "@/lib/distance";
import { sortByNearest } from "@/lib/routeOptimizer";
export async function POST(req: Request) {
  try {
    const {
  message,
  specialRequest,
  currentLocation,
} = await req.json();

    const spots = getAllSpots();

    let nearestSpots = spots;

if (currentLocation) {
  nearestSpots = [...spots]
    .map((spot) => ({
      ...spot,
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        spot.latitude,
        spot.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 30);
}
if (currentLocation) {
  nearestSpots = sortByNearest(
    nearestSpots,
    currentLocation.latitude,
    currentLocation.longitude
  );
}

// ユーザーの希望に応じてスポットを絞り込む
const userMessage = message.toLowerCase();

let candidateSpots = nearestSpots;

if (userMessage.includes("寺") || userMessage.includes("神社")) {
  candidateSpots = nearestSpots.filter(
    (spot) =>
      spot.category === "寺院" ||
      spot.category === "神社"
  );
}

if (userMessage.includes("自然")) {
  candidateSpots = nearestSpots.filter(
    (spot) => spot.category === "自然"
  );
}

if (
  userMessage.includes("グルメ") ||
  userMessage.includes("食べ歩き")
) {
  candidateSpots = nearestSpots.filter(
    (spot) => spot.category === "市場"
  );
}

// 条件に一致しなかった場合は元の一覧を使用
if (candidateSpots.length === 0) {
  candidateSpots = nearestSpots;
}

const spotList = candidateSpots
  .map((spot) => {
    return `・${spot.name}
エリア: ${spot.area}
カテゴリー: ${spot.category}
おすすめ時間帯: ${spot.bestVisitTime ?? "指定なし"}
滞在目安: ${spot.recommendedStay ?? "60分"}
営業時間: ${spot.hours ?? "不明"}
住所: ${spot.address ?? "不明"}
近くのスポット: ${
  spot.nearby?.join("、") ?? "なし"
}`;
  })
  .join("\n\n");

    const response = await openai.responses.create({
      model: "gpt-5",

      text: {
    format: {
      type: "json_schema",
      name: "travel_plan",
      strict: true,
      schema: {
  type: "object",
  additionalProperties: false,

  properties: {
    title: {
      type: "string",
    },

    summary: {
      type: "string",
    },

    days: {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      day: {
        type: "number",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            time: {
              type: "string",
            },
            spot: {
              type: "string",
            },
            description: {
              type: "string",
            },
            transport: {
              type: "string",
            },
            duration: {
              type: "string",
            },
          },
          required: [
            "time",
            "spot",
            "description",
            "transport",
            "duration",
          ],
        },
      },
    },
    required: ["day", "items"],
  },
},
  },

  required: ["title", "summary", "days"],
},
    },
  },

      input: `
あなたは日本旅行専門のAI旅行プランナーです。

目的
訪日外国人が安心して旅行を楽しめる、現実的で効率的な旅行プランを作成してください。

────────────────────────
【必須ルール】
────────────────────────

・必ずJSONのみ返すこと
・JSON Schemaに完全準拠すること
・コードブロックや説明文は一切書かないこと

・spot は利用可能スポット一覧からのみ選択すること
・存在しないスポットは絶対に作らないこと
・旅行全体で同じスポットは1回だけ使用すること

────────────────────────
【旅行品質ルール】
────────────────────────

・近くのスポットを優先してルートを組む
・エリアごとにまとめて観光する
・徒歩または公共交通機関で無理なく移動する
・営業時間を考慮する
・移動距離をできるだけ短くする
・人気スポットは混雑しにくい時間帯を優先する
・朝・昼・夕方に適したスポットを配置する
・スポット情報に「おすすめ時間帯（bestVisitTime）」がある場合は優先して使用する
・スポット情報に「滞在目安（recommendedStay）」がある場合は滞在時間の参考にする
・最後はアクセスしやすい場所で終了する
・各スポットは「滞在目安（recommendedStay）」だけ滞在したものとして予定を組むこと
・スポット間の移動時間も考慮し、現実的な開始時間にすること
・時間が足りない場合はスポット数を減らしてもよい
・「追加の希望」がある場合は最優先で反映してください。
・「その他のご希望」が入力されている場合は、その内容を最優先で旅行プランへ反映してください。
・追加の希望と通常ルールが競合する場合は、追加の希望を優先してください。
・追加の希望を満たすスポット・ルート・時間帯を積極的に提案してください。

────────────────────────
【食事・休憩】
────────────────────────

・昼食は12:00〜13:30頃に配置する
・必要に応じて15:00頃にカフェ休憩を入れてよい

────────────────────────
【日程ルール】
────────────────────────

・ユーザーが指定した日数分だけ days を作成する
・各日4〜6スポット程度を配置する
・各日に最低4件以上の予定を入れる
・全日程へ均等にスポットを配分する
・最後の日だけ極端に少なくしない
・time は HH:mm 形式とする
・時間が重複しないようにする
・スポット間の移動時間と recommendedStay を考慮して、無理のない時間配分にする
・09:00〜18:00頃までで無理のないスケジュールにする
・滞在時間と移動時間が重ならないようにする
・時間に余裕を持たせる

────────────────────────
【現在地】
────────────────────────

現在地情報がある場合は、その周辺エリアから旅行を開始する。

現在地

${currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : "なし"}

────────────────────────
【出力例】
────────────────────────

{
  "title": "旅行プラン名",
  "summary": "旅行全体の概要",
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "09:00",
          "spot": "清水寺",
          "description": "京都を代表する世界遺産を散策します。",
          "transport": "徒歩",
          "duration": "15分"
        }
      ]
    }
  ]
}

────────────────────────
【利用可能スポット一覧】
────────────────────────

${spotList}

────────────────────────
【ユーザーの希望】
────────────────────────

旅行条件
${message}

追加の希望
${specialRequest || "なし"}
`,
    });

    let aiPlan;

try {
  aiPlan = JSON.parse(response.output_text);
} catch {
  console.error("JSON Parse Error:", response.output_text);

  return NextResponse.json(
    {
      error: "AIが正しい旅行プランを生成できませんでした。",
    },
    {
      status: 500,
    }
  );
}

if (
  !aiPlan ||
  typeof aiPlan !== "object" ||
  !Array.isArray(aiPlan.days)
) {
  console.error("Invalid AI response:", aiPlan);

  return NextResponse.json(
    {
      error: "AIが不正な旅行プランを返しました。",
    },
    {
      status: 500,
    }
  );
}

if (process.env.NODE_ENV === "development") {
  console.log("===== AI Travel Plan =====");
  console.log(JSON.stringify(aiPlan, null, 2));
}

type AIPlanItem = {
  time: string;
  spot: string;
  description: string;
  transport: string;
  duration: string;
};

type AIPlanDay = {
  items: AIPlanItem[];
};

    // Spot Databaseと紐付け
    const plan = {
      ...aiPlan,
      days: aiPlan.days.map((day: AIPlanDay) => ({
        ...day,
        items: day.items
  .map((item: AIPlanItem) => {
    const spot = getSpotByName(item.spot);

    // Spot Databaseに存在しないスポットは除外
    if (!spot) {
      console.warn(`Spot not found: ${item.spot}`);
      return null;
    }

    return {
      time: item.time,
      spotId: spot.id,
      description: item.description,
      transport: item.transport,
      duration: item.duration,
    };
  })
  .filter(
    (
      item
    ): item is {
      time: string;
      spotId: string;
      description: string;
      transport: string;
      duration: string;
    } => item !== null
  ),
      })),
    };

    return NextResponse.json({
      message: response.output_text,
      plan,
    });
  } catch (error) {
  console.error("OpenAI Error:", error);

  return NextResponse.json(
    {
      error: "旅行プランの生成に失敗しました。",
      detail:
        error instanceof Error
          ? error.message
          : JSON.stringify(error),
    },
    {
      status: 500,
    }
  );
}
}