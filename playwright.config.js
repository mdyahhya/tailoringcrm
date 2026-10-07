// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config({ path: '.env.test' });

const PORT = 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1, // Only to expose flakiness as required
  workers: process.env.CI ? 2 : 4,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  webServer: {
    command: 'node scripts/serve-static.js',
    url: `${BASE_URL}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
  projects: [
    // Global Auth Setup
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    // Desktop Chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    // Mobile iPhone (WebKit)
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 14'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    // Mobile Android (Pixel)
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 7'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
});
