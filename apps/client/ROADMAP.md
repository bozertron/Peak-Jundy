# Peak Development Roadmap

## Current Status: Sprint 2 Complete

### Completed (Sprint 1-2)
- [x] Workspace cleanup (removed problematic .code-workspace files)
- [x] Type safety improvements (fixed `any` types in trust routes)
- [x] API response types added (conversations, cards, peaks endpoints)
- [x] Dev server unblocked (npm install, .env setup, prisma db push)
- [x] Jest testing infrastructure configured
- [x] React Testing Library integration
- [x] Playwright E2E testing setup
- [x] Test scripts added to package.json

---

## Pre-Launch Priority Queue

### HIGH PRIORITY - Deferred to Final Sprint (Group with Stripe/Money)

These items are intentionally deferred until final sprint before launch:

#### 1. Stripe Integration Testing
- [ ] Manual Stripe webhook testing (requires Stripe login)
- [ ] End-to-end payment flow testing
- [ ] Checkout/fee split verification
- [ ] Connect account onboarding flow
- **Blocker**: Requires Stripe credentials and test environment

#### 2. Security Updates
- [ ] Upgrade Next.js from 14.0.4 to 14.2.35+
  - Current version has CRITICAL security vulnerabilities
  - See: https://nextjs.org/blog/security-update-2025-12-11
- [ ] Run `npm audit fix` after Next.js upgrade
- [ ] Review and address remaining vulnerabilities

#### 3. CI/CD Pipeline
- [ ] Create GitHub Actions workflow for:
  - Type checking (`npm run typecheck`)
  - Linting (`npm run lint`)
  - Unit tests (`npm run test`)
  - E2E tests (`npm run test:e2e`)
- [ ] Add coverage reporting
- [ ] Add PR status checks

#### 4. Accessibility Audit
- [ ] Full WCAG 2.1 AA compliance audit
- [ ] Screen reader testing
- [ ] Keyboard navigation verification
- [ ] Color contrast validation
- [ ] Form label and ARIA attribute review

#### 5. Mobile Performance
- [ ] Mobile page speed verification
- [ ] Lighthouse performance audit
- [ ] Core Web Vitals optimization

---

## Schema Gap Analysis

**CRITICAL**: The Prisma schema is incomplete. The following models are used in API routes but not defined in schema:

### Missing Models (Need Implementation)
```prisma
model Vouch {
  id          String    @id @default(cuid())
  voucherId   String
  voucheeId   String
  broadcast   Boolean   @default(false)
  broadcastAt DateTime?
  createdAt   DateTime  @default(now())

  voucher     User      @relation("VouchesGiven", fields: [voucherId], references: [id])
  vouchee     User      @relation("VouchesReceived", fields: [voucheeId], references: [id])

  @@unique([voucherId, voucheeId])
}

model ContactCard {
  id          String   @id @default(cuid())
  collectorId String
  subjectId   String
  origin      String   // "conversation", "vouch", etc.
  createdAt   DateTime @default(now())

  collector   User     @relation("CardsCollected", fields: [collectorId], references: [id])
  subject     User     @relation("CardsAbout", fields: [subjectId], references: [id])

  @@unique([collectorId, subjectId])
}

model Conversation {
  id          String    @id @default(cuid())
  equipmentId String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  equipment   Equipment? @relation(fields: [equipmentId], references: [id])
  participants User[]
  messages    Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation(fields: [senderId], references: [id])
}

model TreasureChest {
  id          String    @id @default(cuid())
  title       String
  description String
  peaksCost   Int
  prizeType   String    // "discount", "peaks", "equipment", "badge"
  prizeValue  String    // JSON string
  available   Boolean   @default(true)
  claimedBy   String?
  claimedAt   DateTime?
  createdAt   DateTime  @default(now())
}

model PeaksTransaction {
  id            String   @id @default(cuid())
  userId        String
  amount        Int
  reason        String
  referenceId   String?
  referenceType String?
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])
}
```

### Missing User Fields
```prisma
// Add to User model:
avatarUrl       String?
flavor          String?
latitude        Float?
longitude       Float?
locationName    String?
memberSince     DateTime?
foundingMember  Boolean   @default(false)
peaksBalance    Int       @default(0)
```

---

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit Tests | 0% | 80% |
| API Tests | 0% | 90% |
| Component Tests | 0% | 70% |
| E2E Tests | 0% | 50% |

### Test Focus Areas
1. Trust network routes (security-critical)
2. Peaks/rewards system (economy integrity)
3. Conversation permissions (privacy)
4. Equipment visibility (trust model enforcement)

---

## Development Environment Setup

### Quick Start
```bash
cd "Peak Application/Peak Project"
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma generate
npx prisma db push
npm run dev
```

### Required Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | SQLite or PostgreSQL connection |
| NEXTAUTH_SECRET | Yes | Session encryption key |
| NEXTAUTH_URL | Yes | App URL (http://localhost:3000) |
| STRIPE_SECRET_KEY | For payments | Stripe API key |
| STRIPE_WEBHOOK_SECRET | For payments | Webhook verification |

---

## Notes

- **Dev Server Root Cause**: Was blocked due to missing node_modules and .env file
- **Schema Divergence**: API routes assume models that don't exist in schema.prisma
- **Security Alert**: Next.js 14.0.4 has critical vulnerabilities - upgrade before production
