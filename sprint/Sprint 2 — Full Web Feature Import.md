# Sprint 2 — Import complet des fonctionnalités web

**Sprint** : 2  
**Repo** : `kazione-booking-mobile`  
**Prérequis** : [Sprint 1 — Mobile Web Migration](./Sprint%201%20—%20Mobile%20Web%20Migration.md) mergé (fondation + parcours client/owner de base)  
**Référence** : `kazione-booking-frontends` + `kazione-booking-backend`  
**Objectif** : Porter sur mobile **toutes les fonctionnalités déjà livrées sur le web**, avec les mêmes services/hooks/contrats API — sans réécrire la logique métier côté serveur.

---

## Pourquoi ce sprint existe

Le Sprint 1 a posé la coquille et les flux critiques (marketplace, réservation, owner lecture + RDV). Le web expose encore des écrans, actions CRUD et rôles que le mobile n’a pas. Ce sprint vise la **parité fonctionnelle** : chaque route / sidebar web a un équivalent mobile testé.

---

## Matrice de couverture (état au démarrage Sprint 2)

Légende : ✅ Sprint 1 | 🔶 partiel | ❌ absent

### Auth & compte

| Fonctionnalité web | Route / fichier web | Mobile S2 |
|--------------------|---------------------|-----------|
| Login client | `/client/login` | ✅ |
| Login owner/équipe | `/owner/login` | ✅ |
| Inscription (client + business) | `/signup` | 🔶 écran socle → **S2-MO-A01** |
| Mot de passe oublié | `/forgot-password` | ❌ **S2-MO-A02** |
| Réinitialisation MDP | `/reset-password` | ❌ **S2-MO-A02** |
| Vérification e-mail | `/signup/check-email` | ❌ **S2-MO-A03** |
| Callback OAuth / magic link | `/auth/callback` | ❌ **S2-MO-A04** |
| Page non autorisée | `/unauthorized` | ❌ **S2-MO-A05** |
| Politique confidentialité | `/legal/privacy` | ❌ **S2-MO-A06** |

### Client (marketplace & compte)

| Fonctionnalité web | Route web | Mobile S2 |
|--------------------|-----------|-----------|
| Accueil marketplace | `/client` | ✅ |
| Parcourir salons | `/client/browse` | ✅ |
| Vitrine salon | `/client/salon/:slug` | ✅ |
| Liste services salon | `/client/salon/:slug/services` | 🔶 dans vitrine → **S2-MO-C01** écran dédié si besoin |
| Réservation | `/client/salon/:slug/book` | ✅ |
| Détail réservation (guest) | `/booking/:id` | ❌ **S2-MO-C02** |
| Mes réservations | `/client/bookings` | ❌ **S2-MO-C03** |
| Détail / annulation / report | `/client/bookings/:id` | ❌ **S2-MO-C04** |
| Favoris | `/client/favorites` | ❌ **S2-MO-C05** |
| Profil client (`PATCH /me`) | `/client/profile` | ❌ **S2-MO-C06** |
| Dashboard client (onglets) | `/client/dashboard/*` | ❌ **S2-MO-C07** |
| Avis salon (si exposé) | reviews | ❌ **S2-MO-C08** (si API `reviews` utilisée côté client) |

### Owner / manager

