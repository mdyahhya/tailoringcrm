# Iqbal Fashion Tailoring CRM - Comprehensive QA Test Plan

This document defines the complete end-to-end and integration test specifications for the Iqbal Fashion Tailoring CRM (Single-Admin Model). All tests are automated via Playwright running against the application shell and real Supabase backend.

---

## 1. Authentication and Session Management
- [ ] **AUTH-01**: Valid login with preset Admin credentials redirects to Dashboard (`/index.html`) using `location.replace`.
- [ ] **AUTH-02**: Invalid login attempt with incorrect password shows red error alert without redirecting.
- [ ] **AUTH-03**: Empty email or password triggers HTML5 form validation and halts submission.
- [ ] **AUTH-04**: Password visibility toggle toggles input type between `password` and `text` and updates the eye SVG.
- [ ] **AUTH-05**: Active session persists on browser page refresh (`getSession()` recovers valid admin user).
- [ ] **AUTH-06**: Logout clears Supabase session token and redirects to `/login.html`.
- [ ] **AUTH-07**: Unauthenticated direct access to protected routes (`/index.html`, `/orders.html`, `/order-detail.html`, etc.) immediately redirects to `/login.html?redirect=...`.
- [ ] **AUTH-08**: Browser Back button after logout does not reveal protected content and forces redirect to login.
- [ ] **AUTH-09**: Browser Back button on `/index.html` after login does not navigate back to `/login.html`.
- [ ] **AUTH-10**: Public sign-ups are disabled and no sign-up link or self-service account registration exists in the UI.

## 2. Layout, Responsive Navigation, and Top Bar
- [ ] **NAV-01**: Sidebar desktop navigation links are present on all pages (`Dashboard`, `Orders`, `New Order`, `Customers`, `Tailor Staff`, `Activity Log`, `Notifications`, `Settings`).
- [ ] **NAV-02**: Active navigation link styling correctly reflects the currently visited page.
- [ ] **NAV-03**: Mobile hamburger button toggles sidebar drawer open and closed with backdrop overlay.
- [ ] **NAV-04**: Mobile bottom navigation bar is visible on mobile viewports and links to primary sections.
- [ ] **NAV-05**: Top bar brand logo links back to `/index.html`.
- [ ] **NAV-06**: Top bar Refresh button (`#refreshBtn`) is present on every single page and triggers re-fetch with spin animation.
- [ ] **NAV-07**: Connection indicator shows online status and dynamically updates when offline.
- [ ] **NAV-08**: 404 handler renders the custom styled fallback page (`/offline.html`) on non-existent routes.

## 3. Dashboard Metrics and Attention Lists
- [ ] **DASH-01**: Metric card "Active Orders" count matches count of orders with status `in_progress`.
- [ ] **DASH-02**: Metric card "Ready for Pickup" count matches orders with status `ready`.
- [ ] **DASH-03**: Metric card "Delivered (This Month)" matches orders delivered in current month.
- [ ] **DASH-04**: Pipeline breakdown counts (Measurement, Washing, Cutting, Stitching, Finishing, Ready, Delivered) accurately tally order stages.
- [ ] **DASH-05**: "Needs Attention" list accurately displays orders whose expected delivery date is overdue or due today.
- [ ] **DASH-06**: "Recent Activity" timeline displays recent events from `order_history`.
- [ ] **DASH-07**: Clicking an order in the dashboard list navigates to `/order-detail.html?id=...`.

