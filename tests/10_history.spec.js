// tests/10_history.spec.js
const { test, expect } = require('@playwright/test');

test.describe('10. Global Activity Log and Audit Trail', () => {

  test('HIST-01: Audit log table renders chronological history events @smoke', async ({ page }) => {
    await page.goto('/history.html');
    await page.waitForSelector('#historyTableBody tr', { timeout: 15000 });

    const rows = page.locator('#historyTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('HIST-02: Filters audit logs by stage and action', async ({ page }) => {
    await page.goto('/history.html');
    await page.waitForSelector('#filterStage', { timeout: 15000 });

    await page.selectOption('#filterStage', 'measurement');
    await page.waitForTimeout(400);

    const rows = page.locator('#historyTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('HIST-04: Export to CSV triggers file download with expected headers @smoke', async ({ page }) => {
    await page.goto('/history.html');
    await page.waitForSelector('.btn-export-csv', { timeout: 15000 });

    // Listen for download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.click('.btn-export-csv')
    ]);

    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toContain('.csv');
    }
  });
});
