// tests/16_responsive_visual_a11y.spec.js
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const TEST_URLS = [
  '/index.html',
  '/orders.html',
  '/new-order.html',
  '/customers.html',
  '/employees.html',
  '/history.html',
  '/notifications.html',
  '/settings.html'
];

test.describe('16. Responsive UI, Visual Rules & Accessibility Sanity', () => {

  test('VIS-02: Zero emojis rendered anywhere in DOM across all pages @smoke', async ({ page }) => {
    // Emoji regex checking standard unicode emoji ranges
    const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

    for (const url of TEST_URLS) {
      await page.goto(url);
      const textContent = await page.evaluate(() => document.body.innerText);
      const hasEmoji = emojiRegex.test(textContent);
      expect(hasEmoji, `Found emoji on page ${url}`).toBeFalsy();
    }
  });

  test('VIS-03: No native browser alert() dialogs triggered', async ({ page }) => {
    let dialogTriggered = false;
    page.on('dialog', (dialog) => {
      dialogTriggered = true;
      dialog.dismiss();
    });

    for (const url of TEST_URLS) {
      await page.goto(url);
    }

    expect(dialogTriggered).toBeFalsy();
  });

  test('RESP-02: No horizontal scrollbar / overflow at mobile 390x844 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const url of TEST_URLS) {
      await page.goto(url);
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll, `Horizontal scroll overflow detected on ${url}`).toBeFalsy();
    }
  });

  test('A11Y-01: Form inputs have corresponding labels', async ({ page }) => {
    await page.goto('/new-order.html');
    const inputs = page.locator('input[type="text"], input[type="number"], select, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect(await label.count() > 0 || await input.getAttribute('aria-label') !== null).toBeTruthy();
      }
    }
  });
});
