import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 600_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4567',
    viewport: { width: 1280, height: 800 },
    video: 'on',
    launchOptions: {
      slowMo: 50,
    },
  },
  reporter: [['list']],
});
