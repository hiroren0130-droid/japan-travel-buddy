import { expect, test } from "@playwright/test";

type ChatResponse = {
  plan?: {
    title?: string;
    days?: Array<{
      items?: Array<{
        spotId?: string;
      }>;
    }>;
  };
};

test("@integration 実APIの京都1日プランをUIに描画できる", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await page.route("**/api/places/photo?**", async (route) => {
    await route.fulfill({ status: 404 });
  });

  await page.route("https://maps.googleapis.com/**", async (route) => {
    await route.abort();
  });

  await page.goto("/chat");

  await page.locator("#travel-destination").fill("京都");
  await page.locator("#travel-days").selectOption("1");
  await page.locator("#travel-travelers").selectOption("1");
  await page
    .locator("#travel-special-request")
    .fill(
      "伏見稲荷大社、清水寺、八坂神社に行きたい。移動が無駄にならない効率のいいルートでお願いします。"
    );

  const submitButton = page.getByRole("button", {
    name: "✨ AIで旅行プランを作成",
  });

  await expect(submitButton).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/chat") &&
      response.request().method() === "POST",
    { timeout: 150_000 }
  );

  await submitButton.click();

  const response = await responsePromise;

  expect(response.status()).toBe(200);

  const responseBody = (await response.json()) as ChatResponse;
  const plan = responseBody.plan;

  expect(plan).toBeDefined();
  expect(typeof plan?.title).toBe("string");

  const title = plan?.title;

  if (!title) {
    throw new Error("plan.title がAPIレスポンスにありません。");
  }

  const spotIds = (plan.days ?? [])
    .flatMap((day) => day.items ?? [])
    .map((item) => item.spotId);

  const requiredSpotIds = [
    "fushimi-inari",
    "kiyomizudera",
    "yasaka-shrine",
  ];

  expect(spotIds).toEqual(expect.arrayContaining(requiredSpotIds));

  await expect(
    page.getByRole("heading", { name: title, exact: true })
  ).toBeVisible();

  for (const spotName of ["伏見稲荷大社", "清水寺", "八坂神社"]) {
    await expect(page.getByText(spotName, { exact: true }).first()).toBeVisible();
  }

  console.log({
    status: response.status(),
    title,
    requiredSpotIds,
  });
});
