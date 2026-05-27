# PR — Sprint M3 Booking Flow

## Summary

- 4-step booking wizard: staff → datetime → details → summary → confirmation
- Zustand `bookingStore` (session-only)
- APIs: `GET /get-availability`, `POST /create-booking`
- Pay at salon completes booking; full/deposit routes to `/payment/processing` (M4)

## Test plan

- [ ] Book from salon storefront with service pre-selected
- [ ] No preference + specific stylist
- [ ] Reservable (amber) slot selects deposit payment
- [ ] GDPR required; guest and authenticated paths
- [ ] Pay at salon → confirmation with reference
- [ ] Back navigation preserves selections; Cancel resets

## Automated

```bash
npm run typecheck
npm test
```
