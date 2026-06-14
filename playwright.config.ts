import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share a running server; keep sequential to avoid data races
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
  // Start the dev server automatically when running locally
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        command: "node node_modules/next/dist/bin/next dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          MONGODB_URI: process.env.MONGODB_URI ?? "",
          AUTH_SECRET: process.env.AUTH_SECRET ?? "",
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        },
      },
});
