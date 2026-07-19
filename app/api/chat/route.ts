import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-5",

      input: `
あなたはプロの旅行プランナーです。

ユーザーの希望に合わせて旅行プランを作成してください。

あなたはプロの旅行プランナーです。

必ずJSONのみ返してください。

JSON以外の文章は絶対に書かないでください。

以下のJSON形式を厳守してください。

{
  "title": "旅行プラン名",
  "summary": "旅行全体の概要",
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "09:00",
          "spot": "観光地名",
          "description": "説明"
        }
      ]
    }
  ]
}

時間は必ず HH:mm 形式にしてください。

spot は観光地名だけを書いてください。

description は1〜2文で簡潔にしてください。

ユーザーの希望

${message}
`,
    });

    console.log(response);

return NextResponse.json({
  message: response.output_text,
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