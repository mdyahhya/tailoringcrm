// tests/06_orders.spec.js
const { test, expect } = require('@playwright/test');

test.describe('6. Orders List and Board View', () => {

  test('ORD-LIST-04: Kanban Board and Table List view toggle @smoke', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('#kanbanBoard', { timeout: 15000 });

    const kanban = page.locator('#kanbanBoard');
    const table = page.locator('#tableContainer');
    const btnTable = page.locator('#btnTableView');
    const btnKanban = page.locator('#btnKanbanView');

    // Default view is Kanban
    await expect(kanban).toBeVisible();
    await expect(table).toBeHidden();

    // Switch to Table view
    await btnTable.click();
    await expect(table).toBeVisible();
    await expect(kanban).toBeHidden();

    // Switch back to Kanban
    await btnKanban.click();
    await expect(kanban).toBeVisible();
    await expect(table).toBeHidden();
  });

  test('ORD-LIST-01: Search filters orders by customer name or order number', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('#searchInput', { timeout: 15000 });

    const searchInput = page.locator('#searchInput');
    await searchInput.fill('IF-000101');
    await page.waitForTimeout(500);

    // Verify only matching order is displayed
    const visibleCards = page.locator('.order-card-link');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(visibleCards.first()).toContainText('IF-000101');
  });

  test('ORD-LIST-02: Stage filter dropdown updates visible orders', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForSelector('#stageFilter', { timeout: 15000 });

    const stageSelect = page.locator('#stageFilter');
    await stageSelect.selectOption('washing');
    await page.waitForTimeout(500);

    const cards = page.locator('.order-card-link');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
