import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const googlePlacesMockPath = path
  .resolve("tests/helpers/google-places-fetch-mock.cjs")
  .replaceAll("\\", "/");
const playwrightNodeOptions = [
  process.env.NODE_OPTIONS,
  `--require=${googlePlacesMockPath}`,
]
  .filter(Boolean)
  .join(" ");

export default defineConfig({
  testDir: "./tests",

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    env: {
      ...process.env,
      NODE_OPTIONS: playwrightNodeOptions,
      GOOGLE_PLACES_API_KEY: "playwright-dummy-key-not-a-secret",
      PLAYWRIGHT_GOOGLE_PLACES_MOCKS: "1",
      PLAYWRIGHT_GOOGLE_PLACES_MOCK_SENTINEL:
        "jtb-google-places-playwright-v1",
      ADMIN_EMAILS:
        process.env.ADMIN_EMAILS ??
        "admin@example.com,cost-secret-sentinel@example.net",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
