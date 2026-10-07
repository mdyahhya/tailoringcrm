// tests/08_customers.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('8. Customers Management and Drawer', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('CUST-01: Customers directory table renders with orders count @smoke', async ({ page }) => {
    await page.goto('/customers.html');
    await page.waitForSelector('#customersTableBody', { timeout: 15000 });

    const rows = page.locator('#customersTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('CUST-02: Search input filters customer list by name or phone', async ({ page }) => {
    await page.goto('/customers.html');
    await page.waitForSelector('#customerSearchInput', { timeout: 15000 });

    await page.fill('#customerSearchInput', 'Rizwan');
    await page.waitForTimeout(400);

    const rows = page.locator('#customersTableBody tr');
    await expect(rows.first()).toContainText('Mohammad Rizwan');
  });

  test('CUST-03: Clicking customer opens detail drawer with orders list', async ({ page }) => {
    await page.goto('/customers.html');
    await page.waitForSelector('#customersTableBody tr', { timeout: 15000 });

    await page.click('#customersTableBody tr >> nth=0');
    const drawer = page.locator('#customerDrawer');
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('#drawerCustomerName')).toBeVisible();

    // Close drawer
    await page.click('#btnCloseDrawer');
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('CUST-05 & CUST-06: Delete customer guard blocks deletion if active orders exist', async ({ page }) => {
    await page.goto('/customers.html');
    await page.waitForSelector('#customersTableBody tr', { timeout: 15000 });

    // Open first customer (Mohammad Rizwan, who has seed orders)
    await page.click('#customersTableBody tr >> nth=0');
    const drawer = page.locator('#customerDrawer');
    await expect(drawer).toHaveClass(/open/);

    // Click Delete Customer
    await page.click('#btnDeleteCustomer');
    const modal = page.locator('#deleteCustomerModal');
    await expect(modal).toHaveClass(/open/);

    // Verify confirmation button is blocked or warning is displayed
    const warning = page.locator('#deleteBlockedWarning');
    const btnExecute = page.locator('#btnExecuteDeleteCustomer');
    
    // Either blocked warning is visible or button is disabled
    const isBlocked = await warning.isVisible();
    const isDisabled = await btnExecute.isDisabled();
    expect(isBlocked || isDisabled).toBeTruthy();
  });
});
