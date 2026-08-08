import { existsSync } from "node:fs";
import path from "node:path";

import { allSpots } from "../data";

type ValidationIssue = {
  spot: string;
  field: string;
  message: string;
};

const VALID_BEST_VISIT_TIMES =
  new Set([
    "朝",
    "昼",
    "夕方",
  ]);

const VALID_HOURS_PATTERN =
  /^(24時間|([01]\d|2[0-3]):[0-5]\d〜([01]\d|2[0-3]):[0-5]\d)$/;

const VALID_STAY_PATTERN =
  /^(0|[1-9]\d{0,2})分$/;

  const HOURS_OPTIONAL_SPOTS =
  new Set([
    "嵐山",
    "竹林の小径",
    "渡月橋",
    "祇園",
    "錦市場",
    "京都駅",
    "京都御苑",
    "哲学の道",
  ]);

const REQUIRED_STRING_FIELDS = [
  "id",
  "name",
  "area",
  "category",
  "description",
  "image",
] as const;

const errors: ValidationIssue[] = [];
const warnings: ValidationIssue[] = [];

function addError(
  spot: string,
  field: string,
  message: string
): void {
  errors.push({
    spot,
    field,
    message,
  });
}

function addWarning(
  spot: string,
  field: string,
  message: string
): void {
  warnings.push({
    spot,
    field,
    message,
  });
}

