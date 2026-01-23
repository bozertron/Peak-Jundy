# Master Execution Plan (Canonical)

## Execution Rules
- Status is tracked only in this file.
- Supporting TODO files are reference-only; do not check boxes there.
- Refresh context after each TODO list is completed: re-read linked TODOs, re-validate code assumptions, and update the Context Snapshot below.

## Context Snapshot (Verified)
- Environment/DB aligned: `.env`, `.env.local`, `.env.example` set `DATABASE_URL="file:./dev.db"` with DB at `prisma/dev.db`.
- Search flow standardized: `browse/page.tsx` uses POST `/api/equipment/search` via client hook; unfulfilled logging happens only in the API route.
- Frontend spec completion: EquipmentDetail now includes gallery/contact/actions; AdminDashboard now includes filters/visualization (verify in tests).
- Validation wiring completed for equipment/search/checkout with structured errors; remaining endpoints still need alignment.
- API hardening: search rate limiting (100 req/min per user/IP) and equipment listing cache headers added.
- Stripe service consolidated: `lib/stripe.ts` is the single entry point, `lib/stripe-connect.ts` removed, Stripe client initializes lazily to avoid import-time failures.
- Tests not executed: success criteria for checkout/fee split/responsiveness not verified.
- Type-checker baseline in place: `typecheck` script added, API request/response types defined, strict flags enabled, `as any` and explicit `any` removed in core routes/components, `npm run typecheck` passes.
- Sprint 4 testing started: `npm run typecheck` passes; strict ESLint config added and `npm run lint` passes clean; seed data meets requirements; Stripe + NextAuth keys set; Stripe CLI installed (v1.34.0). Dev server cannot bind ports in this environment (EPERM). See `TEST_REPORT.md`.
- Frontend hook coverage expanded: added `useAuth` and `useSearch`, and CheckoutButton now shows inline errors instead of alerts.
- Missing utilities + UI gaps closed: added `parseSpecs`/`calculateRentalDays`, implemented EquipmentSearch component, and added auth middleware for protected routes.
- Master Guide executed and archived as `archived_actions_2.md`; owner/admin pages expanded (users/settings/unfulfilled), admin layout guard added, owner edit route standardized to `/owner/listings/[id]/edit`, search suggestions added, and equipment form is now multi-step.

## Sprint 1 (Complete): Foundation + Search Standardization
- [x] **S1.1 Environment + DB Alignment**
  - Definition of Done:
    - Canonical DATABASE_URL chosen and applied to `.env`, `.env.local`, `.env.example`.
    - SQLite DB exists at canonical path and Prisma schema is applied.
    - App boots without DATABASE_URL errors and Prisma queries succeed.
  - References: `Peak-Rentals-Implementation.TODO.md` (Environment + DB Alignment Plan), `Peak-Rentals-Quick-Reference.TODO.md`.
- [x] **S1.2 Validation Wiring + Equipment Payload Parity**
  - Definition of Done:
    - `lib/validation.ts` used in equipment CRUD, search, and checkout.
    - `image` and `location` accepted/persisted in equipment POST/PUT.
    - Structured validation errors returned for bad payloads.
  - References: `Peak-Rentals-API-Reference.TODO.md`, `Peak-R-Code-Audit.TODO.md`.
- [x] **S1.3 Search Flow Standardization (Canonical POST /api/equipment/search)**
  - Definition of Done:
    - `app/browse/page.tsx` uses POST `/api/equipment/search`.
    - Unfulfilled searches logged only in the API route.
    - Results parity with existing UI for same query/category.
  - References: `Peak-Rentals-Quick-Reference.TODO.md`, `Peak-Rentals-API-Reference.TODO.md`.
- [x] **S1.4 SearchBar Validation + Loading State**
  - Definition of Done:
    - Empty/oversized queries blocked with inline error.
    - Loading state displayed during navigation.
    - Query required for all searches (no category-only searches).
  - References: `Peak-Rentals-Frontend-Architecture.TODO.md`.
- [x] **S1.5 Context Refresh + Doc Sync**
  - Definition of Done:
    - Update Context Snapshot in this file with new verified state.
    - Ensure supporting TODO docs reflect new canonical behavior.

## Sprint 2 (Complete): Frontend Spec Completion
- [x] **S2.1 EquipmentDetail Spec Completion**
  - Definition of Done:
    - Image gallery + fallback implemented.
    - Owner contact block matches policy.
    - Owner edit/delete actions gated by ownership.
  - References: `Peak-Rentals-Frontend-Architecture.TODO.md`.
- [x] **S2.2 AdminDashboard Filters + Visualization**
  - Definition of Done:
    - Filters (date range, min count, text search) wired to API.
    - Lightweight visualization added without extra deps.
  - References: `Peak-Rentals-Frontend-Architecture.TODO.md`.
- [x] **S2.3 Context Refresh + Doc Sync**
  - Definition of Done:
    - Update Context Snapshot + relevant docs.

## Sprint 3: Stripe Consolidation + Type-Checker System
- [x] **S3.1 Stripe Service Consolidation**
  - Definition of Done:
    - Single Stripe service module used across API routes.
    - No import-time crashes when env vars are missing.
  - References: `Peak-Rentals-Implementation.TODO.md`, `Peak-R-Code-Audit.TODO.md`.
- [x] **S3.2 Type-Checker System Baseline**
  - Definition of Done:
    - `typecheck` script exists and passes.
    - API request/response types defined and used.
    - `as any` removed from core routes/pages.
  - References: `Peak-Rentals-Type-Checker-System.TODO.md`.
- [x] **S3.3 Context Refresh + Doc Sync**
  - Definition of Done:
    - Update Context Snapshot + relevant docs.

## Sprint 4: End-of-Sprint Testing Plan
- [ ] **S4.1 Execute Full Testing Plan**
  - Definition of Done:
    - Next sprint testing plan executed with a recorded report.
    - Payment flow verified with Stripe test events.
  - References: `Peak-Rentals-Next-Sprint-Testing-Plan.TODO.md`.
  - Status: In progress; blocked by ESLint config setup, missing seed data, and missing Stripe env/CLI. See `TEST_REPORT.md`.

## Backlog (Post-Sprint / Opportunistic)
- [x] Rate limiting on search endpoint
- [x] Caching for equipment listings
- [ ] OpenAPI/Swagger generation
- [ ] Documentation navigation improvements (index, decision tree)
- [ ] Performance benchmarks and security review

## Reference Map
- Frontend gaps: `Peak-Rentals-Frontend-Architecture.TODO.md`
- API parity/validation: `Peak-Rentals-API-Reference.TODO.md`
- Environment alignment: `Peak-Rentals-Implementation.TODO.md`, `Peak-Rentals-Quick-Reference.TODO.md`
- Stripe consolidation: `Peak-R-Code-Audit.TODO.md`, `Peak-Rentals-Implementation.TODO.md`
- Testing: `Peak-Rentals-Next-Sprint-Testing-Plan.TODO.md`
- Types: `Peak-Rentals-Type-Checker-System.TODO.md`

---

**Last Updated**: December 19, 2025
**Status**: Sprint 3 complete; Sprint 4 in progress
