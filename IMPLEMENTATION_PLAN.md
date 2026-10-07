# Implementation Plan: Iqbal Fashion Tailoring CRM (Production-Level PWA)

This document outlines the complete architectural blueprint, technical specifications, and implementation checklist for the production-grade **Iqbal Fashion Tailoring CRM** progressive web application.

---

## 1. System Architecture & Tech Stack

### Core Tech Stack
- **Frontend Framework**: Plain modern HTML5, CSS3, Vanilla JavaScript (ES6+). Zero external front-end framework, zero bundler/build-step overhead. Pure Web & PWA architecture (Chrome, Edge, Safari, Android, iOS).
- **Single-File Page Architecture**: Every route is a standalone `.html` file with inline, scoped `<style>` and `<script>` blocks. Shared utilities (Supabase client initialization, icon helpers, combobox logic, session guards) are consistently marked with section banners.
- **Backend & Database**: **Supabase** (Postgres 15+, Supabase Auth with persistent session storage, Supabase Realtime via WebSockets).
- **Client Library**: `@supabase/supabase-js` v2 loaded via jsDelivr CDN.
- **Serverless API & Push Notification Worker**: Hosted on **Vercel** with Node.js runtime (`/api/send-push.js`, `/api/check-overdue.js`, `/api/create-user.js`).
- **Web Push**: Standard W3C Push API using `web-push` library with VAPID authentication on the Node.js runtime.
- **PWA Runtime**: Service Worker (`sw.js`) with cache-first static shell strategy, network-first API/HTML, background push notifications, offline fallback (`offline.html`), and cross-platform installation prompts.

### Design System & Visual Aesthetics
- **Color Palette**:
  - Primary Background: Pure White (`#FFFFFF`).
  - Text: Deep Black (`#0A0A0A`).
  - Primary Accent (~20% visual surface): Deep Tailor Navy (`#12306B`).
  - Secondary Accent / Hover: Subtle Indigo Slate (`#1E3A8A` / `#2563EB`).
  - Neutral Backgrounds & Borders: Light Gray (`#F4F5F7`), Border Gray (`#E5E7EB`), Muted Slate (`#64748B`).
  - Status Indicators (restrained & muted):
    - In Progress: Blue (`#2563EB` bg `#EFF6FF`).
    - Ready: Amber (`#D97706` bg `#FFFBEB`).
    - Delivered / Completed: Forest Green (`#16A34A` bg `#F0FDF4`).
    - Overdue / Warning: Crimson Red (`#DC2626` bg `#FEF2F2`).
- **Typography**: Inter / system-ui stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
- **Iconography**: **Strictly NO EMOJIS anywhere**. Uniform SVG stroke icons (24x24 viewBox, 1.75 stroke width, round caps & joins).
- **Responsive Layout**: Desktop left sidebar (260px) + content canvas; Mobile collapsible sliding drawer + fixed bottom action navigation bar. Touch targets at least 44px. Zero horizontal overflow.

---

## 2. Directory & File Structure

```
c:/Users/Administrator/Desktop/All projects/Iqbal Tailoring/
├── .gitignore
├── IMPLEMENTATION_PLAN.md
├── README.md
├── schema.sql
├── vercel.json
├── package.json
├── manifest.json
├── sw.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon-180.png
│   └── favicon.svg
├── api/
│   ├── send-push.js
│   ├── check-overdue.js
│   └── create-user.js
├── index.html            (Dashboard: stat cards, stepper pipeline, attention list, live feed)
├── login.html            (Authentication: email/password, session persistence, role checks)
├── orders.html           (Orders: Kanban board & List table, search, multi-filters, quick steps)
├── new-order.html        (Order Entry: customer combobox + auto-save, measurement assignment)
├── order-detail.html     (Order Details: visual stage stepper, action modals, history log, print slip)
├── customers.html        (Customers: search, order count, drawer with garment timeline, notes)
├── employees.html        (Staff: filtered by tailoring role, workload stats, active toggling)
├── history.html          (Audit Trail: global history log with filters and CSV export)
├── notifications.html    (In-App Notification Center: badge, read/unread, direct order links)
├── settings.html         (Settings: profile, PWA install prompt & iOS guide, Web Push, admin users)
└── offline.html          (PWA Offline Fallback)
```

