# Peak Rentals: Comprehensive LLM Coding Reference

## 🎯 Project Overview

**Peak Rentals** is a peer-to-peer heavy equipment rental marketplace connecting equipment owners with renters. It's a **3-sided marketplace** (platform, owners, renters) built on **Next.js 14** with Stripe Connect payment processing and market intelligence tracking.

### Core Mission
Enable equipment owners (telehandlers, boom lifts, skid steers, construction tools) to monetize their assets while providing renters with transparent access to specialized equipment with professional payment handling.

---

## 📊 Market Verticals & Equipment Categories

### Heavy Equipment
- **Telehandlers**: JLG 10054, 1979 60ft boom lifts
- **Aerial Lifts**: Boom lifts, man lifts, scissor lifts
- **Compact Equipment**: Skid steers, compact track loaders
- **Specialty Equipment**: Jumping jack tampers, packing equipment
- **Construction Materials**: ICF bracing systems (Plumwall 10ft), formwork

### Technical Data Storage
Equipment specs are stored as **JSON strings** in the `specs` field to accommodate:
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

---

## 🏗️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 14.0.4 |
| **Runtime** | Node.js + React | 18 |
| **Language** | TypeScript | ^5 |
| **Database** | SQLite (Prisma) | ^5.8.0 |
| **Authentication** | NextAuth.js | ^4.24.5 |
| **Payments** | Stripe (Connect) | ^14.12.0 |
| **Styling** | Tailwind CSS | ^3.3.0 |
| **Build Tools** | PostCSS, Autoprefixer | Latest |

---

## 💾 Database Schema (Prisma)

### Equipment Model
```prisma
model Equipment {
  id          String    @id @default(cuid())         // Unique identifier
  createdAt   DateTime  @default(now())              // Listing creation timestamp
  title       String                                  // e.g., "1998 JLG 10054 Telehandler"
  description String                                  // Detailed listing description
  specs       String                                  // JSON string with technical data
  category    String                                  // e.g., "Telehandler", "Boom Lift"
  ownerId     String                                  // Reference to owner (User)
  dailyRate   Int                                     // Price in CENTS (avoid floats)
  available   Boolean   @default(true)                // Availability status
  hourMeter   Float?                                  // Optional odometer/hour reading
  
  owner User @relation(fields: [ownerId], references: [id])
}
```

### SearchLog Model
```prisma
model SearchLog {
  id        Int      @id @default(autoincrement())
  query     String                                    // Search term entered by user
  timestamp DateTime @default(now())                  // When search occurred
  fulfilled Boolean  @default(false)                  // true = results found, false = no matches
}
```

**Purpose**: Admin dashboard shows **unfulfilled searches** (fulfilled: false) to identify market gaps and guide listing creation.

### User Model (NextAuth)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]                             // OAuth connections
  stripeAccountId String? @unique                     // Owner's Stripe Express account
  items         Equipment[]                           // Equipment listings owned by user
}
```

### Account Model (NextAuth OAuth)
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

---

## 🔐 Authentication & Authorization

### NextAuth.js Setup
- **Provider**: Email-based authentication (passwordless)
- **Adapter**: Prisma
- **Session Strategy**: Database sessions
- **Callbacks**: Verify user role (admin vs regular user)

### Role-Based Access Control (RBAC)
```typescript
// User types (extend User model with role if needed)
- "USER" (default) → Can browse, rent, list equipment
- "OWNER" → Can create/edit listings, access payouts
- "ADMIN" → Can view dashboard, see unfulfilled searches
```

### Protected Routes Pattern
```typescript
// Middleware to check authentication
if (!session) {
  redirect('/auth/signin');
}

