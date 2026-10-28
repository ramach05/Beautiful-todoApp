import { defineConfig, devices } from '@playwright/test';

const API_PORT = 3101;
const WEB_PORT = 4174;
const WEB_ORIGIN = `http://127.0.0.1:${WEB_PORT}`;
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;
/** Separate database: e2e does not touch dev data */
const E2E_DB_URL = 'postgres://todo:todo@localhost:5433/beautiful_todo_e2e';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: WEB_ORIGIN,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Prod builds of the apps with an e2e environment: the same code as in prod
  webServer: [
    {
      command: 'pnpm --filter @bt/api build && pnpm --filter @bt/api start',
      env: {
        DATABASE_URL: E2E_DB_URL,
        HOST: '127.0.0.1',
        PORT: String(API_PORT),
        CORS_ORIGIN: WEB_ORIGIN,
      },
      url: `${API_ORIGIN}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `pnpm --filter @bt/web build && pnpm --filter @bt/web exec vite preview --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      env: {
        VITE_API_URL: `${API_ORIGIN}/rpc`,
        VITE_AUTH_URL: `${API_ORIGIN}/api/auth`,
      },
      url: WEB_ORIGIN,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