| Fonctionnalité web | Route web | Mobile S2 |
|--------------------|-----------|-----------|
| Tableau de bord KPIs | `/owner` | ✅ |
| Rendez-vous (calendrier + liste) | `/owner/appointments` | 🔶 liste + statuts → **S2-MO-O01** calendrier |
| Clients (CRUD + import) | `/owner/clients` | 🔶 liste → **S2-MO-O02** fiche + création |
| Staff (invite, horaires, services) | `/owner/staff` | 🔶 liste → **S2-MO-O03** CRUD complet |
| Services (CRUD) | `/owner/services` | 🔶 liste → **S2-MO-O04** création/édition |
| Finance | `/owner/finance` | ❌ **S2-MO-O05** |
| Fournisseurs | `/owner/suppliers` | ❌ **S2-MO-O06** |
| Éditeur vitrine | `/owner/storefront` | 🔶 aperçu → **S2-MO-O07** édition + upload |
| Marketplace listing | `/owner/marketplace` | ❌ **S2-MO-O08** |
| Rapports | `/owner/reports` | ❌ **S2-MO-O09** |
| Insights IA | `/owner/insights` | ❌ **S2-MO-O10** |
| Paramètres (Stripe, PayPal, règles) | `/owner/settings` | 🔶 lecture → **S2-MO-O11** complet |
| Création 2ᵉ salon | `CreateBusinessDialog` | ❌ **S2-MO-O12** |
| RDV manuel (create) | `AppointmentsPage` | ❌ **S2-MO-O13** |

### Staff

| Fonctionnalité web | Route web | Mobile S2 |
|--------------------|-----------|-----------|
| Dashboard staff | `/staff` | ❌ placeholder → **S2-MO-S01** |
| Planning / RDV | `/staff/schedule` | ❌ **S2-MO-S02** |
| Clients staff | `/staff/clients` | ❌ **S2-MO-S03** |
| Performance | `/staff/performance` | ❌ **S2-MO-S04** |

### Réceptionniste

| Fonctionnalité web | Route web | Mobile S2 |
|--------------------|-----------|-----------|
| Dashboard | `/receptionist` | ❌ **S2-MO-R01** |
| Calendrier | `/receptionist/calendar` | ❌ **S2-MO-R02** |
| Walk-ins | `/receptionist/walkins` | ❌ **S2-MO-R03** |
| Clients | `/receptionist/clients` | ❌ **S2-MO-R04** |
| Paiements | `/receptionist/payments` | ❌ **S2-MO-R05** |

### Partenaire

| Fonctionnalité web | Route web | Mobile S2 |
|--------------------|-----------|-----------|
| Dashboard partenaire | `/partner` | ❌ **S2-MO-P01** |
| Salons réseau | `/partner/salons` | ❌ **S2-MO-P02** |
| Analytics | `/partner/analytics` | ❌ **S2-MO-P03** |
| Onboarding / settings | `/partner/onboarding`, `/partner/settings` | ❌ **S2-MO-P04** |

### Transversal

| Sujet | Web | Mobile S2 |
|-------|-----|-----------|
| i18n (FR/EN/ET) | `I18nContext` | ❌ **S2-MO-X01** (phase minimale FR) |
| Toasts / erreurs API | toast + `ApiError` | 🔶 **S2-MO-X02** feedback unifié |
| Deep links réservation | URLs slug | ❌ **S2-MO-X03** |
| Tests unitaires (hooks/services) | Vitest | ❌ **S2-MO-X04** |
| Liste `businesses` multi-salon (`/me`) | backend à étendre si besoin | **S2-MO-X05** alignement API |

---

## Prérequis (Pre-Sprint Checklist)

- [ ] Sprint 1 mergé et tagué (ou branche `main` à jour)
- [ ] Matrice ci-dessus validée en équipe (priorités P0/P1)
- [ ] Backend local : Edge Runtime **Up**, migrations à jour
- [ ] Accès aux comptes seed : client, owner, staff, reception (si existants)
- [ ] Décision produit : calendrier owner en **liste seule** vs **vue semaine** (recommandé : liste S2, calendrier S2.1 si trop lourd)

---

## Découpage PR (recommandé)

| PR | Branche | Lot |
|----|---------|-----|
| 1 | `feat/s2-mo-auth-account` | S2-MO-A01 … A06 |
| 2 | `feat/s2-mo-client-account` | S2-MO-C03 … C08 |
| 3 | `feat/s2-mo-owner-operations` | S2-MO-O01 … O04, O13 |
| 4 | `feat/s2-mo-owner-business` | S2-MO-O05 … O12 |
| 5 | `feat/s2-mo-staff-reception` | S2-MO-S01 … R05 |
| 6 | `feat/s2-mo-partner` | S2-MO-P01 … P04 |
| 7 | `feat/s2-mo-cross-cutting` | S2-MO-X01 … X05 |
| 8 | `chore/s2-mo-sprint-docs` | Ce fichier + mise à jour `sprint/README.md` |

