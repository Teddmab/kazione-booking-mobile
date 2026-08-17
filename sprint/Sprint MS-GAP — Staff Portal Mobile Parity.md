# Sprint MS-GAP — Staff Portal Mobile Parity

**Sprint** : MS-GAP  
**Repo** : `kazione-booking-mobile`  
**Estimated effort** : ~25 h total across 4 PRs  
**Depends on** : MS0–MS3 complete, backend S53 merged (bank account + commission endpoints live)  
**Who** : Moise (implementation), Teddy (review)

---

## Why this sprint exists

A full audit comparing the web staff portal (`kazione-booking-frontends/src/pages/dashboard/staff/`) against the mobile app revealed 8 gaps — 2 missing screens and 6 feature/quality gaps on existing screens. This sprint closes all of them so the mobile staff experience is fully on par with the web.

**Gaps found:**

| # | Gap | Type | Priority |
|---|-----|------|----------|
| 1 | Bank name is a free-text input — produces inconsistent DB values | Data bug | P1 |
| 2 | Notifications use 60 s polling instead of Supabase Realtime | Quality | P1 |
| 3 | Commission Ledger screen missing — data is fetched but never shown | Missing screen | P1 |
| 4 | Notification type icons are uniform — no differentiation by type | UX | P2 |
| 5 | Notification timestamps are absolute — should be relative ("5 min ago") | UX | P2 |
| 6 | Calendar screen has no Earnings MTD stat tile | Feature gap | P2 |
| 7 | Client detail sheet has no Entitlements tab | Feature gap | P2 |
| 8 | Training system entirely absent (course list + course player) | Missing screens | P3 |

---

## PR 1 — Quick wins

**Branch** : `feat/ms-gap-quick-wins`  
**Estimated effort** : ~3 h  
**Files touched** : `app/(app)/staff/profile.tsx`, `app/(app)/staff/notifications.tsx`, `app/(app)/staff/(tabs)/calendar.tsx`, `lib/format.ts`

### Task 1 — Bank name picker (P1 · ~1 h)

**Problem** : `profile.tsx` Payment tab uses a plain `TextInput` for `bank_account_bank_name`. Users type anything ("lhv", "LHV bank", "LHV Pank"), producing inconsistent values in the database. The web enforces a fixed dropdown.

**Fix** :
- Replace the `TextInput` for bank name with a `Picker` or a tappable modal sheet.
- Options list (must match web exactly): `LHV`, `SEB`, `Swedbank`, `Luminor`, `Coop Pank`, `Other`.
- When user selects "Other", show a `TextInput` below for free entry.
- On save, send the selected string as `bank_name` to `PATCH /staff?action=update-bank-account` — no backend change needed.

### Task 2 — Notification relative timestamps + type icons (P2 · ~1 h)

**Problem** : `notifications.tsx` shows absolute timestamps ("4 Aug, 14:32") and uniform card layout for all notification types. Web shows "5 min ago" and differentiates icons by type.

**Fix** :
- Add `formatRelativeTime(dateString: string): string` to `lib/format.ts`:
  - < 60 s → `"just now"`
  - < 60 min → `"X min ago"`
  - < 24 h → `"X hr ago"`
  - else → short date string
- Replace `toLocaleString()` calls in the notification card with `formatRelativeTime()`.
- Add `getNotificationIcon(type: string)` helper returning an icon name per type:
  - `appointment_*` → Calendar icon
  - `review_*` → Star icon
  - `message` → MessageCircle icon
  - default → Bell icon
- Render the returned icon in the card's left column.

### Task 3 — Calendar Earnings MTD tile (P2 · ~1 h)

**Problem** : The calendar screen stats row shows 4 tiles (today count, remaining, duration, week count). Web adds a 5th: Earnings MTD from `useStaffPerformance`.

**Fix** :
- `useStaffPerformance` is already called on the Performance tab. Import it (or lift to a shared context) in `calendar.tsx`.
- Add a 5th stat tile: label "MTD Earnings", value `perf.commission_amount` formatted as currency.
- Style identically to the existing 4 tiles.

---

## PR 2 — Earnings screen + realtime notifications

**Branch** : `feat/ms-gap-earnings-realtime`  
**Estimated effort** : ~7 h  
**Files touched** : `app/(app)/staff/earnings.tsx` (new), `constants/staffDrawerNav.ts`, `hooks/useStaffNotifications.ts`, `hooks/useStaffSelf.ts` (or commission hook)

