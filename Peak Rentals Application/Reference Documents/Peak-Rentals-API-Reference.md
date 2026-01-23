# Peak Rentals: API Reference & Data Flow Specifications

## API Endpoint Specifications

### 1. AUTHENTICATION ENDPOINTS

#### POST /api/auth/signin
Send magic link for email authentication
```
REQUEST:
{
  "email": "user@example.com",
  "callbackUrl": "/dashboard"
}

RESPONSE (200):
{
  "ok": true,
  "message": "Check your email for the sign-in link"
}

ERROR (400):
{
  "error": "Invalid email"
}
```

#### POST /api/auth/signout
Clear user session
```
RESPONSE (200):
{
  "url": "/"
}
```

---

### 2. EQUIPMENT ENDPOINTS

#### GET /api/equipment
Fetch all equipment with optional filters
```
QUERY PARAMS:
- q: string (optional) - free-text search term
- category: string (optional) - e.g., "Telehandler"
- available: boolean (optional) - e.g., "true"
- skip: number (optional) - pagination offset
- take: number (optional) - items per page (default: 20)

RESPONSE (200):
{
  "equipment": [
    {
      "id": "clxyz123",
      "title": "1998 JLG 10054 Telehandler",
      "description": "Well-maintained telehandler...",
      "specs": "{\"capacity_lbs\": 10000, \"lift_height_ft\": 53.17}",
      "category": "Telehandler",
      "dailyRate": 35000,
      "available": true,
      "hourMeter": 4500,
      "ownerId": "user123",
      "owner": {
        "name": "John Doe"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pages": 3,
    "hasMore": true
  }
}
```

#### POST /api/equipment
Create new equipment listing (authenticated)
```
HEADERS:
Authorization: Bearer <session_token>

REQUEST BODY:
{
  "title": "1998 JLG 10054 Telehandler",
  "description": "Reliable telehandler, recently serviced",
  "category": "Telehandler",
  "specs": {
    "model": "JLG 10054",
    "year": 1998,
    "capacity_lbs": 10000,
    "lift_height_ft": 53.17,
    "engine": "Cummins F3.8",
    "hourMeter": 4500
  },
  "dailyRate": 350.00,
  "dailyRateCents": 35000,
  "hourMeter": 4500
}

NOTES:
- Send either dailyRate (USD) or dailyRateCents (integer in cents).
- specs may be provided as a JSON object or a JSON string.

RESPONSE (201):
{
  "id": "clxyz123",
  "title": "1998 JLG 10054 Telehandler",
  "specs": "{\"model\":\"JLG 10054\",...}",
  "category": "Telehandler",
  "dailyRate": 35000,
  "ownerId": "user123",
  "available": true,
  "createdAt": "2025-01-15T10:30:00Z"
}

ERROR (401):
{ "error": "Unauthorized" }

ERROR (400):
{ "error": "Missing required fields" }
```

#### GET /api/equipment/[id]
Fetch single equipment details
```
RESPONSE (200):
{
  "id": "clxyz123",
  "title": "1998 JLG 10054 Telehandler",
  "description": "...",
  "specs": "{...}",
  "category": "Telehandler",
  "dailyRate": 35000,
  "available": true,
  "hourMeter": 4500,
  "owner": {
    "name": "John Doe",
    "stripeAccountId": "acct_123"
  }
}

ERROR (404):
{ "error": "Equipment not found" }
```

#### PUT /api/equipment/[id]
Update equipment (owner only)
```
HEADERS:
Authorization: Bearer <session_token>

REQUEST BODY:
{
  "title": "Updated title",
  "dailyRate": 400.00,
  "dailyRateCents": 40000,
  "available": false,
  "hourMeter": 4600
}

NOTES:
- Send either dailyRate (USD) or dailyRateCents (integer in cents).
- specs may be provided as a JSON object or a JSON string.

RESPONSE (200):
{ 
  "id": "clxyz123",
  "title": "Updated title",
  "dailyRate": 40000,
  "hourMeter": 4600,
  ...
}

ERROR (403):
{ "error": "Not authorized to update this equipment" }
```

#### DELETE /api/equipment/[id]
Delete equipment (owner only)
```
HEADERS:
Authorization: Bearer <session_token>

RESPONSE (200):
{ "message": "Equipment deleted" }

ERROR (403):
{ "error": "Not authorized to delete this equipment" }
```

