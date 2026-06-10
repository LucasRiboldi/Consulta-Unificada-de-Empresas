import { defineConfig } from '@playwright/test';

// E2E carrega a extensão empacotada (dist/) num Chromium real — rode `npm run build` antes.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
});
