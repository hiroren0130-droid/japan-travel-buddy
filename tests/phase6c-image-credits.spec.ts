import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getSpotImageCredit } from "@/lib/spotImageCredits";
import { getSpotsByPrefectureId } from "@/lib/spotService";

const creditedSpots = [
  ["osaka-castle", "Osaka Castle 2022-04-23.jpg"],
  ["arashiyama", "Aerial panorama of Arashiyama (嵐山).jpg"],
  ["dotonbori", "2021-12-11 Dōtonbori at Night.jpg"],
  ["tsutenkaku", "Shinsekai Tsutenkaku at night 2022-04-23.jpg"],
] as const;

const kyotoPrioritySpots = [
  ["ginkakuji", "Silver pavilion @ Ginkaku-ji @ Kyoto (13310426555).jpg"],
  ["bamboo-grove", "Bamboo grove, Arashiyama (3811218708).jpg"],
  [
    "togetsukyo",
    "Togetsukyo bridge in Arashiyama- I did not walk to the other side (48743686522).jpg",
  ],
  [
    "tenryuji",
    "Beautiful landscaping at Tenryu-ji for a true sense of zen! (48743691057).jpg",
  ],
  ["yasaka-shrine", "Yasaka Shrine @ Kyoto (13406249543).jpg"],
  ["gion", "Gion street.jpg"],
  ["nijo-castle", "Tonan Sumi-Yagura, Nijo Castle (53648037727).jpg"],
  [
    "nishiki-market",
    "20260428 Nishiki Markt 05 Kyoto, Japan anagoria.jpg",
  ],
] as const;

const secondBatchCreditSpots = [
  {
    spotId: "heian-shrine",
    sourceTitle: "Heian Shrine @ Kyoto (13310604013).jpg",
    photographerName: "Guilhem Vellut",
    licenseName: "CC BY 2.0",
    attributionRequired: true,
    shareAlike: false,
  },
  {
    spotId: "nanzenji",
    sourceTitle: "Nanzenji aqueduct 20211123.jpg",
    photographerName: "Suicasmo",
    licenseName: "CC BY-SA 4.0",
    attributionRequired: true,
    shareAlike: true,
  },
  {
    spotId: "eikando",
    sourceTitle: "Eikando, Kyoto - Eikando7376.jpg",
    photographerName: "lumoplank",
    licenseName: "CC0 1.0",
    attributionRequired: false,
    shareAlike: false,
  },
  {
    spotId: "kodaiji",
    sourceTitle: "Kōdai-ji 20211123-1.jpg",
    photographerName: "Suicasmo",
    licenseName: "CC BY-SA 4.0",
    attributionRequired: true,
    shareAlike: true,
  },
  {
    spotId: "kenninji",
    sourceTitle: "150124 Kenninji Kyoto Japan05s3.jpg",
    photographerName: "663highland",
    licenseName: "CC BY-SA 4.0",
    attributionRequired: true,
    shareAlike: true,
  },
  {
    spotId: "sanjusangendo",
    sourceTitle: "Kyoto Sanjusangen-do Haupthalle 02.jpg",
    photographerName: "Zairon",
    licenseName: "CC BY-SA 4.0",
    attributionRequired: true,
    shareAlike: true,
  },
  {
    spotId: "toji",
    sourceTitle: "Tō-ji, Kyōto (Yozakura).jpg",
    photographerName: "Jean-Michel Lapointe",
    licenseName: "CC BY 4.0",
    attributionRequired: true,
    shareAlike: false,
  },
  {
    spotId: "kyoto-station",
    sourceTitle: "Kyoto Station (50910224293).jpg",
    photographerName: "Dick Thomas Johnson",
    licenseName: "CC BY 2.0",
    attributionRequired: true,
    shareAlike: false,
  },
  {
    spotId: "tofukuji",
    sourceTitle: "Tofuku-ji, Kyoto - Tofukuji6597.jpg",
    photographerName: "lumoplank",
    licenseName: "CC0 1.0",
    attributionRequired: false,
    shareAlike: false,
  },
  {
    spotId: "shimogamo-shrine",
    sourceTitle: "Kyoto Shimogamo-jinja Romon 2.jpg",
    photographerName: "Zairon",
    licenseName: "CC BY-SA 4.0",
    attributionRequired: true,
    shareAlike: true,
  },
  {
    spotId: "kamigamo-shrine",
    sourceTitle: "Kamigamo Shrine-16.jpg",
    photographerName: "Immanuelle",
    licenseName: "CC BY 4.0",
    attributionRequired: true,
    shareAlike: false,
  },
  {
    spotId: "kyoto-gyoen",
    sourceTitle: "KyotoGyoen (15233412330).jpg",
    photographerName: "nobu3withfoxy",
    licenseName: "CC BY 2.0",
    attributionRequired: true,
    shareAlike: false,
  },
] as const;

