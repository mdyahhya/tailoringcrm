# Iqbal Fashion Tailoring CRM (Production-Level PWA)

A complete, production-grade Tailoring Order Tracking CRM and Progressive Web Application built for **Iqbal Fashion**, tracking bespoke customer garments through each stage of the tailoring pipeline with real-time updates and background push notifications.

---

## 1. Project Overview & Features

### Core Tailoring Pipeline
The application models the exact tailoring workflow in chronological order:
1. **Measurement** (Required): Records who took customer measurements upon order entry.
2. **Washing** (Optional): Dedicated washing stage with option to assign staff or skip directly to cutting.
3. **Cutting** (Required): Records cutter assignment and estimated completion date.
4. **Stitching** (Required): Tracks stitching master and progress timestamps.
5. **Finishing** (Required): Tracks pressing, quality checking, and finishing staff.
6. **Ready for Delivery**: Notifies staff and customer that the garment is finished.
7. **Delivered**: Secure action restricted strictly to the authenticated **Admin**.

### Key Features
- **Zero Frontend Framework Overhead**: Built with pure vanilla HTML5, CSS3, and JavaScript (ES6+). Ultra-fast page loads, zero build steps, and zero Electron bloat.
- **Pure Web PWA**: Fully responsive on desktop PC, Android smartphones, and iPhone/iPad (Safari). Installable to Home Screen with offline app shell caching.
- **Instant Real-Time Synchronization**: Backed by Supabase Realtime WebSockets (`postgres_changes`) so changes made on any counter device or phone appear instantly without reloading.
- **Production Web Push Notifications**: W3C Push API with VAPID authentication delivered via Vercel serverless Node.js runtime (`/api/send-push`). Wakes up devices even when the app, tab, or browser is completely closed.
- **Smart Comboboxes with Auto-Save**: Free typing on customer and staff fields automatically persists new names into Postgres with case-insensitive matching.
- **Strict Role-Based Security**: Row Level Security (RLS) policies and PostgreSQL triggers prevent unauthorized deletions, unauthorized delivery sign-offs, or bypassed audit logs.
- **Print Order Slip**: Clean, dedicated print stylesheet on the order detail page for generating paper receipts.
- **Zero Emojis**: Clean, professional design system using SVG icons exclusively.

---

## 2. Supabase Configuration & Credentials

- **Supabase Account**: `ctgroupteam@gmail.com`
- **Supabase Project URL**: `https://ajapvxdpxifdhvvszuhp.supabase.co`
- **Supabase Anon Key** (Client-side safe):
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYXB2eGRweGlmZGh2dnN6dWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODk5NTMsImV4cCI6MjA4MTM2NTk1M30.iC9U-MQC6VYZNXd_RugA6_hxZwrhYRsapffOYDCikio
  ```
- **VAPID Public Key** (Client-side safe):
  ```text
  BIHD9xC9bGzRyYITKivlmj0ePMBYgihxBp2n6r6alspYH-Y1hsvkGncwE3p_luJTOGew2zDNwzlGykR_jLO4CbA
  ```
- **VAPID Subject**: `mailto:ctgroupteam@gmail.com`

> **Security Rule**: The Supabase **Service Role Key** and the VAPID **Private Key** must NEVER be committed to Git or exposed in client-side code. They are configured strictly in Vercel environment variables.

---

## 3. Step-by-Step Setup Instructions

### Step 1: Run the Database Schema
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard) with account `ctgroupteam@gmail.com`.
2. Open project `ajapvxdpxifdhvvszuhp`.
3. In the left sidebar, click on **SQL Editor**.
4. Click **New query**, paste the entire contents of `schema.sql`, and click **Run**.
5. The schema creates all 9 tables, indexes, triggers, stored RPC procedures, RLS policies, realtime publication setups, and initial seed demo data.

### Step 2: Create the First Administrator
1. Open `login.html` or navigate to **Authentication > Users** in the Supabase Dashboard and click **Add user** (or sign up via email `ctgroupteam@gmail.com`).
2. Once the user is registered, open the Supabase SQL Editor and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin',
       full_name = 'Iqbal Admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'ctgroupteam@gmail.com');
   ```
3. Verify your admin role:
   ```sql
   SELECT * FROM public.profiles WHERE role = 'admin';
   ```

