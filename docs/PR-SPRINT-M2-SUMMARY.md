# PR description — Sprint M2 (copy-paste)

> **Canonical report:** [`kazione-docs/team/MOBILE/M2 — Implementation Report.md`](../../../kazione-docs/team/MOBILE/M2%20—%20Implementation%20Report.md)

## Summary

Sprint **M2 — Marketplace & Salon Discovery**: browse salons on `(tabs)/Home`, search with 400ms debounce, category filters, 2-column infinite scroll, full storefront at `/salon/[slug]`, skeletons, i18n error/empty states, and deep links (`kazione://salon/{slug}`).

Uses real Edge Functions: `GET /marketplace-storefronts` and `GET /get-storefront` (page-based pagination, not `next_cursor`).

## Tests performed

| Check | Result |
| ----- | ------ |
| `npm test` | **35/35** passed |
| `npm run typecheck` | **0 errors** |
| `npm run lint` | **0 errors** (warnings only) |

## Test plan

- [ ] `.env` configured with `EXPO_PUBLIC_API_BASE_URL`
- [ ] Marketplace tab loads salons (Afrotouch in seed)
- [ ] Search + category filter update list
- [ ] Tap salon → storefront (services, team, Book Now)
- [ ] Deep link: `xcrun simctl openurl booted "kazione://salon/afrotouch"`
- [ ] CI green on PR