---

### 3. SEARCH ENDPOINTS

#### POST /api/equipment/search
Search equipment with unfulfilled logging
```
REQUEST BODY:
{
  "query": "boom lift 80ft",
  "category": "Boom Lift"
}

NOTES:
- Case-insensitive search across title, description, and category.
- Optional category filter is matched case-insensitively.

RESPONSE (200):
{
  "results": [
    {
      "id": "eq123",
      "title": "1979 60ft JLG Boom Lift",
      "category": "Boom Lift",
      "dailyRate": 45000,
      "owner": { "name": "Owner Name" }
    }
  ],
  "count": 1,
  "fulfilled": true
}

RESPONSE (200) - No results:
{
  "results": [],
  "count": 0,
  "fulfilled": false
}
// SearchLog entry created with fulfilled: false
```

---

### 4. STRIPE CONNECT ENDPOINTS

#### POST /api/stripe/connect
Create Stripe Express account for owner
```
HEADERS:
Authorization: Bearer <session_token>

RESPONSE (200):
{
  "url": "https://connect.stripe.com/onboarding/..."
}

NOTES:
- Redirects owner to Stripe onboarding
- Upon completion, return_url sends to /owner/dashboard
- stripeAccountId stored in User.stripeAccountId
```

#### POST /api/stripe/connect/account
Create a Stripe Express account (explicit account creation)
```
REQUEST BODY:
{
  "displayName": "Owner Name",
  "contactEmail": "owner@example.com"
}

RESPONSE (201):
{
  "success": true,
  "accountId": "acct_...",
  "message": "Connected account created successfully"
}
```

#### GET /api/stripe/connect/onboarding-link
Generate onboarding link for an existing connected account
```
QUERY PARAMS:
- accountId: string (required)

RESPONSE (200):
{
  "url": "https://connect.stripe.com/onboarding/..."
}
```

#### GET /api/stripe/connect/account-status
Retrieve onboarding status for a connected account
```
QUERY PARAMS:
- accountId: string (required)

RESPONSE (200):
{
  "success": true,
  "status": {
    "accountId": "acct_...",
    "readyForPayments": true,
    "readyToReceivePayments": true,
    "hasUnmetRequirements": false,
    "requirementsStatus": "Active",
    "currentlyDue": [],
    "pastDue": []
  }
}
```

#### POST /api/stripe/checkout
Create checkout session for renter
```
HEADERS:
Authorization: Bearer <session_token>

REQUEST BODY:
{
  "equipmentId": "eq123",
  "days": 5
}

RESPONSE (200):
{
  "sessionId": "cs_test_..."
}

NOTES:
- Calculates: totalPrice = dailyRate * days
- Platform fee: 10% → Peak Rentals
- Remaining amount → Equipment owner
- Booking created with status: "PENDING"
```

#### GET /api/stripe/account-status
Check owner onboarding status
```
HEADERS:
Authorization: Bearer <session_token>

RESPONSE (200):
{
  "hasAccount": true,
  "accountId": "acct_...",
  "charges_enabled": true,
  "details_submitted": true,
  "readyForPayments": true,
  "hasUnmetRequirements": false,
  "currentlyDue": [],
  "pastDue": []
}

RESPONSE (200) - no account:
{
  "hasAccount": false
}
```

---

### 5. ADMIN ANALYTICS ENDPOINTS

#### GET /api/analytics/unfulfilled-searches
Get top unfulfilled searches (admin only)
```
HEADERS:
Authorization: Bearer <session_token>

QUERY PARAMS:
- days: number (optional) - filter to last N days (default: 30)
- minCount: number (optional) - minimum count threshold
- query: string (optional) - substring filter for queries

RESPONSE (200):
{
  "topSearches": [
    {
      "query": "excavator",
      "_count": { "query": 150 }
    },
    {
      "query": "man lift 80ft",
      "_count": { "query": 98 }
    }
  ],
  "meta": {
    "days": 30,
    "minCount": 0,
    "query": ""
  }
}

ERROR (403):
{ "error": "Admin access required" }
```

#### GET /api/analytics/market-gaps
Market gap analysis (admin only)
```
QUERY PARAMS:
- days: number (optional) - filter to last N days (default: 30)

RESPONSE (200):
{
  "since": "2025-01-01T00:00:00Z",
  "gaps": [
    { "query": "excavator", "_count": { "query": 150 } }
  ]
}
```

