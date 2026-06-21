# KaziOne Booking Mobile — Gap Analysis

| Field           | Value                                          |
|-----------------|------------------------------------------------|
| **Date**        | 2026-06-11 (updated after M10 commit audit)    |
| **Baseline**    | M10 commit `33c2757` (feat: owner web parity)  |
| **Next sprint** | M9 (tasks revised to reflect M10 state)        |
| **Sources**     | Code audit + Meeting Recording 2026-06-11      |

---

## Executive Summary

The M10 commit `feat(m10): owner web parity — settings, staff, dashboard UX, walk-in` landed immediately after the gap analysis meeting and shipped a large portion of what was planned:

- ✅ Staff schedule editor (working hours per day)
- ✅ Client appointment history in detail view
- ✅ Manual client creation form
- ✅ 5-step walk-in booking flow
- ✅ Dashboard KPI parity (6 cards, week breakdown, realtime)
- ✅ Settings tabs: business hours, notifications (with backend persistence), booking rules, payments, language
- ✅ Service images (single image per service)
- ✅ PayPal connection UI (stub — backend returns "coming_soon")
- ✅ Realtime invalidation on appointments and clients
- ✅ Flat bar charts — no bezier curves anywhere
- ✅ Language selector moved to Settings (7th tab)

**Remaining gaps after M10:** Supplier invoice photo, duration display bug, expense categories, local notification scheduling, Marketplace still in nav, ~20 hardcoded French strings.

Adjusted parity: ~82% vs web dashboard.

---

## Section 1 — Screen Inventory (Current State)

| Screen | File | API | Status |
|--------|------|-----|--------|
| Dashboard | `(tabs)/index.tsx` | ✅ | Working — KPIs, week breakdown, realtime, staff today, promotions, AI insights strip |
| Appointments | `(tabs)/appointments.tsx` | ✅ | Working — week/list view, reschedule sheet, "Terminer" button, realtime |
| Clients | `(tabs)/clients.tsx` | ✅ | Working — search, filters, detail with history, manual creation |
| Staff (tab) | `(tabs)/staff.tsx` | ✅ | Working — schedule editor, service assignment, invites |
| Finance | `owner/finance.tsx` | ✅ | 4 tabs (Overview, Income, Expenses, Profitability) — expense category hardcoded |
| Reports | `owner/reports.tsx` | ✅ | Working — 6 report tabs, CSV/PDF export |
| Services | `owner/services.tsx` | ✅ | Working — images (single), category groups — duration display broken |
| Walk-In | `owner/walk-in.tsx` | ✅ | Working — 5-step flow: client/service/staff/datetime/confirm |
| Settings | `owner/settings.tsx` | ✅ | Working — 7 tabs, all save to backend |
| Notifications | `owner/notifications.tsx` | ⚠️ | List only — no local notification scheduling |
| AI Insights | `owner/ai-insights.tsx` | ✅ | Working |
| Suppliers | `owner/suppliers.tsx` | ✅ | Working — 3 tabs, purchase recording — **no invoice photo** |
| **Storefront** | `owner/storefront.tsx` | — | File exists, **removed from nav** (per meeting) ✅ |
| **Marketplace** | `owner/marketplace.tsx` | — | File exists, **still in "More" nav** ❌ needs removal |

---

## Section 2 — Product Decisions from Meeting (Status)

| Decision | Status |
|----------|--------|
| Remove Storefront from mobile nav | ✅ Done in M10 |
| Remove Marketplace from mobile nav | ❌ Still linked in `more.tsx` |
| Suppliers invoice photo scan | ❌ Not implemented |
| Flat design / no shadows | ✅ Mostly done — one shadow in `LanguageFlagPicker.tsx` dropdown |
| Language selector → Settings | ✅ Done in M10 (7th tab) |
| Charts: simple bars only | ✅ Done — all charts are straight bars |
| Service duration fix | ❌ Still shows "60 min" not "1h" |
| Service save confirmation | ✅ Done — Alert after save |
| Service images | ✅ Partial — single image (web supports 3) |
| Appointment completion modal | ✅ Done — "Terminer" button in detail sheet |
| Completion alert message bug | ❌ Shows "Reprogrammé" text on completion |

---

## Section 3 — Remaining Gaps

### P0 — Sprint M9 (this sprint)

