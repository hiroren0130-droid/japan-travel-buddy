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

const SPOT_WEBSITES: Record<
  string,
  string
> = {
  嵐山:
    "https://ja.kyoto.travel/area/area09.php",

  竹林の小径:
    "https://ja.kyoto.travel/tourism/single01.php?category_id=8&tourism_id=2683",

  渡月橋:
    "https://ja.kyoto.travel/tourism/single01.php?category_id=8&tourism_id=2682",

  祇園:
    "https://ja.kyoto.travel/tourism/single01.php?category_id=8&tourism_id=689",

  京都駅:
    "https://www.kyoto-station-building.co.jp/",

  哲学の道:
    "https://ja.kyoto.travel/tourism/single01.php?category_id=8&tourism_id=2684",
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

function addOrUpdateWebsite(
  block: string,
  website: string
): {
  block: string;
  updated: boolean;
  unchanged: boolean;
} {
  const existingWebsitePattern =
    /(\n\s*website:\s*")([^"]+)(",)/;

  const existingWebsiteMatch =
    block.match(
      existingWebsitePattern
    );

  if (existingWebsiteMatch) {
    const currentWebsite =
      existingWebsiteMatch[2];

    if (currentWebsite === website) {
      return {
        block,
        updated: false,
        unchanged: true,
      };
    }

    return {
      block: block.replace(
        existingWebsitePattern,
        `$1${website}$3`
      ),
      updated: true,
      unchanged: false,
    };
  }

  const addressPattern =
    /(\n\s*address:\s*"[^"]+",)/;

  if (addressPattern.test(block)) {
    return {
      block: block.replace(
        addressPattern,
        `$1\n    website: "${website}",`
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
        `\n    website: "${website}",$1`
      ),
      updated: true,
      unchanged: false,
    };
  }

  throw new Error(
    "websiteを挿入できる位置がありません。"
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
    "Spot Website Updater"
  );
  console.log(
    "========================================"
  );

  for (
    const [
      spotName,
      website,
    ] of Object.entries(
      SPOT_WEBSITES
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
      addOrUpdateWebsite(
        range.text,
        website
      );

    if (result.updated) {
      replacements.push({
        start: range.start,
        end: range.end,
        text: result.block,
      });

      updatedCount += 1;

      console.log(
        `更新: ${spotName}`
      );
    }

    if (result.unchanged) {
      unchangedCount += 1;

      console.log(
        `維持: ${spotName}（設定済み）`
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
    "websiteの更新が完了しました。"
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
    "websiteの更新に失敗しました。"
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exitCode = 1;
}