#### GET /api/analytics/owner-stats
Owner statistics (authenticated)
```
RESPONSE (200):
{
  "equipmentCount": 4,
  "bookingCount": 12,
  "revenueCents": 245000
}
```

---

## Data Flow Diagrams

### 1. EQUIPMENT LISTING FLOW
```
┌─────────────┐
│   Owner     │
└──────┬──────┘
│
       ├─→ POST /api/equipment
       │   {title, category, specs, dailyRate|dailyRateCents}
       │
       ├─→ Prisma: Equipment.create()
       │
       └─→ Equipment stored with ownerId
           Available for search immediately
```

### 2. SEARCH AND UNFULFILLED LOGGING FLOW
```
┌─────────────┐
│   Renter    │
└──────┬──────┘
       │
       ├─→ POST /api/equipment/search
       │   {query: "80ft boom lift"}
       │
       ├─→ Prisma: Equipment.findMany()
       │   WHERE title/description/category CONTAINS query (case-insensitive)
       │
       ├─→ Results found?
       │   ├─ YES: Return results
       │   │       fulfilled = true
       │   │
       │   └─ NO: Log unfulfilled search
       │       Prisma: SearchLog.create()
       │       { query, fulfilled: false }
       │       (fire and forget - non-blocking)
       │
       └─→ Return response with results/empty
```

### 3. BOOKING & PAYMENT FLOW
```
┌─────────────┐
│   Renter    │
└──────┬──────┘
       │
       ├─→ POST /api/stripe/checkout
       │   {equipmentId, days}
       │
       ├─→ Verify equipment exists
       │   Verify owner has Stripe account
       │
       ├─→ Calculate prices:
       │   totalPrice = dailyRate × days
       │   platformFee = totalPrice × 0.10
       │   ownerAmount = totalPrice - platformFee
       │
       ├─→ stripe.checkout.sessions.create()
       │   With application_fee_amount
       │   With transfer_data.destination (owner)
       │
       ├─→ Prisma: Booking.create()
       │   status: "PENDING"
       │   stripeSessionId: <session_id>
       │
       └─→ Return sessionId to frontend
           Frontend redirects to Stripe Checkout
           
           ↓
           
       Renter pays on Stripe Checkout
       
           ↓
           
       Stripe webhook: checkout.session.completed
       
           ├─→ Prisma: Booking.update()
           │   status: "CONFIRMED"
           │
           └─→ Send confirmation email to both parties
```

### 4. OWNER ONBOARDING FLOW
```
┌──────────────┐
│ New Owner    │
└──────┬───────┘
       │
       ├─→ Click "Become a Lender"
       │
       ├─→ POST /api/stripe/connect
       │
       ├─→ stripe.accounts.create()
       │   type: "express"
       │   email: owner@example.com
       │   capabilities: [card_payments, transfers]
       │
       ├─→ Prisma: User.update()
       │   stripeAccountId: "acct_..."
       │
       ├─→ stripe.accountLinks.create()
       │   type: "account_onboarding"
       │   return_url: /owner/dashboard
       │
       └─→ Redirect owner to onboarding link
           Owner completes Stripe verification
           Owner redirected back to dashboard
           Ready to receive payments
```

---

## Request/Response Examples

### Example 1: Create Equipment Listing
```
CURL:
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "title": "1998 JLG 10054 Telehandler",
    "description": "Well-maintained with recent service",
    "category": "Telehandler",
    "specs": {
      "model": "JLG 10054",
      "year": 1998,
      "capacity_lbs": 10000,
      "lift_height_ft": 53.17,
      "engine": "Cummins F3.8",
      "hourMeter": 4500,
      "attachments": ["standard_carriage", "pallet_forks"]
    },
    "dailyRate": 350.00,
    "hourMeter": 4500
  }'

RESPONSE:
{
  "id": "clxyz123abc",
  "title": "1998 JLG 10054 Telehandler",
  "description": "Well-maintained with recent service",
  "category": "Telehandler",
  "specs": "{\"model\":\"JLG 10054\",\"year\":1998,...}",
  "dailyRate": 35000,
  "ownerId": "user_clerk_123",
  "available": true,
  "hourMeter": 4500,
  "createdAt": "2025-01-15T14:23:45Z"
}
```