## 4. New Order Creation Flow
- [ ] **ORD-NEW-01**: Customer name is strictly required; submitting an empty field displays validation error.
- [ ] **ORD-NEW-02**: Existing customer autocomplete type-ahead auto-fills phone number and fitting notes.
- [ ] **ORD-NEW-03**: Typing a brand-new customer name automatically saves them to the `customers` table upon order submission.
- [ ] **ORD-NEW-04**: Customer name whitespace trimming and case-insensitive deduplication ("Ali " vs "ali").
- [ ] **ORD-NEW-05**: Garment type selection populates from available catalog options.
- [ ] **ORD-NEW-06**: Cloth material and description inputs accept custom text and store accurately.
- [ ] **ORD-NEW-07**: Quantity field validates positive integers (bounds $\ge 1$).
- [ ] **ORD-NEW-08**: Expected delivery date datepicker sets date in the future.
- [ ] **ORD-NEW-09**: Measurement tailor selection allows selecting existing employee or typing a new employee name (auto-saved).
- [ ] **ORD-NEW-10**: XSS script injection payloads in customer name, material, and notes are sanitized and rendered as plain text.
- [ ] **ORD-NEW-11**: Successful creation generates sequential order number (`IF-XXXXXX`), initializes stages, and redirects to Order Detail.

## 5. Tailoring Pipeline Stages & State Machine
- [ ] **PIPE-01**: Newly created order initializes at `measurement` stage with initial stage marked done.
- [ ] **PIPE-02**: Next stage presents Washing decision prompt (assign washer staff or skip washing).
- [ ] **PIPE-03**: Skipping washing advances order directly to `cutting` stage and marks washing as `skipped`.
- [ ] **PIPE-04**: Un-skipping washing reverts washing stage to active and allows assigning a washer.
- [ ] **PIPE-05**: Cutting stage allows setting estimated completion date via quick chips (+1d, +2d, +3d) or datepicker.
- [ ] **PIPE-06**: Stitching stage assignment assigns active tailor and logs start timestamp.
- [ ] **PIPE-07**: Finishing stage assignment and completion advances order status to `ready`.
- [ ] **PIPE-08**: Ready stage displays "Ready for Delivery" notification and action banner.
- [ ] **PIPE-09**: Delivered stage can be marked with delivery notes by the Admin.
- [ ] **PIPE-10**: Delivery action records `delivered_at` timestamp and changes order status to `delivered`.
- [ ] **PIPE-11**: Pipeline enforces strict sequence; out-of-order stage transitions are blocked by RLS/RPC.
- [ ] **PIPE-12**: Undo/revert stage action moves an in-progress or completed stage back to the preceding state.
- [ ] **PIPE-13**: Reopen completed stage allows re-assigning staff and adding notes.
- [ ] **PIPE-14**: Reassign employee modal updates active staff snapshot and records entry in `order_history`.

## 6. Orders List and Kanban Board
- [ ] **ORD-LIST-01**: Orders list renders table with order number, customer, garment type, current stage, due date, and status.
- [ ] **ORD-LIST-02**: Search input filters orders in real time by customer name, phone number, and order number.
- [ ] **ORD-LIST-03**: Stage filter dropdown filters table by specific stage (`cutting`, `stitching`, etc.).
- [ ] **ORD-LIST-04**: Status filter dropdown filters by `in_progress`, `ready`, `delivered`, `cancelled`.
- [ ] **ORD-LIST-05**: Garment type filter filters by selected garment.
- [ ] **ORD-LIST-06**: Combined multi-filter filters records meeting all conditions simultaneously.
- [ ] **ORD-LIST-07**: Board/List view toggle switches between table view and visual Kanban board view.
- [ ] **ORD-LIST-08**: Quick "Move to Next Step" action advances stage directly from list/board with confirmation.
- [ ] **ORD-LIST-09**: Empty state displays helpful messaging when no orders match search/filter criteria.

## 7. Order Detail & Order CRUD
- [ ] **ORD-DET-01**: Stepper bar accurately visualizes all 7 steps with proper completed, active, and pending indicators.
- [ ] **ORD-DET-02**: Order Detail header shows customer info, garment type, quantity, fabric, and notes.
- [ ] **ORD-DET-03**: Activity timeline renders chronological history log with timestamps and actor snapshot.
- [ ] **ORD-DET-04**: Edit Order Modal allows admin to edit customer, garment type, material, quantity, notes, and due date.
- [ ] **ORD-DET-05**: Cancel Order action marks order status `cancelled` with reason prompt and creates history log.
- [ ] **ORD-DET-06**: Delete Order action displays confirmation modal and safely cascades deletion of order stages and history.
- [ ] **ORD-DET-07**: Print slip button opens clean print layout excluding navigation and controls.
- [ ] **ORD-DET-08**: Deep link (`/order-detail.html?id=...`) renders correctly on page reload and direct navigation.

