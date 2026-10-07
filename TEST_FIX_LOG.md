# Iqbal Fashion Tailoring CRM - Test Fix Log

This log records every issue identified during testing, its root cause, and the applied code fix.

| Test ID | Issue / Symptom | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| **INIT-01** | Multi-user & Manager references present in codebase | Initial implementation included Manager role and multi-user management endpoints | Removed `api/create-user.js`, aligned UI badges and RLS to single admin model | Fixed |
| **INIT-02** | Missing Garment Types CRUD in Settings | Settings previously contained staff login table instead of garment types management | Replaced staff table with Garment Types Add/Edit/Delete panel connected to `app_settings` | Fixed |
| **INIT-03** | Modals did not close on browser Back button | Modals opened without updating browser `history.pushState` | Implemented `history.pushState` and `window.onpopstate` listener for all modals and drawers | Fixed |
| **INIT-04** | Missing Delete Customer & Delete Staff UI | Customers and Employees pages lacked safe deletion buttons and modals | Added Delete buttons with confirmation modals and relational safety checks | Fixed |
| **INIT-05** | Missing Edit/Cancel/Delete Order actions on Order Detail | Order detail only supported stage transitions | Added Edit Order Modal, Cancel Order action, and Delete Order confirmation modal | Fixed |
| **INIT-06** | Top bar Refresh button missing on several pages | Refresh button was only present on `index.html` and `orders.html` | Added `#refreshBtn` and spinning data re-fetch handler to all remaining HTML pages | Fixed |
| **INIT-07** | Individual notification delete and clear all missing | Notifications page only had filter and mark all read | Added toggle read/unread, delete single notification, and clear all buttons | Fixed |
| **PWA-04** | Offline fallback navigation failed with execution context error | Service worker offline test navigated to `/index.html` which redirected to login on unauthenticated context | Updated offline test to navigate to `/login.html` after verifying `navigator.serviceWorker.ready` | Fixed |
| **PUSH-03** / **PUSH-04** | `/api/send-push` returned HTTP 500 instead of 401 on missing secret | Configuration check executed before authorization check; duplicate `bodyData` variable declaration | Moved webhook secret and bearer token verification before server config check; removed duplicate variable | Fixed |