### Task 4 — Commission Ledger screen (P1 · ~4 h)

**Problem** : The API response from `GET /staff?action=my-commissions` already returns `commissions: CommissionLedgerRow[]` with per-appointment amounts, paid status, pay method, and date paid. Mobile fetches this but only renders a 3-number summary widget in the Profile → Payment tab. The full itemised ledger — which the owner can also see — is entirely absent from mobile.

The `CommissionLedgerRow` type is already defined in `services/staff/profile.ts:49`.

**New screen** : `app/(app)/staff/earnings.tsx`

Structure:
```
┌──────────────────────────────────────┐
│  ← Earnings                          │
│                                      │
│  [This Month] [Last Month] [All]     │  ← period picker chips
│  [All]  [Unpaid]                     │  ← status filter chips
│                                      │
│  Total Earned  Total Paid  Unpaid    │  ← 3 summary cards
│                                      │
│  ┌ Service Name ────────── €12.00 ┐  │
│  │ 15 Aug · Client Name · €60.00  │  │
│  │ ● Paid · cash · 16 Aug         │  │  ← green
│  └────────────────────────────────┘  │
│  ┌ Service Name ────────── €10.00 ┐  │
│  │ 14 Aug · Client Name · €50.00  │  │
│  │ ○ Unpaid                       │  │  ← amber
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

Implementation steps:
1. Add "Earnings" entry to `constants/staffDrawerNav.ts` with a wallet icon.
2. Create `app/(app)/staff/earnings.tsx`:
   - Period state: `"current_month" | "last_month" | "all"` → compute `from`/`to` date strings.
   - Status state: `"all" | "unpaid"` → pass as `status` param.
   - Call `useMyCommissions({ from, to, status })` (hook already exists in the codebase — check `hooks/useStaffSelf.ts` or `services/staff/profile.ts`).
   - Render summary row (3 numbers from `data.summary`).
   - `FlatList` of `CommissionLedgerRow` items.
   - Each row: service name, date, client name, appointment price, commission amount, status badge (green "Paid" + pay method + paid date, or amber "Unpaid").
   - Read-only — no pay action (only owners pay commissions).

### Task 5 — Supabase Realtime notifications (P1 · ~3 h)

**Problem** : `hooks/useStaffNotifications.ts` polls every 60 seconds (`refetchInterval: 60_000`). A new appointment notification can take up to a minute to appear. The web uses a Supabase `postgres_changes` WebSocket channel for instant delivery.

**Reference** : `hooks/useOwnerRealtime.ts` — already uses Supabase channel subscriptions; use as a template.

**Fix** in `hooks/useStaffNotifications.ts`:
1. Remove `refetchInterval: 60_000` from the query config.
2. In `useStaffNotifications`, add a `useEffect` that:
   ```ts
   const channel = supabase
     .channel('staff-notifications')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'notifications',
       filter: `user_id=eq.${userId}`,
     }, () => {
       queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
     })
     .subscribe();

   return () => { supabase.removeChannel(channel); };
   ```
3. Keep pull-to-refresh (`RefreshControl`) as a manual fallback.
4. `userId` comes from `useAuthContext()` (already imported in the hook).

---

## PR 3 — Client entitlements tab

**Branch** : `feat/ms-gap-entitlements`  
**Estimated effort** : ~5 h  
**Files touched** : `types/` (new types), `services/staff/entitlements.ts` (new), `hooks/useStaffClients.ts`, `components/staff/StaffClientDetailSheet.tsx`

### Task 6 — Entitlements tab in client detail (P2 · ~5 h)

**Problem** : Web's `StaffClientsPage` client detail sheet has an Entitlements tab showing the client's active session packages, gift vouchers, and appointment discounts. Mobile `StaffClientDetailSheet` has only Info and Notes tabs. No entitlement types, services, or hooks exist anywhere in the mobile codebase.

**Step 1 — Add types**

Add to the relevant types file (e.g. `types/staff.ts` or `types/api.ts`):
```ts
export type EntitlementType = 'appointment_discount' | 'package' | 'training' | 'gift_voucher';

