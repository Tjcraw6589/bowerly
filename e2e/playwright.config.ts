import { defineConfig, devices } from '@playwright/test';

// Its own port: 4173 is Vite's default and the user's other apps (Holoshelf) test on it, so a
// reused server there would be the wrong app.
const PORT = Number(process.env.BOWERLY_E2E_PORT ?? 4327);

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    cwd: '..',
    url: `http://127.0.0.1:${PORT}`,
    // Always start a fresh server: a leftover one could be serving an older build.
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
