# Business Logic Deep-Dive

> Detailed reference for the core business systems in Peak.

---

## Peaks Economy

### Overview

Peaks are a **narrative reward currency** — not transferable, not cashable, tied to identity. They represent community engagement and trust-building.

### 5-Tier System

| Tier | Threshold | Color | Description |
|------|-----------|-------|-------------|
| Explorer | 0–99 | Stone gray (#9C968C) | Beginning the mountain journey |
| Trailblazer | 100–499 | Forest green (#5A917A) | Forging connections on the trail |
| Summit Seeker | 500–1,499 | Copper (#B87333) | Ascending toward the peaks |
| Peak Patron | 1,500–4,999 | Warm brass (#B8860B) | A distinguished member of the lodge |
| Alpine Elite | 5,000+ | Burgundy (#722F37) | At the pinnacle of Peak |

### Award Amounts

| Action | Peaks Earned |
|--------|-------------|
| Rental complete | 25 |
| First rental (bonus) | 50 |
| Vouch given | 5 |
| Vouch received (broadcast) | 10 |
| First interaction | 3 |
| Profile complete | 15 |
| Referral success | 50 |
| Founding member bonus | 500 |
| Seasonal activity bonus | 20 |

### Chest Costs (Spending)

| Chest Tier | Peaks Cost |
|------------|-----------|
| Bronze | 25 |
| Silver | 75 |
| Gold | 200 |
| Platinum | 500 |

### Balance Calculation

Balance = sum of all `PeaksTransaction` records for a user (immutable ledger):

```typescript
// From lib/peaks.ts
export function calculateBalanceSummary(
  transactions: Pick<PeaksTransaction, 'amount'>[]
): PeaksBalance {
  let lifetime = 0;  // Total earned (positive amounts)
  let spent = 0;     // Total spent (absolute value of negatives)

  for (const tx of transactions) {
    if (tx.amount > 0) lifetime += tx.amount;
    else spent += Math.abs(tx.amount);
  }

  const current = lifetime - spent;
  const rank = determineTier(lifetime);  // Tier based on LIFETIME, not current

  return { current, lifetime, spent, rank };
}
```

**Important**: Tier is determined by **lifetime** Peaks (total ever earned), not current balance. Spending doesn't lower your tier.

### Key Functions in `lib/peaks.ts`

| Function | Purpose |
|----------|---------|
| `calculateRentalPeaks(isFirst, days)` | Peaks earned for a rental (with duration bonus) |
| `calculateVouchPeaks(isBroadcast)` | Peaks for voucher + vouchee |
| `calculateChestCost(tier)` | Cost to open a chest |
| `determineTier(lifetimePeaks)` | Map lifetime points to tier name |
| `calculateTierProgress(lifetime)` | Progress toward next tier (percentage) |
| `calculateBalanceSummary(txs)` | Full balance from transaction history |
| `hasSufficientPeaks(balance, cost)` | Can user afford a transaction? |
| `formatPeaks(amount, opts)` | Display formatting with ⛰ symbol |
| `getTierDisplay(tier)` | Tier color + description for UI |

### Design Principles

- **Pure functions** — no side effects, no DB access, no state mutation
- **Portable to Rust** — written to be easily translatable for the Tauri native layer
- **`as const` everywhere** — compile-time constants for safety

---

## Trust Network

### Core Concept

A **vouch** is a directed trust endorsement: User A vouches for User B.

```
A ──vouch──▶ B    (A trusts B)
```

### Vouch Properties

| Field | Type | Purpose |
|-------|------|---------|
| `voucherId` | String | Who is giving the vouch |
| `voucheeId` | String | Who is being vouched for |
| `note` | String? | Optional context ("Great snowmobile mechanic") |
| `broadcast` | Boolean | If true, visible to voucher's network |
| `broadcastAt` | DateTime? | When it was broadcast |

### Trust Graph Rules

- **Degree 1**: Direct vouch (A vouched for B)
- **Degree 2**: Friend-of-friend (A vouched for C, C vouched for B → A sees B at degree 2)
- **Equipment visibility**: Only see equipment from owners within your trust radius
- **Chat creation**: Can only start conversations with people in your trust graph
- **Contact card formation**: Auto-created on mutual vouch

### Broadcast vs Private Vouches

- **Private** (default): Only the voucher and vouchee know about it
- **Broadcast**: Visible to the voucher's 1st-degree network — expands what they can discover

### Mutual Vouches → Contact Cards

When A vouches for B AND B vouches for A:
```typescript
// Auto-create ContactCards for both directions
await prisma.contactCard.create({
  data: { collectorId: A.id, subjectId: B.id, origin: "vouch" }
});
await prisma.contactCard.create({
  data: { collectorId: B.id, subjectId: A.id, origin: "vouch" }
});
```

### Network Visualization

The `/network` page renders the trust graph visually, showing:
- Your direct vouches (1st degree)
- Extended network (2nd degree)
- Who vouched for whom
- Broadcast status

---

## Stripe Integration

### Architecture

- **Stripe Connect** with Express accounts for equipment owners
- **Destination charges**: renter pays platform → platform takes fee → owner receives remainder
- **Three-sided**: Renter, Owner, Platform

### Account Types

| Entity | Stripe Account Type | Role |
|--------|-------------------|------|
| Platform (Peak) | Platform Account | Holds platform fees |
| Equipment Owner | Express Account | Receives payouts |
| Renter | No account needed | Pays via Checkout |

### Flow

```
1. Owner onboards → createConnectedAccount() → Express account created
2. Owner becomes OWNER role
3. Renter clicks "Rent" → createCheckoutSession()
4. Checkout session with destination charge:
   - Total: dailyRate × days
   - Platform fee: Math.round((total * 1000) / 10000)  // 10%
   - Owner receives: total - platformFee
5. Stripe redirects to success/cancel URL
6. Webhook fires → Booking created/confirmed
```

### Platform Fee

```typescript
const PLATFORM_FEE_BPS = 1000; // 10% = 1000 basis points

// Configurable via env var:
const FEE = Number(process.env.PLATFORM_FEE_BPS || 1000);

// Calculation:
const totalAmount = dailyRate * days;  // in cents
const applicationFee = Math.round((totalAmount * PLATFORM_FEE_BPS) / 10000);
```

Example: $350/day × 3 days = $1,050 total
- Platform fee: $105 (10%)
- Owner receives: $945

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/confirm Booking record |
| `checkout.session.expired` | Cancel pending Booking |

### Metadata Preserved on Checkout Session

```typescript
metadata: {
  equipmentId: params.equipmentId,
  renterId: params.renterId,
  days: String(params.days),
}
```

This allows the webhook handler to create the correct Booking record.

### Key Service Functions (`lib/stripe.ts`)

| Function | Purpose |
|----------|---------|
| `createConnectedAccount(userId)` | Create Express account for owner |
| `createAccountLink(accountId)` | Generate onboarding URL |
| `createCheckoutSession(params)` | Create payment session with fee split |
| `getAccountStatus(accountId)` | Check if account can receive payments |
| `handleWebhookEvent(body, sig)` | Process incoming webhook |
| `validateWebhookSignature(body, sig)` | Verify Stripe signature |

---

## Contact Cards

### What They Are

Collectible "trading cards" representing people in your network. Like baseball cards for the mountain community.

### Auto-Creation Triggers

- **Mutual vouch** — when both users vouch for each other
- **Conversation start** — when you first message someone (planned)
- **Completed rental** — after a successful rental (planned)

### Card Data

| Field | Source |
|-------|--------|
| Avatar | `User.avatarUrl` |
| Name | `User.name` |
| Flavor | `User.flavor` (tagline) |
| Tier badge | Calculated from `User.peaksBalance` → `determineTier()` |
| Founding badge | `User.foundingMember` |
| Trust provenance | "Introduced by X" from vouch chain |
| Origin | How the card was created ("vouch", "conversation", "rental", "manual") |

### Unique Constraint

One card per collector+subject pair:
```prisma
@@unique([collectorId, subjectId])
```

Attempting to create a duplicate returns the existing card.

### Gallery

The `/cards` page displays all cards a user has collected — their visible network as a visual gallery.

---

## SearchLog & Market Gap Analysis

### How It Works

1. User searches for equipment (e.g., "chainsaw")
2. If search returns 0 results → `SearchLog.create({ query: "chainsaw", fulfilled: false })`
3. Admin dashboard aggregates unfulfilled searches
4. Reveals equipment categories the community needs but nobody is listing
5. Admin can use this data to recruit owners or adjust categories

### Admin Analytics Endpoints

- `GET /api/analytics/unfulfilled-searches` — raw search logs
- `GET /api/analytics/market-gaps` — aggregated unfulfilled demand
- `GET /api/analytics/owner-stats` — owner performance metrics
