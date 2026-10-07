// tests/auth.setup.js
const { test: setup, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

const authFile = path.resolve(__dirname, '.auth', 'admin.json');

setup('authenticate as admin', async ({ page, baseURL }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || email === '<fill in>' || password === '<fill in>') {
    console.warn('\n[AUTH WARNING]: Valid ADMIN_EMAIL and ADMIN_PASSWORD are required in .env.test for authenticated flows.');
  }

  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto(`${baseURL}/login.html`);
  await expect(page).toHaveTitle(/Login/);

  if (email && password && email !== '<fill in>' && password !== '<fill in>') {
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#submitBtn');

    // Expect navigation to dashboard
    await page.waitForURL(`${baseURL}/index.html`, { timeout: 15000 });
    await expect(page.locator('#userNameLabel')).toBeVisible();

    await page.context().storageState({ path: authFile });
    console.log('[AUTH SUCCESS]: Storage state saved to', authFile);
  } else {
    // Write empty storage state placeholder
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
  }
});
