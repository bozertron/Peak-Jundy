# Peak Rentals: Detailed Implementation Playbook for LLM Agents

## Part 1: Project Initialization Sequence

### Step 1.1: Create Next.js Project with Proper Config
```bash
npx create-next-app@latest peak-rentals --typescript --tailwind
```

**Key Configuration (next.config.js)**
```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For development
  },
};

module.exports = nextConfig;
```

### Step 1.2: Install Required Dependencies
```bash
npm install @prisma/client next-auth stripe
npm install -D prisma @types/node @types/react typescript
```

### Step 1.3: Set Up Prisma
```bash
npx prisma init
```

Create `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  stripeAccountId String? @unique
  role          String    @default("USER")
  
  accounts      Account[]
  equipment     Equipment[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

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

model Equipment {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  title       String
  description String
  specs       String    // JSON string
  category    String
  ownerId     String
  dailyRate   Int       // In cents
  available   Boolean   @default(true)
  hourMeter   Float?
  
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  bookings    Booking[]
  
  @@index([ownerId])
  @@index([category])
}

model Booking {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  
  equipmentId String
  renterId    String
  startDate   DateTime
  endDate     DateTime
  totalPrice  Int       // In cents
  status      String    @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
  stripeSessionId String?
  
  equipment   Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  
  @@index([equipmentId])
  @@index([renterId])
}

model SearchLog {
  id        Int      @id @default(autoincrement())
  query     String
  userId    String?
  timestamp DateTime @default(now())
  fulfilled Boolean  @default(false)
  
  @@index([fulfilled])
  @@index([query])
}
```

### Step 1.4: Configure Environment Variables
Create `.env.local`:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
PLATFORM_FEE_BPS=1000
```

### Step 1.5: Run Initial Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Part 2: NextAuth.js Configuration

### Step 2.1: Create Auth Configuration
**File: `lib/auth.ts`**
```typescript
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

const emailServerHost = process.env.EMAIL_SERVER_HOST ?? "localhost";
const emailServerPort = Number(process.env.EMAIL_SERVER_PORT || 587);
const emailServerUser = process.env.EMAIL_SERVER_USER ?? "";
const emailServerPassword = process.env.EMAIL_SERVER_PASSWORD ?? "";
const emailFrom = process.env.EMAIL_FROM ?? "Peak Rentals <noreply@peakrentals.local>";
const authSecret = process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: emailServerHost,
        port: emailServerPort,
        auth: {
          user: emailServerUser,
          pass: emailServerPassword,
        },
      },
      from: emailFrom,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "USER";
        session.user.stripeAccountId = user.stripeAccountId ?? null;
      }
      return session;
    },
  },
  ...(authSecret ? { secret: authSecret } : {}),
};
```

### Step 2.2: Create Auth Route Handlers
**File: `app/api/auth/[...nextauth]/route.ts`**
```typescript
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Step 2.3: Create Prisma Client Utility
**File: `lib/prisma.ts`**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Part 3: Stripe Integration

### Step 3.1: Create Stripe Service Module
**File: `lib/stripe.ts`**
```typescript
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const STRIPE_API_VERSION = "2024-06-20";
const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS || 1000); // 10%

let stripeClient: Stripe | null = null;

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION });
  }

  return stripeClient;
}

async function createConnectedAccount(
  userId: string,
  options?: { displayName?: string; contactEmail?: string }
) {
  const stripe = getStripeClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.stripeAccountId) {
    throw new Error("User already has a Stripe account");
  }

  const accountParams: Stripe.AccountCreateParams = {
    type: "express",
    country: "US",
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  };

  const email = options?.contactEmail ?? user.email ?? undefined;
  if (email) accountParams.email = email;

  if (options?.displayName) {
    accountParams.business_profile = { name: options.displayName };
  }

  const account = await stripe.accounts.create(accountParams);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}

async function createAccountLink(accountId: string) {
  const stripe = getStripeClient();
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/owner/reauth`,
    return_url: `${baseUrl}/owner/dashboard`,
    type: "account_onboarding",
  });

  return link.url;
}