// Middleware to check admin role
if (session.user.role !== 'ADMIN') {
  return new Response('Unauthorized', { status: 403 });
}
```

---

## 💳 Stripe Integration (Stripe Connect)

### Account Types
- **Platform Account**: Peak Rentals main Stripe account (holds platform fees)
- **Express Accounts**: Individual owner accounts (receive rental payments)

### Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. OWNER ONBOARDING                                         │
├─────────────────────────────────────────────────────────────┤
│ • User clicks "Become a Lender"                             │
│ • createConnectedAccount(userId) creates Stripe Express     │
│ • stripeAccountId stored in User.stripeAccountId            │
│ • createAccountLink(accountId) returns onboarding URL       │
│ • Owner completes Stripe verification                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. RENTER CHECKOUT                                          │
├─────────────────────────────────────────────────────────────┤
│ • Renter selects equipment and rental period               │
│ • System calculates: totalPrice = dailyRate * days          │
│ • Platform fee = totalPrice * 10% (configurable)            │
│ • Owner receives = totalPrice - platformFee                 │
│ • createCheckoutSession() initiates payment                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PAYMENT PROCESSING                                       │
├─────────────────────────────────────────────────────────────┤
│ • Renter pays via Stripe Checkout (card payment)            │
│ • Platform fee → Peak Rentals Stripe account                │
│ • Rental amount → Owner's Stripe Express account            │
│ • Webhook confirms transaction success                      │
│ • Booking record created in database                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Stripe Functions

**1. Create Connected Account (Owner)**
```typescript
async function createConnectedAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  
  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });
  
  return account.id;
}
```

**2. Create Onboarding Link**
```typescript
async function createAccountLink(accountId: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'https://peakrentals.com/reauth',
    return_url: 'https://peakrentals.com/dashboard',
    type: 'account_onboarding',
  });
}
```

**3. Create Checkout Session (Renter)**
```typescript
async function createCheckoutSession(itemId: string, ownerStripeAccountId: string) {
  const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee
  const item = await prisma.equipment.findUnique({ where: { id: itemId } });
  
  const platformFee = Math.floor(item.dailyRate * PLATFORM_FEE_PERCENT);
  
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: item.title },
        unit_amount: item.dailyRate, // in cents
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: ownerStripeAccountId },
    },
    success_url: 'https://peakrentals.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://peakrentals.com/cancel',
  });
}
```

### Price Calculation
- **Store prices in cents** to avoid floating-point errors
- **Example**: $350/day = 35000 cents in database
- **Platform fee**: 10% (configurable in dashboard)
- **Owner payout**: 90% of rental price

---

## 📡 API Routes

### Authentication
```
POST   /api/auth/signin              → NextAuth signin endpoint
POST   /api/auth/signout             → NextAuth signout endpoint
POST   /api/auth/callback/[provider] → OAuth callback
```

### Equipment Management
```
GET    /api/equipment                → Fetch all equipment (with filtering)
POST   /api/equipment                → Create new listing (auth required)
PUT    /api/equipment/[id]           → Update listing (owner only)
DELETE /api/equipment/[id]           → Delete listing (owner only)
GET    /api/equipment/[id]           → Get single equipment details
POST   /api/equipment/search         → Search with unfulfilled tracking
```

### Stripe Integration
```
POST   /api/stripe/connect           → Create connected account (owner)
POST   /api/stripe/checkout          → Create checkout session (renter)
POST   /api/stripe/webhook           → Receive Stripe events
GET    /api/stripe/account-status    → Check owner onboarding status
```

### Admin Analytics
```
GET    /api/analytics/unfulfilled-searches  → Top unfulfilled searches
GET    /api/analytics/market-gaps           → Market gap analysis
GET    /api/analytics/owner-stats           → Owner statistics
```

---

## 📄 Page Structure

### Public Pages
```
/ → Home/marketplace listing
/browse → Equipment search & filter
/equipment/[id] → Equipment detail page
/auth/signin → Sign in page
```

### User Pages (authenticated)
```
/dashboard → User dashboard
/dashboard/listings → My listings (for owners)
/dashboard/rentals → My active rentals
/dashboard/profile → Profile settings
```

### Owner Pages
```
/owner/onboarding → Stripe Connect setup
/owner/dashboard → Owner dashboard with analytics
/owner/create-listing → Create new equipment listing
/owner/listings/[id]/edit → Edit equipment listing
```

### Admin Pages (admin only)
```
/admin/dashboard → Main admin dashboard
/admin/dashboard/unfulfilled → Unfulfilled search analysis
/admin/users → User management
/admin/settings → Platform settings
```

---

## 🔍 Search & Market Intelligence

### Search Flow
1. User enters search query (e.g., "80 foot boom lift")
2. API searches Equipment table: `title` or `category` contains query
3. **If results.length === 0**:
   - Create SearchLog entry with `fulfilled: false`
   - Non-blocking async operation
4. Return results to user

### Unfulfilled Search Logging
```typescript
// Middleware in search endpoint
if (results.length === 0) {
  // Fire and forget - don't block response
  prisma.searchLog.create({
    data: {
      query: searchTerm,
      fulfilled: false,
      timestamp: new Date(),
    }
  }).catch(err => console.error('SearchLog error:', err));
}
```

### Admin Analytics Endpoint
```typescript
// GET /api/analytics/unfulfilled-searches
const topSearches = await prisma.searchLog.groupBy({
  by: ['query'],
  where: { fulfilled: false },
  _count: { query: true },
  orderBy: { _count: { query: 'desc' } },
  take: 20,
});

