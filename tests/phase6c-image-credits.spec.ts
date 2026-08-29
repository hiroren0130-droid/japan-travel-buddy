import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
