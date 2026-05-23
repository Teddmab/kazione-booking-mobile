# PR description — Sprint M4 Owner (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M4 — Services & Staff Management.md`](../../../kazione-docs/team/MOBILE/Sprint%20M4%20%E2%80%94%20Services%20%26%20Staff%20Management.md)  
> **Depends on:** Sprint M3 — Appointments & Calendar (merged or on `feat/sprint-m3-owner-appointments`)

## Summary

Sprint **M4 — Services & Staff Management**: full CRUD for services and staff from the owner app, category grouping, client search + detail sheet.

### M4-01 — Service CRUD

- Header **+** → create service
- Tap row → edit sheet (`ServiceFormSheet`)
- `POST /services`, `PATCH /services?id=`
- Deactivate: **appui long** on row or bouton dans la fiche → `PATCH` `is_active: false` (pas de route `DELETE` côté backend)

### M4-02 — Categories

- `CategoryPicker` avec suggestions depuis la liste
- Liste groupée par catégorie (`SectionList` + en-têtes de section)

### M4-03 — Invite staff

- Header **+** → `InviteStaffSheet`
- `POST /invite-staff` (`display_name` = prénom + nom)
- Message de confirmation après envoi

### M4-04 — Staff detail & edit

- Tap membre → `StaffDetailSheet`
- `PATCH /staff?id=` — rôle, actif, nom affiché

### M4-05 — Clients

- Recherche debounce **300 ms** + bouton ✕ effacer
- Tap client → `ClientDetailSheet` (stats RDV, dépenses, dernière visite)

---

## Unit tests performed (automated)

| Command | Result |
| ------- | ------ |
| `npm test` | **49/49 passed** (17 suites) |
| `npm run typecheck` | **0 errors** |

### Sprint M4 — new tests (4)

| File | Tests |
| ---- | ----- |
| `__tests__/owner/groupServicesByCategory.test.ts` | Grouping by category; `extractCategoryNames` sorted unique |

### Sprint M3 Owner — still passing (2)

| File | Tests |
| ---- | ----- |
| `__tests__/owner/ownerCalendar.test.ts` | Week start Monday; group by day |

UI sheets (service form, invite, staff detail) → **QA manuelle** (pas de tests RTL dédiés).

---

## Manual tests — to validate (reviewer / QA)

- [ ] Owner connecté, **Services** → + créer un service → visible dans la bonne section catégorie
- [ ] Tap service → modifier prix/durée → sauvegardé
- [ ] Appui long ou bouton désactiver → badge « Inactif »
- [ ] **Équipe** → + inviter (email test) → message succès → membre dans la liste
- [ ] Tap membre → changer rôle / désactiver → sauvegardé
- [ ] **Clients** → recherche filtre la liste ; tap → fiche détail stats
- [ ] `npm run typecheck` && `npm test` green

---

## Files changed (high level)

- `app/(app)/owner/services.tsx`, `staff.tsx`, `clients.tsx`
- `components/owner/ServiceFormSheet.tsx`, `CategoryPicker.tsx`, `InviteStaffSheet.tsx`, `StaffDetailSheet.tsx`, `ClientDetailSheet.tsx`, `OwnerAddHeaderButton.tsx`
- `services/owner/services.ts`, `staff.ts`
- `hooks/useOwnerServices.ts`, `useOwnerStaff.ts`
- `lib/groupServicesByCategory.ts`
