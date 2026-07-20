import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getSpotByName } from "@/lib/spotService";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-5",

      input: `
あなたは日本旅行専門のプロ旅行プランナーです。

ユーザーの条件に合わせて、現実的で効率の良い旅行プランを作成してください。

必ずJSONのみ返してください。
JSON以外の文章・コードブロック・説明は一切書かないでください。

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
・spot はスポット名のみ
・description は1〜2文
・transport は次スポットへの移動手段
・duration は移動時間
・営業時間・現実的な移動を考慮する

ユーザーの希望

${message}
`,
    });

    const aiPlan = JSON.parse(response.output_text);

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