// tests/17_security_integrity_perf.spec.js
const { test, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ajapvxdpxifdhvvszuhp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYXB2eGRweGlmZGh2dnN6dWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODk5NTMsImV4cCI6MjA4MTM2NTk1M30.iC9U-MQC6VYZNXd_RugA6_hxZwrhYRsapffOYDCikio";

test.describe('17. Security, RLS Isolation, Data Integrity, and Performance', () => {

  test('SEC-02: Direct REST queries using anon key with no session return empty or denied by RLS @smoke', async () => {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try reading business tables without auth session
    const { data: custs } = await anonClient.from('customers').select('*');
    const { data: emps } = await anonClient.from('employees').select('*');
    const { data: ords } = await anonClient.from('orders').select('*');
    const { data: stgs } = await anonClient.from('order_stages').select('*');
    const { data: hist } = await anonClient.from('order_history').select('*');
    const { data: notifs } = await anonClient.from('notifications').select('*');

    // All must be empty arrays due to RLS denying anonymous reads
    expect(custs || []).toHaveLength(0);
    expect(emps || []).toHaveLength(0);
    expect(ords || []).toHaveLength(0);
    expect(stgs || []).toHaveLength(0);
    expect(hist || []).toHaveLength(0);
    expect(notifs || []).toHaveLength(0);
  });

  test('SEC-07: No sensitive private keys present in served client files', async ({ page }) => {
    const servedFiles = [
      '/index.html',
      '/orders.html',
      '/settings.html',
      '/sw.js',
      '/manifest.json'
    ];

    for (const file of servedFiles) {
      const response = await page.goto(file);
      const text = await response.text();

      // Ensure service role key and private keys are never exposed in served client files
      expect(text).not.toContain('service_role');
      expect(text).not.toContain('BEGIN PRIVATE KEY');
      expect(text).not.toContain('VAPID_PRIVATE_KEY');
    }
  });

  test('PERF-01: Page load time completes within reasonable performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/index.html');
    const elapsed = Date.now() - start;

    // First load under 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });
});
