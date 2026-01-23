# Peak-Rentals-Quick-Reference.md - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Implement critical patterns, common tasks, and best practices from the quick reference guide.

## Tasks

### High Priority
- [ ] **Critical Data Flows Implementation** - Verify 3 core flows work
  - [ ] Flow 1: Equipment Listing → Database (owner form → POST /api/equipment)
  - [ ] Flow 2: Search → Unfulfilled Tracking (renter search → SearchLog if no results) — UI now uses POST `/api/equipment/search`; verify logging happens only in the API
  - [ ] Flow 3: Booking → Payment → Payout (checkout → Stripe → webhook confirmation) — validation wired; verify webhook + tests
- [ ] **Search Flow Standardization (Decision: Use POST /api/equipment/search)**
  - [ ] `app/browse/page.tsx` fetches results via POST `/api/equipment/search` using `q` + `category` from `searchParams`
  - [ ] Direct Prisma search + logging removed from `app/browse/page.tsx` to avoid duplicate logging
  - [ ] Ensure API route returns `{ results }` with owner metadata used by `EquipmentGrid`
  - [ ] Forward cookies/session when calling the API (server fetch with `cookies()` or convert browse page to client component)
  - [ ] SearchBar enforces query required (no category-only searches)
  - [ ] Acceptance: only the API route logs unfulfilled searches; UI results match API response
  - Note: Implemented in Sprint 1; verify in tests and update docs if needed.
- [ ] **Code Pattern Templates Implementation** - Add all 4 documented patterns
  - [ ] Protected API route pattern (auth check)
  - [ ] Database query pattern (Prisma with includes)
  - [ ] Stripe payment pattern (fees and transfers)
  - [ ] Client component fetch pattern (with error handling)
- [ ] **Common Request Examples** - Implement 5 frequent user scenarios
  - [ ] "Create equipment listing" → POST /api/equipment
  - [ ] "Search and track misses" → POST /api/equipment/search
  - [ ] "Process rental payment" → POST /api/stripe/checkout
  - [ ] "Show admin what renters want" → GET /api/analytics/unfulfilled-searches
  - [ ] "Verify owner can list equipment" → Check stripeAccountId exists

### Medium Priority
- [ ] **Database Models Quick Reference** - Verify all models match docs
  - [ ] User model with id, email, stripeAccountId, role fields
  - [ ] Equipment model with specs JSON, dailyRate in cents, ownerId
  - [ ] Booking model with status, totalPrice in cents, foreign keys
  - [ ] SearchLog model with query, fulfilled boolean, timestamp
  - [ ] Account model for OAuth connections
  - [ ] **CRITICAL**: Ensure all prices stored in cents (int), not dollars (float)
- [ ] **API Routes Quick Map** - Implement all 10 documented routes
  - [ ] Auth routes: signin, signout
  - [ ] Equipment CRUD: GET, POST, PUT, DELETE
  - [ ] Search route with unfulfilled logging
  - [ ] Stripe routes: connect, checkout, webhook, account-status
  - [ ] Admin analytics: unfulfilled-searches
- [ ] **Component Hierarchy Verification** - Match documented structure
  - [ ] Layout (Root) with Navbar and Footer
  - [ ] Pages organized under proper routes
  - [ ] Component folders: Equipment/, Search/, Stripe/, Admin/
  - [ ] Auth pages and error handling

### Low Priority
- [ ] **Development Tools Setup** - Implement debugging commands
  - [ ] `npx prisma studio` for database inspection
  - [ ] `npx prisma migrate reset` for database reset (script missing)
  - [ ] `npx prisma generate` for client generation
  - [ ] `npx prisma format` for schema formatting (script missing)
- [ ] **Environment Variables Validation** - Verify actual env values match docs and DB path is correct
  - [ ] Current state: `.env` and `.env.local` set `DATABASE_URL="file:./dev.db"`
  - [ ] Current state: DB file exists at `prisma/dev.db`
  - [ ] Canonical path decision: `DATABASE_URL="file:./dev.db"` (DB located at `prisma/dev.db`)
  - [ ] Confirm `.env`, `.env.local`, and `.env.example` match the canonical value
  - [ ] Confirm `prisma db push` reports schema in sync
  - [ ] Document final DATABASE_URL in this file and in `Peak-Rentals-Implementation.TODO.md`
  - Note: Verified in Sprint 1; re-check only if env changes.
- [ ] **Common Gotchas Implementation** - Verify all documented patterns are followed
  - [ ] Currency calculations use cents
  - [ ] Search logging is non-blocking (fire and forget)
  - [ ] Check ownership before edit/delete
  - [ ] Admin checks on protected routes
  - [ ] Verify stripeAccountId before checkout

## Detailed Implementation Tasks

### Pattern 1: Protected API Route
```typescript
// Must be implemented in all protected routes
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  
  // Your code here
}
```

