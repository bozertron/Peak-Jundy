# Peak-Rentals-Master-Guide.md - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Implement strategic architecture, database schema, and core business logic based on comprehensive master guide.

## Tasks

### High Priority
- [ ] **Database Schema Implementation** - Verify Prisma schema matches Master Guide
  - [ ] User model with stripeAccountId and role fields
  - [ ] Equipment model with specs JSON and proper indexes
  - [ ] SearchLog model for market intelligence
  - [ ] Account model for NextAuth OAuth
  - [ ] Booking model for rental transactions
- [ ] **Technology Stack Verification** - Ensure all documented tech is properly configured
  - [ ] Next.js 14 with App Router
  - [ ] Prisma ORM with SQLite
  - [ ] NextAuth.js v4 with email provider
  - [ ] Stripe Connect integration
  - [ ] Tailwind CSS configuration
- [ ] **Stripe Connect Payment System** - Implement complete payment flow
  - [ ] Express account creation for owners
  - [ ] Onboarding link generation
  - [ ] Checkout session creation with fee splitting
  - [ ] Webhook handling for payment confirmation
  - [ ] 10% platform fee calculation
  - [ ] Follow-up: consolidate `lib/stripe.ts` vs `lib/stripe-connect.ts` and guard env loading

### Medium Priority
- [ ] **Market Intelligence System** - Build search tracking and analytics
  - [ ] Unfulfilled search logging (non-blocking)
  - [ ] Admin dashboard with search analytics
  - [ ] Market gap identification
  - [ ] Search query grouping and analysis
- [ ] **Authentication & Authorization** - Implement role-based access control
  - [ ] Email-based authentication (magic links)
  - [ ] Session management with database adapter
  - [ ] User roles: USER, OWNER, ADMIN
  - [ ] Protected route middleware (currently enforced per-route only)
- [ ] **Page Structure Implementation** - Build all documented page types
  - [ ] Public pages (home, browse, equipment detail)
  - [ ] User pages (dashboard, listings, rentals, profile)
  - [ ] Owner pages (onboarding, create listing, edit listing)
  - [ ] Admin pages (dashboard, unfulfilled searches)

### Low Priority
- [ ] **Equipment Categories & Specifications** - Implement market verticals
  - [ ] Heavy equipment categories (telehandlers, boom lifts, skid steers)
  - [ ] Aerial lifts (boom lifts, man lifts, scissor lifts)
  - [ ] Compact equipment (skid steers, track loaders)
  - [ ] Specialty equipment (tampers, packing equipment)
  - [ ] Construction materials (ICF bracing, formwork)
- [ ] **Development Roadmap** - Follow 4-phase implementation plan
  - [ ] Phase 1: Foundation (Weeks 1-2)
  - [ ] Phase 2: Marketplace Core (Weeks 3-5)
  - [ ] Phase 3: Transactions & Payouts (Weeks 6-8)
  - [ ] Phase 4: Admin & Intelligence (Weeks 9-10)

## Detailed Implementation Tasks

### Database Schema Implementation

#### Equipment Model Verification
```prisma
model Equipment {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  title       String                    // e.g., "1998 JLG 10054 Telehandler"
  description String                    // Detailed listing description
  specs       String                    // JSON string with technical data
  category    String                    // e.g., "Telehandler", "Boom Lift"
  ownerId     String                    // Reference to owner (User)
  dailyRate   Int                       // Price in CENTS (avoid floats)
  available   Boolean   @default(true)  // Availability status
  hourMeter   Float?                    // Optional odometer/hour reading
  
  owner       User      @relation(fields: [ownerId], references: [id])
  bookings    Booking[]
  
  @@index([ownerId])
  @@index([category])
}
```

#### SearchLog Model Implementation
```prisma
model SearchLog {
  id        Int      @id @default(autoincrement())
  query     String                                    // Search term entered by user
  userId    String?                                   // Optional user tracking
  timestamp DateTime @default(now())                    // When search occurred
  fulfilled Boolean  @default(false)                  // true = results found, false = no matches
  
  @@index([fulfilled])
  @@index([query])
}
```

### Stripe Connect Payment Flow Implementation

#### 1. Owner Onboarding Flow
```typescript
// Must implement:
POST /api/stripe/connect
→ createConnectedAccount(userId) → stripe.accounts.create()
→ Store stripeAccountId in User model
→ createAccountLink(accountId) → stripe.accountLinks.create()
→ Redirect owner to Stripe onboarding
→ Owner completes verification
→ Redirect back to /owner/dashboard
```

#### 2. Payment Processing Flow
```typescript
// Must implement:
POST /api/stripe/checkout
→ Calculate: totalPrice = dailyRate × days
→ Platform fee = totalPrice × 0.10
→ Owner payout = totalPrice - platformFee
→ stripe.checkout.sessions.create() with:
  - application_fee_amount
  - transfer_data.destination (owner)
→ Create Booking with status: "PENDING"
→ Redirect to Stripe Checkout
→ Webhook updates status to "CONFIRMED"
```

### Market Intelligence System

#### Unfulfilled Search Implementation
```typescript
// In /api/equipment/search route:
if (results.length === 0) {
  // Fire and forget - don't block response
  prisma.searchLog.create({
    data: {
      query: searchTerm.trim(),
      userId: session?.user?.id,
      fulfilled: false,
      timestamp: new Date(),
    }
  }).catch(err => console.error('SearchLog error:', err));
}
```

