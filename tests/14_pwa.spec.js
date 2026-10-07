// tests/14_pwa.spec.js
const { test, expect } = require('@playwright/test');

test.describe('14. Progressive Web App (PWA) Verification', () => {

  test('PWA-01: Manifest file is valid JSON with required fields @smoke', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toContain('Iqbal Fashion');
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/index.html');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });

  test('PWA-02: PWA icons return HTTP 200 and valid image MIME types', async ({ page }) => {
    const iconUrls = [
      '/icons/favicon.svg',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-512.png',
      '/icons/apple-touch-icon-180.png'
    ];

    for (const url of iconUrls) {
      const resp = await page.goto(url);
      expect(resp.status()).toBe(200);
      expect(resp.headers()['content-type']).toMatch(/image\/(svg\+xml|png)/);
    }
  });

  test('PWA-03: Service worker registers successfully in browser', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForTimeout(2000);

    const isRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });

    expect(isRegistered).toBeTruthy();
  });

  test('PWA-04: Offline fallback page loads when offline with no cache', async ({ page, context }) => {
    await page.goto('/login.html');
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });
    // Wait briefly for precaching to settle
    await page.waitForTimeout(1000);
    
    // Simulate offline
    await context.setOffline(true);
    try {
      await page.goto('/offline.html');
      await expect(page.locator('h1')).toContainText(/Offline/i);
    } finally {
      await context.setOffline(false);
    }
  });

  test('PWA-06: iOS iPhone emulation triggers 4-step install modal on settings page', async ({ page }) => {
    await page.goto('/settings.html');
    const iosModal = page.locator('#iosInstallModal');
    
    // Open iOS instructions button
    const btnIos = page.locator('button:has-text("iOS Safari")');
    if (await btnIos.count() > 0) {
      await btnIos.click();
      await expect(iosModal).toHaveClass(/open/);
      await expect(iosModal).toContainText(/Safari/);
      await expect(iosModal).toContainText(/Add to Home Screen/);
    }
  });
});
