import {
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const TARGET_FILE = path.resolve(
  process.cwd(),
  "data",
  "kyoto.ts"
);

const MEAL_RECOMMENDATIONS: Record<
  string,
  boolean
> = {
  清水寺: true,
  伏見稲荷大社: true,
  金閣寺: false,
  銀閣寺: true,
  嵐山: true,
  竹林の小径: false,
  渡月橋: true,
  天龍寺: false,
  八坂神社: true,
  祇園: true,
  二条城: false,
  錦市場: true,
  平安神宮: true,
  南禅寺: false,
  永観堂: false,
  高台寺: true,
  建仁寺: true,
  三十三間堂: false,
  東寺: false,
  京都駅: true,
  東福寺: false,
  下鴨神社: false,
  上賀茂神社: false,
  京都御苑: true,
  北野天満宮: true,
  龍安寺: false,
  仁和寺: false,
  知恩院: true,
  青蓮院: true,
  哲学の道: true,
  東本願寺: true,
  西本願寺: true,
};

function getSpotObjectRanges(
  source: string
): Array<{
  start: number;
  end: number;
  text: string;
}> {
  const ranges: Array<{
    start: number;
    end: number;
    text: string;
  }> = [];

  let depth = 0;
  let objectStart = -1;
  let insideString = false;
  let escaped = false;

  for (
    let index = 0;
    index < source.length;
    index += 1
  ) {
    const character = source[index];

    if (insideString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === '"') {
        insideString = false;
      }

      continue;
    }

    if (character === '"') {
      insideString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;

      /*
       * depth 1は配列内の
       * 各Spotオブジェクトです。
       */
      if (depth === 1) {
        objectStart = index;
      }

      continue;
    }

    if (character === "}") {
      if (
        depth === 1 &&
        objectStart >= 0
      ) {
        ranges.push({
          start: objectStart,
          end: index + 1,
          text: source.slice(
            objectStart,
            index + 1
          ),
        });

        objectStart = -1;
      }

      depth -= 1;
    }
  }

  return ranges;
}

function getSpotName(
  block: string
): string | null {
  const match = block.match(
    /\bname:\s*"([^"]+)"/
  );

  return match?.[1] ?? null;
}

function addMealRecommended(
  block: string,
  value: boolean
): {
  block: string;
  updated: boolean;
  skipped: boolean;
} {
  if (
    /\bmealRecommended:\s*(true|false)/.test(
      block
    )
  ) {
    return {
      block,
      updated: false,
      skipped: true,
    };
  }

  const bestVisitTimePattern =
    /(\n\s*bestVisitTime:\s*"[^"]+",)/;

  if (
    !bestVisitTimePattern.test(
      block
    )
  ) {
    throw new Error(
      "bestVisitTimeが見つかりません。"
    );
  }

  return {
    block: block.replace(
      bestVisitTimePattern,
      `$1\n    mealRecommended: ${value},`
    ),
    updated: true,
    skipped: false,
  };
}

function run(): void {
  const originalSource =
    readFileSync(
      TARGET_FILE,
      "utf8"
    );

  const objectRanges =
    getSpotObjectRanges(
      originalSource
    );

  const blocksByName =
    new Map<
      string,
      {
        start: number;
        end: number;
        text: string;
      }
    >();

  for (const range of objectRanges) {
    const spotName =
      getSpotName(range.text);

    if (!spotName) {
      continue;
    }

    blocksByName.set(
      spotName,
      range
    );
  }

  const replacements: Array<{
    start: number;
    end: number;
    text: string;
  }> = [];

  let updatedCount = 0;
  let skippedCount = 0;

  console.log(
    "========================================"
  );
  console.log(
    "Meal Recommended Updater"
  );
  console.log(
    "========================================"
  );

  for (
    const [
      spotName,
      recommendation,
    ] of Object.entries(
      MEAL_RECOMMENDATIONS
    )
  ) {
    const range =
      blocksByName.get(
        spotName
      );

    if (!range) {
      throw new Error(
        `スポットが見つかりません: ${spotName}`
      );
    }

    const result =
      addMealRecommended(
        range.text,
        recommendation
      );

    if (result.updated) {
      replacements.push({
        start: range.start,
        end: range.end,
        text: result.block,
      });

      updatedCount += 1;

      console.log(
        `更新: ${spotName} → ${recommendation}`
      );
    }

    if (result.skipped) {
      skippedCount += 1;

      console.log(
        `維持: ${spotName}（設定済み）`
      );
    }
  }

  /*
   * 後ろの位置から置換し、
   * 文字位置のずれを防ぎます。
   */
  const sortedReplacements =
    replacements.sort(
      (first, second) =>
        second.start -
        first.start
    );

  let updatedSource =
    originalSource;

  for (
    const replacement of
    sortedReplacements
  ) {
    updatedSource =
      updatedSource.slice(
        0,
        replacement.start
      ) +
      replacement.text +
      updatedSource.slice(
        replacement.end
      );
  }

  writeFileSync(
    TARGET_FILE,
    updatedSource,
    "utf8"
  );

  console.log("");
  console.log(
    `更新件数: ${updatedCount}件`
  );
  console.log(
    `設定済み: ${skippedCount}件`
  );
  console.log(
    `対象合計: ${
      updatedCount +
      skippedCount
    }件`
  );
  console.log(
    "========================================"
  );
  console.log(
    "更新が完了しました。"
  );
  console.log(
    "========================================"
  );
}

try {
  run();
} catch (error) {
  console.error("");
  console.error(
    "更新に失敗しました。"
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exitCode = 1;
}