# Database Guide

> Complete reference for the Peak database schema, conventions, and query patterns.

---

## Schema Overview

The database has **13 models** organized into four domains:

### Identity (4 models)
| Model | Purpose |
|-------|---------|
| `User` | Core user record with Peak profile extensions |
| `Account` | OAuth/provider accounts linked to User |
| `Session` | Active sessions (database strategy) |
| `VerificationToken` | Magic-link email verification tokens |

### Marketplace (3 models)
| Model | Purpose |
|-------|---------|
| `Equipment` | Rental listings with specs, pricing, location |
| `Booking` | Rental transactions between renter and equipment |
| `SearchLog` | Logged searches for market gap analysis |

### Trust Network (2 models)
| Model | Purpose |
|-------|---------|
| `Vouch` | Directed trust endorsement (A vouches for B) |
| `ContactCard` | Collectible card auto-created from mutual interactions |

### Communications (2 models)
| Model | Purpose |
|-------|---------|
| `Conversation` | Chat thread between participants, optionally linked to equipment |
| `Message` | Individual message within a conversation |

### Peaks Economy (2 models)
| Model | Purpose |
|-------|---------|
| `PeaksTransaction` | Immutable ledger entry for Peaks earned/spent |
| `TreasureChest` | Redeemable reward chest with Peaks cost |

---

## Model Relationships & Cardinality

```
User 1──∞ Equipment          (owner)
User 1──∞ Booking            (renter)
User 1──∞ Vouch              (voucher — given)
User 1──∞ Vouch              (vouchee — received)
User 1──∞ ContactCard        (collector)
User 1──∞ ContactCard        (subject)
User ∞──∞ Conversation       (participants, implicit M2M)
User 1──∞ Message            (sender)
User 1──∞ PeaksTransaction
User 1──∞ TreasureChest      (claimer, optional)

Equipment 1──∞ Booking
Equipment 1──∞ Conversation   (optional context link)

Conversation 1──∞ Message
```

---

## Money Convention

**ALL prices are stored in cents (integers). Never use floats for money.**

| Display | Stored Value | Field |
|---------|-------------|-------|
| $350/day | `35000` | `Equipment.dailyRate` |
| $1,050 total | `105000` | `Booking.totalPrice` |
| 25 Peaks | `25` | `PeaksTransaction.amount` |
| 100 Peaks cost | `100` | `TreasureChest.peaksCost` |

Platform fee calculation:
```typescript
const PLATFORM_FEE_BPS = 1000; // 10%
const applicationFee = Math.round((totalAmount * PLATFORM_FEE_BPS) / 10000);
```

---

## Specs as JSON

`Equipment.specs` is a **JSON string** column. Flexible per-category schema:

```typescript
// Telehandler specs
{ "reach": "54ft", "capacity": "10000lbs", "engine": "Deutz TCD 3.6" }

// Scissor Lift specs  
{ "platform_height": "40ft", "capacity": "1000lbs", "drive": "Electric" }

// Parsing in code:
const specs = JSON.parse(equipment.specs);
```

---

## Indexing Strategy

| Model | Indexed Fields | Reason |
|-------|---------------|--------|
| Equipment | `ownerId` | Filter by owner |
| Equipment | `category` | Category browse/filter |
| Equipment | `location` | Geographic queries |
| Booking | `equipmentId` | Equipment's bookings |
| Booking | `renterId` | User's rental history |
| Booking | `status` | Filter active/completed |
| Message | `conversationId, createdAt` | Chronological message list |
| Message | `senderId` | User's sent messages |
| PeaksTransaction | `userId, createdAt` | Balance calculation |
| PeaksTransaction | `reason` | Analytics by action type |
| Vouch | `voucherId`, `voucheeId` | Trust graph traversal |
| Vouch | `broadcast` | Filter public vouches |
| SearchLog | `fulfilled`, `query` | Market gap analysis |
| ContactCard | `collectorId`, `subjectId` | Card gallery queries |
| TreasureChest | `available`, `claimedBy` | Available chests list |

