# Sprint 1 — Migration Web → Mobile

**Sprint** : 1  
**Repo** : `kazione-booking-mobile`  
**Référence** : `kazione-booking-frontends` (Vite) + `kazione-booking-backend` (Supabase)  
**Objectif** : Livrer une application Expo (React Native) qui réutilise le **même backend** et les **mêmes contrats API** que le web, avec les parcours client et owner essentiels opérationnels en local (LAN).

---

## Pourquoi ce sprint existe

Le produit web Kazione Booking (marketplace client, réservation, paiement Stripe, espace owner) doit être accessible sur **iOS / Android** sans dupliquer la logique métier côté serveur. Ce sprint pose :

- la **coquille Expo** (Expo Router, auth, tenant, React Query) ;
- l’**alignement des variables d’environnement** avec le front web ;
- les **flux client** (découverte → vitrine → réservation → paiement) ;
- le **socle owner** (tableau de bord + écrans de gestion branchés API) ;
- les **garde-fous de validation** pour les PR suivantes.

---

## Périmètre Sprint 1 (inclus / exclu)

### Inclus

| Domaine | Parité web | Notes |
|---------|------------|--------|
| Config & API | `EXPO_PUBLIC_*` ↔ `VITE_*` | `.env.example` documenté |
| Auth Supabase | Client + équipe (owner/manager/staff/reception) | `AuthContext`, `/me` tenant |
| Onboarding | Visuels web | Images `marketplace-hero`, `salon-afrotouch-cover`, etc. |
| Client — marketplace | Discover, browse, vitrine salon | `/marketplace-storefronts`, `/get-storefront` |
| Client — réservation | `BookingFlow`, dispo, Stripe Payment Sheet | Mêmes endpoints que `SalonBooking.tsx` |
| Owner — dashboard | KPIs, RDV du jour, navigation | `/appointments?action=kpis`, listes CRUD lecture |
| Owner — sous-écrans | RDV, clients, staff, services, vitrine, paramètres | Lecture + actions RDV (statut) |
| Routage rôle | owner/manager → owner, client sans tenant → client | `app/index.tsx` |

### Exclu (sprints ultérieurs)

- Staff / réception / partenaire : écrans complets (placeholders uniquement).
- Client : « Mes réservations » et profil enrichi (placeholders).
- Owner : finance, rapports, insights IA, marketplace listing, fournisseurs (écran « Plus » → web).
- Édition vitrine / Stripe Connect / PayPal depuis mobile.
- Tests automatisés Jest/Detox (hors `tsc` + checklists manuelles ci-dessous).
- Build EAS production / stores.

---

## Prérequis (Pre-Sprint Checklist)

- [ ] Node 20+ et npm installés dans `kazione-booking-mobile`
- [ ] Copie de `.env` depuis `kazione-booking-frontends/.env` (clés `EXPO_PUBLIC_*`)
- [ ] Sur **appareil physique** : IP LAN du PC dans `.env` (pas `127.0.0.1`)
- [ ] `kazione-booking-backend` : `supabase start` + conteneur **`supabase_edge_runtime_*` Up**
- [ ] Comptes de test : client (`customer@test.com` seed) + owner salon

---

## Découpage PR (recommandé)

| PR | Branche suggérée | Tâche |
|----|------------------|--------|
| 1 | `feat/s1-mo-01-expo-foundation` | S1-MO-01 |
| 2 | `feat/s1-mo-02-auth-onboarding` | S1-MO-02 |
| 3 | `feat/s1-mo-03-client-marketplace-booking` | S1-MO-03 |
| 4 | `feat/s1-mo-04-owner-dashboard` | S1-MO-04 |
| 5 | `chore/s1-mo-05-sprint-docs` | Ce fichier + `sprint/README.md` |

Les PR peuvent être **squashées en une seule** `feat/sprint-1-mobile-web-migration` si l’équipe préfère un livrable unique.

---

## TASK S1-MO-01 — Fondation Expo & client API

**Ticket** : KZB-M-001  
**Priorité** : P0  
**Branche** : `feat/s1-mo-01-expo-foundation`

### Implémentation

- Projet Expo SDK 54, Expo Router, React Query, Supabase JS, Stripe React Native.
- `lib/supabase.ts` : client lazy (`getSupabase`) pour ne pas crasher le routeur si `.env` absent.
- `lib/api.ts` : même contrat que `frontends/src/lib/api.ts` (Bearer, `apikey`, endpoints publics, `ApiError`).
- Retry token session (~200 ms) après connexion.
- `app.json` : plugin Stripe `[{}, {}]`, `NSAllowsLocalNetworking` (iOS dev HTTP).
- `.env.example` : mapping `VITE_*` → `EXPO_PUBLIC_*`.

