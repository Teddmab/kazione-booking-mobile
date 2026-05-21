# PR description — Sprint M2 (copy-paste)

> **Canonical report:** [`kazione-docs/team/MOBILE/M2 — Implementation Report.md`](../../../kazione-docs/team/MOBILE/M2%20—%20Implementation%20Report.md)

## Summary

Sprint **M2 — Marketplace & Salon Discovery**: browse salons on `(tabs)/Home`, search with 400ms debounce, category filters, 2-column infinite scroll, full storefront at `/salon/[slug]`, skeletons, i18n error/empty states, and deep links (`kazione://salon/{slug}`).

Uses real Edge Functions: `GET /marketplace-storefronts` and `GET /get-storefront` (page-based pagination, not `next_cursor`).

---

## Unit tests performed (automated)

Run on branch `feat/sprint-m2-marketplace` — **2026-05-19**

| Command | Result |
| ------- | ------ |
| `npm test` | **35/35 passed** (13 suites, 1 snapshot) |
| `npm run typecheck` | **0 errors** |
| `npm run lint` | **0 errors** (style warnings only) |

### Sprint M2 — new tests (12)

| File | Tests |
| ---- | ----- |
| `__tests__/marketplace/marketplaceService.test.ts` | API returns storefronts; query string includes `search`, `categories`, `page` |
| `__tests__/marketplace/useMarketplace.test.tsx` | Hook returns data on success; passes `category` to `getMarketplace` |
| `__tests__/marketplace/CategoryFilter.test.tsx` | Renders All + 7 categories; tap calls `onSelect`; All → `undefined` |
| `__tests__/salon/SalonCard.test.tsx` | Renders name, rating, city; `onPress`; Featured badge |
| `__tests__/salon/useStorefront.test.tsx` | No fetch when slug empty; returns storefront for valid slug |

### Sprint M1 — still passing (23)

Includes: `authStore`, `login`, `signup`, `routeGuard`, `Button`, `Input`, `i18n` parity (EN/FR/ET), legacy snapshot.

---

## Manual tests — to validate (reviewer / QA)

> Not run in CI agent session — check on device/simulator with local or cloud Supabase.

- [ ] `.env` configured: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`
- [ ] `npm start` → Marketplace tab (Home) loads salons (e.g. Afrotouch from seed)
- [ ] Search: type e.g. `braid` → list updates after ~400ms debounce
- [ ] Category filter: tap **Braids** → filtered list; tap **All** → full list
- [ ] Scroll to bottom → next page loads (if `total > 10` in DB)
- [ ] Pull to refresh → list reloads
- [ ] Tap salon card → storefront: hero, about, services, team, gallery, **Book Now** CTA
- [ ] Service **Book** → navigates to `/booking/staff?salonSlug=…`
- [ ] Empty search (`xyznonexistent`) → empty state message
- [ ] Airplane mode / offline → error state + Retry works after reconnect
- [ ] Deep link (iOS sim): `xcrun simctl openurl booted "kazione://salon/afrotouch"` → storefront opens
- [ ] Deep link (Android emu): `adb shell am start -W -a android.intent.action.VIEW -d "kazione://salon/afrotouch"`
- [ ] Layout OK on **375px** and **430px** width (2-column grid)
- [ ] GitHub Actions CI green on this PR