## 8. Customers Directory & CRUD
- [ ] **CUST-01**: Customers table displays name, phone, notes, total orders count, and registration date.
- [ ] **CUST-02**: Real-time search filters customers by name or phone number.
- [ ] **CUST-03**: Add Customer modal creates a new customer record with name, phone, and fitting notes.
- [ ] **CUST-04**: Edit Customer modal updates existing customer details and updates active view.
- [ ] **CUST-05**: Clicking customer row opens Customer Detail Drawer showing full garment history and active stage.
- [ ] **CUST-06**: Delete Customer on client with 0 orders displays confirmation modal and successfully deletes.
- [ ] **CUST-07**: Delete Customer on client with existing orders displays warning modal blocking deletion.

## 9. Tailor Staff Management & Workload
- [ ] **EMP-01**: Staff grid displays tailor cards with name, phone, assigned roles, and active status indicator.
- [ ] **EMP-02**: Workload metrics display accurate "In Progress" and "Completed" counts per employee.
- [ ] **EMP-03**: Role filter tabs filter staff by role (`measurement`, `washing`, `cutting`, `stitching`, `finishing`).
- [ ] **EMP-04**: Add Staff modal creates employee with multiple roles and optional phone.
- [ ] **EMP-05**: Edit Staff modal updates employee name, phone, and role assignments.
- [ ] **EMP-06**: Deactivate/Reactivate toggle switches `is_active` status and updates card appearance.
- [ ] **EMP-07**: Delete Staff displays confirmation modal; historical stage entries retain `employee_name_snapshot`.

## 10. Audit History Log & Export
- [ ] **HIST-01**: History table displays chronological audit logs with timestamp, order number, stage, action, and staff name.
- [ ] **HIST-02**: Filter history by stage, action type, customer name, employee name, and date range.
- [ ] **HIST-03**: "Export to CSV" button downloads valid CSV containing all filtered audit records.
- [ ] **HIST-04**: CSV content verification asserts headers, order number, and proper escaping.
- [ ] **HIST-05**: History records are immutable audit entries and cannot be deleted via the UI.

## 11. In-App Notifications
- [ ] **NOTIF-01**: Bell icon badge in navigation displays unread notifications count.
- [ ] **NOTIF-02**: Notifications list renders alerts sorted chronologically with unread status indicators.
- [ ] **NOTIF-03**: Filter tabs switch between "All" and "Unread" notifications.
- [ ] **NOTIF-04**: Clicking a notification marks it as read and navigates to the associated order detail.
- [ ] **NOTIF-05**: "Mark All as Read" button marks all unread notifications read.
- [ ] **NOTIF-06**: Toggle read/unread button allows individual notification status toggle.
- [ ] **NOTIF-07**: Delete individual notification removes it from list and database.
- [ ] **NOTIF-08**: "Clear All" notifications removes all notifications with confirmation.

## 12. Settings & Shop Configuration
- [ ] **SET-01**: Admin Profile form displays admin email and allows updating full name.
- [ ] **SET-02**: Password change form validates $\ge 6$ characters and updates password via Supabase Auth.
- [ ] **SET-03**: Garment Types section lists configured garment types from `app_settings`.
- [ ] **SET-04**: Add new garment type adds item to catalog and persists to `app_settings`.
- [ ] **SET-05**: Edit garment type updates existing garment type name.
- [ ] **SET-06**: Delete garment type removes garment type with confirmation.
- [ ] **SET-07**: Notification preferences toggles save preferences to `app_settings`.
- [ ] **SET-08**: Push notification permission status text dynamically reflects browser permission state.
- [ ] **SET-09**: "Send Test Notification" dispatches push notification payload to `/api/send-push`.
- [ ] **SET-10**: Clear app cache button clears CacheStorage caches and reloads.