### Tests

```bash
cd kazione-booking-mobile
npm install
npm run typecheck
```

| Test | Attendu |
|------|---------|
| `typecheck` | 0 erreur sur `lib/`, `contexts/`, `services/` (hors routes typées Expo obsolètes si cache) |
| Démarrage sans `.env` | App charge ; erreur explicite au premier appel Supabase |
| Avec `.env` valide | Pas d’erreur `supabaseUrl is required` au boot |

### Validation initiale

- [ ] `npx expo start --lan` démarre sans erreur plugin Stripe
- [ ] `curl -s -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_API_BASE_URL/marketplace-storefronts"` → `200` ou `401` JSON (pas connection refused)

---

## TASK S1-MO-02 — Auth, onboarding & routage

**Ticket** : KZB-M-002  
**Priorité** : P0  
**Branche** : `feat/s1-mo-02-auth-onboarding`

### Implémentation

- `AuthProvider`, `TenantProvider` (`GET /me`, liste `businesses` dérivée de `tenant`).
- Écrans : `onboarding`, `(auth)/welcome`, `login-client`, `login-team`, `signup` (socle).
- `app/index.tsx` : onboarding → auth → tenant → redirect `/(app)/owner` ou `/(app)/client`.
- Onboarding : fond image plein écran (assets web), bouton **Next** en bas (safe area).
- Invalidation query `tenant` après login.

### Tests

| Test | Étapes | Attendu |
|------|--------|---------|
| T-Auth-01 | Premier lancement | Onboarding 3 slides puis welcome |
| T-Auth-02 | Login client seed | Redirection espace client (pas « Could not load workspace ») |
| T-Auth-03 | Login owner seed | Redirection `/(app)/owner` tableau de bord |
| T-Auth-04 | 401 / token expiré | Retour welcome ou message clair (pas crash) |

### Validation initiale

- [ ] Client sans `business_members` : pas bloqué par erreur workspace
- [ ] Owner : `GET /me` retourne `tenant` non null dans les logs Edge (`me`, status 200)
- [ ] Edge Runtime Docker **Up** (sinon erreur réseau générique)

---

## TASK S1-MO-03 — Parcours client (marketplace & réservation)

**Ticket** : KZB-M-003  
**Priorité** : P0  
**Branche** : `feat/s1-mo-03-client-marketplace-booking`

### Implémentation