---

## Cascade Deletes

When a `User` is deleted, the following cascade:
- All owned `Equipment` → also cascades their `Booking`s and `Conversation`s
- All `Booking`s where user is renter
- All `Vouch`es given and received
- All `ContactCard`s collected and appeared in
- All `Message`s sent
- All `PeaksTransaction`s
- All `Account`s and `Session`s

`TreasureChest.claimedBy` uses `onDelete: SetNull` (chest remains, claim reference nulled).
`Conversation.equipmentId` uses `onDelete: SetNull` (conversation persists even if equipment deleted).

---

## Prisma Singleton Pattern

`lib/prisma.ts` prevents connection pool exhaustion in development (hot reload creates new instances):

```typescript
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: logLevels });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Always import from `@/lib/prisma`**, never instantiate `new PrismaClient()` directly.

---

## Common Query Patterns

### Include (eager load relations)
```typescript
const equipment = await prisma.equipment.findMany({
  include: {
    owner: { select: { name: true, stripeAccountId: true } },
    bookings: { where: { status: "CONFIRMED" } },
  },
});
```

### Select (field filtering)
```typescript
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true, peaksBalance: true },
});
```

### Pagination (skip/take)
```typescript
const skip = Number(searchParams.get("skip") || "0");
const take = Math.min(Number(searchParams.get("take") || "20"), 100);

const [items, total] = await Promise.all([
  prisma.equipment.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
  prisma.equipment.count({ where }),
]);
```

### Upsert (idempotent create-or-update)
```typescript
await prisma.vouch.upsert({
  where: { voucherId_voucheeId: { voucherId, voucheeId } },
  update: { note, broadcast },
  create: { voucherId, voucheeId, note, broadcast },
});
```

### Unique constraint queries
```typescript
// ContactCard has @@unique([collectorId, subjectId])
const card = await prisma.contactCard.findUnique({
  where: { collectorId_subjectId: { collectorId, subjectId } },
});
```

---

## Peaks Ledger

`PeaksTransaction` is an **immutable append-only log**. Never update or delete transaction records.

**User's balance = sum of all their transaction amounts:**

```typescript
const transactions = await prisma.peaksTransaction.findMany({
  where: { userId },
  select: { amount: true },
});

// Positive amounts = earned, negative = spent
const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
```

The `User.peaksBalance` field is a **cached denormalization** — the true balance is always the ledger sum.

---

## Migration vs DB Push

| Command | Use Case | Creates Migration File? |
|---------|----------|------------------------|
| `npx prisma db push` | Development/prototyping — fast iteration | No |
| `npx prisma migrate dev` | Production-ready — trackable schema changes | Yes |
| `npx prisma migrate deploy` | Production deployment — applies pending migrations | N/A |

**Rule of thumb**: Use `db push` while iterating on schema design. Switch to `migrate dev` once the schema is stable and you need reproducible deployments.

---

## Seed Data Patterns

### Idempotent with upsert
```javascript
// prisma/seed.js — safe to run multiple times
await prisma.user.upsert({
  where: { email: "alice@peak.local" },
  update: {},
  create: {
    email: "alice@peak.local",
    name: "Alice",
    role: "OWNER",
    foundingMember: true,
    latitude: 49.7231,
    longitude: -118.9367,
    locationName: "Big White Village",
  },
});
```

### Geographic scatter
Seed equipment with varied locations around Big White Village:
```javascript
function nearby(baseLat, baseLng, radiusKm = 5) {
  const offset = radiusKm / 111; // ~1 degree = 111km
  return {
    latitude: baseLat + (Math.random() - 0.5) * offset * 2,
    longitude: baseLng + (Math.random() - 0.5) * offset * 2,
  };
}
```

### Run seed
```bash
npm run db:seed
# or: node prisma/seed.js
```
