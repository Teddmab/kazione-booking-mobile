# Kazione Booking — Mobile roadmap

Same backend and auth as **kazione-booking-frontends** (Supabase + Edge `api`).

## Done (baseline)

- Expo + expo-router, env (`EXPO_PUBLIC_*`), Supabase (AsyncStorage), API client, Auth + Tenant (`/me`), onboarding, welcome, login/signup, role-based redirect, placeholder dashboards.

---

## Phase 1 — Client discovery ✅

- [x] Types + services: `marketplace-storefronts`, `get-storefront`
- [x] Client stack: Discover home, Browse (search + list), Salon detail (info + services)
- [x] Stub routes: `bookings`, `profile` (still placeholders — Phase 3)
- [x] **Polish:** `SafeImage` (fallback on broken/missing URLs), `accessibilityRole` / `accessibilityLabel` on salon cards & rows, pull-to-refresh on Discover + Browse, empty + retry error states

## Phase 2 — Client booking (core flow ✅, card / MM in-app ✅)

- [x] Service → optional specialist → date strip (21 days) → time slots via **`get-availability`**
- [x] Guest details + GDPR consent → review (pay at salon / deposit / full)
- [x] **`create-booking`** + success screen with **booking reference**; **`payment_pending`** when Stripe cannot run in-app (no publishable key, key hint mismatch vs backend, or legacy web-only message)
- [x] **Stripe Payment Sheet** (`@stripe/stripe-react-native`) + **Pawapay** (`/pawapay-payment` + polling **`/appointments`**) — parity with `SalonBooking.tsx` paying step

## Phase 3 — Client account

- [ ] My bookings list + detail (`useCustomerBookings` parity)
- [ ] Favorites
- [ ] Profile (read/update user metadata / API if any)

## Phase 4 — Owner / manager

- [ ] Shell + tabs (appointments, clients, staff, services, finance, reports, insights, settings, storefront, marketplace listing)
- [ ] Wire each area to existing REST paths used on web

## Phase 5 — Staff & reception

- [ ] Staff schedule, clients, reports
- [ ] Receptionist flows matching web routes

## Phase 6 — Hardening

- [ ] Deep links (email confirm, password reset, OAuth)
- [ ] Multi-business picker when `businesses.length > 1`
- [ ] Offline / retry UX, Sentry, EAS build profiles, CI

---

## How we work step-by-step

1. Phase 1 is **closed** for discovery UX.
2. Phase 2 **MVP** includes in-app Stripe Payment Sheet and Pawapay; web-style `payment_pending` remains as fallback when the app cannot present Stripe safely.
3. Keep PR-sized slices (e.g. “Stripe mobile only” then “Pawapay mobile only”).