---

## 3. Database & Security Architecture (`schema.sql`)

### Tables
1. **`profiles`**: Links to `auth.users(id)`, stores `full_name`, `role` (`admin` | `manager`), `is_active`, `created_at`.
2. **`customers`**: Stores `id`, `name` (unique case-insensitive via `lower(trim(name))`), `phone`, `notes`, `created_by`, `created_at`.
3. **`employees`**: Stores `id`, `name` (unique case-insensitive), `phone`, `roles` array (`measurement`, `washing`, `cutting`, `stitching`, `finishing`, `other`), `is_active`, `created_at`.
4. **`orders`**: Stores `order_no` (`IF-000001` via sequence), `customer_id`, `garment_type`, `cloth_material`, `quantity`, `notes`, `current_stage`, `status` (`in_progress` | `ready` | `delivered` | `cancelled`), `expected_delivery_date`, `created_by`, timestamps, `delivered_at`, `delivered_by`.
5. **`order_stages`**: Stores one row per stage per order (`order_id`, `stage`, `employee_id`, `employee_name_snapshot`, `status`, `estimated_date`, `started_at`, `completed_at`, `notes`, `updated_by`). Unique on `(order_id, stage)`.
6. **`order_history`**: Immutable audit log populated via triggers or functions (`order_id`, `stage`, `action`, `employee_name`, `actor_id`, `actor_name`, `details`, `created_at`).
7. **`push_subscriptions`**: Stores web push endpoints, `p256dh`, `auth`, `platform`, `user_agent`, `user_id`.
8. **`notifications`**: In-app notifications audit log (`user_id`, `order_id`, `title`, `body`, `stage`, `is_read`, `created_at`).
9. **`app_settings`**: Shop configuration (`shop_name`, `garment_types`, `notification_prefs`).

### Atomic RPC Functions & Triggers
- `create_order_with_stages(...)`: Atomically finds or inserts customer (case-insensitive trimmed match), finds or inserts measuring employee, creates the order with auto-generated `order_no`, inserts all default stages (`measurement` as done, `washing` as pending, `cutting`, `stitching`, `finishing`, `ready`, `delivered`), logs initial history, and generates in-app notification.
- `update_order_stage(...)`: Updates stage status (`in_progress`, `done`, `skipped`), assigns/reassigns employee (auto-inserting if new), advances `orders.current_stage` and `orders.status`, enforces that only `admin` and `manager` can set `delivered`, logs to `order_history`, and creates notification.
- Database trigger on `notifications` table to trigger webhook `/api/send-push` via `pg_net` or Supabase Database Webhook.

### Row Level Security (RLS)
- Enforce RLS on all tables.
- Authenticated users with active profile can query and update business data.
- Only `admin` role can update `profiles`, delete records, or update system `app_settings`.
- Only `admin` and `manager` can mark orders as `delivered`.
- Anonymous public access is completely denied.

---

## 4. Realtime & Sync Strategy

- Each data page sets up Supabase Realtime channel subscriptions on `orders`, `order_stages`, `order_history`, and `notifications`.
- Live connection indicator in top navigation bar (`Connected` green dot / `Reconnecting` amber dot).
- Automatic re-fetch and resubscription on:
  - Channel error/reconnect.
  - Document `visibilitychange` (user switches back to tab/PWA).
  - Window `online` event.
- Top bar manual **Refresh button** on all pages with spinning animation and "Updated just now" timestamp.
- Audio chime via Web Audio API synth (short subtle two-tone chime) on new foreground realtime notifications.

---

## 5. Web Push Notification & Service Worker Architecture

