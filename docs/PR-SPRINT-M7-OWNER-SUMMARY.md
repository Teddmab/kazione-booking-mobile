# PR description — Sprint M7 Owner (copy-paste)

> **Canonical spec:** [`kazione-docs/team/MOBILE/Sprint M7 — Web Parity & Owner Analytics.md`](../../../kazione-docs/team/MOBILE/Sprint%20M7%20%E2%80%94%20Web%20Parity%20%26%20Owner%20Analytics.md)

## Summary

Sprint **M7 — Web Parity & Owner Analytics**: align owner mobile modules with the web dashboard — routing fix, dashboard charts, settings/business/multi-salon, clients KPIs, finance extended (4 tabs), suppliers, marketplace listing, reports analytics, AI Insights page, storefront publish/preview.

---

## Modules delivered

| Task | Screen / files |
|------|----------------|
| M7-00 | Drawer routes → `suppliers`, `marketplace`, `ai-insights` |
| M7-01 | Dashboard: revenue trend, top services, busy times, staff today, week breakdown |
| M7-02 | Settings tabs: profile, business edit, notifications, Stripe, create business |
| M7-03 | Clients: KPI cards + status filters + i18n |
| M7-04 | Finance: overview / income / expenses / profitability |
| M7-05 | Suppliers: 3 tabs + API |
| M7-06 | Storefront: publish/unpublish + preview (marketplace toggles moved) |
| M7-07 | Marketplace listing screen |
| M7-08 | Reports: 5 analytics tabs + transactions |
| M7-09 | AI Insights dedicated page + finance chat |
| M7-10 | i18n EN/FR/ET + `clientStatus.test.ts` |

---

## Test plan

- [ ] Drawer: Suppliers / Marketplace / AI Insights open dedicated screens
- [ ] Dashboard charts load from `/finance` + KPIs
- [ ] Settings: edit salon, switch business, create 2nd business
- [ ] Clients: KPIs + filter chips
- [ ] Finance: 4 tabs, add expense
- [ ] Suppliers: overview KPIs, add supplier, record purchase
- [ ] Marketplace: visibility toggles + preview link
- [ ] Reports: analytics tabs + CSV export still works
- [ ] AI Insights: period selector + chat question
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — all pass