function normalizeName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function hasText(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function checkRequiredFields(): void {
  for (const spot of allSpots) {
    const spotName =
      hasText(spot.name)
        ? spot.name
        : "(名称未設定)";

    for (
      const field of
      REQUIRED_STRING_FIELDS
    ) {
      const value = spot[field];

      if (!hasText(value)) {
        addError(
          spotName,
          field,
          `${field}が未設定です。`
        );
      }
    }

    if (
      typeof spot.latitude !==
        "number" ||
      !Number.isFinite(
        spot.latitude
      ) ||
      spot.latitude < -90 ||
      spot.latitude > 90
    ) {
      addError(
        spotName,
        "latitude",
        "緯度が正しい数値ではありません。"
      );
    }

    if (
      typeof spot.longitude !==
        "number" ||
      !Number.isFinite(
        spot.longitude
      ) ||
      spot.longitude < -180 ||
      spot.longitude > 180
    ) {
      addError(
        spotName,
        "longitude",
        "経度が正しい数値ではありません。"
      );
    }
  }
}

function checkDuplicateIds(): void {
  const idCounts =
    new Map<string, number>();

  for (const spot of allSpots) {
    const normalizedId =
      spot.id.trim().toLowerCase();

    idCounts.set(
      normalizedId,
      (idCounts.get(
        normalizedId
      ) ?? 0) + 1
    );
  }

  for (
    const [id, count] of
    idCounts.entries()
  ) {
    if (count > 1) {
      addError(
        id,
        "id",
        `同じIDが${count}件あります。`
      );
    }
  }
}

function checkDuplicateNames(): void {
  const nameCounts =
    new Map<
      string,
      {
        name: string;
        count: number;
      }
    >();

  for (const spot of allSpots) {
    const normalizedName =
      normalizeName(spot.name);

    const current =
      nameCounts.get(
        normalizedName
      );

    nameCounts.set(
      normalizedName,
      {
        name: spot.name,
        count:
          (current?.count ?? 0) +
          1,
      }
    );
  }

  for (
    const value of
    nameCounts.values()
  ) {
    if (value.count > 1) {
      addError(
        value.name,
        "name",
        `同じ名称が${value.count}件あります。`
      );
    }
  }
}

function checkDuplicateCoordinates(): void {
  const coordinateMap =
    new Map<
      string,
      string[]
    >();

  for (const spot of allSpots) {
    const coordinateKey =
      `${spot.latitude.toFixed(
        6
      )},${spot.longitude.toFixed(
        6
      )}`;

    const names =
      coordinateMap.get(
        coordinateKey
      ) ?? [];

    names.push(spot.name);

    coordinateMap.set(
      coordinateKey,
      names
    );
  }

  for (
    const [
      coordinates,
      names,
    ] of coordinateMap.entries()
  ) {
    if (names.length > 1) {
      addWarning(
        names.join(" / "),
        "coordinates",
        `同じ座標が設定されています：${coordinates}`
      );
    }
  }
}

function checkNearbyReferences(): void {
  const spotNameMap =
    new Map(
      allSpots.map((spot) => [
        normalizeName(spot.name),
        spot.name,
      ])
    );

  for (const spot of allSpots) {
    if (!spot.nearby) {
      addWarning(
        spot.name,
        "nearby",
        "near隣スポットが未設定です。"
      );

      continue;
    }

    const usedNearbyNames =
      new Set<string>();

    for (
      const nearbyName of
      spot.nearby
    ) {
      const normalizedNearbyName =
        normalizeName(
          nearbyName
        );

      if (
        !normalizedNearbyName
      ) {
        addError(
          spot.name,
          "nearby",
          "空のnearby項目があります。"
        );

        continue;
      }

      if (
        normalizedNearbyName ===
        normalizeName(spot.name)
      ) {
        addError(
          spot.name,
          "nearby",
          "自分自身がnearbyに登録されています。"
        );
      }

      if (
        usedNearbyNames.has(
          normalizedNearbyName
        )
      ) {
        addError(
          spot.name,
          "nearby",
          `${nearbyName}が重複しています。`
        );
      }

      usedNearbyNames.add(
        normalizedNearbyName
      );

      if (
        !spotNameMap.has(
          normalizedNearbyName
        )
      ) {
        addError(
          spot.name,
          "nearby",
          `${nearbyName}はSpot Databaseに存在しません。`
        );
      }
    }
  }
}

function checkHours(): void {
  for (const spot of allSpots) {
    if (!spot.hours) {
      if (
        HOURS_OPTIONAL_SPOTS.has(
          spot.name
        )
      ) {
        continue;
      }

      addWarning(
        spot.name,
        "hours",
        "営業時間が未設定です。"
      );

      continue;
    }

    if (
      !VALID_HOURS_PATTERN.test(
        spot.hours.trim()
      )
    ) {
      addError(
        spot.name,
        "hours",
        `営業時間の形式が不正です：${spot.hours}`
      );
    }
  }
}

function checkRecommendedStay(): void {
  for (const spot of allSpots) {
    if (
      !spot.recommendedStay
    ) {
      addWarning(
        spot.name,
        "recommendedStay",
        "推奨滞在時間が未設定です。"
      );

      continue;
    }

    if (
      !VALID_STAY_PATTERN.test(
        spot.recommendedStay.trim()
      )
    ) {
      addError(
        spot.name,
        "recommendedStay",
        `推奨滞在時間の形式が不正です：${spot.recommendedStay}`
      );
    }
  }
}

function checkBestVisitTime(): void {
  for (const spot of allSpots) {
    if (!spot.bestVisitTime) {
      addWarning(
        spot.name,
        "bestVisitTime",
        "おすすめ訪問時間が未設定です。"
      );

      continue;
    }

    if (
      !VALID_BEST_VISIT_TIMES.has(
        spot.bestVisitTime
      )
    ) {
      addError(
        spot.name,
        "bestVisitTime",
        `使用できない値です：${spot.bestVisitTime}`
      );
    }
  }
}

function checkMealRecommended(): void {
  for (const spot of allSpots) {
    if (
      typeof
        spot.mealRecommended !==
      "boolean"
    ) {
      addWarning(
        spot.name,
        "mealRecommended",
        "食事エリア判定が未設定です。"
      );
    }
  }
}

function checkWebsites(): void {
  for (const spot of allSpots) {
    if (!spot.website) {
      addWarning(
        spot.name,
        "website",
        "公式サイトが未設定です。"
      );

      continue;
    }

    if (
      !spot.website.startsWith(
        "https://"
      )
    ) {
      addError(
        spot.name,
        "website",
        `HTTPSではありません：${spot.website}`
      );
    }

    try {
      new URL(spot.website);
    } catch {
      addError(
        spot.name,
        "website",
        `URL形式が不正です：${spot.website}`
      );
    }
  }
}

function checkImages(): void {
  const publicDirectory =
    path.resolve(
      process.cwd(),
      "public"
    );

  for (const spot of allSpots) {
    if (!hasText(spot.image)) {
      continue;
    }

    if (
      !spot.image.startsWith("/")
    ) {
      addError(
        spot.name,
        "image",
        `画像パスは「/」から始めてください：${spot.image}`
      );

      continue;
    }

    const relativeImagePath =
      spot.image.replace(
        /^\/+/,
        ""
      );

    const absoluteImagePath =
      path.join(
        publicDirectory,
        relativeImagePath
      );

    if (
      !existsSync(
        absoluteImagePath
      )
    ) {
      addWarning(
        spot.name,
        "image",
        `画像ファイルが見つかりません：${spot.image}`
      );
    }
  }
}

function printIssueSection(
  title: string,
  issues: ValidationIssue[]
): void {
  console.log("");
  console.log(`【${title}】`);

  if (issues.length === 0) {
    console.log("なし");

    return;
  }

  issues.forEach(
    (issue, index) => {
      console.log(
        `${index + 1}. ${issue.spot}`
      );

      console.log(
        `   項目: ${issue.field}`
      );

      console.log(
        `   内容: ${issue.message}`
      );
    }
  );
}

function countWarningsByField(): void {
  const counts =
    new Map<string, number>();

  for (const warning of warnings) {
    counts.set(
      warning.field,
      (counts.get(
        warning.field
      ) ?? 0) + 1
    );
  }

  console.log("");
  console.log(
    "【未設定・警告件数】"
  );

  if (counts.size === 0) {
    console.log("なし");

    return;
  }

  const sortedCounts =
    [...counts.entries()].sort(
      ([fieldA], [fieldB]) =>
        fieldA.localeCompare(
          fieldB,
          "ja"
        )
    );

  for (
    const [
      field,
      count,
    ] of sortedCounts
  ) {
    console.log(
      `${field}: ${count}件`
    );
  }
}

function runValidation(): void {
  checkRequiredFields();
  checkDuplicateIds();
  checkDuplicateNames();
  checkDuplicateCoordinates();
  checkNearbyReferences();
  checkHours();
  checkRecommendedStay();
  checkBestVisitTime();
  checkMealRecommended();
  checkWebsites();
  checkImages();

  console.log(
    "========================================"
  );

  console.log(
    "Spot Database Validator"
  );

  console.log(
    "========================================"
  );

  console.log(
    `総スポット数: ${allSpots.length}件`
  );

  console.log(
    `エラー: ${errors.length}件`
  );

  console.log(
    `警告: ${warnings.length}件`
  );

  countWarningsByField();

  printIssueSection(
    "エラー",
    errors
  );

  printIssueSection(
    "警告",
    warnings
  );

  console.log("");
  console.log(
    "========================================"
  );

  if (errors.length > 0) {
    console.error(
      "RESULT: FAILED"
    );

    console.error(
      "修正が必要なデータがあります。"
    );

    console.log(
      "========================================"
    );

    process.exitCode = 1;

    return;
  }

  console.log(
    "RESULT: PASSED"
  );

  if (warnings.length > 0) {
    console.log(
      "必須エラーはありません。警告項目を順次整備してください。"
    );
  } else {
    console.log(
      "すべての検証項目を通過しました。"
    );
  }

  console.log(
    "========================================"
  );
}

runValidation();