// tests/07_order_detail.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('7. Order Detail, Editing, Cancellation, and Deletion', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('ORD-DET-01 & ORD-DET-02: Pipeline stepper and history timeline render accurately @smoke', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('.order-card-link', { timeout: 15000 });
    await page.click('.order-card-link >> nth=0');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });
    await expect(page.locator('#orderHeaderCard')).toBeVisible();
    await expect(page.locator('#stepperContainer')).toBeVisible();
    await expect(page.locator('#orderHistoryTimeline')).toBeVisible();
  });

  test('ORD-DET-03: Edit order details updates fields and logs to history', async ({ page }) => {
    // 1. Create a dedicated test order
    const custName = generateTestName('EditCust');
    await page.goto('/new-order.html');
    await page.fill('#customerComboboxInput', custName);
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#employeeComboboxInput', 'Farhan Master');
    await page.click('#btnSubmitOrder');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    // 2. Click Edit Order Details
    await page.click('#btnEditOrder');
    const modal = page.locator('#editOrderModal');
    await expect(modal).toHaveClass(/open/);

    // 3. Edit notes and quantity
    await page.fill('#editNotes', 'Updated fitting notes by admin');
    await page.fill('#editQuantity', '3');
    await page.click('button:has-text("Save Changes")');

    // 4. Assert updated values on header card
    await expect(page.locator('#valNotes')).toHaveText('Updated fitting notes by admin');
    await expect(page.locator('#valQuantity')).toHaveText('3');
  });

  test('ORD-DET-04: Cancel order marks status as cancelled', async ({ page }) => {
    const custName = generateTestName('CancelCust');
    await page.goto('/new-order.html');
    await page.fill('#customerComboboxInput', custName);
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#employeeComboboxInput', 'Farhan Master');
    await page.click('#btnSubmitOrder');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    await page.click('#btnCancelOrder');
    const modal = page.locator('#cancelOrderModal');
    await expect(modal).toHaveClass(/open/);

    await page.fill('#cancelReasonInput', 'Customer requested cancellation');
    await page.click('button:has-text("Confirm Cancellation")');

    await expect(page.locator('#orderStatusBadge')).toHaveText(/cancelled/i);
  });

  test('ORD-DET-05: Delete order permanently removes record and redirects to /orders.html', async ({ page }) => {
    const custName = generateTestName('DeleteCust');
    await page.goto('/new-order.html');
    await page.fill('#customerComboboxInput', custName);
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#employeeComboboxInput', 'Farhan Master');
    await page.click('#btnSubmitOrder');

    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    await page.click('#btnDeleteOrder');
    const modal = page.locator('#deleteOrderModal');
    await expect(modal).toHaveClass(/open/);

    await page.click('button:has-text("Delete Permanently")');
    await page.waitForURL(/\/orders\.html/, { timeout: 15000 });
  });

  test('ORD-DET-07: Deep link directly into order-detail loads correctly on fresh page load', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('.order-card-link', { timeout: 15000 });
    const href = await page.locator('.order-card-link').first().getAttribute('href');

    // Navigate fresh to URL
    await page.goto(href);
    await expect(page.locator('#orderNoHeading')).toBeVisible();
    await expect(page.locator('#stepperContainer')).toBeVisible();
  });
});
