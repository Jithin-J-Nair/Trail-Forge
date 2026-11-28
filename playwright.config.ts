import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env['E2E_PORT'] ?? 4173);
const baseURL = process.env['E2E_BASE_URL'] ?? `http://127.0.0.1:${port}`;

const config = defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'off',
  },
});

if (!process.env['E2E_BASE_URL']) {
  config.webServer = {
    command: `npm run build -w @trailforge/web && npm run preview -w @trailforge/web -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  };
}

export default config;
