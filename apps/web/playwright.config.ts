import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the admin portal: a production build of apps/web
// (proxy, session cookie, middleware and all) against e2e/mock-api.mjs, a
// stateful stand-in for arlink28-api. Run with `pnpm --filter @arlink28/web test:e2e`.
const WEB_PORT = 3200;
const API_PORT = 5399;

export default defineConfig({
  testDir: "./e2e",
  // One shared mock API: tests reset it and must not run in parallel.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Locally, drive the installed Chrome (no browser download); CI installs Chromium.
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `node e2e/mock-api.mjs`,
      env: { MOCK_API_PORT: String(API_PORT) },
      port: API_PORT,
      reuseExistingServer: false,
    },
    {
      command: `pnpm build && pnpm start -p ${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}`, NEXT_TELEMETRY_DISABLED: "1" },
      port: WEB_PORT,
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
