# PR description — Sprint M3 Owner (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M3 — Appointments & Calendar.md`](../../../kazione-docs/team/MOBILE/Sprint%20M3%20%E2%80%94%20Appointments%20%26%20Calendar.md)

## Summary

Sprint **M3 — Appointments & Calendar** (owner / manager): full appointment management on mobile — weekly calendar, list toggle, detail sheet with status actions, walk-in quick booking, reschedule, and in-app notifications.

**Not in this PR:** client marketplace booking wizard (`app/booking/*`) — see `docs/PR-SPRINT-M3-SUMMARY.md` on a separate branch if needed.

### M3-01 — Calendar week view

- Replaces flat-only `appointments.tsx` with **Week | List** toggle
- Header: week range label + ← → navigation + tap “Aujourd’hui”
- Custom week grid (8h–20h), blocks color-coded by status, current-time line on today
- `lib/ownerCalendar.ts` + `hooks/useOwnerCalendar.ts`

### M3-02 — Appointment detail sheet

- `components/owner/AppointmentDetailSheet.tsx` (Modal, no extra native deps)
- Context actions: pending → Confirm / Cancel; confirmed → Complete / No-show / Reschedule / Cancel
- Cancel uses **`POST /cancel-booking`** with reason picker (not PATCH alone)

### M3-03 — Walk-in booking

- `app/(app)/owner/walk-in.tsx` — 3 steps: client (passage or search) → service/staff/slot → confirm
- FAB on Appointments + dashboard “Passage rapide” card
- **`POST /create-booking`** with `payment_method: later`

### M3-04 — Reschedule

- `components/owner/RescheduleSheet.tsx` — date strip + slots from **`GET /get-availability`**
- **`POST /reschedule-booking`**

### M3-05 — Notifications (in-app)

- `NotificationBell` on Appointments header, `app/(app)/owner/notifications.tsx`
- **`GET /notifications`**, mark read / mark-all-read, badge count, 60s polling
- **Push Expo not wired** — backend has no `register_token` action yet (documented gap)

### API / services

| Endpoint | Use |
| -------- | --- |
| `GET /appointments` | Week/list data (`date_from` / `date_to`) |
| `PATCH /appointments?id=` | Confirm, complete, no_show |
| `POST /cancel-booking` | Cancel with reason |
| `POST /reschedule-booking` | Move slot |
| `POST /create-booking` | Walk-in |
| `GET /get-availability` | Walk-in + reschedule slots |
| `GET /notifications` | List + unread badge |

---

## Unit tests performed (automated)

Run on branch `feat/sprint-m3-owner-appointments`

| Command | Result |
| ------- | ------ |
| `npm test` | **47/47 passed** (16 suites, 1 snapshot) |
| `npm run typecheck` | **0 errors** |

### Sprint M3 Owner — new tests (2)

| File | Tests |
| ---- | ----- |
| `__tests__/owner/ownerCalendar.test.ts` | `startOfWeekMonday` → Monday; `groupAppointmentsByWeekDay` assigns appointment to day index 0 |

### Existing suite — still passing (45)

Includes M1/M2 auth, marketplace, booking store/slots (if present on branch), i18n, components snapshot.

> **Note:** M3 UI components (WeekCalendarView, sheets, walk-in screen) are covered by **manual QA** below; no component snapshot tests added for this sprint (same pattern as early M2 before dedicated RTL tests).

---

## Manual tests — to validate (reviewer / QA)

> Requires local Supabase + owner login (`owner@afrotouch.ee` / `Test1234!`) via **login-team**.

- [ ] `.env` LAN IP for physical device; `supabase start` on PC
- [ ] Owner → **Rendez-vous** → default **Semaine** view shows appointments in correct columns
- [ ] ← → changes week; tap range label area resets to current week
- [ ] Toggle **Liste** → same appointments, tap row opens detail sheet
- [ ] Tap calendar block → sheet: client, service, staff, reference, status badge
- [ ] **Pending** → Confirm → status updates, list refreshes
- [ ] **Confirmed** → Complete / No-show work
- [ ] **Cancel** → pick reason → appointment cancelled via API
- [ ] **Reprogrammer** → pick date + slot → new time in list/calendar
- [ ] FAB **+** → walk-in 3 steps → booking appears in week/list + dashboard KPI
- [ ] Dashboard **Passage rapide** → same flow
- [ ] Bell icon → notifications list; unread badge; mark one / mark all read
- [ ] `npm run typecheck` && `npm test` green in CI

---

## Files changed (high level)

- `app/(app)/owner/appointments.tsx`, `walk-in.tsx`, `notifications.tsx`, `_layout.tsx`, `index.tsx`
- `components/owner/WeekCalendarView.tsx`, `AppointmentListView.tsx`, `AppointmentDetailSheet.tsx`, `RescheduleSheet.tsx`, `NotificationBell.tsx`
- `hooks/useOwnerCalendar.ts`, `useOwnerNotifications.ts`, `useOwnerAppointments.ts`
- `services/owner/appointments.ts`, `services/owner/notifications.ts`
- `lib/ownerCalendar.ts`
