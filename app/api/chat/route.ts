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
    const { message, currentLocation } = await req.json();

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

const spotList = nearestSpots
  .map((spot) => {
    return `・${spot.name}
エリア: ${spot.area}
カテゴリー: ${spot.category}
近くのスポット: ${
  spot.nearby && spot.nearby.length > 0
    ? spot.nearby.join("、")
    : "なし"
}`;
  })
  .join("\n\n");

    const response = await openai.responses.create({
      model: "gpt-5",

      input: `
あなたは日本旅行専門のプロ旅行プランナーです。

訪日外国人が実際に旅行することを想定し、
現実的・効率的・満足度の高い旅行プランを作成してください。

以下を必ず守ってください。
・旅行ルートは「近くのスポット」を優先して組み立てること。
・遠く離れたスポットを連続で配置しないこと。
・徒歩や公共交通機関で効率よく回れる順番にすること。
・同じスポットは1回だけ使用すること。
・移動距離が短くなる順番で観光する
・無理な移動はしない
・徒歩・電車・バスを現実的に選択する
・営業時間を考慮する
・昼食は12:00〜13:30頃に入れる
・必要なら15:00頃にカフェ休憩を入れる
・朝・昼・夕方で景色が良い時間帯を考慮する
・人気スポットは混雑しにくい時間を優先する
・最後はアクセスの良い場所で終了する
現在地情報がある場合は、その場所から近いエリアを優先してください。

必ずJSONのみ返してください。
JSON以外の文章・コードブロック・説明は一切書かないでください。

【重要】
・ユーザーが指定した日数分だけ days を作成すること。
・すべての日に十分な観光プランを作成すること。
・途中の日だけ内容が多く、最後の日が極端に少なくならないこと。

現在地情報が渡された場合は、その場所から近いエリアを優先して旅行プランを作成してください。

現在地:
${currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : "なし"}

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

ルール

・time は HH:mm
・spot は必ず下記「利用可能スポット一覧」の中から選ぶこと
・spot はスポット名のみ返すこと
・description は1〜2文
・transport は次スポットへの移動手段
・duration は移動時間
・営業時間・現実的な移動を考慮する
・一覧にないスポット名は絶対に作らない
・現在地に近いスポットを優先して選択すること
・利用可能スポット一覧以外は絶対に使用しない
・不明なスポットは生成しない
【旅行プラン作成ルール】
・午前中は人気観光地を優先すること。
・昼食は12:00〜13:30頃に入れること。
・15:00頃にカフェ休憩を入れてもよい。
・夕方は景色や街歩きを楽しめる場所を選ぶこと。
・営業終了時間を考慮すること。
・近くのスポットを優先してルートを組むこと。
・同じスポットは1回しか使用しないこと。
・徒歩または公共交通機関で無理なく移動できること。
・旅行者が実際に楽しめる現実的なプランにすること。
・days の全日程に items を4件以上含めること
・各日4〜6スポット訪問すること。
・各日最低4件以上の予定を入れること。
・日数に応じてスポット数を均等に配分すること。
・最後の日だけ1スポットで終了してはいけない。
・各日最低4スポット以上訪問すること
・時間順に並べること
・時間が重複しないこと
・旅行全体を通して同じスポットを重複して使用してはいけない。
・1つのスポットは旅行全体で1回だけ使用すること。

==========================
利用可能スポット一覧

${spotList}

==========================

ユーザーの希望

${message}
`,
    });

    const aiPlan = JSON.parse(response.output_text);

// 開発時のみ使用
console.log(JSON.stringify(aiPlan, null, 2));

    // Spot Databaseと紐付け
    const plan = {
      ...aiPlan,
      days: aiPlan.days.map((day: any) => ({
        ...day,
        items: day.items.map((item: any) => {
          const spot = getSpotByName(item.spot);

          return {
            time: item.time,
            spotId: spot?.id ?? "",
            description: item.description,
            transport: item.transport,
            duration: item.duration,
          };
        }),
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
      },
      {
        status: 500,
      }
    );
  }
}