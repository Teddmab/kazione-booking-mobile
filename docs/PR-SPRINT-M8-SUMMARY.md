# PR description — Sprint M8 Brand (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M8 — brand alignment.md`](../../../kazione-docs/team/MOBILE/Sprint%20M8%20%E2%80%94%20brand%20alignment.md)  
> **Implementation report:** [`docs/M8-IMPLEMENTATION-REPORT.md`](./M8-IMPLEMENTATION-REPORT.md)  
> **Depends on:** Sprint M7 (`feat/sprint-m7-web-parity`) if not yet merged to `master`

## Summary

Sprint **M8 — Brand Alignment & Design System** : alignement mobile sur le kit KaziOne (orange `#E84E26`, fonds clairs, Plus Jakarta Sans, logos PNG officiels), refonte tokens owner/client, drawer & auth brandés, signup owner **2 étapes** (parité web), correctifs auth/workspace.

### M8-01 — Tokens & thème

- `tailwind.config.js`, `constants/ownerTheme.ts`, `constants/tokens.ts`, `constants/authTheme.ts`
- Remplacement gold/dark → orange / thème clair client

### M8-02 — Police

- `@expo-google-fonts/plus-jakarta-sans` + chargement dans `app/_layout.tsx`

### M8-03 — Logos

- `assets/logos/` (PNG officiels), `constants/logos.ts`, `app.config.ts` (icon/splash, `userInterfaceStyle: light`)

### M8-04 à M8-06 — UI

- `OwnerDrawer`, `OwnerAppBar`, `AuthBrandMark`, `Logo`, `Button`, `Badge`, `StatusBadge`
- `COLORS.gold` → `COLORS.orange` sur booking, marketplace, salon

### Auth & signup (hors spec stricte, même PR)

- Signup owner 2 steps → `registerBusinessOwner()` / `POST /auth-register`
- Correctifs `AuthGate`, bouton login, safe area signup, messages workspace

---

## Unit tests performed (automated)

| Command | Result |
| ------- | ------ |
| `npm test` | **55/55 passed** (19 suites) |
| `npm run typecheck` | **0 errors** |

### Sprint M8 — tests clés

| File | Tests |
| ---- | ----- |
| `__tests__/auth/signup.test.tsx` | Step 1, step 2 sans API, submit `registerBusinessOwner` + signIn, erreur `EMAIL_TAKEN` |
| `__tests__/auth/login.test.tsx` | Mocks mis à jour |

---

## Manual tests — to validate (reviewer / QA)

> **Reviewer:** @Teddmab — approbation requise avant merge.

- [ ] `npm start` — police Plus Jakarta Sans visible (plus Georgia)
- [ ] Login owner : bouton orange visible, logo brand
- [ ] Signup 2 étapes : compte → salon → redirect dashboard
- [ ] Owner drawer : logo blanc, item actif orange
- [ ] Storefront / booking client : accents orange, fond clair
- [ ] Splash & app icon : logo KaziOne sur fond blanc
- [ ] Device physique : `.env` avec IP LAN + backend `npm run dev` pour `/me`

---

## Reviewer

| Rôle | GitHub | Statut |
| ---- | ------ | ------ |
| Reviewer / merge approval | **@Teddmab** | ⬜ |
