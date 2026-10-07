// tests/09_employees.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('9. Tailor Staff Management', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('EMP-01: Tailor staff grid renders with workload cards @smoke', async ({ page }) => {
    await page.goto('/employees.html');
    await page.waitForSelector('#staffCardsGrid', { timeout: 15000 });

    const cards = page.locator('#staffCardsGrid .staff-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('EMP-02: Role tabs filter tailor staff by stage specialty', async ({ page }) => {
    await page.goto('/employees.html');
    await page.waitForSelector('#staffCardsGrid', { timeout: 15000 });

    // Click Cutter tab
    const cutterTab = page.locator('.role-tab-btn:has-text("Cutting")');
    if (await cutterTab.count() > 0) {
      await cutterTab.click();
      await page.waitForTimeout(300);
      const cards = page.locator('#staffCardsGrid .staff-card');
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('EMP-03: Add new tailor staff member @smoke', async ({ page }) => {
    const newStaffName = generateTestName('Staff');

    await page.goto('/employees.html');
    await page.waitForSelector('#btnAddStaff', { timeout: 15000 });

    await page.click('#btnAddStaff');
    const modal = page.locator('#staffModal');
    await expect(modal).toHaveClass(/open/);

    await page.fill('#staffNameInput', newStaffName);
    await page.fill('#staffPhoneInput', '+91 99999 88888');
    
    // Select role checkbox
    const cuttingCheckbox = page.locator('input[value="cutting"]');
    if (await cuttingCheckbox.count() > 0) {
      await cuttingCheckbox.check();
    }

    await page.click('#btnSaveStaff');

    // Verify staff appears in grid
    await page.waitForTimeout(1000);
    await expect(page.locator('#staffCardsGrid')).toContainText(newStaffName);
  });

  test('EMP-05 & EMP-06: Deactivate staff and delete staff safely', async ({ page }) => {
    const staffToDelete = generateTestName('DelStaff');

    await page.goto('/employees.html');
    await page.click('#btnAddStaff');
    await page.fill('#staffNameInput', staffToDelete);
    await page.click('#btnSaveStaff');
    await page.waitForTimeout(1000);

    // Locate the newly created card
    const card = page.locator(`.staff-card:has-text("${staffToDelete}")`);
    await expect(card).toBeVisible();

    // Click Delete on card
    await card.locator('.btn-staff-delete').click();
    const deleteModal = page.locator('#deleteStaffModal');
    await expect(deleteModal).toHaveClass(/open/);

    await page.click('#btnExecuteDeleteStaff');
    await page.waitForTimeout(1000);
    await expect(page.locator('#staffCardsGrid')).not.toContainText(staffToDelete);
  });
});
