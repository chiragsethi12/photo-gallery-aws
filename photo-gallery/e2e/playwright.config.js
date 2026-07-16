// playwright.config.js - Configuration for Playwright end-to-end tests
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  expect: {
    timeout: 8000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
  },
  webServer: {
    command: 'node start-servers.js',
    cwd: '.',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
