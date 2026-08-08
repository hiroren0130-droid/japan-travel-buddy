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

const SPOT_HOURS: Record<
  string,
  string
> = {
  南禅寺: "08:40〜16:00",
  三十三間堂: "09:00〜16:00",
  東寺: "08:00〜17:00",
  東福寺: "09:00〜15:30",
  建仁寺: "10:00〜16:30",
  高台寺: "09:00〜17:30",
  永観堂: "09:00〜17:00",

  平安神宮: "06:00〜17:00",
  下鴨神社: "06:30〜17:00",
  上賀茂神社: "05:30〜17:00",
  北野天満宮: "07:00〜17:00",

  銀閣寺: "09:00〜16:30",
  龍安寺: "08:30〜16:30",
  仁和寺: "09:00〜16:30",
  知恩院: "09:00〜15:50",
    青蓮院: "09:00〜16:30",
  東本願寺: "06:20〜16:30",
  西本願寺: "05:30〜17:00",
};

type SpotObjectRange = {
  start: number;
  end: number;
  text: string;
};

type Replacement = {
  start: number;
  end: number;
  text: string;
};

function getSpotObjectRanges(
  source: string
): SpotObjectRange[] {
  const ranges: SpotObjectRange[] = [];

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

function addOrUpdateHours(
  block: string,
  hours: string
): {
  block: string;
  updated: boolean;
  unchanged: boolean;
} {
  const existingHoursPattern =
    /(\n\s*hours:\s*")([^"]+)(",)/;

  const existingHoursMatch =
    block.match(
      existingHoursPattern
    );

  if (existingHoursMatch) {
    const currentHours =
      existingHoursMatch[2];

    if (currentHours === hours) {
      return {
        block,
        updated: false,
        unchanged: true,
      };
    }

    return {
      block: block.replace(
        existingHoursPattern,
        `$1${hours}$3`
      ),
      updated: true,
      unchanged: false,
    };
  }

  const websitePattern =
    /(\n\s*website:\s*"[^"]+",)/;

  if (websitePattern.test(block)) {
    return {
      block: block.replace(
        websitePattern,
        `$1\n    hours: "${hours}",`
      ),
      updated: true,
      unchanged: false,
    };
  }

  const recommendedStayPattern =
    /(\n\s*recommendedStay:\s*"[^"]+",)/;

  if (
    recommendedStayPattern.test(
      block
    )
  ) {
    return {
      block: block.replace(
        recommendedStayPattern,
        `\n    hours: "${hours}",$1`
      ),
      updated: true,
      unchanged: false,
    };
  }

  throw new Error(
    "営業時間を挿入できる位置がありません。"
  );
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
      SpotObjectRange
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

  const replacements: Replacement[] =
    [];

  let updatedCount = 0;
  let unchangedCount = 0;

  console.log(
    "========================================"
  );
  console.log(
    "Spot Hours Updater"
  );
  console.log(
    "========================================"
  );

  for (
    const [
      spotName,
      hours,
    ] of Object.entries(
      SPOT_HOURS
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
      addOrUpdateHours(
        range.text,
        hours
      );

    if (result.updated) {
      replacements.push({
        start: range.start,
        end: range.end,
        text: result.block,
      });

      updatedCount += 1;

      console.log(
        `更新: ${spotName} → ${hours}`
      );
    }

    if (result.unchanged) {
      unchangedCount += 1;

      console.log(
        `維持: ${spotName}（${hours}）`
      );
    }
  }

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
    `変更なし: ${unchangedCount}件`
  );
  console.log(
    `対象合計: ${
      updatedCount +
      unchangedCount
    }件`
  );
  console.log(
    "========================================"
  );
  console.log(
    "営業時間の更新が完了しました。"
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
    "営業時間の更新に失敗しました。"
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exitCode = 1;
}