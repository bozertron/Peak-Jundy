# Peak-Rentals-Implementation.md - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Implement all step-by-step code templates and patterns from the detailed implementation guide.

## Recent Updates (Sprint 3)
- Stripe service consolidated into `lib/stripe.ts`; `lib/stripe-connect.ts` removed.
- Stripe client is lazy-initialized to avoid import-time failures when env vars are missing.
- Stripe API routes now use the consolidated `stripeService` surface.

## Recent Updates (Post-Sprint 4)
- Utility functions `parseSpecs` and `calculateRentalDays` added to `lib/utils.ts`.
- EquipmentSearch component implemented in `components/Search/EquipmentSearch.tsx`.

## Tasks

### High Priority
- [ ] **Phase 1: Foundation Setup** - Verify all 7 initialization steps
  - [ ] Step 1.1: Next.js project with proper next.config.js
  - [ ] Step 1.2: All dependencies installed
  - [ ] Step 1.3: Prisma setup with schema
  - [ ] Step 1.4: Environment variables configured (mismatch found, see plan below)
  - [ ] Step 1.5: Initial migration complete (verify against canonical DB path)
  - [ ] Step 1.6: Environment + DB alignment (canonicalize DATABASE_URL and DB file location)
- [ ] **Phase 2: Authentication** - Implement NextAuth system
  - [ ] Step 2.1: Auth configuration in lib/auth.ts
  - [ ] Step 2.2: Auth route handlers
  - [ ] Step 2.3: Prisma client utility
- [ ] **Phase 3: Stripe Integration** - Complete payment system
  - [ ] Step 3.1: Stripe service module (3 main functions)
  - [ ] Step 3.2: Stripe webhook handler
  - [ ] Step 3.3: Consolidate `lib/stripe.ts` and `lib/stripe-connect.ts` into one service surface; remove duplicate account/product helpers. (Implemented in Sprint 3; verify with Stripe routes/tests.)
  - [ ] Step 3.4: Guard Stripe initialization so missing env vars fail requests gracefully (no import-time throw). (Implemented in Sprint 3; verify error paths.)
- [ ] **Phase 4: API Routes** - Implement all CRUD operations
  - [ ] Step 4.1: Equipment CRUD routes
  - [ ] Step 4.2: Search with unfulfilled logging
  - [ ] Step 4.3: Stripe Connect routes
  - [ ] Step 4.4: Admin analytics routes

### Medium Priority
- [ ] **Phase 5: Frontend Components** - Build UI components
  - [ ] Step 5.1: Equipment card component
  - [ ] Step 5.2: Equipment search component
- [ ] **Phase 6: Utility Functions** - Implement helpers
  - [ ] Currency formatting
  - [ ] JSON spec parsing
  - [ ] Date calculations
- [ ] **Phase 7: Testing** - Complete testing checklist
  - [ ] Equipment listing flow tests
  - [ ] Search and analytics tests
  - [ ] Stripe integration tests
  - [ ] Authentication tests

### Low Priority
- [ ] **Error Handling Enhancement** - Improve error patterns
- [ ] **Performance Optimization** - Add caching and indexing
- [ ] **Documentation Updates** - Keep docs in sync with implementation

## Detailed Implementation Tasks

### Part 1: Project Initialization
```typescript
// Verify next.config.js matches documentation
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
};
```

```bash
# Verify all dependencies installed
npm install @prisma/client next-auth stripe
npm install -D prisma @types/node @types/react typescript
```

### Environment + DB Alignment Plan (Detailed)
- [ ] **Current state (verified)**
  - `.env` and `.env.local` set `DATABASE_URL="file:./dev.db"`
  - `prisma/dev.db` exists
  - `.env.example` documents `DATABASE_URL="file:./dev.db"`
- [ ] **Decide canonical DATABASE_URL**
  - Canonical: `DATABASE_URL="file:./dev.db"` so DB lives at `prisma/dev.db`
- [ ] **Align env files**
  - Update `.env`, `.env.local`, `.env.example` to the same DATABASE_URL
  - Document the final choice in `Peak-Rentals-Quick-Reference.TODO.md`
- [ ] **Normalize the SQLite DB location**
  - Move or regenerate the DB at the canonical path
  - Run `prisma db push` and confirm schema created
  - Verify with `prisma studio` that tables exist
- [ ] **Acceptance criteria**
  - App boots without `DATABASE_URL` errors
  - Prisma queries succeed using the canonical DB location

### Part 2: NextAuth Configuration
```typescript
// lib/auth.ts must include:
- EmailProvider configuration
- PrismaAdapter integration
- Session callbacks for user data
- Redirect logic
- Event handlers
- Custom pages
```

```typescript
// app/api/auth/[...nextauth]/route.ts must include:
- NextAuth handler export
- Proper HTTP method exports
```

