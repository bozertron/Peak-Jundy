# Peak-Rentals Next Sprint Testing Plan - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Comprehensive end-of-sprint verification plan covering backend, frontend, and Stripe flows. This plan is executed after the next sprint's implementation work lands.

## Preconditions (Must Be True Before Testing)
- [ ] Environment variables aligned and DB path validated (see Implementation + Quick Reference TODOs)
- [ ] Seed data available (at least 3 equipment listings, 2 owners, 2 renters)
- [ ] Stripe test keys configured (secret/publishable/webhook secret)
- [ ] Stripe CLI available for local webhook testing

## Test Execution Schedule (End of Sprint)
- [ ] **Day 1: Backend + API Validation**
  - [ ] Run `npm run lint`
  - [ ] Run `npx tsc --noEmit`
  - [ ] Exercise equipment CRUD with valid/invalid payloads
  - [ ] Verify structured validation errors (400) for bad payloads
- [ ] **Day 2: Frontend + UX Validation**
  - [ ] Verify SearchBar validation + loading states
  - [ ] Verify EquipmentDetail gallery/contact/actions
  - [ ] Verify AdminDashboard filters + visualization
- [ ] **Day 3: Stripe + Payments Validation**
  - [ ] Stripe Connect onboarding flow (owner)
  - [ ] Checkout flow (renter)
  - [ ] Webhook handling and booking confirmation
  - [ ] Verify fee split math (10% platform fee)

## Backend Test Matrix
- [ ] **Equipment CRUD**
  - [ ] POST `/api/equipment` with required fields
  - [ ] POST `/api/equipment` missing title/category -> 400 with structured errors
  - [ ] POST includes `image`/`location` and returns persisted values
  - [ ] PUT `/api/equipment/[id]` updates `image`/`location`
  - [ ] DELETE `/api/equipment/[id]` by owner succeeds; non-owner -> 403
- [ ] **Search Flow (Canonical: POST /api/equipment/search)**
  - [ ] Query returns matching results
  - [ ] Empty query rejected with validation error
  - [ ] Unfulfilled search logs once in SearchLog
- [ ] **Analytics**
  - [ ] GET `/api/analytics/unfulfilled-searches` (ADMIN only)
  - [ ] GET `/api/analytics/market-gaps` (ADMIN only) with `days` param
  - [ ] GET `/api/analytics/owner-stats` (OWNER only)
- [ ] **Stripe**
  - [ ] POST `/api/stripe/connect` creates account and returns onboarding URL
  - [ ] GET `/api/stripe/account-status` returns status
  - [ ] POST `/api/stripe/checkout` rejects missing `equipmentId` or invalid `days`
  - [ ] POST `/api/stripe/webhook` verifies signature and updates booking

## Frontend Test Matrix
- [ ] **Search + Browse**
  - [ ] SearchBar blocks empty/oversized queries with inline error
  - [ ] Browse results match API results for same query
- [ ] **Equipment Detail**
  - [ ] Gallery renders with primary image and optional thumbnails
  - [ ] Owner contact section visible per policy
  - [ ] Owner edit/delete actions visible only to owner
- [ ] **Checkout Flow**
  - [ ] Renter can start checkout session
  - [ ] Error state shown when owner not onboarded
- [ ] **Admin Dashboard**
  - [ ] Filters apply to analytics results
  - [ ] Visualization renders and scales for large counts

## Responsive + Accessibility Checks
- [ ] Mobile layout tested for Home, Browse, Equipment Detail, Admin Dashboard
- [ ] Keyboard navigation for SearchBar and CheckoutButton
- [ ] Form fields have labels and error messages are readable

## Stripe Test Plan
- [ ] Use Stripe CLI to forward webhooks: `stripe listen --forward-to ...`
- [ ] Trigger `checkout.session.completed` and confirm Booking status update
- [ ] Verify application fee calculation (10% of total)
- [ ] Verify transfers set to owner Stripe account

## Exit Criteria
- [ ] All high-priority tests pass
- [ ] No unhandled console errors
- [ ] Payment flow verified with test card
- [ ] All validation errors return structured responses

## Reporting
- [ ] Record test results in a short report (pass/fail + notes)
- [ ] Link report to `IMPLEMENTATION_REPORT.md` (or new `TEST_REPORT.md`)

## Execution Notes (Sprint 4)
- Date: December 19, 2025
- Preconditions: env alignment PASS; seed data PASS (equipment=4, owners=2, renters=2); Stripe keys present; Stripe CLI installed.
- Results: lint PASS (no warnings); typecheck PASS; manual/API/Stripe tests NOT RUN (dev server cannot bind in this environment).
- Report: `TEST_REPORT.md`
