// tests/01_auth.spec.js
const { test, expect } = require('@playwright/test');
require('dotenv').config({ path: '.env.test' });

test.describe('1. Authentication and Session Management', () => {
  // Use unauthenticated context for auth flow testing
  test.use({ storageState: { cookies: [], origins: [] } });

  test('AUTH-03: Empty email or password triggers HTML5 validation @smoke', async ({ page }) => {
    await page.goto('/login.html');
    const submitBtn = page.locator('#submitBtn');
    await submitBtn.click();
    
    // Email field is required
    const emailInput = page.locator('#email');
    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('AUTH-04: Password visibility toggle switches input type and icon', async ({ page }) => {
    await page.goto('/login.html');
    const pwInput = page.locator('#password');
    const toggleBtn = page.locator('#togglePassword');

    expect(await pwInput.getAttribute('type')).toBe('password');
    await toggleBtn.click();
    expect(await pwInput.getAttribute('type')).toBe('text');
    await toggleBtn.click();
    expect(await pwInput.getAttribute('type')).toBe('password');
  });

  test('AUTH-02: Invalid login attempt shows error message without redirecting', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'invalid_user@iqbalfashion.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('#submitBtn');

    const alertBox = page.locator('#alertBox');
    await expect(alertBox).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login.html');
  });

  test('AUTH-07: Unauthenticated direct access to protected routes redirects to login @smoke', async ({ page }) => {
    const protectedPages = [
      '/index.html',
      '/orders.html',
      '/new-order.html',
      '/customers.html',
      '/employees.html',
      '/history.html',
      '/notifications.html',
      '/settings.html'
    ];

    for (const url of protectedPages) {
      await page.goto(url);
      await expect(page).toHaveURL(new RegExp(`/login\\.html\\?redirect=`));
    }
  });

  test('AUTH-10: Public sign-ups are disabled and no registration link exists in UI', async ({ page }) => {
    await page.goto('/login.html');
    const signupLinks = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create Account")');
    await expect(signupLinks).toHaveCount(0);
  });
});