async function createCheckoutSession(params: {
  equipmentId: string;
  dailyRate: number; // cents
  days: number;
  renterId: string;
  ownerStripeAccountId: string;
  equipmentTitle?: string;
  equipmentDescription?: string;
}) {
  const stripe = getStripeClient();
  const totalAmount = params.dailyRate * params.days;
  const applicationFee = Math.round((totalAmount * PLATFORM_FEE_BPS) / 10000);

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name:
              params.equipmentTitle ||
              `Equipment Rental (${params.days} day${params.days === 1 ? "" : "s"})`,
            ...(params.equipmentDescription
              ? { description: params.equipmentDescription }
              : {}),
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: { destination: params.ownerStripeAccountId },
    },
    success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/booking/cancel`,
    metadata: {
      equipmentId: params.equipmentId,
      renterId: params.renterId,
      days: String(params.days),
    },
  });

  return session;
}

async function getAccountStatus(accountId: string) {
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const currentlyDue = account.requirements?.currently_due || [];
  const pastDue = account.requirements?.past_due || [];
  const hasUnmetRequirements = currentlyDue.length > 0 || pastDue.length > 0;

  return {
    id: account.id,
    accountId: account.id,
    charges_enabled: account.charges_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
    readyToReceivePayments: chargesEnabled && payoutsEnabled,
    readyForPayments: chargesEnabled && payoutsEnabled && !hasUnmetRequirements,
    hasUnmetRequirements,
    requirementsStatus: account.requirements?.eventually_due ? "Pending" : "Active",
    currentlyDue,
    pastDue,
  };
}

async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}

async function retrieveSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

async function handleWebhookEvent(rawBody: string, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const equipmentId = session.metadata?.equipmentId;
    const renterId = session.metadata?.renterId;
    const days = Number(session.metadata?.days || 1);
    const amountTotal = session.amount_total ?? 0;

    if (!equipmentId || !renterId) return;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.max(1, days));

    const existing = await prisma.booking.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: "CONFIRMED",
          totalPrice: amountTotal,
          startDate,
          endDate,
        },
      });
    } else {
      await prisma.booking.create({
        data: {
          equipmentId,
          renterId,
          startDate,
          endDate,
          totalPrice: amountTotal,
          status: "CONFIRMED",
          stripeSessionId: session.id,
        },
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const existing = await prisma.booking.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "stripe_session_expired",
        },
      });
    }
  }

  return { received: true };
}

async function createProduct(params: {
  name: string;
  description: string;
  priceInCents: number;
  connectedAccountId: string;
  equipmentId?: string;
}) {
  const stripe = getStripeClient();
  return stripe.products.create({
    name: params.name,
    description: params.description,
    default_price_data: {
      unit_amount: params.priceInCents,
      currency: "usd",
    },
    metadata: {
      connected_account_id: params.connectedAccountId,
      equipment_id: params.equipmentId || "",
    },
  });
}

async function getProducts() {
  const stripe = getStripeClient();
  const products = await stripe.products.list({
    limit: 100,
    expand: ["data.default_price"],
  });

  return products.data;
}

function validateWebhookSignature(body: string | Buffer, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export const stripeService = {
  createConnectedAccount,
  createAccountLink,
  createProduct,
  getProducts,
  createCheckoutSession,
  getAccountStatus,
  retrieveCheckoutSession,
  retrieveSession,
  handleWebhookEvent,
  validateWebhookSignature,
};
```

### Step 3.2: Create Stripe Webhook Handler
**File: `app/api/stripe/webhook/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { stripeService } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  try {
    const result = await stripeService.handleWebhookEvent(rawBody, signature);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Webhook error:", err);
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

---

## Part 4: API Routes Implementation

### Step 4.1: Equipment CRUD Routes
**File: `app/api/equipment/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  formatValidationErrors,
  hasErrors,
  validateEquipment,
} from "@/lib/validation";

function normalizeSpecs(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "{}";
}

