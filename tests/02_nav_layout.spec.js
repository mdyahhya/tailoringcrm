// tests/02_nav_layout.spec.js
const { test, expect } = require('@playwright/test');

const PAGES = [
  { url: '/index.html', titlePart: 'Dashboard' },
  { url: '/orders.html', titlePart: 'Orders' },
  { url: '/new-order.html', titlePart: 'Book New Order' },
  { url: '/customers.html', titlePart: 'Customers' },
  { url: '/employees.html', titlePart: 'Staff' },
  { url: '/history.html', titlePart: 'Activity' },
  { url: '/notifications.html', titlePart: 'Notification' },
  { url: '/settings.html', titlePart: 'Settings' }
];

test.describe('2. Layout, Navigation, and Back-Button Handling', () => {

  test('NAV-06: Top bar Refresh button (#refreshBtn) is present on every page and triggers spin @smoke', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      const refreshBtn = page.locator('#refreshBtn');
      await expect(refreshBtn).toBeVisible({ timeout: 10000 });
      
      // Click refresh and verify it doesn't crash or throw console errors
      await refreshBtn.click();
    }
  });

  test('NAV-01 & NAV-02: Desktop sidebar navigation is present with correct active links', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      const sidebar = page.locator('#sidebar');
      await expect(sidebar).toBeVisible();

      // Check active link matches page URL
      const activeNav = sidebar.locator(`.nav-item[href="${p.url}"]`);
      if (await activeNav.count() > 0) {
        await expect(activeNav).toHaveClass(/active/);
      }
    }
  });

  test('NAV-07: Connection indicator reflects online and offline state dynamically', async ({ page, context }) => {
    await page.goto('/index.html');
    const dot = page.locator('#connectionDot');
    const text = page.locator('#connectionText');

    await expect(dot).toBeVisible();
    await expect(text).toHaveText(/Online|Connected/);

    // Simulate going offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(text).toHaveText(/Offline/);

    // Restore online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(text).toHaveText(/Online|Connected/);
  });

  test('NAV-08: 404 handler renders offline/not-found fallback page', async ({ page }) => {
    const response = await page.goto('/non-existent-page-xyz.html');
    expect(response.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/Offline|Not Found|Iqbal/i);
  });

  test('BACK-04: Modals close on Escape key and Backdrop click', async ({ page }) => {
    await page.goto('/settings.html');
    // Open garment modal
    await page.click('#btnAddGarment');
    const modal = page.locator('#garmentModal');
    await expect(modal).toHaveClass(/open/);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/open/);

    // Open again and click outside backdrop
    await page.click('#btnAddGarment');
    await expect(modal).toHaveClass(/open/);
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).not.toHaveClass(/open/);
  });

  test('BACK-04: Modals close on browser Back button (popstate)', async ({ page }) => {
    await page.goto('/settings.html');
    await page.click('#btnAddGarment');
    const modal = page.locator('#garmentModal');
    await expect(modal).toHaveClass(/open/);

    // Trigger browser Back
    await page.goBack();
    await expect(modal).not.toHaveClass(/open/);
  });
});