| Gap | Screen | Detail |
|-----|--------|--------|
| Marketplace still in nav | `more.tsx` | Per meeting: remove it |
| Supplier invoice photo scan | `suppliers.tsx` | Camera → upload → store URL on purchase record |
| Service duration display | `services.tsx` | Shows "60 min" → must show "1h" / "1h 30min" |
| Service buffer time in form | `services.tsx` | `buffer_minutes` field not exposed in ServiceFormSheet |
| Expense category selector | `finance.tsx` | Hardcoded `"other"` — needs picker |
| Completion alert wrong message | `appointments.tsx` | "Terminer" success shows "Reprogrammé" text |
| ~20 hardcoded French strings | multiple | `services.tsx`, `settings.tsx`, `walk-in.tsx` |

### P1 — Sprint M10 (next sprint)

| Gap | Screen | Detail |
|-----|--------|--------|
| Local notification scheduling | `appointments.tsx` | Schedule `expo-notifications` at appointment time; no implementation yet |
| Service images: support up to 3 | `services.tsx` | Currently single `image_url`; web supports array of 3 |
| Advanced finance tabs | `finance.tsx` | Bookkeeping, Tax estimate, Accountant Export tabs missing |
| Staff performance stats | `staff.tsx` | Only shows 30-day booking count; no revenue/utilization/rating |
| Custom date range picker | `finance.tsx`, `reports.tsx` | Presets only, no custom date range |
| AI chat history | `ai-insights.tsx` | Single question only, no conversation thread |
| PayPal integration (backend) | `settings.tsx` | UI ready but backend returns "coming_soon" |

### P2 — Future

| Gap | Screen | Detail |
|-----|--------|--------|
| Revenue dedicated screen | new | Match web `RevenuePage.tsx` (daily/weekly charts, by staff/service) |
| CSV client import | `clients.tsx` | Bulk import not implemented |
| Supplier order status tracking | `suppliers.tsx` | No status workflow on orders |
| Bulk service operations | `services.tsx` | No batch deactivate/delete |
| Promotion editing | `storefront.tsx` | Can add/delete but not edit existing promotions |

---

## Section 4 — API Coverage

| Edge Function | Mobile | Notes |
|---------------|--------|-------|
| `appointments` | ✅ | Realtime + reschedule + completion |
| `ai-insights` | ✅ | |
| `ai-finance` | ✅ | |
| `cancel-booking` | ✅ | |
| `clients` | ✅ | CRUD + history |
| `create-booking` | ✅ | |
| `finance` | ✅ | |
| `get-availability` | ✅ | Walk-in + reschedule |
| `get-storefront` | ✅ | |
| `invite-staff` | ✅ | |
| `me` | ✅ | |
| `notifications` | ✅ | |
| `reschedule-booking` | ✅ | |
| `services` | ✅ | |
| `staff` | ✅ | Schedule + service assignment |
| `storefront-owner` | ✅ | |
| `storefront-upload` | ✅ | Service images |
| `suppliers` | ✅ | |
| `export-report` | ✅ | |
| `get-business-settings` | ✅ | Via `businessSettings.ts` |
| `paypal-connect` | ⚠️ | UI ready, backend stub |
| `gdpr` | ❌ | Not implemented |
| `reviews` | ❌ | Not implemented |

---

## Section 5 — Hardcoded French Text (Remaining)

| File | Strings |
|------|---------|
| `services.tsx` | `"Actif"/"Inactif"` badges, `"Appui long → désactiver"` hint, Alert messages (`"Enregistré"`, `"Désactivé"`, `"Désactiver"`, `"Annuler"`) |
| `settings.tsx` | Tab labels `"Horaires"` / `"Réservation"`, form labels `"Acompte (%)"` / `"Annulation (heures avant)"` / `"Tampon entre RDV"` / `"Report"`, `"Paiement complet"` |
| `walk-in.tsx` | Guest default `"Client passage"`, summary labels `"Coiffeur·se"` / `"Paiement"` |
| `appointments.tsx` | `"Reprogrammé"` shown as completion success (wrong key) |

~20 strings total. Most are in settings tabs (form labels). Not critical for EN/ET users but must be cleaned.

---

## Sprint Summary

| Sprint | Theme | Remaining work |
|--------|-------|----------------|
| **M9** | Suppliers + critical UX | See revised Sprint M9 doc |
| **M10** | Notifications + analytics | Local notifications, finance depth, service images ×3 |
