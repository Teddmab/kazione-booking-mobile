# PR description (copy-paste)

> **Canonical implementation report (tasks + tests):**  
> [`kazione-docs/team/MOBILE/M1 — Implementation Report.md`](../../../kazione-docs/team/MOBILE/M1%20—%20Implementation%20Report.md)

Use the sections below for the GitHub PR title/description.

---

## Summary

Sprint **M1 — Mobile Foundation** — Expo SDK 54 app with auth, tab navigation, i18n (EN/FR/ET), KaziOne design tokens, UI library, CI, Sentry, and EAS config. See the [implementation report](../../../kazione-docs/team/MOBILE/M1%20—%20Implementation%20Report.md) for full task breakdown.

## Tests performed

| Check | Result |
| ----- | ------ |
| `npm test` | **23/23 passed** |
| `npm run typecheck` | **0 errors** |
| `npm run lint` | **0 errors** |

Coverage (scoped): ~28% lines — auth store, auth screens, UI Button/Input, i18n parity.

## Test plan

- [ ] `.env` from `.env.example`
- [ ] `npm start` — Expo Go
- [ ] Login → `(tabs)`; sign out → login
- [ ] Profile language EN/FR/ET
- [ ] CI green on PR