Alternative : une PR par tâche `S2-MO-*` si revue plus granulaire.

---

## TASK S2-MO-A01 — Inscription complète (client + business)

**Ticket** : KZB-M-101 | **P0** | `feat/s2-mo-a01-signup`

### Implémentation

- Reprendre `SignupPage.tsx` : choix rôle, formulaire multi-étapes business, `auth-register` Edge Function.
- Routes : `(auth)/signup` avec flux aligné web.
- Redirection post-inscription : client → `/(app)/client`, business → `/(app)/owner`.

### Tests & validation

| ID | Scénario | Attendu |
|----|----------|---------|
| T-A01-1 | Inscription client | Compte créé, login auto ou redirect login |
| T-A01-2 | Inscription business | `setup_new_business` OK, tenant owner |
| T-A01-3 | E-mail déjà pris | Message `EMAIL_TAKEN` lisible |

- [ ] `npm run typecheck`
- [ ] Test manuel LAN + backend up

---

## TASK S2-MO-A02 — Mot de passe oublié / reset

**Ticket** : KZB-M-102 | **P0** | `feat/s2-mo-a02-password`

### Implémentation

- `(auth)/forgot-password`, `(auth)/reset-password`.
- `authClient.resetPasswordForEmail`, `updatePassword`, deep link scheme `kazionebookingmobile://` (Expo Linking).

### Tests & validation

| ID | Scénario | Attendu |
|----|----------|---------|
| T-A02-1 | Demande reset | E-mail envoyé (Mailpit en local) |
| T-A02-2 | Lien reset | Nouveau MDP accepté, connexion OK |

---

## TASK S2-MO-A03 — Check e-mail & callback auth

**Ticket** : KZB-M-103 | **P1** | `feat/s2-mo-a03-auth-flows`

### Implémentation

- `(auth)/check-email`, `(auth)/auth-callback` (équivalent `AuthCallbackPage`).
- Gestion `exchangeCodeForSession` si applicable.

### Validation

- [ ] Ouverture app depuis lien de confirmation (si configuré Supabase redirect URLs mobile)

---

## TASK S2-MO-A04 — Pages utilitaires auth & légal

**Ticket** : KZB-M-104 | **P2** | `feat/s2-mo-a04-auth-legal`

### Implémentation

- `(auth)/unauthorized`, `app/legal/privacy.tsx` (contenu statique ou fetch si hébergé).

---

## TASK S2-MO-C03 — Mes réservations (liste)

**Ticket** : KZB-M-201 | **P0** | `feat/s2-mo-c03-bookings-list`

### Implémentation

- `services/booking.ts` : `getCustomerBookings` → `GET /appointments?action=customer-bookings`.
- `hooks/useCustomerBookings.ts`, écran `client/bookings.tsx` (remplace placeholder).
- Pull-to-refresh, états vide / erreur.

### Tests & validation

| ID | Scénario | Attendu |
|----|----------|---------|
| T-C03-1 | Client avec RDV | Liste chronologique |
| T-C03-2 | Client sans RDV | Empty state |
| T-C03-3 | Hors ligne / API down | Message réseau clair |

---

## TASK S2-MO-C04 — Détail réservation (annuler / reporter)

**Ticket** : KZB-M-202 | **P0** | `feat/s2-mo-c04-booking-detail`

### Implémentation

- `client/bookings/[id].tsx` + lookup guest `booking/[id]` si besoin.
- `cancel-booking`, `reschedule-booking` (mêmes payloads que `bookingService.ts`).

### Validation

- [ ] Annulation avec politique salon respectée
- [ ] Report vers créneau disponible (`get-availability`)

---

## TASK S2-MO-C05 — Favoris client

**Ticket** : KZB-M-203 | **P2** | `feat/s2-mo-c05-favorites`

