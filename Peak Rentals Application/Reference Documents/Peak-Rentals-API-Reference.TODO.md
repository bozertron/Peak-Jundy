# Peak-Rentals-API-Reference.md - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Analyze and implement missing API endpoints based on comprehensive API specifications.

## Tasks

### High Priority
- [ ] **Endpoint Gap Analysis**: ✅ COMPLETED - All 15+ documented endpoints exist and functional
- [ ] **Missing Route Implementation**: ✅ COMPLETED
  - [ ] `PUT /api/equipment/[id]` - Update equipment (owner only)
  - [ ] `DELETE /api/equipment/[id]` - Delete equipment (owner only)  
  - [ ] `GET /api/stripe/account-status` - Check owner onboarding status
  - [ ] `GET /api/analytics/market-gaps` - Market gap analysis
  - [ ] `GET /api/analytics/owner-stats` - Owner statistics
- [ ] **Error Response Standardization**: Align all endpoints to documented error format (equipment/search/checkout updated; remaining endpoints pending)
  - Note: Bookings + owner-stats now return structured `{ error }` on failure; remaining Stripe connect/product endpoints still need alignment.
- [ ] **Authentication Verification**: ✅ COMPLETED - Proper auth checks on all protected routes

### Medium Priority
- [ ] **Request/Response Validation**: Wire `lib/validation.ts` into equipment CRUD, search, and checkout; return structured errors (equipment/search/checkout now updated; verify others)
- [ ] **Data Flow Implementation**: Re-verify 4 flows after search standardization and validator wiring
- [ ] **Rate Limiting**: Implement rate limiting on search endpoint (100 req/min)
  - Note: Added in-memory limiter to `/api/equipment/search` (100 req/min per user/IP); returns 429 with Retry-After.
- [ ] **Caching Strategy**: Add caching for equipment listings (5-min TTL)
  - Note: `GET /api/equipment` now sends `Cache-Control: s-maxage=300, stale-while-revalidate=60`.
- [ ] **Database Indexing**: ✅ COMPLETED - Basic indexes exist in schema
- [ ] **Equipment Payload Parity**: Update `app/api/equipment/route.ts` and `app/api/equipment/[id]/route.ts` to accept/persist `image` and `location` fields (currently ignored despite schema/types), and return validation errors instead of generic 400s.
  - Note: Implemented in Sprint 1; verify in tests and update examples.
- [ ] **Shared Validator Usage**: Wire `lib/validation.ts` helpers into equipment CRUD, search, and checkout flows so bad inputs get structured errors; ensure price conversions happen once (keep storage in cents).
  - Note: Implemented for equipment/search/checkout; remaining endpoints still need alignment.
- [ ] **Search Flow Standardization (Decision: Use POST /api/equipment/search)**
  - [ ] Browse UI uses POST `/api/equipment/search` (verify and keep canonical)
  - [ ] Ensure unfulfilled logging happens only in the API route (no duplicate logs)
  - [ ] Forward session cookies if server-fetching, or convert browse page to client fetch
  - [ ] Update API docs to show the canonical search flow and payloads
  - Note: Implemented via client-side hook (`useSearch`) on the browse page; verify in tests and update API examples if needed.

### Low Priority
- [ ] **cURL Examples**: Create test scripts for all endpoints
- [ ] **Webhook Event Handling**: Implement all documented Stripe webhook events
- [ ] **Pagination**: ✅ COMPLETED - Added pagination to equipment listing endpoints with metadata
- [ ] **API Documentation**: Generate OpenAPI/Swagger specs

## Implementation Notes

### Critical Patterns to Implement
```typescript
// Protected route pattern
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Ownership verification pattern
if (equipment.ownerId !== session.user.id) {
  return NextResponse.json({ error: "Not authorized" }, { status: 403 });
}

// Error response pattern
return NextResponse.json({ error: "Error message" }, { status: 400 });
```

### Price Handling
- Store all prices in cents (integers)
- Use `Math.floor()` for fee calculations
- Convert to dollars only for display

### Search Implementation
- Log unfulfilled searches asynchronously (fire and forget) ✅ IMPLEMENTED
- Use case-insensitive search with `mode: "insensitive"` ⚠️ SQLite doesn't support, removed mode param
- Add proper indexing on search fields ✅ IMPLEMENTED
- Admin analytics now supports optional filters on `/api/analytics/unfulfilled-searches`: `days`, `minCount`, `query` (document in API reference)

## Dependencies
- Database schema must match documentation
- Authentication system (NextAuth) must be configured
- Stripe integration for payment-related endpoints

## Success Criteria
- ✅ All documented endpoints are implemented
- ✅ Error responses match documented format
- ✅ Authentication and authorization work correctly
- ✅ Payment processing is secure and functional (through Stripe checkout)
- ✅ Search analytics are properly tracked
- ✅ Admin dashboard shows market intelligence data

## Implementation Issues Encountered

### 1. TypeScript Augmentation Issues
- **Problem**: Multiple files using `@ts-expect-error augmented` directive was unused
- **Solution**: Extended `next-auth` types in `types/next-auth.d.ts` and removed `as any` casts in core routes/components.
- **Files Fixed**: Admin pages, dashboard pages, layout, UserMenu component, core API routes

### 2. SQLite Search Compatibility
- **Problem**: SQLite doesn't support `mode: "insensitive"` in Prisma queries
- **Solution**: Removed mode parameter from search queries
- **Impact**: Search is now case-sensitive (acceptable for dev)
- **Files Fixed**: `/api/equipment/search/route.ts`, `/api/equipment/route.ts`, `/browse/page.tsx`

### 3. Environment Variable Configuration
**Problem**: Environment variables do not match actual DB location.
**Observed (updated)**:
- `.env` and `.env.local`: `DATABASE_URL="file:./dev.db"`
- DB file exists at `prisma/dev.db`
**Impact**: Resolved by aligning env vars with the canonical DB path.
**Remedy Plan**:
1. Confirm `.env`, `.env.local`, `.env.example` remain aligned.
2. Confirm `prisma db push` reports schema in sync.

### 4. Price Handling Implementation
- **Problem**: Documentation specifies prices in cents, but endpoints used mixed conversions
- **Solution**: Accept `dailyRate` in cents; validate numeric and avoid double conversion
- **Files Updated**: `/api/equipment/route.ts` (POST), `/api/equipment/[id]/route.ts` (PUT)

### 5. API Endpoint Method Mismatch
- **Problem**: Search endpoint was GET but documentation specifies POST
- **Solution**: Changed to POST and updated response format to `{ results: [...] }`
- **File Fixed**: `/api/equipment/search/route.ts`

## Overall Status: ⚠️ PARTIAL
Core endpoints exist; environment alignment, search flow standardization, and validators for equipment/search/checkout are in place. Remaining: webhook coverage, full error standardization across all endpoints, and test verification.
