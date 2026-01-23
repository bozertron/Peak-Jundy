# Peak-R Code Audit - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Notes from the latest code scan. Each task includes the specific files to touch and the success criteria to close it out.

## Recent Updates (Sprint 3)
- Stripe service consolidated into `lib/stripe.ts`; `lib/stripe-connect.ts` removed.
- Stripe client initialization is now lazy to avoid import-time failures without env vars.
- Checkout payload validation uses shared validator helpers.

## High Priority
- [ ] **Equipment API matches schema**  
  - Update `app/api/equipment/route.ts` and `app/api/equipment/[id]/route.ts` to accept/persist `image` and `location` (fields exist in `prisma/schema.prisma` and `lib/types.ts` but are currently dropped).  
  - Use the shared validators in `lib/validation.ts` before writes; keep price handling in cents with a single conversion point.  
  - Success: POST/PUT payloads with image/location round-trip, invalid payloads return structured validation errors.
  - Note: Implemented in Sprint 1; verify with tests before marking complete.
- [ ] **Shared validators are wired in**  
  - Integrate `validateEquipment`, `validateBooking`, and `validateSearch` into their respective routes (equipment CRUD, checkout, search).  
  - Success: invalid inputs return `{ error: \"Validation failed\", errors: {...} }` with 4xx status; search rejects empty/oversized queries.
  - Note: Equipment/search/checkout now use shared validators; verify behavior in tests.

## Medium Priority
- [ ] **Stripe library consolidation**  
  - `lib/stripe.ts` and `lib/stripe-connect.ts` overlap (both create accounts/links/products). Choose one entry point and remove duplication so API routes use a single service surface.  
  - Success: One Stripe service module, no duplicate logic, consistent types for account/product/checkout helpers.
  - Note: Implemented in Sprint 3; verify by exercising Stripe routes.
- [ ] **Environment-safe Stripe initialization**  
  - `lib/stripe-connect.ts` throws at module import when `STRIPE_SECRET_KEY` is missing, breaking static analysis/builds. Guard initialization so missing env vars fail requests, not startup.  
  - Success: importing the module without Stripe env vars no longer crashes the app; requests return clear 500/400 errors instead.
  - Note: Implemented in Sprint 3; verify by running routes without Stripe env vars set.
- [ ] **Checkout input validation**  
  - `app/api/stripe/checkout/route.ts` should validate `equipmentId` presence and `days` > 0 before creating sessions/bookings, reusing `validateBooking` where possible.  
  - Success: bad payloads get 400 with field-specific errors; bookings created only for validated inputs.
  - Note: Implemented with `validateCheckout`; verify in tests.

## Notes
- Date of review: Dec 18, 2025.  
- Add new items here for future inconsistencies rather than embedding them in archived action logs.
