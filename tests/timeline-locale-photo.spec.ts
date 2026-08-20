import {
  expect,
  test,
} from "@playwright/test";

test("English timeline localizes mismatched descriptions and keeps spot photos distinct", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "japan-travel-buddy-locale",
      "en"
    );
  });

  await page.route(
    "https://maps.googleapis.com/**",
    async (route) => {
      await route.abort();
    }
  );

  await page.route(
    "**/api/chat",
    async (route) => {
      if (
        route.request().method() !==
        "POST"
      ) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          plan: {
            title: "Kyoto Shrine Day",
            summary:
              "A full day visiting Kyoto shrines.",
            days: [
              {
                day: 1,
                items: [
                  {
                    time: "09:00",
                    spotId: "fushimi-inari",
                    description:
                      "千本鳥居をゆっくり参拝します。",
                    transport: "徒歩",
                    duration: "0分",
                  },
                  {
                    time: "11:01",
                    spotId: "yasaka-shrine",
                    description:
                      "祇園の守り神を参拝します。",
                    transport: "バス",
                    duration: "31分",
                  },
                  {
                    time: "13:18",
                    spotId: "heian-shrine",
                    description:
                      "朱塗りの社殿を見学します。",
                    transport: "バス",
                    duration: "18分",
                  },
                ],
              },
            ],
          },
        }),
      });
    }
  );

  await page.goto("/chat");
  await page
    .locator("#travel-destination")
    .fill("Kyoto");
  await page
    .locator("#travel-days")
    .selectOption("1");
  await page
    .locator("#travel-travelers")
    .selectOption("2");
  await page
    .getByRole("button", {
      name: "✨ Create an AI Travel Plan",
    })
    .click();

  for (
    const value of [
      "Fushimi Inari Taisha",
      "Yasaka Shrine",
      "Heian Jingu Shrine",
      "Fushimi",
      "Higashiyama",
      "Ginkaku-ji and Okazaki",
    ]
  ) {
    await expect(
      page.getByText(value, {
        exact: true,
      }).first()
    ).toBeVisible();
  }

  await expect(
    page.getByText(
      "A shrine known worldwide for the thousands of vermilion torii gates lining its paths.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "A shrine cherished as the guardian of Gion and a central stop for sightseeing in Higashiyama.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "A leading Okazaki landmark distinguished by its grand torii gate and vermilion shrine buildings.",
      { exact: true }
    )
  ).toBeVisible();

  await expect(
    page.getByText("31 min", {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByText("18 min", {
      exact: true,
    })
  ).toBeVisible();

  const timelineImages = page.locator(
    '[role="listitem"] img'
  );
  await expect(timelineImages).toHaveCount(3);

  const photoUrls = [
    "/api/places/photo?query=伏見稲荷大社%20京都&spotId=fushimi-inari&latitude=34.9671&longitude=135.7727",
    "/api/places/photo?query=八坂神社%20京都&spotId=yasaka-shrine&latitude=35.0037&longitude=135.7788",
    "/api/places/photo?query=平安神宮%20京都&spotId=heian-shrine&latitude=35.0159&longitude=135.7823",
  ];
  const photoBodies: string[] = [];

  for (const photoUrl of photoUrls) {
    const response = await request.get(
      photoUrl
    );

    expect(response.status()).toBe(200);
    expect(
      response.headers()["content-type"]
    ).toMatch(/^image\//);
    photoBodies.push(
      (await response.body()).toString(
        "base64"
      )
    );
  }

  expect(new Set(photoBodies).size).toBe(3);

  for (const image of await timelineImages.all()) {
    await expect
      .poll(async () =>
        image.evaluate(
          (element) =>
            (element as HTMLImageElement)
              .naturalWidth
        )
      )
      .toBeGreaterThan(0);
  }

  const imageUrls = await timelineImages.evaluateAll(
    (images) =>
      images.map(
        (image) =>
          (image as HTMLImageElement).currentSrc
      )
  );

  expect(new Set(imageUrls).size).toBe(3);

  await page.screenshot({
    path: "test-results/timeline-locale-photo.png",
    fullPage: true,
  });
});
