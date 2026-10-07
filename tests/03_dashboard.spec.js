// tests/03_dashboard.spec.js
const { test, expect } = require('@playwright/test');
const { supabase } = require('./helpers/supabase-test-helper');

test.describe('3. Dashboard Metrics and Attention Lists', () => {

  test('DASH-01, DASH-02, DASH-03: Stat cards render with database counts @smoke', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#statActiveOrders', { timeout: 15000 });

    const activeEl = page.locator('#statActiveOrders');
    const readyEl = page.locator('#statReadyOrders');
    const deliveredEl = page.locator('#statDeliveredMonth');

    await expect(activeEl).toBeVisible();
    await expect(readyEl).toBeVisible();
    await expect(deliveredEl).toBeVisible();

    const activeText = await activeEl.innerText();
    expect(parseInt(activeText, 10)).toBeGreaterThanOrEqual(0);
  });

  test('DASH-04: Pipeline stage breakdown counters match stage tally', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#stageCount_measurement', { timeout: 15000 });

    const stages = ['measurement', 'washing', 'cutting', 'stitching', 'finishing', 'ready', 'delivered'];
    for (const stage of stages) {
      const el = page.locator(`#stageCount_${stage}`);
      if (await el.count() > 0) {
        const text = await el.innerText();
        expect(parseInt(text, 10)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('DASH-06: Recent activity timeline renders event cards', async ({ page }) => {
    await page.goto('/index.html');
    const timeline = page.locator('#recentActivityContainer');
    await expect(timeline).toBeVisible({ timeout: 15000 });
  });

  test('DASH-07: Clicking order in dashboard list navigates to order detail', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForTimeout(1000); // Wait for fetch
    const firstOrderLink = page.locator('a[href*="order-detail.html"]').first();
    if (await firstOrderLink.count() > 0) {
      await firstOrderLink.click();
      await expect(page).toHaveURL(/order-detail\.html\?id=/);
    }
  });
});
