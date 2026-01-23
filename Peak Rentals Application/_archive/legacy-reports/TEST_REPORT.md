# Peak Rentals - Sprint 4 Test Report

Date: December 19, 2025

## Environment

- Repo: /workspaces/Peak-R/Peak Rentals Project
- DB file: prisma/dev.db
- Env alignment: DATABASE_URL set to file:./dev.db in .env/.env.local/.env.example
- NEXTAUTH_URL set to <http://localhost:3000>
- Missing env vars: none (Stripe + NextAuth keys present)
- Stripe CLI: installed at `Peak Rentals Project/tools/stripe` (v1.34.0)

## Preconditions

- Environment variables aligned and DB path validated: PASS
- Seed data available (>=3 equipment, 2 owners, 2 renters): PASS
  - equipmentCount=4, ownerCount=2, renterCount=2, adminCount=1
- Stripe test keys configured: PASS
- Stripe CLI available for local webhook testing: PASS

## Test Execution

### Day 1: Backend + API Validation

- npm run lint: PASS (no warnings)
- npm run typecheck: PASS (tsc --noEmit)
- Equipment CRUD tests: NOT RUN (no running server + auth)
- Validation error checks: NOT RUN (no running server)

### Day 2: Frontend + UX Validation

- SearchBar validation/loading: NOT RUN (no running server)
- EquipmentDetail gallery/contact/actions: NOT RUN (no running server)
- AdminDashboard filters/visualization: NOT RUN (no running server)

### Day 3: Stripe + Payments Validation

- Stripe Connect onboarding: NOT RUN (no running server)
- Checkout flow: NOT RUN (no running server)
- Webhook handling: NOT RUN (Stripe CLI installed; needs `stripe login` + `stripe listen`)
- Fee split math: NOT RUN

## Exit Criteria

- Not met (manual/Stripe tests not executed; needs dev server + Stripe CLI login/listen)

## Commands Executed

- npm run typecheck
- npm run lint
- npm run db:seed
- npm run dev (failed: EPERM on port bind)

## Blockers

- Dev server cannot start in this environment (EPERM when binding to port 3000/3001)
- Stripe CLI needs login/listen for webhook verification

## Recommendations / Next Steps

1. Start the dev server and run the manual API + UX checks.
2. Run `stripe login` and `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` for webhook tests.
3. Re-run Sprint 4 test plan and update this report with pass/fail outcomes.

## Latest Retest

- npm run typecheck: PASS
- npm run lint: PASS (no warnings)
