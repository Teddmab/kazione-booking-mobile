# KaziOne Booking — Mobile

Expo (SDK 54) client app for KaziOne Booking. Uses Expo Router, Supabase Auth, TanStack Query, NativeWind, and i18n (EN / FR / ET).

## Prerequisites

- Node.js ≥ 20
- npm
- [EAS CLI](https://docs.expo.dev/build/setup/) for cloud builds: `npm install -g eas-cli`

## Setup

```bash
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_BASE_URL, etc.
npm install
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |

## EAS Build

Secrets must be stored in EAS (not committed):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "..."
```

```bash
eas build --profile development --platform ios
eas build --profile preview --platform android
```

## CI

GitHub Actions runs on push/PR to `main` and `dev`: typecheck, lint, unit tests, and architecture scan (blocks direct `supabase.from` outside `lib/`).

**Branch protection (recommended):** require CI to pass before merge; require 1 reviewer on PRs to `main`.

## Architecture

- API calls: `lib/api.ts` → Edge Functions only
- Supabase Auth / role: `lib/auth.ts`, `lib/supabase.ts`
- No direct `supabase.from()` in `app/`, `components/`, `hooks/`, or `store/` (except `lib/auth.ts` for role lookup)

## Deep links (scheme `kazione`)

| Deep link | Screen |
| --------- | ------ |
| `kazione://salon/{slug}` | Salon storefront (`app/salon/[slug].tsx`) |
| `kazione://booking/staff?salonSlug={slug}` | Booking flow step 1 |
| `kazione://payment/pawapay?status=success&payment_id={id}` | Payment callback → success/failure |

**iOS simulator:** `xcrun simctl openurl booted "kazione://salon/afrotouch"`  
**Android emulator:** `adb shell am start -W -a android.intent.action.VIEW -d "kazione://salon/afrotouch"`

## Marketplace API (Sprint M2)

- List: `GET /marketplace-storefronts` — query `search`, `categories`, `page`, `limit` → `{ storefronts, total }`
- Detail: `GET /get-storefront?slug=` → full storefront JSON (camelCase)

Sprint docs: `kazione-docs/team/MOBILE/`
