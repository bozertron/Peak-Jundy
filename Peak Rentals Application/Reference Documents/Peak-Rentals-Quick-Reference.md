# Peak Rentals: Quick Reference for LLM Agents

## Project at a Glance

**Peak Rentals** is a peer-to-peer heavy equipment rental marketplace built with:
- **Next.js 14** (App Router, TypeScript)
- **Prisma + SQLite** (database)
- **NextAuth.js** (authentication)
- **Stripe Connect** (payment processing)
- **Tailwind CSS** (styling)

**Core Feature**: Equipment owners list equipment → Renters search & rent → Platform tracks unfulfilled searches → Admin uses data to identify market gaps

---

## Three Critical Data Flows

### 1️⃣ Equipment Listing → Database
```
Owner fills form → POST /api/equipment
→ Prisma creates Equipment record
→ Stored with ownerId, dailyRate (in cents), specs (JSON)
→ Available immediately on marketplace
```

### 2️⃣ Search → Unfulfilled Tracking
```
Renter searches "80ft boom lift" → POST /api/equipment/search
→ Query Equipment table
→ Results found? ✅ Return results + count/fulfilled
→ No results? ❌ Log to SearchLog (fulfilled: false) → Return empty
```

### 3️⃣ Booking → Payment → Payout
```
Renter clicks "Book" → POST /api/stripe/checkout
→ Calculate: price = dailyRate × days
→ Platform fee = 10%, owner gets 90%
→ Create Booking (status: PENDING)
→ Redirect to Stripe Checkout
→ Payment processed
→ Webhook: Booking status → CONFIRMED
→ Money split: Platform + Owner
```

---

## Database Models (Must Remember)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | Owner/Renter account | id, email, stripeAccountId, role |
| **Equipment** | Listing item | id, title, specs (JSON), dailyRate (cents), ownerId |
| **Booking** | Rental transaction | id, equipmentId, renterId, totalPrice (cents), status |
| **SearchLog** | Market intelligence | id, query, fulfilled (bool), timestamp |
| **Account** | OAuth connection | userId, provider, providerAccountId |

**Critical**: Store all prices in **cents** (int), not dollars (float).
API accepts dailyRate (USD) or dailyRateCents (int), then stores cents.

---

## API Routes Quick Map

```
🔐 AUTH
  POST /api/auth/signin
  POST /api/auth/signout

📦 EQUIPMENT (CRUD)
  GET  /api/equipment              (browse all)
  POST /api/equipment              (create listing)
  GET  /api/equipment/[id]         (view item)
  PUT  /api/equipment/[id]         (edit listing)
  DELETE /api/equipment/[id]       (delete listing)

🔍 SEARCH
  POST /api/equipment/search       (search + unfulfilled logging)

💳 STRIPE
  POST /api/stripe/connect         (owner onboarding)
  POST /api/stripe/connect/account (explicit account creation)
  GET  /api/stripe/connect/onboarding-link (generate onboarding link)
  GET  /api/stripe/connect/account-status  (connected account status)
  POST /api/stripe/checkout        (renter checkout)
  POST /api/stripe/webhook         (payment confirmation)
  GET  /api/stripe/account-status  (check setup)

📊 ADMIN
  GET  /api/analytics/unfulfilled-searches (top missed searches)
  GET  /api/analytics/market-gaps          (market demand gaps)
  GET  /api/analytics/owner-stats          (owner summary)
```

---

## Code Pattern Templates

### Pattern 1: Protected API Route
```typescript
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
import { prisma } from "@/lib/prisma";

const results = await prisma.equipment.findMany({
  where: { category: "Telehandler" },
  include: { owner: { select: { name: true } } },
});
```

### Pattern 3: Stripe Payment
```typescript
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
"use client";
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data }),
});
```

---

## Component Hierarchy

```
Layout (Root)
├── Navbar (auth status, user menu)
└── Pages
    ├── Home (hero + featured equipment)
    ├── Browse (search results)
    ├── Equipment[id] (detail page)
    ├── Dashboard (user portal)
    │   ├── /dashboard/listings (my listings)
    │   └── /dashboard/rentals (my rentals)
    ├── Owner
    │   ├── /owner/dashboard (owner summary)
    │   ├── /owner/create-listing (multi-step form)
    │   ├── /owner/listings/[id]/edit (edit listing)
    │   └── /owner/onboarding (Stripe setup)
    ├── Admin (admin only)
    │   ├── /admin/dashboard (overview)
    │   ├── /admin/dashboard/unfulfilled (market gaps)
    │   ├── /admin/users (user management)
    │   └── /admin/settings (platform settings)
    └── Auth
        ├── /auth/signin (email magic link)
        └── /auth/error (error page)
```

---

## File Locations for Key Features

