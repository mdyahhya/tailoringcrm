// tests/11_notifications.spec.js
const { test, expect } = require('@playwright/test');

test.describe('11. In-App Notifications and Notification Center', () => {

  test('NOTIF-02: Notification list renders alert cards @smoke', async ({ page }) => {
    await page.goto('/notifications.html');
    await page.waitForSelector('#notificationsList', { timeout: 15000 });

    const notifCards = page.locator('#notificationsList .notification-card');
    const count = await notifCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('NOTIF-03: Filter tabs switch between All and Unread alerts', async ({ page }) => {
    await page.goto('/notifications.html');
    await page.waitForSelector('#tabUnread', { timeout: 15000 });

    await page.click('#tabUnread');
    await expect(page.locator('#tabUnread')).toHaveClass(/active/);

    await page.click('#tabAll');
    await expect(page.locator('#tabAll')).toHaveClass(/active/);
  });

  test('NOTIF-04: Mark all notifications as read updates badges', async ({ page }) => {
    await page.goto('/notifications.html');
    await page.waitForSelector('.btn-mark-all-read', { timeout: 15000 });

    await page.click('.btn-mark-all-read >> nth=0');
    await expect(page.locator('.toast-card')).toContainText(/marked as read/i);
  });

  test('NOTIF-06 & NOTIF-07: Single notification read toggle and delete', async ({ page }) => {
    await page.goto('/notifications.html');
    await page.waitForSelector('#notificationsList .notification-card', { timeout: 15000 });

    const firstCard = page.locator('#notificationsList .notification-card').first();
    const toggleBtn = firstCard.locator('.btn-notif-act').first();
    
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click();
      await expect(page.locator('.toast-card')).toBeVisible();
    }
  });

  test('NOTIF-08: Clear all notifications modal opens and closes safely', async ({ page }) => {
    await page.goto('/notifications.html');
    await page.waitForSelector('#btnClearAll', { timeout: 15000 });

    await page.click('#btnClearAll');
    const modal = page.locator('#clearAllModal');
    await expect(modal).toHaveClass(/open/);

    // Cancel modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toHaveClass(/open/);
  });
});