### Implémentation

- Reprendre `ClientFavoritesPage` : persistance (AsyncStorage ou API si existante côté web).
- Navigation depuis onglet profil / dashboard client.

---

## TASK S2-MO-C06 — Profil client (`GET/PATCH /me`)

**Ticket** : KZB-M-204 | **P1** | `feat/s2-mo-c06-profile`

### Implémentation

- `hooks/useUserProfile`, `useUpdateUserProfile` (comme web `useAuth.ts`).
- `client/profile.tsx` : prénom, nom, téléphone.

### Validation

- [ ] PATCH persisté, rechargement affiche nouvelles valeurs

---

## TASK S2-MO-C07 — Dashboard client à onglets

**Ticket** : KZB-M-205 | **P1** | `feat/s2-mo-c07-client-dashboard`

### Implémentation

- `client/_layout` ou `client/dashboard` avec onglets : Réservations | Favoris | Profil (équivalent `/client/dashboard`).

---

## TASK S2-MO-O01 — Rendez-vous owner (calendrier + création)

**Ticket** : KZB-M-301 | **P0** | `feat/s2-mo-o01-appointments-full`

### Implémentation

- `getCalendar`, `createAppointment`, `useCreateAppointment` (port depuis `appointmentService.ts`).
- Vue **semaine simplifiée** (liste groupée par jour) ou intégration calendrier RN si validé en équipe.
- Filtres staff / statut comme web.

### Validation

- [ ] Création RDV manuel visible dans liste client + KPIs

---

## TASK S2-MO-O02 — Clients owner (fiche + CRUD)

**Ticket** : KZB-M-302 | **P0** | `feat/s2-mo-o02-clients-crud`

### Implémentation

- `getClient`, `createClient`, `patchClient` (`clientService.ts`).
- `clients/[id].tsx`, formulaire ajout client.
- Import CSV : **web-only** ou phase 2 si fichier picker complexe.

### Validation

- [ ] Création client puis RDV manuel avec ce client

---

## TASK S2-MO-O03 — Staff owner (CRUD + horaires + services)

**Ticket** : KZB-M-303 | **P0** | `feat/s2-mo-o03-staff-full`

### Implémentation

- Porter `staffService.ts` + `useStaff.ts` : invite, PATCH, schedule PUT, assign services, deactivate.
- Écrans détail staff + modales actions.

### Validation

- [ ] Invitation (e-mail Mailpit) + membre visible liste
- [ ] Modification horaires reflétée sur `get-availability`

---

## TASK S2-MO-O04 — Services owner (CRUD)

**Ticket** : KZB-M-304 | **P0** | `feat/s2-mo-o04-services-crud`

### Implémentation

- `createOwnerService`, `updateOwnerService` + formulaires mobile.

---

## TASK S2-MO-O05 — Finance

**Ticket** : KZB-M-305 | **P1** | `feat/s2-mo-o05-finance`

### Implémentation

- Porter `financeService.ts`, `useFinance.ts`, onglets revenus / dépenses / taxe (version mobile : listes + graphiques simplifiés).

### Référence web

- `FinancePage.tsx`, endpoints finance dans backend.

---

## TASK S2-MO-O06 — Fournisseurs

**Ticket** : KZB-M-306 | **P2** | `feat/s2-mo-o06-suppliers`

### Implémentation

- Porter `supplierService.ts`, `useSuppliers.ts` : liste, détail, commandes.

---

## TASK S2-MO-O07 — Éditeur vitrine

**Ticket** : KZB-M-307 | **P1** | `feat/s2-mo-o07-storefront-editor`

### Implémentation

- Porter `storefrontService.ts` : PATCH vitrine, upload logo/cover/galerie (`expo-image-picker` + `storefront-upload`).
- Sections principales : hero, about, services mis en avant (subset si trop large → livrer par vagues).

### Validation

- [ ] Publication / dépublication vitrine
- [ ] Changement visible sur marketplace mobile

---

## TASK S2-MO-O08 — Marketplace listing (owner)