## 13. Real-Time Synchronization & Multi-Tab Behavior
- [ ] **RT-01**: Two simultaneous browser windows synchronize order stage transition without manual reload within 3s.
- [ ] **RT-02**: Adding a new order in Window A immediately renders new card in Window B.
- [ ] **RT-03**: Reconnection sync: toggling network offline and back online triggers re-fetch and sync.
- [ ] **RT-04**: Page visibility change (tab switch back to foreground) verifies fresh data.

## 14. Progressive Web App (PWA) Capabilities
- [ ] **PWA-01**: Web App Manifest (`manifest.json`) is valid JSON with required fields (`name`, `short_name`, `icons`, `start_url`, `display`).
- [ ] **PWA-02**: All configured PWA icons load successfully with HTTP 200 (`icon-192.png`, `icon-512.png`, `apple-touch-icon-180.png`).
- [ ] **PWA-03**: Service Worker (`sw.js`) registers and activates successfully on application load.
- [ ] **PWA-04**: Offline mode (`context.setOffline(true)`) serves cached shell and data gracefully.
- [ ] **PWA-05**: Offline fallback page (`offline.html`) renders when navigating to un-cached uncached routes while offline.
- [ ] **PWA-06**: Desktop/Android install button triggers `beforeinstallprompt` prompt.
- [ ] **PWA-07**: iPhone emulation (iOS Safari User-Agent) displays step-by-step "Add to Home Screen" modal.
- [ ] **PWA-08**: Standalone display mode emulation reflects "Already Installed" badge and disables install button.

## 15. Web Push Notifications & Serverless Functions
- [ ] **PUSH-01**: Requesting push permission in granted state creates row in `push_subscriptions` table.
- [ ] **PUSH-02**: Denied permission state displays warning message directing to browser permissions.
- [ ] **PUSH-03**: `/api/send-push` rejects requests lacking authorization header or webhook secret with HTTP 401.
- [ ] **PUSH-04**: `/api/send-push` accepts valid requests and returns HTTP 200 with sent count.
- [ ] **PUSH-05**: `/api/send-push` automatically deletes expired or invalid subscriptions (HTTP 404/410 handling).
- [ ] **PUSH-06**: Service worker push event handler displays notification with title, body, vibrate pattern, and action buttons.
- [ ] **PUSH-07**: Notification click event opens or focuses existing application window to order deep link.
- [ ] **PUSH-08**: In-app chime sound plays when notification is received while application is foregrounded.

## 16. Responsive UI & Viewport Validation
- [ ] **RESP-01**: Desktop viewport (1440x900) displays full multi-column layout without horizontal scrollbar.
- [ ] **RESP-02**: Tablet viewport (820x1180) adapts layout with collapsible sidebar and responsive grid.
- [ ] **RESP-03**: Mobile viewport (390x844) displays bottom navigation, full-width cards, and hamburger drawer.
- [ ] **RESP-04**: Interactive touch targets across all mobile viewports meet minimum $\ge 44 \times 44\text{px}$ sizing.
- [ ] **RESP-05**: All modals fit within mobile viewport height without clipping or inaccessible action buttons.

## 17. Visual Design, Contrast, and No-Emoji Standards
- [ ] **VIS-01**: Strict color palette enforced (Pure White `#FFFFFF`, Dark Navy `#12306B`, Dark Slate text).
- [ ] **VIS-02**: Zero emoji characters exist in rendered DOM or source code across all pages (inline SVG only).
- [ ] **VIS-03**: No standard native browser `alert()` or `confirm()` dialogs used (custom accessible modals/toasts only).
- [ ] **VIS-04**: Clean browser console with 0 uncaught errors and 0 unexpected 4xx/5xx network failures.

