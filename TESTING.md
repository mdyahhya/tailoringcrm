# Iqbal Fashion Tailoring CRM - Testing & QA Guide

This guide details the complete testing strategy, automation execution, test data management, and the manual physical-device validation checklist for Web Push Notifications.

---

## 1. Automated Test Architecture

The testing suite is built using **Playwright Test** (`@playwright/test`), configured for rapid, isolated, and parallel execution against the live static application and real Supabase backend.

### Project & Folder Structure
- `/tests`: Complete test suite covering all 22 functional areas (105+ test cases).
  - `auth.setup.js`: Global authentication setup that logs in once as Admin and saves storage state (`tests/.auth/admin.json`).
  - `01_auth.spec.js`: Authentication, session persistence, security redirects, and disabled public sign-ups.
  - `02_nav_layout.spec.js`: Layout, desktop sidebar, mobile drawer, connection status, modal back/escape/backdrop behavior.
  - `03_dashboard.spec.js`: Realtime statistics cards, pipeline breakdowns, overdue attention items, recent activities.
  - `04_new_order.spec.js`: Order creation wizard, customer and employee auto-enrollment, validation, XSS hygiene.
  - `05_pipeline.spec.js`: 7-stage workflow transitions, optional washing popup (assign/skip/unskip), cutting dates, stage undo/reopen, history audit logs.
  - `06_orders.spec.js`: Orders list, Kanban board toggle, status filters, search, quick next step.
  - `07_order_detail.spec.js`: Order timeline, order edit modal, stage edit, cancel order, cascade delete, print slip.
  - `08_customers.spec.js`: Customer directory, detail drawer with full order history, edit modal, delete protection when orders exist.
  - `09_employees.spec.js`: Tailor staff directory, multi-role chips, active status toggling, safe delete preserving history snapshots.
  - `10_history.spec.js`: Audit log filtering (stage, action, staff, date), CSV export verification.
  - `11_notifications.spec.js`: In-app notification center, unread counter badge, single read/unread toggle, single delete, clear all with modal.
  - `12_settings.spec.js`: Garment types catalog CRUD, notification preference checkboxes, profile info, password update.
  - `13_realtime_sync.spec.js`: Dual-context multi-window live synchronization over Supabase Realtime channels.
  - `14_pwa.spec.js`: Web manifest verification, icon MIME types, service worker registration, offline fallback caching, iOS 4-step install modal.
  - `15_push.spec.js`: Serverless `/api/send-push` authorization, test payload acceptance, service worker push event options.
  - `16_responsive_visual_a11y.spec.js`: Viewport responsiveness (desktop 1440x900, tablet 820x1180, mobile 390x844), zero emoji DOM enforcement, absence of native browser `alert()` dialogs, accessibility label associations.
  - `17_security_integrity_perf.spec.js`: RLS anonymous restriction audit, no secrets leaked in client-facing bundles, load performance budgets.

---

## 2. Environment Setup

Create `.env.test` in the repository root (based on `.env.test.example`):

```bash
# Application Base URL
BASE_URL=http://localhost:3000

# Single Admin Account Credentials (Supabase Auth)
ADMIN_EMAIL=your-admin@iqbalfashion.com
ADMIN_PASSWORD=YourSecurePassword123!

# Supabase Project Credentials
SUPABASE_URL=https://ajapvxdpxifdhvvszuhp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYXB2eGRweGlmZGh2dnN6dWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODk5NTMsImV4cCI6MjA4MTM2NTk1M30.iC9U-MQC6VYZNXd_RugA6_hxZwrhYRsapffOYDCikio

# Web Push Webhook Secret
PUSH_WEBHOOK_SECRET=iqbal_tailoring_webhook_secret_2025
```

> **Security Note:** `.env.test` is strictly included in `.gitignore` and is never committed to source control.

---

## 3. Running the Tests

Execute tests via npm scripts:

```bash
# Run all Playwright tests across workers
npm test

# Run critical-path smoke tests (approx. 15 core tests)
npm run test:smoke

# Run tests in headed browser mode (visual observation)
npm run test:headed

# Open the interactive HTML test report
npm run test:report
```

---

## 4. Test Data Management & Teardown

To guarantee that the client's production database is never polluted or corrupted by automated runs:
1. **Isolated Test Prefix**: Every test entity (customer, tailor employee, order, garment catalog item) created during automated execution is prefixed with `PW_TEST_`.
2. **Automated Teardown**: The cleanup utility (`tests/helpers/supabase-test-helper.js`) executes cascade deletions after test suites:
   - Deletes `order_stages`, `order_history`, and `notifications` linked to `PW_TEST_` orders.
   - Deletes `PW_TEST_` orders.
   - Deletes `PW_TEST_` customers.
   - Deletes `PW_TEST_` tailor staff members.
   - Cleans temporary `PW_TEST_` garment types from `app_settings`.
3. **Safety Guarantee**: The cleanup routine filters strictly on `PW_TEST_%` and never modifies or deletes genuine client records.

---

## 5. Manual Device Checklist for Closed-App Web Push

Because browser automation engines (such as Playwright) cannot simulate OS-level push notifications to an app that is completely closed and terminated, perform this physical device validation prior to final client handover:

### A. Android Device (Chrome PWA)
1. Open the CRM URL in Chrome for Android (`https://...` or LAN IP).
2. Tap the browser menu `⋮` and select **Install app** / **Add to Home screen**.
3. Launch the installed PWA from the home screen.
4. Navigate to **Settings** > **Push Notifications**.
5. Tap **Enable Push Notifications** and tap **Allow** on the system prompt.
6. Verify that the notification status turns green ("Notifications Active").
7. Completely swipe away / terminate the Iqbal CRM app from Android Recent Apps.
8. From another device (or via curl to `/api/send-push`), trigger a notification for a status transition (e.g. stage marked ready).
9. **Assert**:
   - The device vibrates with the pattern (2-3 pulses).
   - An Android system notification banner appears with the Iqbal CRM badge icon.
   - Tapping the notification wakes the device and navigates directly to `/order-detail.html?id=...`.

### B. Desktop (Google Chrome / Microsoft Edge)
1. Open the CRM in Google Chrome on desktop.
2. Sign in as Admin and go to **Settings** > **Push Notifications**.
3. Tap **Enable Notifications** and grant browser permission.
4. Minimize the browser window.
5. In another tab or test client, create an order or transition a stage.
6. **Assert**:
   - Native Windows / macOS desktop banner appears in the lower-right / upper-right screen corner.
   - Notification displays the action button `View Order`.
   - Clicking the banner focuses the browser window and deep-links to the order.
7. Open the app in the foreground and trigger another notification:
   - **Assert**: Subtle in-app audio chime plays (Web Audio synthesizer).

### C. Apple iPhone (iOS Safari PWA)
> *Note: Web Push on iOS requires iOS 16.4 or later, and the app MUST be installed to the Home Screen.*
1. Open the CRM URL in Mobile Safari on iPhone.
2. Navigate to **Settings** > tap **Install App Guide** (or verify the iOS installation prompt).
3. Tap Safari's **Share** button (box with upward arrow) > tap **Add to Home Screen** > tap **Add**.
4. Open the installed **Iqbal CRM** app from the iPhone Home Screen (running in standalone mode).
5. Log in and navigate to **Settings** > tap **Enable Push Notifications**.
6. Tap **Allow** on the native Apple notification permission dialog.
7. Lock the iPhone screen or switch to another app.
8. Trigger a push notification.
9. **Assert**:
   - The notification appears on the iOS Lock Screen and in Notification Center.
   - Tapping the notification launches the standalone PWA and deep-links to the order.