export interface ClientEntitlement {
  id: string;
  type: EntitlementType;
  status: 'active' | 'exhausted' | 'expired' | 'cancelled';
  offer_title: string;
  sessions_used: number | null;
  sessions_total: number | null;
  remaining_balance: number | null;
  value: number | null;
  issued_at: string;
  expires_at: string | null;
}
```

**Step 2 — Add service function**

Create `services/staff/entitlements.ts`:
```ts
import { staffApi } from '../api';

export async function fetchClientEntitlements(
  businessId: string,
  clientId: string,
): Promise<ClientEntitlement[]> {
  const params = new URLSearchParams({ business_id: businessId, client_id: clientId });
  const data = await staffApi.get<{ entitlements: ClientEntitlement[] }>(
    `/entitlements?${params}`,
  );
  return data.entitlements ?? [];
}
```

**Step 3 — Add hook**

In `hooks/useStaffClients.ts`, add:
```ts
export function useClientEntitlements(businessId: string, clientId: string | null) {
  return useQuery({
    queryKey: ['client-entitlements', clientId],
    queryFn: () => fetchClientEntitlements(businessId, clientId!),
    enabled: !!clientId && !!businessId,
    staleTime: 30_000,
  });
}
```

**Step 4 — Add tab to `StaffClientDetailSheet`**

- Add a 3rd tab "Entitlements" after Notes.
- On tab activate: call `useClientEntitlements(businessId, client.id)` lazily.
- Render each entitlement as a card:
  - Type badge: "Package" (blue) / "Voucher" (emerald) / "Discount" (amber) / "Training" (purple)
  - Offer title
  - For packages: progress bar `sessions_used / sessions_total` + remaining count
  - For vouchers: remaining balance + original value
  - For discounts: discount value/percentage
  - Status badge: "Active" (green) / "Exhausted" (grey) / "Expired" (red)
- **Read-only** on mobile — no create/redeem/cancel actions in this sprint.

---

## PR 4 — Training system

**Branch** : `feat/ms-gap-training`  
**Estimated effort** : ~10 h  
**Files touched** : types (new), `services/staff/training.ts` (new), `hooks/useStaffTraining.ts` (new), `app/(app)/staff/training.tsx` (new), `app/(app)/staff/training/[redemptionId].tsx` (new), `constants/staffDrawerNav.ts`

### Task 7 — Training course list + course player (P3 · ~10 h)

**Problem** : The entire training system is absent from mobile. Web has a course list (`/staff/training`) and a chapter/section player with support for video, text, image, and quiz content types. Both screens are entirely new.

**Step 1 — Add types**

```ts
export interface StaffTrainingItem {
  offer_id: string;
  offer_title: string;
  redemption_id: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  sessions_used: number;
  sessions_total: number;
  course?: { title: string };
}

export type TrainingContentType = 'video' | 'text' | 'quiz' | 'image';

export interface TrainingSection {
  id: string;
  title: string;
  content_type: TrainingContentType;
  content: string;           // URL for video/image, HTML/markdown for text, JSON for quiz
  is_completed: boolean;
}

export interface TrainingChapter {
  id: string;
  title: string;
  order: number;
  sections: TrainingSection[];
}

export interface TrainingPlayerData {
  redemption_id: string;
  status: string;
  current_section_id: string | null;
  chapters: TrainingChapter[];
}
```

**Step 2 — Add service** (`services/staff/training.ts`):
```ts
export const fetchStaffTraining = (businessId: string) =>
  staffApi.get<{ training: StaffTrainingItem[] }>(`/training?action=staff-training&business_id=${businessId}`);

export const registerForTraining = (offerId: string) =>
  staffApi.post<{ redemption_id: string }>('/training?action=register', { offer_id: offerId });

export const fetchPlayerData = (redemptionId: string) =>
  staffApi.get<{ player: TrainingPlayerData }>(`/training?action=player-data&redemption_id=${redemptionId}`);

export const markSectionComplete = (redemptionId: string, sectionId: string) =>
  staffApi.post<{ success: boolean }>('/training?action=mark-section-complete', { redemption_id: redemptionId, section_id: sectionId });
