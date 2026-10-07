// tests/13_realtime_sync.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('13. Multi-Window Real-Time Synchronization', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('RT-01: Changes in window A reflect in window B without reload via WebSockets @smoke', async ({ browser }) => {
    // Window A (Dashboard or Orders)
    const contextA = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
    const pageA = await contextA.newPage();
    await pageA.goto('/orders.html');
    await pageA.waitForSelector('.order-card-link', { timeout: 15000 });

    // Window B (New Order or Order Detail)
    const contextB = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
    const pageB = await contextB.newPage();
    const custName = generateTestName('SyncTest');

    await pageB.goto('/new-order.html');
    await pageB.fill('#customerComboboxInput', custName);
    await pageB.selectOption('#garmentTypeSelect', { index: 1 });
    await pageB.fill('#employeeComboboxInput', 'Farhan Master');
    await pageB.click('#btnSubmitOrder');
    await pageB.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    // Assert that Window A receives the update via Supabase Realtime within 5 seconds
    await expect(pageA.locator(`text="${custName}"`)).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });
});