### Step 3: Set Up the Supabase Database Webhook
To trigger background push notifications whenever an order event is logged:
1. In the Supabase Dashboard, click on **Database** > **Webhooks** (or **Integrations** > **Webhooks**).
2. Click **Create a new webhook**.
3. Name: `push_notification_dispatcher`.
4. Table: `public.notifications`.
5. Events: Check **Insert**.
6. Type of webhook: **HTTP Request**.
7. HTTP Method: `POST`.
8. HTTP URL: `https://<YOUR-VERCEL-DEPLOYMENT-URL>/api/send-push`.
9. HTTP Headers:
   - Header 1: `x-webhook-secret` = `<YOUR_PUSH_WEBHOOK_SECRET>` (the same secret string you set in Vercel).
   - Header 2: `Content-Type` = `application/json`.
10. Click **Create webhook**.

### Step 4: Deploy to Vercel
1. Push this repository to GitHub: `https://github.com/mdyahhya/tailoringcrm`.
2. In [Vercel Dashboard](https://vercel.com), click **Add New** > **Project** and import `tailoringcrm`.
3. Framework Preset: **Other**. Root Directory: `./`.
4. Add the Environment Variables (see Section 4 below).
5. Click **Deploy**.

---

## 4. Vercel Environment Variables

Set the following exact environment variables in your Vercel Project Settings under **Settings > Environment Variables**:

| Variable Name | Description | Value |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Public VAPID key for web push | `BIHD9xC9bGzRyYITKivlmj0ePMBYgihxBp2n6r6alspYH-Y1hsvkGncwE3p_luJTOGew2zDNwzlGykR_jLO4CbA` |
| `VAPID_PRIVATE_KEY` | Private VAPID secret key | Paste your private VAPID key |
| `VAPID_SUBJECT` | Contact URI for push services | `mailto:ctgroupteam@gmail.com` |
| `SUPABASE_URL` | Supabase project API URL | `https://ajapvxdpxifdhvvszuhp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | Copy from Supabase Settings > API (Service Role Secret) |
| `PUSH_WEBHOOK_SECRET` | Shared secret header between Supabase & Vercel | Any secure random string (e.g. generated via openssl rand -hex 24) |

---

## 5. Replacing Keys and Configuration Later

All frontend pages contain a clearly marked shared configuration block at the top of their inline `<script>` tags:

```javascript
/* ===== SHARED: SUPABASE CLIENT CONFIG ===== */
const SUPABASE_URL = "https://ajapvxdpxifdhvvszuhp.supabase.co";
const SUPABASE_ANON_KEY = "...";
const VAPID_PUBLIC_KEY = "...";
```

To update credentials later:
- Update these three constants across:
  `index.html`, `login.html`, `orders.html`, `new-order.html`, `order-detail.html`, `customers.html`, `employees.html`, `history.html`, `notifications.html`, and `settings.html`.
- Update the corresponding environment variables in Vercel Settings.

---

## 6. PWA Installation Instructions

### Desktop PC (Google Chrome & Microsoft Edge)
1. Open the website in Google Chrome or Microsoft Edge.
2. In the browser address bar, click the **Install App** icon, or go to **Settings & PWA** inside the CRM and click **Install App**.
3. Confirm the prompt. The app installs as a standalone desktop window with a dedicated taskbar icon and desktop shortcut.

### Android (Chrome / Samsung Internet)
1. Open the CRM URL in Chrome on Android.
2. An automatic "Add to Home screen" banner will appear, or you can click **Install App** in the CRM Settings.
3. The app installs to your home screen and app drawer with the Iqbal Fashion monogram icon.

### iPhone / iPad (Apple Safari on iOS 16.4+)
1. Open the website in **Safari** (Apple does not permit PWA installation from Chrome for iOS).
2. Tap the **Share** button at the bottom of Safari.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right corner.
5. Launch the app from the Home Screen. Background Web Push notifications will now function as on native iOS apps.

---

## 7. Web Push Notification Architecture & Testing

### How It Works
1. User clicks **Allow Notifications** in `settings.html`.
2. The browser registers with the Push Service (FCM on Android/Chrome, Apple Push Notification service on iOS) using the VAPID Public Key.
3. The subscription endpoint is saved into `push_subscriptions` in Supabase.
4. When a stage progress event occurs, the Supabase Database Webhook fires to `/api/send-push`.
5. The Vercel serverless function uses `web-push` to sign payloads and distribute notifications.
6. The service worker (`sw.js`) intercepts the push event, vibrates the device (`[200, 100, 200, 100, 200]`), and displays a rich notification that deep-links directly to `/order-detail.html?id=...`.

### How to Test Push Notifications
1. Go to **Settings & PWA** (`settings.html`).
2. Click **Allow Notifications** and grant browser permission.
3. Click **Send Test Notification**.
4. Close your browser tab or lock your phone. Within seconds, a test push notification will appear in your system notification tray.

### Known Platform Limitations
- **Apple iOS**: Web Push requires the user to add the app to the Home Screen and is supported on iOS 16.4 and newer.
- **Custom Sounds**: Web Push specifications delegate sound playback to the host operating system. To ensure audible feedback, notifications use `silent: false` alongside an in-app Web Audio synthesizer chime played when the CRM is open in the foreground.

---

## 8. Directory Structure

```
├── .gitignore               # Git ignore rules for node_modules and secrets
├── IMPLEMENTATION_PLAN.md   # Architectural plan and verification checklist
├── README.md                # Documentation and setup guide
├── schema.sql               # Complete idempotent PostgreSQL schema & demo seeds
├── vercel.json              # Vercel serverless runtime and cron configuration
├── package.json             # Backend serverless dependencies (web-push, @supabase/supabase-js)
├── manifest.json            # Web App Manifest for PWA installation
├── sw.js                    # Service worker for offline shell and push notifications
├── icons/                   # High-resolution icons and vector assets
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon-180.png
│   └── favicon.svg
├── api/                     # Vercel Node.js serverless functions
│   ├── send-push.js         # Web push dispatcher and dead endpoint pruner
│   ├── check-overdue.js     # Scheduled cron job for overdue alerts
│   └── create-user.js       # Admin staff user provisioning endpoint
├── index.html               # Shop Dashboard with live pipeline stepper and metrics
├── login.html               # Authentication login with session persistence
├── orders.html              # Kanban board and table list with search and filters
├── new-order.html           # New order entry with customer & measurer comboboxes
├── order-detail.html        # Interactive stage stepper, action modals, history log, print slip
├── customers.html           # Customer directory with garment history drawer
├── employees.html           # Tailor staff management by role with workload counters
├── history.html             # Global activity audit log with CSV export
├── notifications.html       # In-app notification center
├── settings.html            # PWA install prompt, push config, profile, and user admin
└── offline.html             # Friendly offline fallback screen
```

---

## 9. Single-Admin Model & Security

The Iqbal Fashion Tailoring CRM operates on a **Single-Admin Architecture**:
- **Single Login**: Exactly one administrative login account with a preset password.
- **Supabase Sign-Ups Disabled**: In the Supabase Dashboard, navigate to **Authentication > Providers > Email** and turn OFF **Enable Sign Up**. Public account creation and self-service password resets are permanently disabled.
- **Admin Account Creation**: The admin account is created once via the Supabase Auth Dashboard or via the initial seed setup instructions. The password is never stored or served in client-side code.
- **Row Level Security (RLS)**: Anonymous access is strictly denied across all business tables (`customers`, `employees`, `orders`, `order_stages`, `order_history`, `notifications`, `app_settings`). Only the authenticated admin session can read and write data.
- **Full Admin CRUD & Correction**:
  - **Customers**: Create, view, edit name/phone/notes, and delete (guarded against clients with active order history).
  - **Tailor Staff**: Create, edit name/phone/roles, deactivate/reactivate, and delete (historical stage snapshots are preserved).
  - **Orders**: Create, edit all garment and delivery fields, cancel, and permanently delete.
  - **Stage Entries**: Assign, change employee, change target completion dates, edit notes, undo/reopen completed steps, skip/un-skip washing, and move delivered orders back to ready.
  - **Catalog & Settings**: Full CRUD for garment types, notification preferences, and password updates.
  - **Notifications**: Mark individual read/unread, delete single, and clear all.
  - **Audit History**: `order_history` log entries are append-only and non-deletable by design to guarantee an unalterable business audit trail.

---

## 10. Troubleshooting

- **Realtime Not Updating**: Ensure the tables `orders`, `order_stages`, `order_history`, and `notifications` are published in `supabase_realtime` (included in `schema.sql`).
- **Push Notifications Not Delivering**: Check that `VAPID_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are entered into Vercel environment variables and that the Database Webhook header matches `PUSH_WEBHOOK_SECRET`.
- **iOS Install Prompt Not Showing**: On iOS, Apple limits `beforeinstallprompt`. The CRM automatically detects iOS Safari and displays a 4-step diagram modal explaining how to use the Safari Share menu.