### Pattern 2: Database Query
```typescript
// Must be implemented for all database operations
import { prisma } from "@/lib/prisma";

const results = await prisma.equipment.findMany({
  where: { category: "Telehandler" },
  include: { owner: { select: { name: true } } },
});
```

### Pattern 3: Stripe Payment
```typescript
// Must be implemented for all payment processing
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price_data: { currency: 'usd', unit_amount }, quantity: 1 }],
  payment_intent_data: {
    application_fee_amount: platformFee,
    transfer_data: { destination: ownerStripeAccountId },
  },
});
```

### Pattern 4: Client Component Fetch
```typescript
// Must be implemented in all client components
"use client";
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data }),
});
```

### Critical Implementation Checklist

#### Before Any Feature Development
- [ ] Is authentication required? → Use `getServerSession()`
- [ ] Does it involve money? → Use cents (int)
- [ ] Is it a search? → Log unfulfilled in separate non-blocking call
- [ ] Is it admin-only? → Check `session.user.role === "ADMIN"`
- [ ] Does it modify data? → Verify ownership first

#### For Every API Route
- [ ] Add error handling (try-catch)
- [ ] Return appropriate status codes
- [ ] Log errors to console
- [ ] Return JSON responses
- [ ] Check authentication if needed

#### For Every Component
- [ ] Use "use client" if needs state/effects
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Mobile responsive (Tailwind)
- [ ] Accessible (labels, focus states)

### Common Gotchas Implementation

#### ❌ Don't forget:
- [ ] Currency calculations use cents
- [ ] Search logging is non-blocking (fire and forget)
- [ ] Check ownership before edit/delete
- [ ] Admin checks on protected routes
- [ ] Verify stripeAccountId before checkout

#### ❌ Don't use:
- [ ] localStorage/sessionStorage (throws SecurityError)
- [ ] Floating-point for money
- [ ] Synchronous heavy operations in API routes
- [ ] Direct database access in components (use API)
- [ ] Plain text passwords (use NextAuth)

#### ✅ Always:
- [ ] Return JSON from API routes
- [ ] Wrap long operations in try-catch
- [ ] Use relative imports (@/lib/...)
- [ ] Include error handling in fetch calls
- [ ] Log important events

### File Locations Implementation

| Feature | Required Files |
|---------|----------------|
| **Authentication** | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` |
| **Database** | `lib/prisma.ts`, `prisma/schema.prisma` |
| **Stripe** | `lib/stripe.ts`, `app/api/stripe/*` |
| **Equipment CRUD** | `app/api/equipment/*`, `components/Equipment/*` |
| **Search** | `app/api/equipment/search/route.ts`, `components/Search/*` |
| **Admin** | `components/Admin/*`, `app/api/analytics/*` |

### Quick Start for LLM Agent Implementation

When given a task, must follow this process:
1. **Check context**: Is this auth? Payment? Search?
2. **Find pattern**: Look for similar code in existing files
3. **Copy template**: Use pattern from this guide
4. **Adapt**: Change model names, field names, routes
5. **Test**: Use cURL or API client to verify
6. **Deploy**: Run migrations if schema changed

### Success Criteria Implementation

✅ **Business Success Requirements:**
- [ ] Equipment owners can create listings with technical specs
- [ ] Renters can search and see availability
- [ ] Unfulfilled searches tracked for market intel
- [ ] Stripe handles payments securely
- [ ] Admin dashboard shows market gaps
- [ ] Mobile responsive design
- [ ] Fast search performance (indexed)
- [ ] No exposed secrets in code

### Document Reference Map Implementation

| Document | Use For | Implementation Status |
|----------|---------|----------------------|
| **Master-Guide** | Architecture, planning, database schema | To verify |
| **Implementation** | Code patterns, step-by-step features | To implement |
| **API-Reference** | Exact endpoint specs, request/response formats | To cross-ref |
| **Frontend-Architecture** | Component structure, UI patterns | To build |
| **Quick-Reference** | (This file) Quick lookup, patterns, gotchas | This file |

### Final Notes Implementation

Must build with these principles:
- **Trust**: Secure payments, verified identities
- **Discovery**: Good search helps renters find what they need
- **Intelligence**: Unfulfilled searches tell us what equipment market needs

When implementing, always ask:
1. Does this secure money properly?
2. Does this help or harm discovery?
3. Does this respect user privacy?
4. Is this user-friendly?

## Dependencies
- Complete codebase audit for current patterns
- Database access for model verification
- API testing tools (cURL/Postman)
- Stripe test account for payment testing
- Development environment setup

## Success Criteria
- All 4 code patterns are implemented correctly
- All 10 API routes exist and work
- All 5 database models match documentation
- All critical data flows function end-to-end
- All common gotchas are properly handled
- All environment variables are configured
- All debugging commands work correctly
- All security best practices are followed
