import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    headless: true,
    screenshot: "on",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  reporter: [["json", { outputFile: "results/report.json" }]],
});
