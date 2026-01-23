# Peak Rentals - Source of Truth Index (SOT)

**Created:** January 22, 2026
**Status:** Active - Single Source of Truth
**Git Remote:** <https://github.com/bozertron/Jundalabra.git>

---

## Project Overview

Peak Rentals is an equipment rental marketplace built with Next.js 14, Prisma, and Stripe Connect. The platform enables equipment owners to list items for rent and customers to book them with secure payment processing.

---

## Current State Assessment

### What ACTUALLY Works (Verified)

| Component | Status | Location |
|-----------|--------|----------|
| Prisma Schema | COMPLETE | `prisma/schema.prisma` |
| Database (SQLite) | COMPLETE | `prisma/dev.db` |
| Type Definitions | COMPLETE | `lib/types.ts` (169 lines) |
| Validation Library | COMPLETE | `lib/validation.ts` (148 lines) |
| Stripe Service | COMPLETE | `lib/stripe.ts` (297 lines) |
| Equipment Components | COMPLETE | `components/Equipment/*` |
| Search Components | COMPLETE | `components/Search/*` |
| Stripe UI Components | COMPLETE | `components/Stripe/*` |
| Admin UI Components | COMPLETE | `components/Admin/*` |
| Navigation Components | COMPLETE | `components/Navigation/*` |
| Base Pages | COMPLETE | `/`, `/browse`, `/equipment/[id]` |
| Auth Pages | COMPLETE | `/auth/signin`, `/auth/error` |
| Booking Result Pages | COMPLETE | `/booking/success`, `/booking/cancel` |
| TypeScript Compilation | PASSES | `npm run typecheck` |

### What Does NOT Work (Blocking Issues)

| Component | Issue | Impact |
|-----------|-------|--------|
| `/api/equipment/route.ts` | **EMPTY FILE (0 bytes)** | No equipment CRUD |
| `/api/bookings/route.ts` | **EMPTY FILE (0 bytes)** | No booking endpoints |
| `/api/equipment/search/*` | **DOES NOT EXIST** | Search broken |
| `/api/analytics/*` | **DOES NOT EXIST** | Admin dashboard broken |
| `/api/stripe/*` | **DOES NOT EXIST** | Payments broken |
| Owner pages | **DELETED in git** | Owner flow broken |
| Admin pages | **DELETED in git** | Admin flow broken |

### Security Alert

Next.js 14.0.4 has **critical security vulnerabilities**. Must upgrade to 14.2.35+.

---

## Architecture

```
Peak Rentals Project/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (MOSTLY EMPTY!)
│   │   ├── bookings/route.ts     # 0 bytes - NEEDS IMPLEMENTATION
│   │   └── equipment/route.ts    # 0 bytes - NEEDS IMPLEMENTATION
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/page.tsx    # EXISTS
│   │   ├── admin/layout.tsx      # EXISTS (guard)
│   │   └── [owner/admin pages]   # DELETED - need restoration
│   ├── auth/                     # Auth pages
│   ├── booking/                  # Booking result pages
│   ├── browse/page.tsx           # Equipment browse
│   ├── equipment/[id]/page.tsx   # Equipment detail
│   └── page.tsx                  # Home
├── components/
│   ├── Admin/                    # Admin UI (works, no data)
│   ├── Equipment/                # Equipment UI (works)
│   ├── Navigation/               # Nav components (works)
│   ├── Search/                   # Search UI (works)
│   └── Stripe/                   # Stripe UI (works, no API)
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── hooks.ts                  # Custom hooks
│   ├── prisma.ts                 # Prisma client
│   ├── stripe.ts                 # Stripe service (COMPLETE)
│   ├── types.ts                  # TypeScript types (COMPLETE)
│   ├── utils.ts                  # Utilities
│   └── validation.ts             # Validators (COMPLETE)
├── prisma/
│   ├── schema.prisma             # Database schema (COMPLETE)
│   ├── dev.db                    # SQLite database (EXISTS)
│   └── seed.js                   # Seed script
└── types/                        # Global type declarations
```

---

## Database Schema

