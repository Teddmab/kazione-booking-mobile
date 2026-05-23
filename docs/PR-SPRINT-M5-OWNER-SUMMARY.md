# PR description — Sprint M5 Owner (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M5 — Finance & Reports.md`](../../../kazione-docs/team/MOBILE/Sprint%20M5%20%E2%80%94%20Finance%20%26%20Reports.md)  
> **Depends on:** Sprint M4 — Services & Staff (`feat/sprint-m4-services-staff`)

## Summary

Sprint **M5 — Finance & Reports** : vue revenus owner, historique transactions, export CSV et insights IA sur mobile.

### M5-01 — Revenue Overview

- Écran `app/(app)/owner/finance.tsx`
- Chips période : **Aujourd’hui | Semaine | Mois | Personnalisé** (custom = 30 derniers jours)
- 4 cartes KPI : revenu total, RDV terminés, panier moyen, top service
- Graphique barres journalier (composant custom, pas de lib chart)
- Top 3 staff + top 3 services
- APIs : `GET /finance?action=revenue`, `action=income&group_by=day`, `action=staff-performance`

### M5-02 — Transaction History

- Écran `app/(app)/owner/reports.tsx`
- Filtres statut (all / completed / cancelled / refunded) + période
- Lignes RDV : date, client, service, staff, montant, paiement, badge statut
- Pagination **Load more** (`useInfiniteQuery`, 20 par page)
- API : `GET /appointments` (pas de `action=transactions` côté backend — aligné sur données réelles)

### M5-03 — CSV Export

- Bouton **Export** dans le header Rapports
- `ExportReportSheet` → `GET /export-report?type=appointments&format=csv`
- Sauvegarde + partage via `expo-file-system` + `expo-sharing`

### M5-04 — AI Finance Insights

- Carte **AI Insights** sur l’écran Finance
- `POST /ai-insights` (`period_days: 30`) + bouton refresh
- Hook `useAIFinanceChat` prêt pour chat (`POST /ai-finance`) — UI chat non incluse (P3 spec)

### Navigation

- Drawer + onglet **Plus** : liens **Finance** et **Rapports** (remplace placeholder « Available on web »)

---

## Unit tests performed (automated)

| Command | Result |
| ------- | ------ |
| `npm test` | **51/51 passed** (18 suites) |
| `npm run typecheck` | **0 errors** |

### Sprint M5 — new tests (2)

| File | Tests |
| ---- | ----- |
| `__tests__/owner/financePeriod.test.ts` | Today range; chart label format |

---

## Manual tests — to validate (reviewer / QA)

- [ ] Owner → **Finance** (drawer ou Plus) → cartes KPI + graphique pour le mois en cours
- [ ] Changer période (Today / Week / Month) → données mises à jour
- [ ] Top staff / services visibles si seed a des paiements
- [ ] Carte **AI Insights** affiche un insight (nécessite clé Anthropic en backend)
- [ ] **Rapports** → liste transactions, filtres statut + période
- [ ] **Load more** charge la page suivante
- [ ] **Export** → choix dates → share sheet CSV
- [ ] `npm run typecheck` && `npm test` green

---

## Écarts vs spec doc

| Spec | Implémentation |
|------|----------------|
| `GET /finance?action=transactions` | `GET /appointments` paginé |
| `react-native-chart-kit` / `victory-native` | Bar chart custom (`View`) |
| `GET /ai-insights` | **`POST /ai-insights`** (backend réel) |
| AI chat input (P3) | Non livré — hook `useAIFinanceChat` seulement |
| Filtre refunded | Filtre client sur `payment.status` |

---

## Files changed (high level)

- `app/(app)/owner/finance.tsx`, `reports.tsx`, `_layout.tsx`, `(tabs)/more.tsx`
- `components/owner/PeriodChipSelector.tsx`, `RevenueBarChart.tsx`, `TransactionRow.tsx`, `FinanceInsightCard.tsx`, `ExportReportSheet.tsx`
- `services/owner/finance.ts`, `ai.ts`
- `hooks/useOwnerFinance.ts`, `useOwnerAI.ts`
- `lib/financePeriod.ts`, `exportReport.ts`
- `types/finance.ts`
- `constants/ownerDrawerNav.ts`
- `i18n/en.json`, `fr.json`, `et.json`
- `package.json` — `expo-file-system`, `expo-sharing`
