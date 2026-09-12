// Configuración de Playwright (escritorio y móvil).

import { defineConfig, devices } from '@playwright/test';

const PUERTO = Number(process.env.E2E_PORT ?? 3210);
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm --filter @blackpink/web exec next start --port ${PUERTO}`,
        url: BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
