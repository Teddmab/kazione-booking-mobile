# PR description — M8-FIX EAS Preview Android (copy-paste)

> **Implementation report:** [`kazione-docs/team/MOBILE/M8-FIX — EAS Preview Implementation Report.md`](../../../kazione-docs/team/MOBILE/M8-FIX%20%E2%80%94%20EAS%20Preview%20Implementation%20Report.md)  
> **Depends on:** [M8 — Implementation Report.md](../../../kazione-docs/team/MOBILE/M8%20%E2%80%94%20Implementation%20Report.md) (PR #12 merged)

## Summary

Fix **EAS preview Android APK** build and runtime config:

- Disable Sentry source map upload on preview builds (`SENTRY_DISABLE_AUTO_UPLOAD`) — fixes Gradle failure without Sentry org/project.
- Add `expo-updates` + `updates` / `runtimeVersion` in `app.config.ts` for preview channel.
- Document cloud env workflow (`.env.eas.example`, `.gitignore`) — `EXPO_PUBLIC_*` prod values live on **expo.dev**, not in Git.

**Cloud env (already on expo.dev, not in this PR):** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL` on `@afrotouch-ou/kazione-booking-mobile` (preview + production).

---

## Files changed

| File | Purpose |
| ---- | ------- |
| `eas.json` | `SENTRY_DISABLE_AUTO_UPLOAD` on preview profile |
| `app.config.ts` | EAS Update URL + `runtimeVersion` policy |
| `package.json` | `expo-updates` dependency |
| `.env.eas.example` | Template for `eas env:push` |
| `.gitignore` | Ignore `.env.eas` |

---

## Test plan

- [ ] Merge PR, run `npx eas-cli build --profile preview --platform android`
- [ ] Install **new** APK — no crash « Missing Supabase configuration »
- [ ] Login `owner@afrotouch.ee` / `Test1234!` against cloud Supabase
- [ ] Local dev unchanged: `.env` still uses LAN IP for `expo start`

---

## Reviewer

| Role | GitHub | Statut |
| ---- | ------ | ------ |
| Reviewer / merge | **@Teddmab** | ⬜ |
