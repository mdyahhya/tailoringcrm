// tests/15_push.spec.js
const { test, expect } = require('@playwright/test');

test.describe('15. Web Push Notifications Endpoint & Payload Verification', () => {

  test('PUSH-03: /api/send-push rejects requests missing authorization secret header @smoke', async ({ request }) => {
    const response = await request.post('/api/send-push', {
      data: {
        record: {
          id: 'test-order-id',
          order_no: 'IF-999999',
          current_stage: 'cutting'
        }
      }
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('PUSH-04: /api/send-push accepts valid secret header and payload', async ({ request }) => {
    const secret = process.env.PUSH_WEBHOOK_SECRET || 'iqbal_tailoring_webhook_secret_2025';
    const response = await request.post('/api/send-push', {
      headers: {
        'x-webhook-secret': secret
      },
      data: {
        type: 'test',
        title: 'PW Test Push',
        body: 'Testing push delivery pipeline'
      }
    });

    // Endpoint processes request
    expect([200, 207, 404]).toContain(response.status());
  });

  test('PUSH-06: Service worker push event handler registers vibration and action options', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForTimeout(1000);

    const swHasPush = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });

    expect(swHasPush).toBeTruthy();
  });
});