// Returns: [
//   { query: "excavator", _count: { query: 150 } },
//   { query: "man lift 80ft", _count: { query: 98 } },
//   ...
// ]
```

---

## 🎨 UI Components (to be built)

### Core Components
- `EquipmentCard` → Display equipment listing
- `SearchBar` → Equipment search with autocomplete
- `EquipmentForm` → Multi-step form for creating/editing listings
- `EquipmentDetail` → Full equipment page
- `CheckoutFlow` → Stripe checkout integration
- `AdminAnalyticsDashboard` → Unfulfilled searches table
- `OwnerOnboarding` → Stripe Connect flow

---

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
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

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# OAuth (if using GitHub/Google)
GITHUB_ID=xxxxx
GITHUB_SECRET=xxxxx
```

---

## 📝 Critical Implementation Notes

### Money Handling
- **ALWAYS store prices in cents** (use integer)
- Never use floating-point for currency
- Example: $350 = 35000 cents
- Calculate fees with `Math.floor()` to avoid decimal issues

### Database Relations
- Equipment → User (many-to-one, owner)
- SearchLog → User (optional, for tracking which user searched)
- User → Stripe account (one-to-one)

### Search Performance
- Add indexes on `Equipment.category`, `Equipment.title`
- Add index on `SearchLog.query`, `SearchLog.fulfilled`
- Consider full-text search for large deployments

### Security
- Verify owner before allowing listing edits
- Verify owner's stripeAccountId before checkout
- Use middleware to check admin role
- Sanitize search queries
- CORS policy for API routes

### Error Handling
- Stripe errors → User-friendly messages
- Database errors → Log and return generic 500 response
- Auth errors → Redirect to signin

---

## 🧠 LLM Agent Instructions

When implementing features, follow this approach:

1. **Read the schema first** - Understand data models
2. **Check the API pattern** - Follow existing conventions
3. **Implement API routes** - Backend first (type-safe)
4. **Build UI components** - Front-end after
5. **Test thoroughly** - Especially payment flows
6. **Consider mobile** - Responsive design
7. **Handle errors gracefully** - User feedback
8. **Document code** - Comments for complex logic

---

## 🎯 Success Criteria

✅ Equipment owners can list heavy equipment with specs
✅ Renters can search and find available equipment
✅ Unfulfilled searches are tracked for market insights
✅ Stripe Connect handles payments securely
✅ Admin dashboard shows market gaps
✅ Mobile-responsive design
✅ Fast search performance
✅ Secure authentication and authorization