```

**Step 3 — Add hooks** (`hooks/useStaffTraining.ts`):
- `useStaffTraining(businessId)` — query, key `['staff-training', businessId]`
- `useRegisterForTraining()` — mutation, invalidates `['staff-training']` on success
- `usePlayerData(redemptionId)` — query, key `['training-player', redemptionId]`, `staleTime: 0`
- `useMarkSectionComplete()` — mutation, on success updates `['training-player', redemptionId]` cache optimistically (set `is_completed = true` on matching section)

**Step 4 — Course list screen** (`app/(app)/staff/training.tsx`):

Structure:
```
┌──────────────────────────────────────┐
│  ← Training                          │
│                                      │
│  IN PROGRESS                         │
│  ┌ Course Title ─────────────── ┐   │
│  │ ████████░░░░ 4/6 chapters    │   │
│  │                 [Continue →] │   │
│  └──────────────────────────────┘   │
│                                      │
│  AVAILABLE                           │
│  ┌ Course Title ─────────────── ┐   │
│  │ 6 chapters                   │   │
│  │                    [Start →] │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

- Add "Training" to `constants/staffDrawerNav.ts` with a BookOpen icon.
- "Start" → calls `registerForTraining(offerId)` mutation → on success navigates to `training/[redemptionId]` with the returned id.
- "Continue" → navigates directly to `training/[redemptionId]`.
- Empty state if no courses available.

**Step 5 — Course player screen** (`app/(app)/staff/training/[redemptionId].tsx`):

Structure:
```
┌──────────────────────────────────────┐
│  ← Course Title            2/6 done  │
│  ──────────────────────────────────  │
│  Chapter 1 ▼                         │
│    ✓ Introduction                    │
│    → Section 2  ← current            │
│    ○ Section 3                       │
│  Chapter 2 ▷                         │
│  ──────────────────────────────────  │
│                                      │
│  [Section content renders here]      │
│  text | video | image | quiz         │
│                                      │
│  ──────────────────────────────────  │
│            [Mark Complete]           │
└──────────────────────────────────────┘
```

Content rendering by `content_type`:
- `"text"` → `ScrollView` + `react-native-render-html` (or plain `Text` if not installed)
- `"video"` → `expo-video` `VideoView` component (already used in the app)
- `"image"` → `Image` from `expo-image`
- `"quiz"` → Parse `content` as JSON `{ question: string, options: string[], correct: number }` → render radio buttons; require correct answer before "Mark Complete" is enabled

"Mark Complete" button:
- Calls `useMarkSectionComplete()` mutation with `(redemptionId, section.id)`
- On success: advances to next incomplete section; if all sections in all chapters are complete → show completion modal → navigate back to training list

---

## What the backend already provides (no changes needed)

All API endpoints required by this sprint are already deployed:

| Endpoint | Used by |
|----------|---------|
| `PATCH /staff?action=update-bank-account` | Task 1 (already exists) |
| `GET /notifications` + Realtime channel | Task 5 |
| `GET /staff?action=my-commissions` | Task 4 |
| `GET /entitlements?business_id=...&client_id=...` | Task 6 |
| `GET /training?action=staff-training` | Task 7 |
| `POST /training?action=register` | Task 7 |
| `GET /training?action=player-data` | Task 7 |
| `POST /training?action=mark-section-complete` | Task 7 |

---

## Verification checklist

- [ ] Bank name picker: saving "LHV" stores exactly `"LHV"` in DB — confirm via Supabase dashboard
- [ ] Bank name "Other": shows free-text input below picker
- [ ] Notifications: new booking fires instantly on mobile (no 60 s wait) — confirm via Realtime logs
- [ ] Notifications: relative timestamps render correctly ("just now" / "5 min ago" / "2 hr ago")
- [ ] Notifications: calendar icon for appointment types, star for review types, bell for default
- [ ] Calendar: Earnings MTD tile shows correct value (matches Performance tab)
- [ ] Earnings screen: "This Month" filter matches the 3-number summary on Profile → Payment tab
- [ ] Earnings screen: "Unpaid" filter hides paid rows; "All" restores them
- [ ] Earnings screen: paid rows show pay method + paid date in green; unpaid rows in amber
- [ ] Client detail Entitlements tab: lists client's active packages and vouchers correctly
- [ ] Client detail Entitlements tab: exhausted/expired entitlements shown with correct badge
- [ ] Client detail Entitlements tab: sessions progress bar shows correct used/total
- [ ] Training list: in-progress courses show chapter progress bar
- [ ] Training list: "Start" on an available course enrolls and navigates to player
- [ ] Training player: text sections render readable content
- [ ] Training player: video sections play inline
- [ ] Training player: quiz sections require correct answer before marking complete
- [ ] Training player: completing all sections shows completion screen and navigates back
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Tested on iOS simulator and Android emulator