function normalizeDailyRate(
  dailyRate: unknown,
  dailyRateCents: unknown
): number | null {
  const raw =
    dailyRateCents !== undefined && dailyRateCents !== null ? dailyRateCents : dailyRate;
  if (raw === undefined || raw === null || raw === "") return null;

  const numeric =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  if (!Number.isFinite(numeric) || numeric < 0) return null;

  if (dailyRateCents !== undefined && dailyRateCents !== null) {
    return Math.round(numeric);
  }

  // Assume dollars unless the value already looks like cents (>= 10000).
  return Math.round(numeric >= 10000 ? numeric : numeric * 100);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const available = searchParams.get("available");
  const skip = Number(searchParams.get("skip") || "0");
  const take = Math.min(Number(searchParams.get("take") || "20"), 100);

  try {
    const where = {
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(available !== null ? { available: available === "true" } : {}),
    };

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { owner: { select: { name: true, stripeAccountId: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json(
      {
        equipment,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          pages: Math.ceil(total / take),
          hasMore: skip + take < total,
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/equipment error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      specs,
      category,
      dailyRate,
      dailyRateCents,
      available,
      hourMeter,
      image,
      location,
    } = body;

    const dailyRateNumber = normalizeDailyRate(dailyRate, dailyRateCents);
    const hourMeterNumber =
      hourMeter === null || hourMeter === undefined || hourMeter === ""
        ? null
        : Number(hourMeter);

    const normalized = {
      title: typeof title === "string" ? title : "",
      description: typeof description === "string" ? description : "",
      category: typeof category === "string" ? category : "",
      dailyRate: dailyRateNumber,
      available: typeof available === "boolean" ? available : true,
      specs: normalizeSpecs(specs),
      hourMeter: hourMeterNumber,
      image: typeof image === "string" ? image.trim() || null : null,
      location:
        typeof location === "string" ? location.trim() || null : null,
    };

    const errors = validateEquipment(normalized);
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    if (dailyRateNumber === null) {
      return NextResponse.json(
        { error: "Invalid daily rate" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        title: normalized.title,
        description: normalized.description,
        specs: normalized.specs,
        category: normalized.category,
        dailyRate: dailyRateNumber,
        available: normalized.available,
        hourMeter: normalized.hourMeter,
        image: normalized.image ?? null,
        location: normalized.location ?? null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment error:", error);
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
```

**File: `app/api/equipment/[id]/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  formatValidationErrors,
  hasErrors,
  validateEquipment,
} from "@/lib/validation";

function normalizeSpecs(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "{}";
}

function normalizeDailyRate(
  dailyRate: unknown,
  dailyRateCents: unknown
): number | null {
  const raw =
    dailyRateCents !== undefined && dailyRateCents !== null ? dailyRateCents : dailyRate;
  if (raw === undefined || raw === null || raw === "") return null;

  const numeric =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  if (!Number.isFinite(numeric) || numeric < 0) return null;

  if (dailyRateCents !== undefined && dailyRateCents !== null) {
    return Math.round(numeric);
  }

  return Math.round(numeric >= 10000 ? numeric : numeric * 100);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: { owner: { select: { name: true, stripeAccountId: true } } },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("GET /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      specs,
      dailyRate,
      dailyRateCents,
      available,
      hourMeter,
      image,
      location,
    } = body;

    const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this equipment" }, { status: 403 });
    }

    const dailyRateNumber =
      dailyRate === undefined && dailyRateCents === undefined
        ? existing.dailyRate
        : normalizeDailyRate(dailyRate, dailyRateCents);
    const hourMeterValue =
      hourMeter === undefined
        ? existing.hourMeter
        : hourMeter === null || hourMeter === ""
        ? null
        : Number(hourMeter);

    const normalizedSpecs =
      specs === undefined ? existing.specs : normalizeSpecs(specs);

    const normalizedImage =
      image === undefined
        ? existing.image
        : image === null
        ? null
        : typeof image === "string"
        ? image.trim() || null
        : existing.image;

    const normalizedLocation =
      location === undefined
        ? existing.location
        : location === null
        ? null
        : typeof location === "string"
        ? location.trim() || null
        : existing.location;

    const validationInput = {
      title: typeof title === "string" ? title : existing.title,
      description:
        typeof description === "string" ? description : existing.description,
      category: typeof category === "string" ? category : existing.category,
      specs: normalizedSpecs,
      dailyRate: dailyRateNumber ?? existing.dailyRate,
      available: typeof available === "boolean" ? available : existing.available,
      hourMeter: hourMeterValue ?? null,
      image: normalizedImage ?? null,
      location: normalizedLocation ?? null,
    };

    const errors = validateEquipment(validationInput);
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    if (dailyRateNumber === null) {
      return NextResponse.json(
        { error: "Invalid daily rate" },
        { status: 400 }
      );
    }

    const updated = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        title: validationInput.title,
        description: validationInput.description,
        category: validationInput.category,
        specs: validationInput.specs,
        dailyRate: dailyRateNumber,
        available: validationInput.available,
        hourMeter: hourMeterValue,
        image: normalizedImage,
        location: normalizedLocation,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this equipment" }, { status: 403 });
    }

    await prisma.equipment.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Equipment deleted" });
  } catch (error) {
    console.error("DELETE /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
```

### Step 4.2: Search with Unfulfilled Tracking
**File: `app/api/equipment/search/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  formatValidationErrors,
  hasErrors,
  validateSearch,
} from "@/lib/validation";
import type { EquipmentSearchRequest } from "@/lib/types";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();

function getClientKey(req: Request, userId: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0]?.trim() || "unknown"}`;
  const realIp = req.headers.get("x-real-ip");
  return `ip:${realIp || "unknown"}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EquipmentSearchRequest;
    const { query, category } = body;

    const errors: Record<string, string> = {};
    if (typeof query !== "string") {
      errors.query = "Query must be a string";
    } else {
      Object.assign(errors, validateSearch(query));
    }

    if (category !== undefined && typeof category !== "string") {
      errors.category = "Category must be a string";
    }

    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const rateKey = getClientKey(req, userId);
    const rateLimit = checkRateLimit(rateKey);

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        }
      );
    }

    const trimmedQuery = query.trim();

    const results = await prisma.equipment.findMany({
      where: {
        available: true,
        AND: [
          {
            OR: [
              { title: { contains: trimmedQuery, mode: "insensitive" } },
              { description: { contains: trimmedQuery, mode: "insensitive" } },
              { category: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          },
          ...(category
            ? [{ category: { equals: category, mode: "insensitive" } }]
            : []),
        ],
      },
      include: { owner: { select: { name: true, stripeAccountId: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (results.length === 0) {
      prisma.searchLog
        .create({
          data: {
            query: trimmedQuery,
            fulfilled: false,
            userId,
            timestamp: new Date(),
          },
        })
        .catch((err) => console.error("SearchLog error:", err));
    }

    return NextResponse.json(
      {
        results,
        count: results.length,
        fulfilled: results.length > 0,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
```

### Step 4.3: Stripe Connect + Checkout Routes
**File: `app/api/stripe/connect/account/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { StripeConnectAccountRequest } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = (await req.json()) as StripeConnectAccountRequest;
    const { displayName, contactEmail } = body;

    if (!displayName || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: displayName, contactEmail" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.stripeAccountId) {
      if (user.role === "USER") {
        await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
      }
      return NextResponse.json(
        {
          error: "User already has a connected account",
          accountId: user.stripeAccountId,
        },
        { status: 400 }
      );
    }

    const accountId = await stripeService.createConnectedAccount(userId, {
      displayName,
      contactEmail,
    });

    if (user?.role === "USER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
    }

    return NextResponse.json(
      {
        success: true,
        accountId,
        message: "Connected account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating connected account:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create account",
      },
      { status: 500 }
    );
  }
}
```

**File: `app/api/stripe/connect/onboarding-link/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required query parameter: accountId" },
        { status: 400 }
      );
    }

    const onboardingUrl = await stripeService.createAccountLink(accountId);

    return NextResponse.json(
      {
        success: true,
        url: onboardingUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating onboarding link:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate link",
      },
      { status: 500 }
    );
  }
}
```

**File: `app/api/stripe/connect/account-status/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required query parameter: accountId" },
        { status: 400 }
      );
    }

    const status = await stripeService.getAccountStatus(accountId);

    return NextResponse.json(
      {
        success: true,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving account status:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to retrieve status",
      },
      { status: 500 }
    );
  }
}
```

**File: `app/api/stripe/connect/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const accountId = user.stripeAccountId || (await stripeService.createConnectedAccount(userId));
    const url = await stripeService.createAccountLink(accountId);

    if (user.role === "USER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe connect error:", error);
    return NextResponse.json({ error: "Failed to connect Stripe" }, { status: 500 });
  }
}
```

**File: `app/api/stripe/account-status/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.stripeAccountId) {
    return NextResponse.json({ hasAccount: false });
  }

  try {
    const status = await stripeService.getAccountStatus(user.stripeAccountId);
    return NextResponse.json({ hasAccount: true, ...status });
  } catch (e) {
    console.error("Account status error:", e);
    return NextResponse.json({ error: "Failed to retrieve Stripe status" }, { status: 500 });
  }
}
```

**File: `app/api/stripe/checkout/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";
import {
  formatValidationErrors,
  hasErrors,
  validateCheckout,
} from "@/lib/validation";
import type { StripeCheckoutRequest } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as StripeCheckoutRequest;
    const equipmentId =
      typeof body.equipmentId === "string" ? body.equipmentId : "";
    const days = Number(body.days);

    const errors = validateCheckout({ equipmentId, days });
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { owner: true },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
    if (!equipment.available) {
      return NextResponse.json({ error: "Equipment unavailable" }, { status: 400 });
    }
    if (!equipment.owner.stripeAccountId) {
      return NextResponse.json({ error: "Owner not onboarded to Stripe" }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    const totalPrice = equipment.dailyRate * days;

    const checkout = await stripeService.createCheckoutSession({
      equipmentId,
      dailyRate: equipment.dailyRate,
      days,
      renterId: session.user.id,
      ownerStripeAccountId: equipment.owner.stripeAccountId,
      equipmentTitle: equipment.title,
      equipmentDescription: equipment.description,
    });

    await prisma.booking.create({
      data: {
        equipmentId,
        renterId: session.user.id,
        startDate,
        endDate,
        totalPrice,
        status: "PENDING",
        stripeSessionId: checkout.id,
      },
    });

    return NextResponse.json({ sessionId: checkout.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
```

**File: `app/api/stripe/products/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import type { StripeProductRequest } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden - only owners can create products" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as StripeProductRequest;
    const {
      name,
      description,
      priceInCents,
      connectedAccountId,
      equipmentId,
    } = body;

    if (!name || !description || !priceInCents || !connectedAccountId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, description, priceInCents, connectedAccountId",
        },
        { status: 400 }
      );
    }

    if (typeof priceInCents !== "number" || priceInCents <= 0) {
      return NextResponse.json(
        { error: "priceInCents must be a positive number" },
        { status: 400 }
      );
    }

    const product = await stripeService.createProduct({
      name,
      description,
      priceInCents,
      connectedAccountId,
      ...(equipmentId ? { equipmentId } : {}),
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}
```

### Step 4.4: Admin Analytics Routes
**File: `app/api/analytics/unfulfilled-searches/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const daysParam = Number(searchParams.get("days"));
    const minCountParam = Number(searchParams.get("minCount"));
    const queryFilter = (searchParams.get("query") || "").trim().toLowerCase();

    const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await prisma.searchLog.groupBy({
      by: ["query"],
      where: { fulfilled: false, timestamp: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 100,
    });

    let filtered = grouped;
    if (queryFilter) {
      filtered = filtered.filter((row) =>
        row.query.toLowerCase().includes(queryFilter)
      );
    }

    const minCount =
      Number.isFinite(minCountParam) && minCountParam > 0
        ? minCountParam
        : 0;
    if (minCount > 0) {
      filtered = filtered.filter((row) => row._count.query >= minCount);
    }

    const topSearches = filtered.slice(0, 50);

    return NextResponse.json({
      topSearches,
      meta: { days, minCount, query: queryFilter },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
```

### Step 4.5: Market Gaps + Owner Stats
**File: `app/api/analytics/market-gaps/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
  const since = new Date();
  since.setDate(since.getDate() - Math.max(1, days));

  try {
    const gaps = await prisma.searchLog.groupBy({
      by: ["query"],
      where: { fulfilled: false, timestamp: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 50,
    });

    return NextResponse.json({ since, gaps });
  } catch (e) {
    console.error("Market gaps error:", e);
    return NextResponse.json({ error: "Failed to fetch market gaps" }, { status: 500 });
  }
}
```

**File: `app/api/analytics/owner-stats/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const [equipmentCount, bookingCount, revenue] = await Promise.all([
      prisma.equipment.count({ where: { ownerId: userId } }),
      prisma.booking.count({ where: { equipment: { ownerId: userId } } }),
      prisma.booking.aggregate({
        where: { equipment: { ownerId: userId }, status: "CONFIRMED" },
        _sum: { totalPrice: true },
      }),
    ]);

    return NextResponse.json({
      equipmentCount,
      bookingCount,
      revenueCents: revenue._sum.totalPrice ?? 0,
    });
  } catch (error) {
    console.error("Owner stats error:", error);
    return NextResponse.json({ error: "Failed to fetch owner stats" }, { status: 500 });
  }
}
```

### Step 4.6: Booking Routes
**File: `app/api/bookings/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const bookings = await prisma.booking.findMany({
      where: { renterId: userId },
      orderBy: { createdAt: "desc" },
      include: { equipment: { include: { owner: { select: { name: true } } } } },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
```

---

## Part 5: Frontend Components

### Step 5.1: Equipment Card Component
**File: `components/Equipment/EquipmentCard.tsx`**
```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Equipment } from "@/lib/types";

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({
  equipment,
}: EquipmentCardProps) {
  const {
    id,
    title,
    category,
    dailyRate,
    owner,
    image,
    available = true,
    location,
  } = equipment;
  return (
    <Link href={`/equipment/${id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" />
              </svg>
            </div>
          )}
          {!available && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Unavailable
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-2">{category}</p>
          {location && <p className="text-xs text-gray-400 mb-2">Location: {location}</p>}

          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(dailyRate)}</p>
              <p className="text-xs text-gray-500">per day</p>
            </div>
            <p className="text-xs text-gray-500">by {owner.name ?? "Owner"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### Step 5.2: Equipment Search Component
**File: `components/Search/EquipmentSearch.tsx`**
```typescript
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import { useSearch } from "@/lib/hooks";

export default function EquipmentSearch() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const { results, loading, error, search, clear } = useSearch();

  useEffect(() => {
    if (!query) {
      clear();
      return;
    }

    if (category) {
      search({ query, category });
    } else {
      search({ query });
    }
  }, [query, category, search, clear]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Browse Equipment
        </h1>

        <div className="mb-8">
          <SearchBar />
        </div>

        {loading && (
          <p className="mb-4 text-sm text-gray-600">Searching...</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <EquipmentGrid equipment={results} />
      </div>
    </div>
  );
}
```

### Step 5.3: Search Bar Component
**File: `components/Search/SearchBar.tsx`**
```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const suggestions = [
    ...EQUIPMENT_CATEGORIES,
    "Telehandler 10k",
    "Boom lift 60ft",
    "Scissor lift electric",
    "Skid steer tracks",
    "ICF bracing system",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    const trimmedCategory = category.trim();

    if (!trimmedQuery) {
      setError("Enter a search term.");
      return;
    }

    if (trimmedQuery.length > 100) {
      setError("Search query must be 100 characters or fewer.");
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedCategory) params.set("category", trimmedCategory);

    setError(null);
    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search equipment (telehandler, boom lift...)"
          value={query}
          list="equipment-search-suggestions"
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <datalist id="equipment-search-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Categories</option>
          <option value="Telehandler">Telehandler</option>
          <option value="Boom Lift">Boom Lift</option>
          <option value="Skid Steer">Skid Steer</option>
          <option value="ICF Bracing">ICF Bracing</option>
        </select>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

### Step 5.4: Equipment Detail Component
**File: `components/Equipment/EquipmentDetail.tsx`**
```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, safeJsonParse } from "@/lib/utils";
import CheckoutFlow from "@/components/Stripe/CheckoutFlow";

interface EquipmentDetailProps {
  viewerId?: string | null;
  equipment: {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    category: string;
    specs: string;
    dailyRate: number;
    available: boolean;
    image?: string | null;
    location?: string | null;
    hourMeter?: number | null;
    owner: { name: string | null; email?: string | null; stripeAccountId?: string | null };
  };
}

export default function EquipmentDetail({ equipment, viewerId }: EquipmentDetailProps) {
  const router = useRouter();
  const specs = safeJsonParse<Record<string, unknown>>(equipment.specs, {});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const images = [
    equipment.image,
    ...(Array.isArray(specs.images) ? specs.images : []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const uniqueImages = Array.from(new Set(images));
  const isOwner = Boolean(viewerId && viewerId === equipment.ownerId);
  const activeImage = uniqueImages[activeImageIndex];

  const handleDelete = async () => {
    if (!confirm("Delete this listing? This action cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/equipment/${equipment.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete listing.");
      }
      router.push("/dashboard/listings");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={equipment.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {uniqueImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {uniqueImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-16 h-16 rounded border ${
                      index === activeImageIndex ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.title}</h1>
                <p className="text-gray-600">Category: {equipment.category}</p>
                {equipment.location && <p className="text-gray-600">Location: {equipment.location}</p>}
                {equipment.hourMeter !== null && equipment.hourMeter !== undefined && (
                  <p className="text-gray-600">Hour meter: {equipment.hourMeter}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(equipment.dailyRate)}
                </p>
                <p className="text-gray-500">per day</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Owner</p>
              <p className="text-gray-900 font-medium">{equipment.owner.name ?? "Owner"}</p>
              {equipment.owner.email ? (
                <a className="text-sm text-blue-600" href={`mailto:${equipment.owner.email}`}>
                  {equipment.owner.email}
                </a>
              ) : (
                <p className="text-sm text-gray-500">
                  <Link href={`/auth/signin?callbackUrl=/equipment/${equipment.id}`}>
                    Sign in to view contact
                  </Link>
                </p>
              )}
            </div>

            {isOwner && (
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Owner Actions</p>
                <div className="flex flex-wrap gap-3">
                  <Link className="btn-secondary" href={`/owner/listings/${equipment.id}/edit`}>
                    Edit Listing
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Listing"}
                  </button>
                </div>
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              </div>
            )}

            <div className="border-t pt-6">
              {equipment.available ? (
                <CheckoutFlow
                  equipmentId={equipment.id}
                  dailyRate={equipment.dailyRate}
                  ownerStripeAccountId={equipment.owner.stripeAccountId || ""}
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold">Currently unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-700">{equipment.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-gray-600">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 5.5: Checkout Flow Component
**File: `components/Stripe/CheckoutFlow.tsx`**
```typescript
"use client";

import CheckoutButton from "@/components/Stripe/CheckoutButton";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutFlow({
  equipmentId,
  dailyRate,
  ownerStripeAccountId,
}: {
  equipmentId: string;
  dailyRate: number;
  ownerStripeAccountId: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Daily rate: <span className="font-semibold">{formatCurrency(dailyRate)}</span>
      </div>
      <CheckoutButton
        equipmentId={equipmentId}
        dailyRate={dailyRate}
        ownerStripeAccountId={ownerStripeAccountId}
      />
      <p className="text-xs text-gray-500">
        Platform fees are calculated automatically at checkout.
      </p>
    </div>
  );
}
```

### Step 5.6: Admin Dashboard Component
**File: `components/Admin/AdminDashboard.tsx`**
```typescript
"use client";

import { useEffect, useState } from "react";
import type { SearchLogAggregate, UnfulfilledSearchesResponse } from "@/lib/types";

export default function AdminDashboard() {
  const [searchLogs, setSearchLogs] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    days: "30",
    minCount: "0",
    query: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("days", appliedFilters.days);
        if (appliedFilters.minCount) params.set("minCount", appliedFilters.minCount);
        if (appliedFilters.query) params.set("query", appliedFilters.query);

        const res = await fetch(`/api/analytics/unfulfilled-searches?${params.toString()}`);
        const data = (await res.json()) as UnfulfilledSearchesResponse | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data && data.error ? data.error : "Failed to fetch analytics");
        }
        if ("topSearches" in data) {
          setSearchLogs(data.topSearches || []);
        } else {
          setSearchLogs([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load analytics");
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [appliedFilters]);

  const topChart = searchLogs.slice(0, 10);
  const maxCount = topChart.reduce((max, item) => Math.max(max, item._count.query), 1);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Analytics Dashboard</h1>

      <form
        className="bg-white border rounded-lg p-4 mb-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedFilters(filters);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium">
            Date Range
            <select
              className="input-field w-full mt-2"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Minimum Count
            <input
              className="input-field w-full mt-2"
              type="number"
              min="0"
              value={filters.minCount}
              onChange={(e) => setFilters({ ...filters, minCount: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium">
            Query Filter
            <input
              className="input-field w-full mt-2"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="e.g. telehandler"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Applying..." : "Apply Filters"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              const reset = { days: "30", minCount: "0", query: "" };
              setFilters(reset);
              setAppliedFilters(reset);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Search Demand</h2>
          {topChart.length ? (
            <div className="space-y-3">
              {topChart.map((item) => (
                <div key={item.query} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-gray-600 truncate">{item.query}</div>
                  <div className="flex-1 bg-gray-100 rounded">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{ width: `${(item._count.query / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs text-gray-500 text-right">
                    {item._count.query}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data available for the selected filters.</p>
          )}
          <div className="mt-4 text-xs text-gray-500">
            Priority thresholds: High &gt; 100, Medium &gt; 50, Low &lt;= 50
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Top Unfulfilled Searches</h2>
          <p className="text-gray-600 text-sm">
            Equipment renters are searching for but not finding
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Search Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchLogs.map((log) => (
                <tr key={log.query} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.query}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log._count.query}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        log._count.query > 100
                          ? "bg-red-100 text-red-800"
                          : log._count.query > 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {log._count.query > 100
                        ? "High"
                        : log._count.query > 50
                        ? "Medium"
                        : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {!searchLogs.length && (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-600" colSpan={3}>
                    No unfulfilled searches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## Part 6: Utility Functions

**File: `lib/utils.ts`**
```typescript
export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseSpecs(specsString: string): Record<string, unknown> {
  return safeJsonParse<Record<string, unknown>>(specsString, {});
}

export function calculateRentalDays(start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  const diffMs = endMs - startMs;
  if (diffMs <= 0) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(diffMs / msPerDay);
}
```

---

## Part 7: Testing Checklist

### Equipment Listing Flow
- [ ] Owner can create equipment listing
- [ ] Specs stored as valid JSON
- [ ] Daily rate calculated correctly in cents
- [ ] Daily rate accepts dollars or dailyRateCents without double conversion
- [ ] Listing appears on marketplace
- [ ] Owner can edit own listing
- [ ] Owner cannot edit other listings
- [ ] Owner can delete own listing

### Search & Analytics
- [ ] Search returns correct results
- [ ] Search rate limit responds with 429 and retry headers
- [ ] Unfulfilled searches logged
- [ ] Admin can view and filter unfulfilled searches
- [ ] Search analytics grouped by query
- [ ] Market gaps endpoint returns top gaps and since date
- [ ] Owner stats endpoint returns equipment, bookings, and revenue

### Stripe Integration
- [ ] Owner can create Stripe Express account
- [ ] Onboarding link functional
- [ ] Account status endpoints return readiness flags
- [ ] Renter can complete checkout
- [ ] Platform fee deducted correctly
- [ ] Owner receives correct payout
- [ ] Webhook confirms booking and cancels on session expiration

### Authentication
- [ ] User can sign up with email
- [ ] User can sign in
- [ ] Session persists
- [ ] Logout clears session
- [ ] Protected routes redirect to signin

---

## Error Handling Guidelines

```typescript
// Always catch and log errors
try {
  // Attempt operation
} catch (error) {
  console.error("Operation failed:", error);
  
  // Return user-friendly error
  if (error instanceof StripeError) {
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```
