import { expect, test } from "@playwright/test";

test("複数city PlanはGoogle Maps区間リンクを順番どおり表示する", async ({
  page,
}) => {
  await page.route("**/api/places/photo?**", async (route) => {
    await route.fulfill({ status: 404 });
  });

  await page.route("**/api/chat", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        plan: {
          title: "京都から大阪への1日プラン",
          summary: "京都と大阪を巡ります。",
          days: [
            {
              day: 1,
              items: [
                {
                  time: "09:00",
                  spotId: "kiyomizudera",
                  description: "清水寺を拝観します。",
                  transport: "徒歩",
                  duration: "0分",
                },
                {
                  time: "11:00",
                  spotId: "gion",
                  description: "祇園を散策します。",
                  transport: "徒歩",
                  duration: "18分",
                },
                {
                  time: "14:00",
                  spotId: "osaka-castle",
                  description: "大阪城を見学します。",
                  transport: "電車",
                  duration: "90分",
                },
              ],
            },
          ],
        },
      }),
    });
  });

  await page.goto("/chat");
  await page.locator("#travel-destination").fill("京都・大阪");
  await page.locator("#travel-days").selectOption("1");
  await page.locator("#travel-travelers").selectOption("1");
  await page.locator('form button[type="submit"]').click();

  await expect(
    page.getByRole("heading", {
      name: "京都から大阪への1日プラン",
    })
  ).toBeVisible();

  await page.getByRole("button", {
    name: "Google Mapsでルートを開く",
  }).click();

  const routeSection = page.getByRole("region", {
    name: "区間別Google Mapsルート",
  });
  await expect(routeSection).toBeVisible();
  await expect(
    routeSection.getByText("清水寺", { exact: true })
  ).toBeVisible();
  await expect(
    routeSection.getByText("祇園", { exact: true })
  ).toHaveCount(2);
  await expect(
    routeSection.getByText("大阪城天守閣", { exact: true })
  ).toBeVisible();
  await expect(
    routeSection.getByText("徒歩", { exact: true })
  ).toBeVisible();
  await expect(
    routeSection.getByText("公共交通", { exact: true })
  ).toBeVisible();

  const links = routeSection.getByRole("link", {
    name: "Google Mapsで開く",
  });
  await expect(links).toHaveCount(2);

  const firstUrl = new URL(
    (await links.nth(0).getAttribute("href")) ?? ""
  );
  const secondUrl = new URL(
    (await links.nth(1).getAttribute("href")) ?? ""
  );

  expect(firstUrl.searchParams.get("travelmode")).toBe("walking");
  expect(secondUrl.searchParams.get("travelmode")).toBe("transit");
  expect(firstUrl.searchParams.has("waypoints")).toBe(false);
  expect(secondUrl.searchParams.has("waypoints")).toBe(false);
});
