# M6 — App Store & Play Store Release Checklist

> **Owner:** Teddy  
> **Spec:** [Sprint M6 — Storefront Editor & App Store Release.md](../../../kazione-docs/team/MOBILE/Sprint%20M6%20%E2%80%94%20Storefront%20Editor%20%26%20App%20Store%20Release.md)

## Pre-submission (both platforms)

- [ ] M2–M6 features tested on **physical device** with production `.env`
- [ ] `npm run typecheck` && `npm test` green on release branch
- [ ] Privacy Policy URL live: https://kazione.app/privacy
- [ ] App icon 1024×1024 in `assets/icon.png`
- [ ] EAS production profile configured in `eas.json`

## iOS (M6-04)

- [ ] App Store Connect record created (M0-03)
- [ ] Screenshots: iPhone 6.7" + 4.7"
- [ ] Description + keywords (100 chars max)
- [ ] Age rating 4+
- [ ] Build: `eas build --profile production --platform ios`
- [ ] Submit: `eas submit --platform ios --profile production`

**Review notes for Apple:** B2B salon owner app, existing account required, Supabase Auth, no IAP in V1.

## Android (M6-05)

- [ ] Play Console record + service account (M0-04)
- [ ] Data safety form completed
- [ ] Screenshots phone + 7" tablet
- [ ] Build: `eas build --profile production --platform android`
- [ ] Submit: `eas submit --platform android --profile production`

## E2E script (M6-06)

Run on **production build** with `owner@afrotouch.ee`:

- [ ] Auth: login → dashboard → sign out → session persists
- [ ] Appointments: calendar, detail, confirm, walk-in
- [ ] Services / Staff / Clients CRUD
- [ ] Finance: KPIs, transactions, CSV export
- [ ] Storefront: edit text, cover upload, promotion, gallery
- [ ] Settings: profile save, language, sign out confirm
