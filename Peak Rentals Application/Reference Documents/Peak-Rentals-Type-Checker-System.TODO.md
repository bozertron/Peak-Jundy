# Peak-Rentals Type-Checker System - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Create a generalist, app-intent-aligned type-checker system that enforces correctness across API inputs, database models, and UI props. This system should catch invalid states early and support the end-of-sprint testing plan.

## Current Baseline (Verified)
- `npm run typecheck` runs `tsc --noEmit` and passes.
- `types/next-auth.d.ts` extends session/user types; core routes/components no longer use `as any`.
- API request types added in `lib/types.ts` and used in key routes (search, checkout, connect account, products).
- Stricter TS flags enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- API response types added for analytics/market gaps/owner stats + bookings.

## Goals
- Compile-time safety for all core domain objects (User, Equipment, Booking, SearchLog)
- Runtime validation for API inputs and external data
- Zero `any` in production code paths
- Clear, consistent error reporting for invalid payloads

## High Priority Tasks
- [ ] **Type Audit Baseline**
  - [ ] Inventory all `any`, `as any`, and `@ts-expect-error` usage across `app/`, `components/`, `lib/`
  - [ ] Create a tracking list with file paths and intended replacement types
  - [ ] Identify missing types in `lib/types.ts` (e.g., Search request/response types)
  - Note: `as any` and explicit `any` annotations removed from core routes/components; still audit remaining `any` usage for non-core files.
- [ ] **Compile-Time Enforcement**
  - [ ] Add a `typecheck` script: `tsc --noEmit`
  - [ ] Consider enabling stricter TS flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
  - [ ] Update `tsconfig.json` to enforce strictness consistently in CI
  - Note: `typecheck` script added in Sprint 3; CI wiring still pending.
- [ ] **Runtime Validation Layer**
  - [ ] Decide validation strategy: extend `lib/validation.ts` or migrate to schema-based validators
  - [ ] Create typed validators for:
    - Equipment create/update
    - Booking create
    - Search requests
  - [ ] Ensure validators return typed error objects used by API routes
- [ ] **API Contract Types**
  - [ ] Define request/response types for each API route in `lib/types.ts`
  - [ ] Use these types in API handlers and client components
  - [ ] Add helper wrappers to parse + validate JSON requests
  - Note: Request types added for search/checkout/connect account/products and used in routes; expand coverage to remaining endpoints and responses.

## Medium Priority Tasks
- [ ] **UI Prop Type Alignment**
  - [ ] Replace inline prop types with shared interfaces
  - [ ] Eliminate `equipment as any` casting in `app/equipment/[id]/page.tsx` (resolved in Sprint 3)
- [ ] **Prisma Type Integration**
  - [ ] Use Prisma types where applicable to avoid drift
  - [ ] Add a mapping layer where API contracts differ from DB models
- [ ] **Error Type Standardization**
  - [ ] Standardize error responses to `{ error, errors }` structure
  - [ ] Ensure API consumers handle typed error payloads

## Low Priority Tasks
- [ ] **Type Coverage Reporting**
  - [ ] Add a lightweight report of remaining `any` usage
  - [ ] Track type coverage improvements per sprint

## Acceptance Criteria
- No `any` or `as any` in API routes or core components
- All API routes validate input and return structured, typed errors
- `npm run typecheck` passes with strict flags enabled
- Tests in the next sprint can rely on consistent, typed payloads