- `services/marketplace.ts`, `hooks/useMarketplace.ts`
- Écrans : `client/index`, `browse`, `salon/[slug]`, `book/[slug]`
- `components/booking/BookingFlow.tsx` : services, staff, date, créneaux, client, paiement
- `StripePaymentSheet` + `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `services/booking.ts` : `get-availability`, `create-booking` (aligné web)

### Tests

| Test | Étapes | Attendu |
|------|--------|---------|
| T-Client-01 | Discover / Browse | Liste salons, images ou fallback lettre |
| T-Client-02 | Ouvrir vitrine | Services affichés, CTA réserver |
| T-Client-03 | Flux réservation | Créneaux chargés pour date + service |
| T-Client-04 | Paiement carte (test) | Payment Sheet s’ouvre si clé Stripe renseignée |
| T-Client-05 | Réseau LAN | Téléphone atteint `EXPO_PUBLIC_SUPABASE_URL` (IP PC) |

### Validation initiale

- [ ] Même salon visible que sur web (même API base URL)
- [ ] Pas de `Network request failed` avec backend + edge up
- [ ] Erreur Stripe explicite si clé publishable absente

---

## TASK S1-MO-04 — Espace owner (parité web lecture + RDV)

**Ticket** : KZB-M-004  
**Priorité** : P0  
**Branche** : `feat/s1-mo-04-owner-dashboard`

### Implémentation

- `app/(app)/owner/_layout.tsx` : garde rôle owner/manager
- `owner/index` : KPIs (`useOwnerDashboardKPIs`), menu rapide
- `owner/appointments` : liste + changement statut (`PATCH /appointments`)
- `owner/clients`, `staff`, `services`, `storefront`, `settings`, `more`
- `types/owner.ts`, `services/owner/*`, `hooks/useOwner*`
- `components/owner/*` (StatCard, StatusBadge, QueryState, OwnerBusinessHeader)
- Suppression placeholder `owner/home.tsx` → groupe `owner/`

### Tests

| Test | Étapes | Attendu |
|------|--------|---------|
| T-Owner-01 | Dashboard | 4 cartes KPI chargées (ou tirets si vide) |
| T-Owner-02 | RDV aujourd’hui / 7j | Liste appointments |
| T-Owner-03 | Changer statut | Confirmer / Terminer / Annuler → refresh liste |
| T-Owner-04 | Clients | Recherche debounce, liste paginée |
| T-Owner-05 | Staff & services | Listes depuis `/staff`, `/services` |
| T-Owner-06 | Vitrine | Titre, slug, publiée / brouillon |
| T-Owner-07 | Multi-salon | Chips switcher si plusieurs `businesses` |

### Validation initiale

- [ ] Parité des endpoints avec `frontends/src/services/*` (mêmes chemins)
- [ ] Manager redirigé comme owner
- [ ] Écran « Plus » indique sections web-only (finance, rapports, etc.)

---

## TASK S1-MO-05 — Documentation sprint & PR template

**Ticket** : KZB-M-005  
**Priorité** : P2  
**Branche** : `chore/s1-mo-05-sprint-docs`

### Implémentation

- Dossier `sprint/` (ce fichier + `README.md`)
- Section « Rapport d’implémentation » à remplir en fin de sprint

### Validation initiale

- [ ] Lien PR GitHub renseigné dans le rapport ci-dessous
- [ ] Copie optionnelle vers `kazione-docs/team/MOBILE/` lors du merge

---

## Checklist validation globale (UAT Sprint 1)

À cocher avant merge de la PR principale :

### Environnement

- [ ] `.env` aligné sur le front web
- [ ] IP LAN pour test sur téléphone
- [ ] `docker ps` : `supabase_edge_runtime_kazione-booking` **Up**
- [ ] `supabase functions serve` non requis si stack CLI complète

### Fonctionnel

- [ ] Onboarding → login client → marketplace → réservation (happy path)
- [ ] Login owner → dashboard → RDV → changement statut
- [ ] Déconnexion depuis paramètres owner

### Qualité

- [ ] `npm run typecheck` exécuté (noter écarts Expo Router typés si cache)
- [ ] Pas de secrets commités (`.env` dans `.gitignore`)
- [ ] Captures d’écran ou courte vidéo UAT jointes à la PR

---

## Modèle de description PR (copier-coller)

```markdown
## Summary
Sprint 1 — Migration parité web → mobile (Expo): auth, client marketplace/booking, owner dashboard.

## Changes
- Foundation: Supabase lazy, API client, env mapping
- Auth + onboarding + role routing
- Client: discover, browse, salon, BookingFlow, Stripe
- Owner: KPIs, appointments, clients, staff, services, storefront, settings

## Test plan
- [ ] Pre-sprint checklist (backend edge runtime up, .env LAN)
- [ ] T-Auth-01 … T-Auth-04
- [ ] T-Client-01 … T-Client-05
- [ ] T-Owner-01 … T-Owner-07
- [ ] npm run typecheck

## Screenshots
<!-- onboarding, client salon, owner dashboard -->

## Related
- Front: kazione-booking-frontends
- Back: kazione-booking-backend
- Doc: sprint/Sprint 1 — Mobile Web Migration.md
```

---

## Rapport d’implémentation

```md
## Sprint 1 — Mobile Web Migration — Implementation Report
Date:
Engineer:
PR principale:

### S1-MO-01 — Fondation Expo & API
Status: ✅ / ❌
Branch:
PR Link:
typecheck OK: YES / NO
Expo start OK: YES / NO

### S1-MO-02 — Auth & onboarding
Status: ✅ / ❌
Branch:
PR Link:
T-Auth-01 … 04: PASS / FAIL

### S1-MO-03 — Client marketplace & booking
Status: ✅ / ❌
Branch:
PR Link:
T-Client-01 … 05: PASS / FAIL
Stripe Payment Sheet testé: YES / NO / N/A

### S1-MO-04 — Owner dashboard
Status: ✅ / ❌
Branch:
PR Link:
T-Owner-01 … 07: PASS / FAIL

### S1-MO-05 — Documentation
Status: ✅ / ❌
Branch:
PR Link:
sprint/ publié dans repo: YES / NO
Copié vers kazione-docs: YES / NO

### PRs mergées
| PR | Branche | Mergé |
|----|---------|-------|
| Foundation | feat/s1-mo-01-expo-foundation | |
| Auth | feat/s1-mo-02-auth-onboarding | |
| Client | feat/s1-mo-03-client-marketplace-booking | |
| Owner | feat/s1-mo-04-owner-dashboard | |
| Docs | chore/s1-mo-05-sprint-docs | |

### Blocants restants
-

### Notes UAT
-
```

---

## Sprint suivant

Voir **[Sprint 2 — Full Web Feature Import](./Sprint%202%20—%20Full%20Web%20Feature%20Import.md)** : import de toutes les fonctionnalités web restantes (auth complète, client compte, owner CRUD/finance/vitrine, staff, réception, partenaire, tests).