```prisma
model User {
  id              String     @id @default(cuid())
  email           String?    @unique
  name            String?
  image           String?
  role            Role       @default(RENTER)
  stripeAccountId String?
  equipment       Equipment[]
  bookings        Booking[]  @relation("RenterBookings")
}

model Equipment {
  id          String    @id @default(cuid())
  title       String
  description String
  category    String
  dailyRate   Float
  image       String?
  location    String?
  hourMeter   Float?
  ownerId     String
  owner       User      @relation(...)
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Booking {
  id                 String   @id @default(cuid())
  equipmentId        String
  renterId           String
  startDate          DateTime
  endDate            DateTime
  totalPrice         Float
  status             BookingStatus @default(PENDING)
  stripeSessionId    String?
  cancelledAt        DateTime?
  cancellationReason String?
}

model SearchLog {
  id         String   @id @default(cuid())
  query      String
  category   String?
  userId     String?
  fulfilled  Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

---

## Execution Plan

### Phase 1: Critical Fixes (Priority: BLOCKING)

**Sprint 1.1: Fix TypeScript Errors**

- [ ] Fix `lib/prisma.ts:13` - Type 'string[]' not assignable
- [ ] Fix `lib/stripe.ts:16` - Stripe API version mismatch

**Sprint 1.2: Update Next.js (Security)**

- [ ] Run `npm audit fix --force` to upgrade to Next.js 14.2.35

**Sprint 1.3: Implement Equipment API**

- [ ] `GET /api/equipment` - List all equipment
- [ ] `POST /api/equipment` - Create equipment (owner only)
- [ ] `GET /api/equipment/[id]` - Get single equipment
- [ ] `PUT /api/equipment/[id]` - Update equipment (owner only)
- [ ] `DELETE /api/equipment/[id]` - Delete equipment (owner only)

**Sprint 1.4: Implement Search API**

- [ ] `POST /api/equipment/search` - Search with unfulfilled logging

**Sprint 1.5: Implement Bookings API**

- [ ] `GET /api/bookings` - List user's bookings
- [ ] `POST /api/bookings` - Create booking
- [ ] `PATCH /api/bookings/[id]` - Update booking status

### Phase 2: Stripe Integration

**Sprint 2.1: Stripe API Routes**

- [ ] `POST /api/stripe/connect/account` - Create connected account
- [ ] `GET /api/stripe/connect/account-status` - Get account status
- [ ] `GET /api/stripe/connect/onboarding-link` - Get onboarding URL
- [ ] `POST /api/stripe/checkout` - Create checkout session
- [ ] `POST /api/stripe/webhook` - Handle Stripe webhooks

### Phase 3: Analytics & Admin

**Sprint 3.1: Analytics API**

- [ ] `GET /api/analytics/unfulfilled-searches` - Admin only
- [ ] `GET /api/analytics/market-gaps` - Admin only
- [ ] `GET /api/analytics/owner-stats` - Owner only

**Sprint 3.2: Restore/Recreate Pages**

- [ ] `/owner/dashboard` - Owner home
- [ ] `/owner/create-listing` - Create equipment listing
- [ ] `/owner/listings/[id]/edit` - Edit listing
- [ ] `/owner/onboarding` - Stripe onboarding
- [ ] `/admin/dashboard` - Admin home
- [ ] `/admin/unfulfilled-searches` - Market gap analysis
- [ ] `/admin/users` - User management

### Phase 4: Testing & Polish

**Sprint 4.1: Manual Testing**

- [ ] Equipment CRUD flow
- [ ] Search and browse flow
- [ ] Stripe checkout flow
- [ ] Admin dashboard flow

**Sprint 4.2: UI/UX Polish**

- [ ] Implement design system
- [ ] Responsive testing
- [ ] Accessibility audit

---

## API Reference

### Equipment Endpoints (TO IMPLEMENT)

```typescript
// GET /api/equipment
// Returns: { equipment: Equipment[], count: number }

// POST /api/equipment
// Body: { title, description, category, dailyRate, image?, location? }
// Returns: { equipment: Equipment }

// GET /api/equipment/[id]
// Returns: { equipment: EquipmentWithOwner }

// PUT /api/equipment/[id]
// Body: { title?, description?, category?, dailyRate?, image?, location? }
// Returns: { equipment: Equipment }

// DELETE /api/equipment/[id]
// Returns: { success: true }
```

### Search Endpoint (TO IMPLEMENT)

```typescript
// POST /api/equipment/search
// Body: { query: string, category?: string, location?: string }
// Returns: { results: Equipment[], count: number, fulfilled: boolean }
// Side effect: Logs to SearchLog if unfulfilled
```

### Stripe Endpoints (TO IMPLEMENT)

```typescript
// POST /api/stripe/connect/account
// Returns: { accountId: string }

// GET /api/stripe/connect/account-status
// Returns: { readyForPayments: boolean, requirements: string[] }

// GET /api/stripe/connect/onboarding-link
// Returns: { url: string }

// POST /api/stripe/checkout
// Body: { equipmentId: string, days: number }
// Returns: { sessionId: string, url: string }

// POST /api/stripe/webhook
// Handles: checkout.session.completed, checkout.session.expired
```

---

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PLATFORM_FEE_BPS="1000"  # 10%
```

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run typecheck        # TypeScript check
npm run lint             # ESLint check

# Database
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npx prisma studio        # Database GUI
```

---

## Legacy Documentation

All previous TODO files have been archived to:

- `_archive/legacy-todos/` - All .TODO.md files
- `_archive/legacy-actions/` - All archived_actions*.md files
- `_archive/legacy-reports/` - IMPLEMENTATION_REPORT.md, PROJECT_SUMMARY.md

**DO NOT USE LEGACY FILES** - This SOT-INDEX.md is the single source of truth.

---

## Verification Checklist

Before marking any phase complete:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes with no warnings
- [ ] API endpoints return expected responses
- [ ] Frontend can fetch and display data
- [ ] Error states handled gracefully
- [ ] No console errors in browser

---

## Contact

- **Repository Owner:** bozertron
- **Original Creator:** Peter (peterjohnlundy-cyber)
- **Git Remote:** <https://github.com/bozertron/Jundalabra.git>

---

*Last Updated: January 22, 2026*