## 18. Accessibility (A11y) & WCAG Compliance
- [ ] **A11Y-01**: Automated axe-core scan on `/login.html` passes with 0 serious or critical violations.
- [ ] **A11Y-02**: Automated axe-core scan on `/index.html` passes with 0 serious or critical violations.
- [ ] **A11Y-03**: Automated axe-core scan on `/orders.html` passes with 0 serious or critical violations.
- [ ] **A11Y-04**: Automated axe-core scan on `/new-order.html` passes with 0 serious or critical violations.
- [ ] **A11Y-05**: Automated axe-core scan on `/order-detail.html` passes with 0 serious or critical violations.
- [ ] **A11Y-06**: Automated axe-core scan on `/customers.html` passes with 0 serious or critical violations.
- [ ] **A11Y-07**: Automated axe-core scan on `/employees.html` passes with 0 serious or critical violations.
- [ ] **A11Y-08**: Automated axe-core scan on `/history.html` passes with 0 serious or critical violations.
- [ ] **A11Y-09**: Automated axe-core scan on `/notifications.html` passes with 0 serious or critical violations.
- [ ] **A11Y-10**: Automated axe-core scan on `/settings.html` passes with 0 serious or critical violations.
- [ ] **A11Y-11**: Keyboard navigation: New Order form can be completed and submitted entirely using Tab, Enter, and Space keys.
- [ ] **A11Y-12**: Modals trap keyboard focus and return focus to triggering element upon closure.

## 19. Security & Row Level Security (RLS)
- [ ] **SEC-01**: Unauthenticated requests to Supabase REST API for `orders` table are rejected by RLS (HTTP 401/empty).
- [ ] **SEC-02**: Unauthenticated requests to `customers` table are rejected by RLS.
- [ ] **SEC-03**: Unauthenticated requests to `employees` table are rejected by RLS.
- [ ] **SEC-04**: Unauthenticated requests to `order_stages` table are rejected by RLS.
- [ ] **SEC-05**: Unauthenticated requests to `order_history` table are rejected by RLS.
- [ ] **SEC-06**: Unauthenticated requests to `push_subscriptions` table are rejected by RLS.
- [ ] **SEC-07**: No sensitive secrets (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, admin password) leaked in served files.
- [ ] **SEC-08**: Customer name and order notes with HTML tags `<script>alert(1)</script>` render escaped without execution.

## 20. Data Integrity & Edge Cases
- [ ] **EDGE-01**: Concurrent order stage update from two browser contexts handles race condition cleanly.
- [ ] **EDGE-02**: Double-clicking form submit buttons does not generate duplicate orders or customers.
- [ ] **EDGE-03**: Submitting order with extreme character lengths (1000+ chars notes) stores cleanly without UI break.
- [ ] **EDGE-04**: Dates display in Indian Standard Time (IST / Asia/Kolkata) locale formatting (`DD/MM/YYYY` or `DD Mon YYYY`).
- [ ] **EDGE-05**: Network disconnection mid-request triggers error toast notification without corrupting local state.

## 21. Performance Sanity
- [ ] **PERF-01**: Initial page load and first contentful render completes within 2.5s on throttled network profile.
- [ ] **PERF-02**: Idle pages do not execute continuous polling loops when realtime WebSocket is connected.

## 22. Browser Back-Button & Modal Popstate Handling
- [ ] **BACK-01**: Pressing browser Back when a modal is open (`washingModal`) closes the modal and stays on the page.
- [ ] **BACK-02**: Pressing browser Back when Customer Detail Drawer is open closes the drawer and stays on `/customers.html`.
- [ ] **BACK-03**: Pressing Escape key closes any active modal or drawer.
- [ ] **BACK-04**: Clicking outside the modal container (on backdrop) closes the modal.
- [ ] **BACK-05**: In-app "Back to Orders" button on `/order-detail.html` navigates back to `/orders.html`.
- [ ] **BACK-06**: Search filters and active tabs are preserved when navigating forward and backward.
