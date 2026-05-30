# M8-FIX — EAS Preview Android (Rapport d'implémentation)

| Field | Value |
| ----- | ----- |
| **Sprint / patch** | M8-FIX — EAS Preview Android build & cloud env |
| **Date** | 2026-05-30 |
| **Engineer** | Moise (AI-assisted) |
| **Repo mobile** | [kazione-booking-mobile](https://github.com/Teddmab/kazione-booking-mobile) |
| **Depends on** | M8 merged (PR #12) |
| **Branche** | `fix/eas-preview-android-build` |
| **Org EAS** | `@afrotouch-ou/kazione-booking-mobile` |

---

## Executive summary

Premier build **EAS preview APK** Android pour distribution interne. Trois catégories de problèmes résolues :

1. **Gradle / Sentry** — échec upload source maps sans org/projet Sentry configuré.
2. **expo-updates** — canal `preview` dans `eas.json` sans package/config Expo Updates.
3. **Variables `EXPO_PUBLIC_*`** — EAS Build ne lit pas le `.env` local → crash au lancement *« Missing Supabase configuration »* ; variables prod poussées sur **expo.dev** (pas dans Git).

**Overall status:** ✅ Code + config EAS cloud prêts — ⬜ merge PR fix + rebuild APK + QA login cloud.

---

## Problèmes rencontrés

### 1. Build Gradle — Sentry

```
Task :app:createBundleReleaseJsAndAssets_SentryUpload_... FAILED
error: An organization ID or slug is required (provide with --org)
```

**Cause :** plugin `@sentry/react-native` dans `app.config.ts` sans `organization` / `project` ; tâche Gradle `sentry-cli` échoue en release.

**Fix :** `eas.json` → profil `preview` :

```json
"env": { "SENTRY_DISABLE_AUTO_UPLOAD": "true" }
```

Sentry runtime reste possible via `EXPO_PUBLIC_SENTRY_DSN` (optionnel). Upload source maps à activer plus tard avec config Sentry complète en production.

### 2. expo-updates / canal preview

```
The build profile "preview" specifies the channel "preview",
but the "expo-updates" package hasn't been installed.
Cannot automatically write to dynamic config at: app.config.ts
```

**Fix :**

- `npm install expo-updates` (~29.0.18)
- Ajout manuel dans `app.config.ts` :

```ts
updates: {
  url: 'https://u.expo.dev/68b7dcc4-7c49-4726-b0a4-00d820b24980',
},
runtimeVersion: { policy: 'appVersion' },
```

### 3. Crash APK — config Supabase absente

```
Missing Supabase configuration: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

**Cause :** EAS Build sur serveurs Expo — **ne charge pas** `.env` local (IP LAN `192.168.x.x`).

**Fix :** variables sur [expo.dev](https://expo.dev) → projet → **Environment variables** (preview + production) :

| Variable | Valeur cloud |
| -------- | ------------ |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://hwvqbsqlvwvedyhfuiwt.supabase.co` |
| `EXPO_PUBLIC_API_BASE_URL` | `https://hwvqbsqlvwvedyhfuiwt.supabase.co/functions/v1` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | clé anon projet (identique stack seed / prod pilot) |

**Non commité dans Git** — workflow documenté via `.env.eas.example` + `.gitignore` (`.env.eas`).

**CLI utilisée :**

```bash
npx eas-cli env:create --environment preview --environment production \
  --name EXPO_PUBLIC_SUPABASE_URL --value "https://hwvqbsqlvwvedyhfuiwt.supabase.co" ...

npx eas-cli env:push preview --path .env.eas --force   # alternative locale
```

**Reste optionnel :** `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` sur expo.dev si tests Payment Sheet sur APK.

---

## Fichiers modifiés (branche fix)

| File | Change |
| ---- | ------ |
| `eas.json` | `SENTRY_DISABLE_AUTO_UPLOAD` sur profil `preview` |
| `app.config.ts` | `updates` + `runtimeVersion` |
| `package.json` / `package-lock.json` | `expo-updates` |
| `.env.eas.example` | Modèle push vars cloud |
| `.gitignore` | ignore `.env.eas` |

---

## Deux configs env (important)

| Contexte | Source | URLs |
| -------- | ------ | ---- |
| Dev local `expo start` | `.env` (gitignored) | IP LAN / `10.0.2.2` → Supabase local |
| EAS build APK | expo.dev env vars | `hwvqbsqlvwvedyhfuiwt.supabase.co` |

Le `.env` local **ne doit pas** être changé pour la prod — il sert uniquement au dev sur machine.

---

## Build & deploy

```bash
# Preview APK (org afrotouch-ou)
npx eas-cli build --profile preview --platform android

# Suivi
npx eas-cli build:list --platform android --limit 3
```

Profil `preview` dans `eas.json` : `distribution: internal`, `android.buildType: apk`.

---

## Test execution report

| Check | Result |
| ----- | ------ |
| EAS env vars preview | ✅ 3 vars Supabase sur expo.dev |
| Gradle build cloud | ✅ après fix Sentry + expo-updates |
| APK launch (sans rebuild post-env) | ❌ ancien APK — rebuild requis |
| Login cloud post-rebuild | ⬜ QA manuelle |

---

## Manual QA (recommended)

- [ ] Installer **nouvel** APK preview (pas l'ancien build)
- [ ] App démarre sans « Missing Supabase configuration »
- [ ] Login `owner@afrotouch.ee` contre backend cloud
- [ ] Parcours booking client (si Stripe key ajoutée sur EAS)
- [ ] Dev local inchangé : `.env` LAN + `supabase start` + `npm run dev`

---

## PR

| Field | Value |
| ----- | ----- |
| Branche | `fix/eas-preview-android-build` |
| Base | `master` |
| PR summary | [`docs/PR-SPRINT-M8-FIX-EAS-PREVIEW-SUMMARY.md`](./PR-SPRINT-M8-FIX-EAS-PREVIEW-SUMMARY.md) |
| Mergé | ⬜ |

---

## Sign-off

| Role | Name | Date | OK |
| ---- | ---- | ---- | -- |
| Mobile lead | Moise | 2026-05-30 | ✅ |
| Reviewer | Teddy | | ⬜ |
| QA APK cloud | Teddy | | ⬜ |