| Feature | Files |
|---------|-------|
| **Authentication** | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` |
| **Database** | `lib/prisma.ts`, `prisma/schema.prisma` |
| **Stripe** | `lib/stripe.ts`, `app/api/stripe/*` |
| **Equipment CRUD** | `app/api/equipment/*`, `components/Equipment/*` |
| **Search** | `app/api/equipment/search/route.ts`, `components/Search/*` |
| **Admin** | `components/Admin/*`, `app/api/analytics/*` |

---

## Critical Implementation Checklist

### Before Any Feature Development
- [ ] Is authentication required? → Use `getServerSession()`
- [ ] Does it involve money? → Use cents (int)
- [ ] Is it a search? → Log unfulfilled in separate non-blocking call
- [ ] Is it admin-only? → Check `session.user.role === "ADMIN"`
- [ ] Does it modify data? → Verify ownership first

### For Every API Route
- [ ] Add error handling (try-catch)
- [ ] Return appropriate status codes
- [ ] Log errors to console
- [ ] Return JSON responses
- [ ] Check authentication if needed

### For Every Component
- [ ] Use "use client" if needs state/effects
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Mobile responsive (Tailwind)
- [ ] Accessible (labels, focus states)

---

## Debugging Commands

```bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev

# Check schema
npx prisma format
```

---

## Environment Variables

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Common Gotchas to Avoid

❌ **Don't forget**:
- Currency calculations use cents
- Search logging is non-blocking (fire and forget)
- Check ownership before edit/delete
- Admin checks on protected routes
- Verify stripeAccountId before checkout

❌ **Don't use**:
- localStorage/sessionStorage (throws SecurityError)
- Floating-point for money
- Synchronous heavy operations in API routes
- Direct database access in components (use API)
- Plain text passwords (use NextAuth)

✅ **Always**:
- Return JSON from API routes
- Wrap long operations in try-catch
- Use relative imports (@/lib/...)
- Include error handling in fetch calls
- Log important events

---

## Quick Start for LLM Agent

When given a task:

1. **Check context**: Is this auth? Payment? Search?
2. **Find pattern**: Look for similar code in existing files
3. **Copy template**: Use pattern from this guide
4. **Adapt**: Change model names, field names, routes
5. **Test**: Use cURL or API client to verify
6. **Deploy**: Run migrations if schema changed

---

## Examples of Common Requests

### "Create equipment listing"
→ POST /api/equipment, store specs as JSON, dailyRate in cents

### "Search and track misses"
→ POST /api/equipment/search, log to SearchLog if no results (async)

### "Process rental payment"
→ POST /api/stripe/checkout, calculate fees (10%), create Booking with PENDING status

### "Show admin what renters want"
→ GET /api/analytics/unfulfilled-searches, group SearchLog by query (fulfilled:false)

### "Verify owner can list equipment"
→ Check POST /api/stripe/connect was called, stripeAccountId exists

---

## Success Criteria

✅ Equipment owners can create listings with technical specs
✅ Renters can search and see availability
✅ Unfulfilled searches tracked for market intel
✅ Stripe handles payments securely
✅ Admin dashboard shows market gaps
✅ Mobile responsive design
✅ Fast search performance (indexed)
✅ No exposed secrets in code

---

## Resources

- **NextAuth Docs**: https://next-auth.js.org/
- **Prisma ORM**: https://www.prisma.io/docs/
- **Stripe Connect**: https://stripe.com/docs/connect
- **Next.js App Router**: https://nextjs.org/docs/app
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Getting Help from LLM Agent

**Good prompt**: "Create a POST endpoint at /api/equipment that accepts title, description, category, specs (JSON), and dailyRate (in dollars). Convert dailyRate to cents, verify user is authenticated, and store in database."

**Better prompt**: "Following the equipment CRUD pattern in /api/equipment/route.ts, create a PUT route at /api/equipment/[id] that updates an equipment listing. Verify the user is the owner before allowing updates."

**Best prompt**: "Using Peak-Rentals-Implementation.md as reference, implement the Stripe webhook handler at /api/stripe/webhook to update booking status from PENDING to CONFIRMED when checkout.session.completed fires."

---

## Document Reference Map

| Document | Use For |
|----------|---------|
| **Peak-Rentals-Master-Guide.md** | Understanding project architecture, database schema, tech stack, roadmap |
| **Peak-Rentals-Implementation.md** | Step-by-step code implementation, project initialization, API routes, components |
| **Peak-Rentals-API-Reference.md** | Exact endpoint specs, request/response formats, data flows, example cURLs |
| **Peak-Rentals-Frontend-Architecture.md** | Component structure, UI patterns, page layouts, styling |
| **Peak-Rentals-Quick-Reference.md** | (This file) Quick lookup, patterns, gotchas, common requests |

---

## Final Notes for LLM Agents

You are building a **marketplace that connects people with expensive equipment**. Every line of code affects:
- **Trust**: Secure payments, verified identities
- **Discovery**: Good search helps renters find what they need
- **Intelligence**: Unfulfilled searches tell us what equipment the market needs

When implementing, always ask:
1. Does this secure money properly?
2. Does this help or harm discovery?
3. Does this respect user privacy?
4. Is this user-friendly?

Build with care. Build with precision. Build Peak Rentals to last.

---

**Last Updated**: December 18, 2025  
**Project Version**: 0.1.0 (Alpha)  
**Status**: Ready for active development