**Ticket** : KZB-M-308 | **P2** | `feat/s2-mo-o08-marketplace-listing`

### Implémentation

- Porter `MarketplaceListingPage` + hooks associés (visibilité, promo).

---

## TASK S2-MO-O09 — Rapports

**Ticket** : KZB-M-309 | **P1** | `feat/s2-mo-o09-reports`

### Implémentation

- Porter `useReports.ts`, export si téléchargement fichier supporté (`expo-sharing` / `expo-file-system`).

---

## TASK S2-MO-O10 — Insights IA

**Ticket** : KZB-M-310 | **P2** | `feat/s2-mo-o10-ai-insights`

### Implémentation

- Porter `AIInsightsPage` + endpoints IA documentés backend.

---

## TASK S2-MO-O11 — Paramètres owner complets

**Ticket** : KZB-M-311 | **P0** | `feat/s2-mo-o11-settings`

### Implémentation

- `useBusiness`, `useBusinessSettings`, `useUpdateBusinessSettings` (Supabase tables).
- `useStripeConnect`, `usePayPalConnect` : statut + liens onboarding (WebBrowser / in-app browser).
- Règles réservation : acompte, annulation, buffer, etc.

### Validation

- [ ] Stripe Connect : ouverture onboarding sans crash
- [ ] Modification `business_settings` persistée

---

## TASK S2-MO-O12 — Création salon supplémentaire

**Ticket** : KZB-M-312 | **P2** | `feat/s2-mo-o12-create-business`

### Implémentation

- Porter `useCreateBusiness`, dialogue création 2ᵉ business + switcher tenant (déjà partiellement en `OwnerBusinessHeader`).

---

## TASK S2-MO-O13 — Supprimer écran « Plus » web-only

**Ticket** : KZB-M-313 | **P3** | `feat/s2-mo-o13-owner-nav-cleanup`

### Implémentation

- Remplacer `owner/more.tsx` par liens réels une fois O05–O10 livrés.
- Menu owner = parité sidebar web.

---

## TASK S2-MO-S01 … S04 — Espace staff

**Ticket** : KZB-M-401 … 404 | **P1** | `feat/s2-mo-staff-*`

### Implémentation

- Remplacer `staff/home` placeholder par stack `app/(app)/staff/` :
  - `index` (dashboard)
  - `schedule` (appointments filtrés staff connecté)
  - `clients`
  - `performance` (rapports staff)
- Réutiliser hooks `useAppointments`, `useClients` avec filtres `staffId` = membre courant.

### Validation

- [ ] Login compte staff seed → routes staff, pas owner

---

## TASK S2-MO-R01 … R05 — Espace réceptionniste

**Ticket** : KZB-M-501 … 505 | **P1** | `feat/s2-mo-reception-*`

### Implémentation

- Stack `app/(app)/receptionist/` : dashboard, calendrier, walk-ins, clients, paiements.
- Aligner sur `ReceptionistDashboard` web + endpoints appointments/payments.

---

## TASK S2-MO-P01 … P04 — Espace partenaire

**Ticket** : KZB-M-601 … 604 | **P2** | `feat/s2-mo-partner-*`

### Implémentation

- Stack `app/(app)/partner/` : dashboard, salons réseau, analytics, onboarding/settings.
- Porter `PartnerDashboard` + panneaux associés.

---

## TASK S2-MO-X01 — i18n minimale

**Ticket** : KZB-M-701 | **P2** | `feat/s2-mo-i18n`

### Implémentation

- Introduire couche i18n (ex. `i18next` + fichiers JSON) ou contexte léger FR/EN.
- Clés critiques : auth, booking, erreurs API.

---

## TASK S2-MO-X02 — Feedback utilisateur (toasts / alertes)

**Ticket** : KZB-M-702 | **P1** | `feat/s2-mo-feedback`

### Implémentation

- Composant toast RN ou `Alert` wrapper pour mutations (succès / `ApiError`).

---

## TASK S2-MO-X03 — Deep links