const creditedTwentyFourSpots = [
  ...creditedSpots,
  ...kyotoPrioritySpots,
  ...secondBatchCreditSpots.map(
    ({ spotId, sourceTitle }) => [spotId, sourceTitle] as const
  ),
] as const;

function getJpegDimensions(buffer: Buffer): {
  width: number;
  height: number;
} {
  expect(buffer.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));

  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + segmentLength;
  }

  throw new Error("JPEG dimensions were not found.");
}

test("the eight Kyoto priority images are deterministic 1200 x 800 JPEG files", () => {
  for (const [spotId] of kyotoPrioritySpots) {
    const imagePath = path.join(
      process.cwd(),
      "public",
      "spots",
      `${spotId}.jpg`
    );
    expect(existsSync(imagePath)).toBe(true);

    const image = readFileSync(imagePath);
    expect(getJpegDimensions(image)).toEqual({ width: 1200, height: 800 });
  }
});

test("the second batch twelve Spots have complete audited credit metadata", () => {
  expect(secondBatchCreditSpots).toHaveLength(12);
  expect(creditedTwentyFourSpots).toHaveLength(24);
  expect(new Set(creditedTwentyFourSpots.map(([spotId]) => spotId)).size).toBe(
    24
  );

  for (const expected of secondBatchCreditSpots) {
    const credit = getSpotImageCredit(expected.spotId);
    expect(credit).toBeDefined();
    expect(credit).toMatchObject({
      spotId: expected.spotId,
      sourceTitle: expected.sourceTitle,
      photographerName: expected.photographerName,
      licenseName: expected.licenseName,
      attributionRequired: expected.attributionRequired,
      localFilename: `/spots/${expected.spotId}.jpg`,
    });
    expect(credit?.modifications).toContain("1200 × 800");
    expect(credit?.modifications).toContain("quality 84");

    if (expected.shareAlike) {
      expect(credit?.notes).toContain(
        "This adapted image is licensed under CC BY-SA 4.0."
      );
    } else {
      expect(credit?.notes).not.toContain("licensed under CC BY-SA");
    }
  }
});

test("the second batch twelve images are deterministic 1200 x 800 JPEG files", () => {
  for (const { spotId } of secondBatchCreditSpots) {
    const imagePath = path.join(
      process.cwd(),
      "public",
      "spots",
      `${spotId}.jpg`
    );
    expect(existsSync(imagePath)).toBe(true);

    const image = readFileSync(imagePath);
    expect(getJpegDimensions(image)).toEqual({ width: 1200, height: 800 });
  }
});

