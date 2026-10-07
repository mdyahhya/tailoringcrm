// tests/12_settings.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('12. Settings & Garment Types Catalog CRUD', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('SET-03, SET-04, SET-05: Garment types catalog CRUD @smoke', async ({ page }) => {
    const testGarment = generateTestName('Garment');

    await page.goto('/settings.html');
    await page.waitForSelector('#btnAddGarment', { timeout: 15000 });

    // 1. Add garment type
    await page.click('#btnAddGarment');
    const modal = page.locator('#garmentModal');
    await expect(modal).toHaveClass(/open/);

    await page.fill('#garmentNameInput', testGarment);
    await page.click('button:has-text("Save Garment Type")');

    // Verify it appears in table
    await page.waitForTimeout(1000);
    const tableBody = page.locator('#garmentTypesTableBody');
    await expect(tableBody).toContainText(testGarment);

    // 2. Delete the created garment type
    const row = tableBody.locator(`tr:has-text("${testGarment}")`);
    await row.locator('.btn-table-action.danger').click();
    
    const deleteModal = page.locator('#deleteGarmentModal');
    await expect(deleteModal).toHaveClass(/open/);
    await deleteModal.locator('button:has-text("Delete")').click();

    await page.waitForTimeout(1000);
    await expect(tableBody).not.toContainText(testGarment);
  });

  test('SET-06 & SET-07: Notification preferences toggles persist state', async ({ page }) => {
    await page.goto('/settings.html');
    await page.waitForSelector('#pref_ready_pickup', { timeout: 15000 });

    const toggle = page.locator('#pref_ready_pickup');
    const isChecked = await toggle.isChecked();

    // Toggle and save
    await toggle.setChecked(!isChecked);
    await page.click('#btnSaveNotifPrefs');

    const toast = page.locator('.toast-card');
    await expect(toast).toContainText(/saved/i);
  });
});