#### Admin Analytics Implementation
```typescript
// GET /api/analytics/unfulfilled-searches
const topSearches = await prisma.searchLog.groupBy({
  by: ['query'],
  where: { fulfilled: false },
  _count: { query: true },
  orderBy: { _count: { query: 'desc' } },
  take: 20,
});
```

### Equipment Categories Implementation

#### Category System
```typescript
const EQUIPMENT_CATEGORIES = [
  "Telehandler",
  "Boom Lift", 
  "Skid Steer",
  "Jumping Jack Tamper",
  "ICF Bracing",
  "Scissor Lift",
  "Man Lift",
  "Compact Track Loader",
  "Packing Equipment",
  "Formwork"
];
```

#### Specs JSON Structure
```json
{
  "model": "JLG 10054",
  "year": 1998,
  "capacity_lbs": 10000,
  "lift_height_ft": 53.17,
  "engine": "Cummins F3.8",
  "hourMeter": 4500,
  "hydraulic_capacity_gal": 52,
  "attachments": ["standard_carriage", "pallet_forks"]
}
```

### Authentication & Authorization

#### Role-Based Access Control
```typescript
// User roles to implement:
"USER"    → Can browse, rent, list equipment
"OWNER"    → Can create/edit listings, access payouts
"ADMIN"    → Can view dashboard, see unfulfilled searches

// Middleware patterns:
if (!session) redirect('/auth/signin');
if (session.user.role !== 'ADMIN') {
  return new Response('Unauthorized', { status: 403 });
}
```

### Critical Implementation Notes

#### Money Handling Rules
- **ALWAYS store prices in cents** (use integer)
- Never use floating-point for currency
- Example: $350/day = 35000 cents in database
- Calculate fees with `Math.floor()` to avoid decimal issues

#### Database Relations
- Equipment → User (many-to-one, owner)
- SearchLog → User (optional, for tracking which user searched)
- User → Stripe account (one-to-one)
- Booking → Equipment (many-to-one, rental)

#### Search Performance
- Add indexes on `Equipment.category`, `Equipment.title`
- Add index on `SearchLog.query`, `SearchLog.fulfilled`
- Consider full-text search for large deployments

#### Security Implementation
- Verify owner before allowing listing edits
- Verify owner's stripeAccountId before checkout
- Use middleware to check admin role
- Sanitize search queries
- CORS policy for API routes

#### Error Handling Guidelines
- Stripe errors → User-friendly messages
- Database errors → Log and return generic 500 response
- Auth errors → Redirect to signin
- Always wrap operations in try-catch

## Development Roadmap Implementation

### Phase 1: Foundation (Weeks 1-2) - Status: Should be Complete
- [ ] Initialize Next.js 14 with TypeScript, Tailwind, Prisma
- [ ] Set up SQLite database
- [ ] Create Prisma schema (Equipment, SearchLog, User, Account)
- [ ] Integrate NextAuth.js with email provider
- [ ] Build sign-up/login pages
- [ ] Create database migrations

### Phase 2: Marketplace Core (Weeks 3-5)
- [ ] Equipment listing form (multi-step)
- [ ] Equipment detail page with dynamic routing
- [ ] Search functionality with filtering
- [ ] Unfulfilled search logging middleware
- [ ] Equipment cards and listing grid
- [ ] Category filtering system
- [ ] Responsive mobile UI

### Phase 3: Transactions & Payouts (Weeks 6-8)
- [ ] Stripe Connect integration
- [ ] Owner onboarding flow
- [ ] Renter checkout session
- [ ] Payment processing with fee splitting
- [ ] Booking database model
- [ ] Webhook handlers for Stripe events
- [ ] Success/cancel pages
- [ ] Order management dashboard

### Phase 4: Admin & Intelligence (Weeks 9-10)
- [ ] Admin dashboard with role-based access
- [ ] Unfulfilled searches visualization
- [ ] Market gap analysis
- [ ] Equipment recommendation engine
- [ ] Admin user management
- [ ] Platform settings/configuration

## Dependencies
- Stripe Connect account setup
- Email provider configuration for NextAuth
- Proper environment variables
- Database migration permissions
- Test environment for payment testing

## Success Criteria

### Business Success
- [ ] Equipment owners can list equipment with full specs
- [ ] Renters can search and find available equipment
- [ ] Unfulfilled searches are tracked for market insights
- [ ] Stripe Connect handles payments securely
- [ ] Admin dashboard shows market gaps
- [ ] Mobile responsive design
- [ ] Fast search performance
- [ ] Secure authentication and authorization

### Technical Success
- [ ] Database schema matches documentation exactly
- [ ] All API routes implemented and functional
- [ ] Payment processing is secure and reliable
- [ ] Search analytics are accurate and useful
- [ ] Admin tools provide actionable insights
- [ ] Code follows documented patterns
- [ ] Performance meets documented benchmarks
- [ ] Security best practices are implemented

## Quality Metrics
- Documentation accuracy: 100%
- Feature completeness: 100%
- Payment processing success rate: >99%
- Search response time: <200ms
- Mobile page speed: >90
- Security audit: No critical vulnerabilities
- Code test coverage: >80%
