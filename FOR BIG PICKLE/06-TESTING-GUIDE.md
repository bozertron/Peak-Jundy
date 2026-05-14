# Testing Guide

> How to write and run tests for Peak.

---

## Three Test Levels

| Level | Framework | Location | What It Tests |
|-------|-----------|----------|---------------|
| Unit | Jest | `__tests__/unit/` | Pure functions from `lib/` |
| API | Jest | `__tests__/api/` | Route handlers with mocked Prisma |
| E2E | Playwright | `__tests__/e2e/` | Real browser flows against running app |

---

## Running Tests

```bash
cd apps/client

# All Jest tests (unit + API + components)
npm run test

# Specific project
npm run test:unit           # Unit tests only
npm run test:api            # API route tests only
npm run test:components     # Component tests only

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (requires dev server running or auto-starts it)
npm run test:e2e

# E2E with UI mode (interactive debugging)
npm run test:e2e:ui

# Everything
npm run test:all            # Jest + Playwright
```

---

## Jest Configuration

From `jest.config.js`:

- **Preset**: `next/jest` (handles Next.js transforms, .env loading)
- **Environment**: `jest-environment-jsdom`
- **Setup files**:
  - `jest.setup.globals.ts` — Web API polyfills (Request, Response, etc.)
  - `jest.setup.ts` — Global mocks (Prisma, NextAuth, Stripe)
- **Module aliases**: `@/*` maps to `<rootDir>/*`
- **Test match**: `**/__tests__/**/*.(spec|test).[jt]s?(x)`
- **Coverage threshold**: 50% (branches, functions, lines, statements)

---

## How to Write a Unit Test

Test pure functions from `lib/`:

```typescript
// __tests__/unit/utils.test.ts
import { describe, it, expect } from "@jest/globals";
import { determineTier, calculateRentalPeaks, hasSufficientPeaks } from "@/lib/peaks";

describe("determineTier", () => {
  it("returns Explorer for 0 peaks", () => {
    expect(determineTier(0)).toBe("Explorer");
  });

  it("returns Trailblazer at 100 peaks", () => {
    expect(determineTier(100)).toBe("Trailblazer");
  });

  it("returns Alpine Elite at 5000+ peaks", () => {
    expect(determineTier(5000)).toBe("Alpine Elite");
    expect(determineTier(10000)).toBe("Alpine Elite");
  });
});

describe("calculateRentalPeaks", () => {
  it("awards 50 for first rental", () => {
    expect(calculateRentalPeaks(true)).toBe(50);
  });

  it("awards 25 for subsequent rentals", () => {
    expect(calculateRentalPeaks(false)).toBe(25);
  });

  it("adds duration bonus for week-long rentals", () => {
    expect(calculateRentalPeaks(false, 7)).toBe(30); // 25 + 5
  });
});

describe("hasSufficientPeaks", () => {
  it("returns true when balance covers cost", () => {
    expect(hasSufficientPeaks(100, 50)).toBe(true);
  });

  it("returns false when balance is insufficient", () => {
    expect(hasSufficientPeaks(10, 50)).toBe(false);
  });
});
```

---

## How to Write an API Test

Mock Prisma client, call route handler, assert response:

```typescript
// __tests__/api/cards.test.ts
import { describe, it, expect, beforeEach } from "@jest/globals";
import { GET, POST } from "@/app/api/cards/route";

// These are mocked in jest.setup.ts:
// - prisma (all methods are jest.fn())
// - getServerSession (returns mock session)

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetSession = getServerSession as jest.Mock;

describe("GET /api/cards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/cards");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns user's contact cards", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@peak.local", role: "USER" },
    });

    const mockCards = [
      { id: "card-1", collectorId: "user-1", subjectId: "user-2", origin: "vouch" },
    ];
    (mockPrisma.contactCard.findMany as jest.Mock).mockResolvedValue(mockCards);

    const request = new Request("http://localhost:3000/api/cards");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cards).toHaveLength(1);
  });
});

describe("POST /api/cards", () => {
  it("creates a contact card", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@peak.local", role: "USER" },
    });

    const newCard = { subjectId: "user-2", origin: "vouch" };
    (mockPrisma.contactCard.create as jest.Mock).mockResolvedValue({
      id: "card-new",
      ...newCard,
      collectorId: "user-1",
    });

    const request = new Request("http://localhost:3000/api/cards", {
      method: "POST",
      body: JSON.stringify(newCard),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

---

## How to Write an E2E Test

Playwright tests run against a real browser:

```typescript
// __tests__/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Peak/);
});

test("equipment browse page renders", async ({ page }) => {
  await page.goto("/browse");
  await expect(page.locator("h1")).toBeVisible();
});

test("unauthenticated user is redirected from dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/auth\/signin/);
});
```

### Auth in E2E Tests

For authenticated flows, use the magic-link auth approach:

```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("magic link sign-in flow", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.fill('input[name="email"]', "test@peak.local");
  await page.click('button[type="submit"]');
  // Check Mailpit for the magic link (http://localhost:8025)
  // Navigate to the link to complete auth
});
```

---

## Playwright Configuration

From `playwright.config.ts`:

- **Test directory**: `__tests__/e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web server**: Auto-starts `npm run dev` before tests
- **Screenshots**: On failure only
- **Traces**: On first retry

---

## Seed Data as Test Fixtures

The `prisma/seed.js` provides a stable foundation for tests:
- Seeded users with known emails and roles
- Seeded equipment with known categories and prices
- Seeded vouches, conversations, transactions

Tests can reference these known entities by their seeded IDs.

---

## Coverage

```bash
npm run test:coverage
```

Threshold (from `jest.config.js`):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

Coverage collected from: `app/`, `components/`, `lib/` (excluding `.d.ts` and `node_modules`).

---

## Before Pushing

The full pre-push verification:

```bash
npm run typecheck && npm run lint && npm run test
```

For thorough verification (includes E2E):
```bash
npm run typecheck && npm run lint && npm run test:all
```
