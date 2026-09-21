import { expect, test } from "@playwright/test";
import { getSpotById } from "@/lib/spotService";

for (const scenario of [
  { name: "同一都市", start: "京都駅", end: "京都駅", modes: ["walking", "walking", "walking", "walking", "walking"] },
  { name: "異都市", start: "大阪駅", end: "大阪駅", modes: ["transit", "walking", "walking", "walking", "transit"] },
  { name: "三ノ宮から神戸", start: "三ノ宮駅", end: "神戸駅", modes: [null, "walking", "walking", "walking", null] },
]) {
  test(`保存済みPlan・${scenario.name}は全体URLを開かず5区間を表示する`, async ({ page, context }) => {
    const spots = ["nishiki-market", "gion", "yasaka-shrine", "kiyomizudera"].map((id) => getSpotById(id)!);
    const plan = {
      id: "route-segments-plan", uid: "user-1", favorite: true,
      title: "保存済み区間ルート", summary: "京都の4地点を順に訪問します。",
      startLocation: scenario.start, endLocation: scenario.end,
      days: [{ day: 1, items: spots.map((spot) => ({
        spotId: spot.id, time: "10:00", description: spot.name,
        transport: "電車", duration: "30分",
      })) }],
    };
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      return host === "localhost" || host === "127.0.0.1" ? route.continue() : route.abort();
    });
    await page.addInitScript((savedPlan) => {
      localStorage.setItem("japan-travel-buddy-locale", "ja");
      localStorage.setItem("playwright-firebase-mock-state", JSON.stringify({
        user: { uid: "user-1" }, plans: [savedPlan], calls: {},
      }));
      window.open = () => { throw new Error("Unexpected whole-route window.open"); };
    }, plan);
    await page.goto(`/favorites?plan=${plan.id}`);
    const section = page.getByRole("region", { name: "区間別Google Mapsルート" });
    await expect(section).toHaveCount(0);
    await page.getByRole("button", { name: "Google Mapsでルートを開く" }).click();
    await expect(section).toBeVisible();
    const articles = section.getByRole("article");
    const names = [scenario.start, ...spots.map((spot) => spot.name), scenario.end];
    await expect(articles).toHaveCount(5);
    for (let index = 0; index < 5; index++) {
      await expect(articles.nth(index).getByText(names[index], { exact: true })).toBeVisible();
      await expect(articles.nth(index).getByText(names[index + 1], { exact: true })).toBeVisible();
      const link = articles.nth(index).getByRole("link", { name: "Google Mapsで開く" });
      const url = new URL((await link.getAttribute("href"))!);
      expect(url.searchParams.get("travelmode")).toBe(scenario.modes[index]);
      expect(url.searchParams.has("waypoints")).toBe(false);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(context.pages()).toHaveLength(1);
    await section.getByRole("button", { name: "閉じる", exact: false }).click();
    await expect(section).toHaveCount(0);
  });
}

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