### Push Pipeline
1. Client requests notification permission in `settings.html` or post-PWA installation prompt.
2. Service Worker registers and subscribes via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) })`.
3. Subscription object is stored in `push_subscriptions` linked to `auth.uid()`.
4. When stage changes or order is placed, Supabase inserts into `notifications` and fires Webhook to `/api/send-push`.
5. `/api/send-push.js` (Vercel Serverless Function, Node.js runtime) validates `PUSH_WEBHOOK_SECRET`, queries active subscriptions, signs payloads with `web-push`, and delivers to browser push gateways (FCM, Apple Web Push, Mozilla autopush). Dead subscriptions (HTTP 404/410) are purged automatically.
6. Service Worker `push` event handler wakes up in background, displays notification with:
   - Specific Title & Body (e.g., "Order IF-000102 with Rashid for Cutting").
   - Vibration: `[200, 100, 200, 100, 200]`.
   - `tag` matching order ID (replaces stale notifications for same order).
   - Deep-link URL (`data.url = '/order-detail.html?id=...'`).
7. Service Worker `notificationclick` handler focuses existing open window or opens a new window directly to the order.

### Overdue Checker Cron
- `/api/check-overdue.js` is called every 15–30 minutes via Vercel Cron.
- Queries orders where `estimated_date < current_date` and `status != 'delivered'`, generating overdue warning notifications.

---

## 6. PWA Installation & iOS Safari Strategy

- **Desktop & Android**: Listens for `beforeinstallprompt`, stores deferred prompt, and triggers native prompt when "Install App" button in Settings is clicked. Displays "Already Installed" badge when running in standalone display mode.
- **iPhone / iPad Safari**: Detects iOS Safari environment. "Install App" button opens a step-by-step modal popup with custom SVG illustrations detailing:
  1. Open Iqbal Fashion CRM in Safari.
  2. Tap the **Share** button in the Safari toolbar.
  3. Scroll down and tap **Add to Home Screen**.
  4. Tap **Add** in the top right.
- iOS-specific meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`).

---

## 7. Quality, Performance & Security Standards

- Zero emojis in all code, UI, SVG, markdown, and notification payloads.
- All user inputs sanitized before DOM injection to prevent XSS.
- Print stylesheet for Order Slip (`@media print`) on `order-detail.html`.
- Strict Content Security Policy and security headers in `vercel.json`.
- Zero secrets committed to Git repository (service role key and VAPID private key only in Vercel environment variables).

---

## 8. Implementation Checklist

- [x] Task 1: Architecture plan and documentation setup (`IMPLEMENTATION_PLAN.md`)
- [x] Task 2: Database schema creation (`schema.sql` with tables, indexes, RLS, triggers, RPCs, seed data)
- [x] Task 3: PWA assets setup (`manifest.json`, icon generation, `offline.html`)
- [x] Task 4: Service worker implementation (`sw.js` with caching, push listener, notificationclick)
- [x] Task 5: Vercel serverless functions & configuration (`vercel.json`, `package.json`, `/api/send-push.js`, `/api/check-overdue.js`, `/api/create-user.js`)
- [x] Task 6: Authentication page (`login.html` with Supabase Auth, persistent session, role redirect)
- [x] Task 7: Shared layout, SVG icon library, and combobox component standard
- [x] Task 8: Dashboard page (`index.html` with metrics, stage pipeline stepper, attention list, live feed)
- [x] Task 9: Orders board and list page (`orders.html` with Kanban board, table list, search, filters, quick actions)
- [x] Task 10: New order entry page (`new-order.html` with customer auto-save, measurement assignment)
- [x] Task 11: Order detail page (`order-detail.html` with visual stepper, washing modal, stage actions, print slip, history)
- [x] Task 12: Customer management page (`customers.html` with customer drawer, garment history, search)
- [x] Task 13: Employee management page (`employees.html` with role filters, workload counters, activate/deactivate)
- [x] Task 14: Global history & audit page (`history.html` with filters and CSV export)
- [x] Task 15: Notification center page (`notifications.html` with read/unread toggle, order deep-linking)
- [x] Task 16: Settings page (`settings.html` with profile, PWA install prompt / iOS modal, Web Push tests, user admin)
- [x] Task 17: End-to-end testing, real-time sync verification, responsive layout validation
- [x] Task 18: Documentation (`README.md` with Supabase setup, Vercel env vars, webhook guide)
- [x] Task 19: Git repository initialization and push to https://github.com/mdyahhya/tailoringcrm