**Ticket** : KZB-M-703 | **P2** | `feat/s2-mo-deeplinks`

### Implémentation

- Scheme `kazionebookingmobile` : `salon/:slug/book`, `booking/:id`, reset password.
- Config `app.json` + tests manuels Expo Linking.

---

## TASK S2-MO-X04 — Tests automatisés

**Ticket** : KZB-M-704 | **P1** | `feat/s2-mo-tests`

### Implémentation

- Jest + tests unitaires sur `lib/api.ts`, `lib/format.ts`, services owner/client (mocks fetch).
- Objectif : couvrir contrats critiques avant régression Sprint 3.

```bash
npm run test   # à ajouter dans package.json
npm run typecheck
```

---

## TASK S2-MO-X05 — Tenant multi-business (`/me`)

**Ticket** : KZB-M-705 | **P1** | `feat/s2-mo-tenant-businesses`

### Implémentation

- Si backend étendu : `GET /me` retourne `businesses[]` (comme attendu par web `TenantContext`).
- Sinon : documenter écart et requêtes supplémentaires côté mobile.

### Validation

- [ ] Owner 2 salons : switcher change KPIs et listes

---

## Checklist validation globale (UAT Sprint 2)

### Par rôle

- [ ] **Client** : signup → book → mes RDV → annuler/reporter → profil
- [ ] **Owner** : CRUD client/service/staff → RDV manuel → finance (lecture min.) → settings Stripe → vitrine publiée
- [ ] **Staff** : planning + clients assignés
- [ ] **Réception** : calendrier + walk-in / paiement (selon périmètre validé)
- [ ] **Partenaire** : dashboard + liste salons (si compte dispo)

### Technique

- [ ] Aucune régression Sprint 1 (smoke client + owner)
- [ ] `npm run typecheck` + `npm run test` (si X04 livré)
- [ ] Pas de secret dans le repo
- [ ] Matrice du haut mise à jour (✅ sur toutes les lignes P0)

---

## Modèle de description PR (Sprint 2)

```markdown
## Summary
Sprint 2 — Import fonctionnalités web → mobile ([lot: auth | client | owner | staff | …]).

## Parité
- Référence: kazione-booking-frontends (routes + services)
- Doc: sprint/Sprint 2 — Full Web Feature Import.md

## Test plan
- [ ] Tâches S2-MO-* du lot (cocher IDs)
- [ ] UAT rôle concerné
- [ ] typecheck (+ test si applicable)

## Out of scope
- …
```

---

## Rapport d’implémentation

```md
## Sprint 2 — Full Web Feature Import — Implementation Report
Date:
Engineer:
PR principale:

### Lot Auth (S2-MO-A01 … A06)
Status: ✅ / ❌ / partiel
PRs:
T-A01-1 … T-A02-2: PASS / FAIL

### Lot Client (S2-MO-C03 … C08)
Status:
PRs:
T-C03-1 … T-C06: PASS / FAIL

### Lot Owner ops (S2-MO-O01 … O04, O13)
Status:
PRs:

### Lot Owner business (S2-MO-O05 … O12)
Status:
PRs:

### Lot Staff / Reception / Partner
Status:
PRs:

### Transversal (S2-MO-X01 … X05)
Status:
PRs:

### Matrice couverture
Lignes P0 restantes en ❌:
-

### PRs mergées
| PR | Branche | Mergé |
|----|---------|-------|
| | | |

### Blocants
-

### Notes
-
```

---

## Definition of Done (Sprint 2)

Le sprint est **terminé** lorsque :

1. Toutes les lignes **P0** de la matrice sont ✅ ou explicitement reportées avec ticket Sprint 3.
2. Chaque lot a une PR mergée et un rapport d’implémentation rempli.
3. UAT sign-off (Teddy / PO) sur au moins un appareil iOS ou Android réel.
4. Documentation `sprint/README.md` mise à jour (Sprint 2 = done).

**Sprint 3 (suggestion)** : performance, offline, notifications push, EAS build TestFlight/Play Internal, polish UI/accessibilité.
