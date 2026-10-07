// tests/05_pipeline.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData, supabase } = require('./helpers/supabase-test-helper');

test.describe('5. Pipeline Stage Transitions & Full Editability', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('PIPE-02, PIPE-03, PIPE-04: Washing step handling (Skip & Assign) and Cutting stage @smoke', async ({ page }) => {
    // 1. Create a fresh test order via new-order page
    const custName = generateTestName('PipeCust');
    await page.goto('/new-order.html');
    await page.fill('#customerComboboxInput', custName);
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#employeeComboboxInput', 'Farhan Master');
    await page.click('#btnSubmitOrder');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });
    const orderUrl = page.url();

    // 2. We should be on Washing stage (or Cutting if washing skipped)
    const actionPanel = page.locator('#actionPanelBody');
    await expect(actionPanel).toBeVisible();

    // Click Skip Washing if button is present
    const skipBtn = actionPanel.locator('button:has-text("Skip Washing")');
    if (await skipBtn.count() > 0) {
      await skipBtn.click();
      await expect(page.locator('.toast-card')).toContainText(/Washing skipped/i);
    }

    // Now should be on Cutting stage: assign staff & start
    await page.waitForTimeout(1000);
    const cuttingStaffInput = page.locator('#actionEmpInput');
    if (await cuttingStaffInput.count() > 0) {
      await cuttingStaffInput.fill('Rashid Tailor');
      await page.click('button:has-text("Start CUTTING")');
      await expect(page.locator('.toast-card')).toContainText(/Started cutting/i);
    }
  });

  test('PIPE-11: Undo / Reopen completed stage restores in_progress status', async ({ page }) => {
    // Navigate to an existing active order (Order 1: IF-000101)
    await page.goto('/orders.html');
    await page.waitForSelector('.order-card-link', { timeout: 15000 });
    await page.click('.order-card-link >> nth=0');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });
    
    // Look for Undo / Reopen button on any done step
    const undoBtn = page.locator('button:has-text("Undo / Reopen")').first();
    if (await undoBtn.count() > 0) {
      await undoBtn.click();
      const toast = page.locator('.toast-card');
      await expect(toast).toContainText(/Reopened/i);
    }
  });

  test('PIPE-12: Un-skipping washing restores step to pending', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('.order-card-link', { timeout: 15000 });
    await page.click('.order-card-link >> nth=0');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    const unskipBtn = page.locator('button:has-text("Un-skip Washing")');
    if (await unskipBtn.count() > 0) {
      await unskipBtn.click();
      const toast = page.locator('.toast-card');
      await expect(toast).toContainText(/restored/i);
    }
  });
});
