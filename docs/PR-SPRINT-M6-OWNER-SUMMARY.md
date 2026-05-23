# PR description — Sprint M6 Owner (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M6 — Storefront Editor & App Store Release.md`](../../../kazione-docs/team/MOBILE/Sprint%20M6%20%E2%80%94%20Storefront%20Editor%20%26%20App%20Store%20Release.md)  
> **Depends on:** Sprint M5 (`feat/sprint-m5-finance-reports`) + backend PR gallery/promotions API

## Summary

Sprint **M6 — Storefront Editor & Settings** : édition vitrine owner sur mobile, galerie photos, promotions, paramètres profil + checklist release App Store / Play Store.

### M6-01 — Storefront Editor

- `app/(app)/owner/storefront.tsx` — remplace la vue read-only
- Branding : tagline (140 car.) + à propos (800 car.), auto-save debounced
- Couverture : `expo-image-picker` → `POST /storefront-upload` → PATCH cover
- Visibilité : marketplace listed + featured toggles
- Promotions : liste, ajout (sheet), suppression (appui long)
- Bouton **Enregistrer** sticky

### M6-02 — Gallery

- `StorefrontGalleryGrid` — grille 3 colonnes, `n / 20`
- Multi-upload (max 5), appui long → suppression confirmée
- `GET /storefront-owner?action=gallery` (backend)

### M6-03 — Settings

- `app/(app)/owner/settings.tsx` — profil `PATCH /me`, langue, déconnexion confirmée
- Infos salon read-only

### M6-04 / M6-05 / M6-06 — Release prep

- `docs/RELEASE-M6-CHECKLIST.md` — EAS build/submit iOS & Android, script E2E (Teddy)

---

## Backend dependency

Requires merged backend PR adding to `storefront-owner`:
- `GET ?action=gallery`
- `GET ?action=promotions`
- `POST ?action=promotion`
- `DELETE ?action=promotion`

---

## Unit tests performed (automated)

| Command | Result |
| ------- | ------ |
| `npm test` | **51/51 passed** (18 suites) |
| `npm run typecheck` | **0 errors** |

---

## Manual tests — to validate (reviewer / QA)

- [ ] **Vitrine** → modifier tagline + à propos → visible sur web après refresh
- [ ] Changer couverture → image mise à jour
- [ ] Toggle marketplace → publié / brouillon
- [ ] Ajouter promotion → visible ; appui long → supprimée
- [ ] Galerie → + photos ; appui long → supprimée ; compteur correct
- [ ] **Paramètres** → prénom/nom/téléphone sauvegardés via `/me`
- [ ] Langue EN/FR/ET → app traduite
- [ ] Déconnexion → confirmation → welcome
- [ ] `npm run typecheck` && `npm test` green

---

## Écarts vs spec doc

| Spec | Implémentation |
|------|----------------|
| Avatar upload profil | ⏭️ Non livré (pas d’endpoint upload avatar) |
| Swipe-left promotion | Appui long |
| App Store / Play submit | Checklist doc — exécution Teddy |

---

## Files changed (high level)

- `app/(app)/owner/storefront.tsx`, `settings.tsx`
- `components/owner/PromotionFormSheet.tsx`, `StorefrontGalleryGrid.tsx`, `SwitchRow.tsx`
- `services/owner/storefront.ts`, `profile.ts`
- `hooks/useOwnerStorefront.ts`, `useUserProfile.ts`
- `lib/imageUpload.ts`
- `types/owner.ts`
- `docs/RELEASE-M6-CHECKLIST.md`
- `package.json` — `expo-image-picker`, `expo-image-manipulator`
