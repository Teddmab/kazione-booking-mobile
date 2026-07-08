# PR description — Sprint M17 Mobile (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M17 — Staff Portal, Roles & Earnings.md`](../../../kazione-docs/team/MOBILE/Sprint%20M17%20%E2%80%94%20Staff%20Portal%2C%20Roles%20%26%20Earnings.md)  
> **Branch:** `feat/sprint-m17-staff-portal` → `master`

## Summary

Sprint **M17 — Staff Portal, Roles & Earnings** (mobile) + polish UX livré en session :

- **Portail staff** : sélecteur de rôle post-login, stack `(staff)` dédié (RDV assignés, gains commission), routage selon `role` / multi-business
- **Owner staff** : champ `position` à l’invitation et dans la fiche membre ; commission par service (étape tarifs du formulaire)
- **Formulaire service** : 4 étapes alignées web (Infos → Tarifs → Photos ×3 → Produits), fix étape 3 qui revenait à l’étape 1 après sauvegarde
- **Toasts globaux** : `ToastProvider` + `useToast()` (success / error / warning), remplace les `Alert.alert` de feedback owner ; affichage au-dessus des bottom sheets via Modal transparente ; design thème KaziOne
- **Bottom sheets** : `OwnerSheetHeader` — titre à gauche, bouton fermer rond orange avec croix à droite ; boutons « Annuler » en bas retirés sur 17 sheets
- **Services** : lignes archivées grisées + badge « Archivé »
- **Fournisseurs** : fix scan facture Expo SDK 54 (`readAsStringAsync` déprécié) via `lib/localFile.ts`
- **TenantContext** : memberships enrichis (`staffProfileId`, `position`) pour M17

**Backend requis :** migration `056` + edge functions M17 (`/me`, `/appointments`, `/staff`, `/services`)

---

## Modules livrés

| Zone | Fichiers clés |
|------|----------------|
| M17-01 Role selector | `app/(auth)/role-select.tsx`, `lib/workspaceRouting.ts`, `app/index.tsx` |
| M17-02 Staff portal | `app/(staff)/`, `hooks/useStaffAppointments.ts`, `components/staff/StaffAppointmentCard.tsx` |
| M17-03 Position staff | `InviteStaffSheet.tsx`, `StaffDetailSheet.tsx`, `OwnerStaffScreenContent.tsx` |
| M17-04 Commission service | `ServiceFormSheet.tsx`, `types/owner.ts`, `hooks/useOwnerServices.ts` |
| Toasts | `contexts/ToastContext.tsx`, `components/owner/OwnerToast.tsx` |
| Sheet headers | `components/owner/OwnerSheetHeader.tsx` + 17 bottom sheets |
| Services UX | `ServiceRow.tsx`, `app/(app)/owner/services.tsx` |
| Expo FileSystem | `lib/localFile.ts`, `CreateOrderSheet.tsx`, `ImportClientsSheet.tsx` |

---

## Test plan

- [ ] Owner login → dashboard owner si seul membership owner
- [ ] Staff invité → login → role-select ou `(staff)` portal
- [ ] Staff : RDV assignés + commission (backend M17)
- [ ] Services : 4 étapes, 3 photos, étape 3 → 4 sans reset
- [ ] Service archivé grisé
- [ ] Toast visible au-dessus d’un bottom sheet
- [ ] Croix orange ferme les sheets
- [ ] Scan facture fournisseur sans erreur filesystem
- [ ] `npm run typecheck` — 0 erreurs