### Example 2: Search with Unfulfilled Logging
```
CURL:
curl -X POST http://localhost:3000/api/equipment/search \
  -H "Content-Type: application/json" \
  -d '{"query":"80 foot boom lift"}'

RESPONSE (No results - unfulfilled):
{
  "results": [],
  "count": 0,
  "fulfilled": false
}

// Asynchronously, SearchLog entry created:
// {
//   query: "80 foot boom lift",
//   fulfilled: false,
//   timestamp: 2025-01-15T14:25:00Z
// }
```

### Example 3: Initiate Checkout
```
CURL:
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "equipmentId": "clxyz123abc",
    "days": 5
  }'

RESPONSE:
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0"
}

FRONTEND:
// Redirect to Stripe Checkout:
stripe.redirectToCheckout({ sessionId: "cs_test_..." })

DATABASE:
// Booking created:
{
  id: "booking_123",
  equipmentId: "clxyz123abc",
  renterId: "user_renter_456",
  startDate: 2025-02-15,
  endDate: 2025-02-20,
  totalPrice: 175000,  // $1750 in cents
  status: "PENDING",
  stripeSessionId: "cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

---

## Database Query Examples

### Find Available Equipment by Category
```typescript
const equipment = await prisma.equipment.findMany({
  where: {
    category: "Telehandler",
    available: true,
  },
  include: {
    owner: {
      select: { name: true, email: true, stripeAccountId: true }
    },
    bookings: {
      where: { status: "CONFIRMED" },
      select: { startDate: true, endDate: true }
    }
  },
  orderBy: { createdAt: "desc" },
});
```

### Get Top Unfulfilled Searches
```typescript
const topSearches = await prisma.searchLog.groupBy({
  by: ["query"],
  where: {
    fulfilled: false,
    timestamp: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  },
  _count: {
    query: true,
  },
  orderBy: {
    _count: {
      query: "desc",
    },
  },
  take: 20,
});
```

### Get Owner's Equipment Bookings
```typescript
const bookings = await prisma.booking.findMany({
  where: {
    equipment: {
      ownerId: userId,
    },
  },
  include: {
    equipment: {
      select: { title: true, dailyRate: true }
    },
  },
  orderBy: { startDate: "desc" },
});
```

---

## Error Responses

### Common Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Missing required fields | Incomplete request body |
| 401 | Unauthorized | No authentication token |
| 403 | Admin access required | User is not admin |
| 403 | Not authorized to update | User doesn't own equipment |
| 404 | Equipment not found | Invalid equipment ID |
| 422 | Invalid daily rate | Price malformed |
| 500 | Internal server error | Unexpected database error |

### Error Response Format
```json
{
  "error": "Equipment not found"
}
```

---

## Rate Limiting & Performance

### Recommendations
- Implement rate limiting on search endpoint (100 req/min per IP)
- Cache equipment listings (5-min TTL)
- Index Equipment table on: category, ownerId, available
- Index SearchLog table on: fulfilled, query, timestamp
- Paginate results (max 50 per page)

### Caching Strategy
```
GET /api/equipment
├─ Check Redis cache (key: "equipment:all")
├─ If cached: return (expires in 5 min)
└─ If miss:
    ├─ Query database
    ├─ Store in Redis
    └─ Return results
```

---

## Webhook Handling

### Stripe Events to Handle

**1. checkout.session.completed**
- Update Booking status → "CONFIRMED"
- Send confirmation emails
- Update Equipment available status if needed

**2. checkout.session.expired**
- Update Booking status → "CANCELLED"
- Log expiration

**3. charge.failed**
- Update Booking status → "FAILED"
- Notify renter

**4. account.updated**
- Verify Stripe account status
- Update User.stripeAccountId if changed

---

## Testing Endpoints with cURL

```bash
# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","callbackUrl":"/dashboard"}'

# Get all equipment
curl http://localhost:3000/api/equipment

# Search equipment
curl -X POST http://localhost:3000/api/equipment/search \
  -H "Content-Type: application/json" \
  -d '{"query":"boom lift"}'

# Create Stripe account
curl -X POST http://localhost:3000/api/stripe/connect \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Admin: Get unfulfilled searches
curl http://localhost:3000/api/analytics/unfulfilled-searches \
  -H "Authorization: Bearer <admin_token>"
```
