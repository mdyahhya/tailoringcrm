// tests/04_new_order.spec.js
const { test, expect } = require('@playwright/test');
const { generateTestName, cleanupTestData } = require('./helpers/supabase-test-helper');

test.describe('4. New Order Creation Flow', () => {

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('ORD-NEW-01: Customer name is required; empty submission shows error @smoke', async ({ page }) => {
    await page.goto('/new-order.html');
    await page.waitForSelector('#newOrderForm', { timeout: 15000 });

    // Try submitting without filling customer name
    await page.click('#btnSubmitOrder');
    const toast = page.locator('.toast-card');
    await expect(toast).toContainText(/Customer name is required/i);
  });

  test('ORD-NEW-07: Quantity validates positive integer bounds', async ({ page }) => {
    await page.goto('/new-order.html');
    const qtyInput = page.locator('#quantityInput');
    await qtyInput.fill('0');
    
    await page.fill('#customerComboboxInput', 'Test Customer');
    await page.click('#btnSubmitOrder');
    const toast = page.locator('.toast-card');
    await expect(toast).toContainText(/Quantity must be at least 1/i);
  });

  test('ORD-NEW-03 & ORD-NEW-11: Create new order with brand-new customer and tailor @smoke', async ({ page }) => {
    const custName = generateTestName('Customer');
    const tailorName = generateTestName('Tailor');

    await page.goto('/new-order.html');
    await page.waitForSelector('#newOrderForm', { timeout: 15000 });

    // Fill customer name
    await page.fill('#customerComboboxInput', custName);
    await page.fill('#customerPhoneInput', '+91 98765 43210');

    // Fill garment specifications
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#clothMaterialInput', 'Premium Linen Cloth');
    await page.fill('#quantityInput', '1');

    // Measurement staff
    await page.fill('#employeeComboboxInput', tailorName);

    // Notes
    await page.fill('#orderNotesInput', 'PW Test fitting instructions');

    // Submit form
    await page.click('#btnSubmitOrder');

    // Assert redirection to order detail page
    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });
    await expect(page.locator('#orderNoHeading')).toBeVisible();
    await expect(page.locator('#valCustomerName')).toContainText(custName);
  });

  test('ORD-NEW-10: Script injection string is properly escaped without execution', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>';
    const safeCustName = generateTestName('XSS');

    await page.goto('/new-order.html');
    await page.waitForSelector('#newOrderForm', { timeout: 15000 });

    await page.fill('#customerComboboxInput', safeCustName);
    await page.selectOption('#garmentTypeSelect', { index: 1 });
    await page.fill('#clothMaterialInput', xssPayload);
    await page.fill('#orderNotesInput', xssPayload);
    await page.fill('#employeeComboboxInput', 'Farhan Master');

    await page.click('#btnSubmitOrder');
    await page.waitForURL(/\/order-detail\.html\?id=/, { timeout: 15000 });

    // Assert the script string is rendered as harmless text, not executed HTML
    const materialValue = page.locator('#valClothMaterial');
    await expect(materialValue).toContainText(xssPayload);
  });
});
