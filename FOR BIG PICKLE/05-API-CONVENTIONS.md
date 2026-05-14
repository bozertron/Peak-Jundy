# API Conventions

> How API routes are structured, authenticated, and tested in Peak.

---

## Route File Structure

```
apps/client/app/api/
├── auth/[...nextauth]/route.ts     # NextAuth handler
├── bookings/route.ts               # POST booking creation
├── cards/route.ts                  # GET/POST contact cards
├── conversations/
│   ├── route.ts                    # GET/POST conversations
│   └── [id]/
│       ├── route.ts               # GET conversation by ID
│       └── messages/route.ts      # GET/POST messages
├── equipment/
│   ├── route.ts                   # GET (list) / POST (create)
│   ├── [id]/route.ts             # GET/PUT/DELETE single equipment
│   └── search/route.ts           # POST search with market-gap logging
├── peaks/
│   ├── balance/route.ts          # GET user's Peaks balance
│   └── chest/route.ts            # GET available / POST claim chest
├── stripe/
│   ├── account/route.ts          # POST create connected account
│   ├── account-link/route.ts     # POST create onboarding link
│   ├── account-status/route.ts   # GET account status
│   ├── checkout/route.ts         # POST create checkout session
│   └── webhook/route.ts          # POST Stripe webhook handler
├── trust/
│   ├── network/route.ts          # GET trust network graph
│   └── visible-equipment/route.ts # GET trust-filtered equipment
└── analytics/
    ├── market-gaps/route.ts       # GET unfulfilled search analysis (ADMIN)
    ├── owner-stats/route.ts       # GET owner metrics (ADMIN)
    └── unfulfilled-searches/route.ts # GET raw search logs (ADMIN)
```

---

## Export Pattern

Route files export **named HTTP method functions**:

```typescript
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
export async function PUT(request: Request) { ... }
export async function DELETE(request: Request) { ... }
```

---

## Authentication Pattern

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Standard auth check
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User ID available as:
  const userId = session.user.id;

  // Role available as:
  const role = session.user.role; // "USER" | "OWNER" | "ADMIN"

  // Stripe account ID (for owners):
  const stripeId = session.user.stripeAccountId;
}
```

---

## Input Validation Pattern

```typescript
import { validateEquipment, hasErrors, formatValidationErrors } from "@/lib/validation";

export async function POST(request: Request) {
  // ...auth check...

  const body = await request.json();

  // Validate
  const errors = validateEquipment(body);
  if (hasErrors(errors)) {
    return NextResponse.json(formatValidationErrors(errors), { status: 400 });
  }

  // Proceed with valid data...
}
```

Available validators in `lib/validation.ts`:
- `validateEquipment(data)` — title, description, category, dailyRate, hourMeter, location
- `validateBooking(data)` — startDate, endDate, equipmentId
- `validateSearch(query)` — non-empty, max 100 chars
- `validateCheckout(data)` — equipmentId, days (positive integer)

---

## Error Response Shape

**Always** return errors in this format:

```typescript
// Simple error
return NextResponse.json({ error: "Human-readable message" }, { status: 4xx });

// Validation error (with field-level details)
return NextResponse.json({
  error: "Validation failed",
  errors: {
    title: "Title is required",
    dailyRate: "Daily rate must be a positive number",
  }
}, { status: 400 });
```

---

## Prisma Query Patterns in Routes

### Include for relations
```typescript
const equipment = await prisma.equipment.findMany({
  include: { owner: { select: { name: true, stripeAccountId: true } } },
});
```

### Select for projections
```typescript
const users = await prisma.user.findMany({
  select: { id: true, name: true, peaksBalance: true },
});
```

### Pagination
```typescript
const skip = Number(searchParams.get("skip") || "0");
const take = Math.min(Number(searchParams.get("take") || "20"), 100);

const [items, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
  prisma.model.count({ where }),
]);

return NextResponse.json({
  items,
  pagination: {
    total,
    page: Math.floor(skip / take) + 1,
    pages: Math.ceil(total / take),
    hasMore: skip + take < total,
  },
});
```

---

## Role-Based Access Control

```typescript
// ADMIN-only route
if (session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}

// OWNER-only route
if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Owner access required" }, { status: 403 });
}

// Resource ownership check
const equipment = await prisma.equipment.findUnique({ where: { id } });
if (equipment?.ownerId !== session.user.id) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

Three roles: `USER` → `OWNER` (via Stripe Connect onboarding) → `ADMIN` (manually granted).

---

## Stripe Webhook Pattern

```typescript
// app/api/stripe/webhook/route.ts
import { stripeService } from "@/lib/stripe";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    // 1. Verify webhook signature FIRST
    const result = await stripeService.handleWebhookEvent(rawBody, signature);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
```

Handled events:
- `checkout.session.completed` → Create/confirm Booking
- `checkout.session.expired` → Cancel pending Booking

---

## SearchLog Pattern (Market Gap Analysis)

When search returns 0 results, log it for admin analytics:

```typescript
// Fire-and-forget — don't block the response
if (results.length === 0) {
  prisma.searchLog.create({
    data: {
      query: searchTerm,
      userId: session?.user?.id || null,
      fulfilled: false,
    },
  }).catch(() => {}); // Non-blocking
}
```

This data surfaces in `/admin/dashboard` → "Unfulfilled Searches" to identify market gaps.

---

## Caching

```typescript
// Equipment list — cache for 5 minutes
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
  },
});
```

---

## Complete Endpoint Reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| * | `/api/auth/[...nextauth]` | No | NextAuth handler (signin/signout/callback) |
| GET | `/api/equipment` | No | List equipment (paginated, filterable) |
| POST | `/api/equipment` | Yes | Create equipment listing |
| GET | `/api/equipment/[id]` | No | Get single equipment |
| PUT | `/api/equipment/[id]` | Yes+Owner | Update equipment |
| DELETE | `/api/equipment/[id]` | Yes+Owner | Delete equipment |
| POST | `/api/equipment/search` | No | Search with market-gap logging |
| POST | `/api/bookings` | Yes | Create a booking |
| GET | `/api/cards` | Yes | Get user's contact cards |
| POST | `/api/cards` | Yes | Create contact card |
| GET | `/api/conversations` | Yes | List user's conversations |
| POST | `/api/conversations` | Yes | Create conversation |
| GET | `/api/conversations/[id]` | Yes | Get conversation detail |
| GET | `/api/conversations/[id]/messages` | Yes | Get messages |
| POST | `/api/conversations/[id]/messages` | Yes | Send message |
| GET | `/api/peaks/balance` | Yes | Get Peaks balance & tier |
| GET | `/api/peaks/chest` | Yes | List available chests |
| POST | `/api/peaks/chest` | Yes | Claim a chest |
| GET | `/api/trust/network` | Yes | Get trust network graph |
| GET | `/api/trust/visible-equipment` | Yes | Trust-filtered equipment |
| POST | `/api/stripe/account` | Yes | Create Stripe Express account |
| POST | `/api/stripe/account-link` | Yes | Get onboarding link |
| GET | `/api/stripe/account-status` | Yes | Check account readiness |
| POST | `/api/stripe/checkout` | Yes | Create checkout session |
| POST | `/api/stripe/webhook` | No* | Stripe webhook (signature-verified) |
| GET | `/api/analytics/market-gaps` | Admin | Unfulfilled search analysis |
| GET | `/api/analytics/owner-stats` | Admin | Owner performance metrics |
| GET | `/api/analytics/unfulfilled-searches` | Admin | Raw search logs |