test("the first twenty-four Kyoto Discover Spots use unique non-placeholder local files", () => {
  const firstTwentyFourSpots = getSpotsByPrefectureId("kyoto").slice(0, 24);
  const placeholderHash = createHash("sha256")
    .update(
      readFileSync(
        path.join(process.cwd(), "public", "spots", "placeholder.jpg")
      )
    )
    .digest("hex");
  const imageHashes = new Set<string>();

  expect(firstTwentyFourSpots).toHaveLength(24);

  for (const spot of firstTwentyFourSpots) {
    expect(spot.image).toMatch(/^\/spots\/[a-z0-9-]+\.jpg$/);
    expect(spot.image).not.toBe("/spots/placeholder.jpg");

    const imagePath = path.join(process.cwd(), "public", spot.image);
    expect(existsSync(imagePath)).toBe(true);

    const image = readFileSync(imagePath);
    const imageHash = createHash("sha256").update(image).digest("hex");
    expect(imageHash).not.toBe(placeholderHash);
    expect(imageHashes.has(imageHash)).toBe(false);
    imageHashes.add(imageHash);
  }

  expect(imageHashes.size).toBe(24);
});

test("the replaced Kyoto images do not reuse the Kiyomizudera file", () => {
  const kiyomizuderaHash = createHash("sha256")
    .update(
      readFileSync(
        path.join(process.cwd(), "public", "spots", "kiyomizudera.jpg")
      )
    )
    .digest("hex");

  for (const spotId of [
    "yasaka-shrine",
    "gion",
    "nijo-castle",
    "nishiki-market",
  ]) {
    const imageHash = createHash("sha256")
      .update(
        readFileSync(
          path.join(process.cwd(), "public", "spots", `${spotId}.jpg`)
        )
      )
      .digest("hex");
    expect(imageHash).not.toBe(kiyomizuderaHash);
  }
});

test("the first twelve Kyoto Discover Spots have existing local images", () => {
  const firstTwelveSpots = getSpotsByPrefectureId("kyoto").slice(0, 12);
  expect(firstTwelveSpots).toHaveLength(12);

  for (const spot of firstTwelveSpots) {
    expect(spot.image).toMatch(/^\/spots\/[a-z0-9-]+\.jpg$/);
    expect(spot.image).not.toBe("/spots/placeholder.jpg");
    expect(
      existsSync(path.join(process.cwd(), "public", spot.image))
    ).toBe(true);
  }
});

test.beforeEach(async ({ page }) => {
  await page.route("https://maps.googleapis.com/**", async (route) => {
    await route.abort();
  });
});

test("the four priority Spots use local images without Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  for (const [spotId] of creditedSpots) {
    await page.goto(`/spots/${spotId}`);
    await expect(page.locator("main img").first()).toHaveAttribute(
      "src",
      new RegExp(`/spots/${spotId}\\.jpg$`)
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "画像クレジット", exact: true })
    ).toHaveAttribute("href", `/image-credits#${spotId}`);
  }

  expect(placesPhotoRequests).toBe(0);
});

test("the eight Kyoto priority Spots expose local images and credit links without Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  for (const [spotId] of kyotoPrioritySpots) {
    await page.goto(`/spots/${spotId}`);
    await expect(page.locator("main img").first()).toHaveAttribute(
      "src",
      new RegExp(`/spots/${spotId}\\.jpg$`)
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "画像クレジット", exact: true })
    ).toHaveAttribute("href", `/image-credits#${spotId}`);
  }

  expect(placesPhotoRequests).toBe(0);
});

test("the second batch twelve Spots expose local images and credit links without Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;

  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  for (const { spotId } of secondBatchCreditSpots) {
    await page.goto(`/spots/${spotId}`);
    await expect(page.locator("main img").first()).toHaveAttribute(
      "src",
      new RegExp(`/spots/${spotId}\\.jpg$`)
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "画像クレジット", exact: true })
    ).toHaveAttribute("href", `/image-credits#${spotId}`);
  }

  expect(placesPhotoRequests).toBe(0);
});

test("Kyoto Discover renders its first twelve local images without a placeholder or Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;
  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  await page.goto("/discover/kyoto");
  const discoverImages = page.locator("main img");
  await expect(discoverImages.nth(11)).toBeVisible();

  for (let index = 0; index < 12; index += 1) {
    await expect(discoverImages.nth(index)).not.toHaveAttribute(
      "src",
      /\/spots\/placeholder\.jpg$/
    );
  }

  expect(placesPhotoRequests).toBe(0);
});