### Part 3: Stripe Integration
```typescript
// lib/stripe.ts must implement:
export async function createConnectedAccount(userId: string)
export async function createAccountLink(accountId: string)  
export async function createCheckoutSession(
  equipmentId: string,
  renterId: string,
  daysRequested: number
)
```

```typescript
// app/api/stripe/webhook/route.ts must handle:
- checkout.session.completed events
- checkout.session.expired events
- Stripe signature verification
- Booking status updates
```

### Part 4: API Routes

#### Equipment CRUD Routes
```typescript
// app/api/equipment/route.ts must implement:
GET: Fetch equipment with filtering
POST: Create new equipment (auth required)
- Validation: title, category, dailyRate required
- Convert dailyRate to cents
- Store specs as JSON string
```

```typescript
// app/api/equipment/[id]/route.ts must implement:
GET: Fetch single equipment with owner details
PUT: Update equipment (owner verification required)
DELETE: Delete equipment (owner verification required)
```

#### Search Route
```typescript
// app/api/equipment/search/route.ts must:
- Accept query and category parameters
- Search title, description, category (case-insensitive)
- Log unfulfilled searches (fire and forget)
- Return results with count and fulfilled status
```

#### Stripe Routes
```typescript
// app/api/stripe/connect/route.ts must:
- Create Stripe Express account for owners
- Generate onboarding link
- Store stripeAccountId in User model
```

```typescript
// app/api/stripe/checkout/route.ts must:
- Create checkout session with application fees
- Calculate platform fee (10%)
- Create Booking record with PENDING status
```

#### Analytics Routes
```typescript
// app/api/analytics/unfulfilled-searches/route.ts must:
- Require admin role verification
- Group SearchLog by query
- Return top 20 unfulfilled searches
- Order by search frequency
```

### Part 5: Frontend Components

#### EquipmentCard Component
```typescript
// components/EquipmentCard.tsx must include:
- Image gallery with fallback
- Equipment details display
- Owner information
- Pricing in dollars (converted from cents)
- Link to equipment detail page
- Responsive design
```

#### EquipmentSearch Component
```typescript
// components/EquipmentSearch.tsx must include:
- Search input with validation
- Category filter dropdown
- Search results display
- Loading states
- Error handling
- Integration with EquipmentCard
```

### Part 6: Utility Functions

```typescript
// lib/utils.ts must implement:
export function formatCurrency(cents: number): string
export function parseSpecs(specsString: string): Record<string, any>
export function calculateRentalDays(start: Date, end: Date): number
```

## Critical Implementation Patterns

### Protected API Route Pattern
```typescript
// Must be used in all protected routes
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Ownership Verification Pattern
```typescript
// Must be used for update/delete operations
const equipment = await prisma.equipment.findUnique({
  where: { id: params.id },
});

if (!equipment || equipment.ownerId !== session.user.id) {
  return NextResponse.json(
    { error: "Not authorized to update this equipment" },
    { status: 403 }
  );
}
```

### Error Handling Pattern
```typescript
// Must wrap all database/stripe operations
try {
  // Operation
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: "Failed to complete operation" },
    { status: 500 }
  );
}
```

### Price Calculation Pattern
```typescript
// Always store prices in cents
const dailyRateCents = Math.floor(dailyRate * 100);
const platformFee = Math.floor(totalPrice * 0.1);
```

## Testing Checklist Implementation

### Equipment Listing Flow
- [ ] Owner can create equipment listing
- [ ] Specs stored as valid JSON
- [ ] Daily rate calculated correctly in cents
- [ ] Listing appears on marketplace
- [ ] Owner can edit own listing
- [ ] Owner cannot edit other listings
- [ ] Owner can delete own listing

### Search & Analytics
- [ ] Search returns correct results
- [ ] Unfulfilled searches logged
- [ ] Admin can view unfulfilled searches
- [ ] Search analytics grouped by query

### Stripe Integration
- [ ] Owner can create Stripe Express account
- [ ] Onboarding link functional
- [ ] Renter can complete checkout
- [ ] Platform fee deducted correctly
- [ ] Owner receives correct payout
- [ ] Webhook confirms booking

### Authentication
- [ ] User can sign up with email
- [ ] User can sign in
- [ ] Session persists
- [ ] Logout clears session
- [ ] Protected routes redirect to signin

## Dependencies
- Database access and permissions
- Stripe test account configuration
- Email provider for NextAuth
- Proper environment variables

## Success Criteria
- All 7 initialization steps completed
- All API routes implemented and functional
- All frontend components built and working
- Stripe integration handles payments correctly
- Authentication system secure
- Search and analytics working
- All tests from checklist pass
- Error handling comprehensive
- Documentation matches implementation

## Quality Metrics
- Code follows documented patterns exactly
- All error cases handled gracefully
- Security best practices implemented
- Performance optimized (indexes, caching)
- Mobile responsive design
- Accessibility standards met