test("Kyoto Discover renders its first twenty-four local images without a placeholder or Places requests", async ({
  page,
}) => {
  let placesPhotoRequests = 0;
  await page.route("**/api/places/photo?**", async (route) => {
    placesPhotoRequests += 1;
    await route.abort();
  });

  await page.goto("/discover/kyoto");
  const discoverImages = page.locator("main img");
  await expect(discoverImages.nth(23)).toBeVisible();

  for (let index = 0; index < 24; index += 1) {
    await expect(discoverImages.nth(index)).toHaveAttribute(
      "src",
      /^(?:http:\/\/localhost:3000)?\/spots\/[a-z0-9-]+\.jpg$/
    );
    await expect(discoverImages.nth(index)).not.toHaveAttribute(
      "src",
      /\/spots\/placeholder\.jpg$/
    );
  }

  expect(placesPhotoRequests).toBe(0);
});

test("Home and Osaka Discover expose the new local images", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator('img[src$="/spots/arashiyama.jpg"]').first()
  ).toBeVisible();
  await expect(
    page.locator('img[src$="/spots/osaka-castle.jpg"]').first()
  ).toBeVisible();

  await page.goto("/discover/osaka");
  await expect(
    page.locator('img[src$="/spots/osaka-castle.jpg"]').first()
  ).toBeVisible();
});

test("the image credits page contains source, license, and modification details", async ({
  page,
}) => {
  await page.goto("/image-credits");

  for (const [spotId, sourceTitle] of creditedSpots) {
    const credit = page.locator(`#${spotId}`);
    await expect(credit).toContainText(sourceTitle);
    await expect(credit).toContainText("作者");
    await expect(credit).toContainText("ライセンス");
    await expect(credit).toContainText("加工内容");
    await expect(
      credit.locator('a[href^="https://commons.wikimedia.org/wiki/File:"]')
    ).toBeVisible();
    await expect(credit.getByRole("link", { name: /^CC BY/ })).toHaveAttribute(
      "href",
      /^https:\/\/creativecommons\.org\/licenses\/by\//
    );
  }
});

test("the image credits page contains all eight Kyoto priority credits", async ({
  page,
}) => {
  await page.goto("/image-credits");

  for (const [spotId, sourceTitle] of kyotoPrioritySpots) {
    const credit = page.locator(`#${spotId}`);
    await expect(credit).toContainText(sourceTitle);
    await expect(credit).toContainText("作者");
    await expect(credit).toContainText("ライセンス");
    await expect(credit).toContainText("加工内容");
    await expect(
      credit.locator('a[href^="https://commons.wikimedia.org/wiki/File:"]')
    ).toBeVisible();
  }

  await expect(page.locator("#nijo-castle")).toContainText("CC0 1.0");
  await expect(page.locator("#nishiki-market")).toContainText(
    "This adapted image is licensed under CC BY-SA 4.0."
  );
});

test("the image credits page renders all second batch credit fields", async ({
  page,
}) => {
  await page.goto("/image-credits");

  for (const expected of secondBatchCreditSpots) {
    const creditData = getSpotImageCredit(expected.spotId);
    expect(creditData).toBeDefined();

    const credit = page.locator(`#${expected.spotId}`);
    await expect(credit).toContainText(expected.sourceTitle);
    await expect(credit).toContainText(expected.photographerName);
    await expect(credit).toContainText(expected.licenseName);
    await expect(credit).toContainText(creditData?.modifications ?? "");
    await expect(credit).toContainText(creditData?.notes ?? "");
    await expect(
      credit.locator('a[href^="https://commons.wikimedia.org/wiki/File:"]')
    ).toBeVisible();
  }
});
