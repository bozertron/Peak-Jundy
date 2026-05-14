# Adding Features to Peak

> Step-by-step guides for adding new pages, API endpoints, database models, UI components, and more.

---

## Adding a New Page

### 1. Create the page file

```bash
# Server component (default — no client JS shipped)
touch apps/client/app/your-page/page.tsx
```

```tsx
// apps/client/app/your-page/page.tsx
export default function YourPage() {
  return (
    <div className="min-h-screen bg-peak-cream p-8">
      <h1 className="font-display text-3xl text-peak-charcoal">Your Page</h1>
    </div>
  );
}
```

### 2. If client interactivity is needed

Add `"use client"` at the very top:

```tsx
"use client";

import { useState } from "react";

export default function YourPage() {
  const [state, setState] = useState(false);
  // ...
}
```

### 3. If auth-protected

Place under the `(dashboard)` route group:

```bash
# This route is automatically protected by the dashboard layout
mkdir -p apps/client/app/\(dashboard\)/your-page
touch apps/client/app/\(dashboard\)/your-page/page.tsx
```

The `(dashboard)/layout.tsx` handles session checking and redirects.

### 4. Add navigation link

Edit `apps/client/components/Navigation/Sidebar.tsx` to add your route to the nav items array.

### 5. Test

```bash
npm run dev
# Visit http://localhost:3000/your-page
```

---

## Adding a New API Endpoint

### 1. Create the route file

```bash
mkdir -p apps/client/app/api/your-endpoint
touch apps/client/app/api/your-endpoint/route.ts
```

### 2. Implement with the standard pattern

```typescript
// apps/client/app/api/your-endpoint/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET — public or auth-optional
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = Number(searchParams.get("skip") || "0");
  const take = Math.min(Number(searchParams.get("take") || "20"), 100);

  try {
    const items = await prisma.yourModel.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/your-endpoint error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST — always auth-protected
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "requiredField is required" },
        { status: 400 }
      );
    }

    // Create resource
    const item = await prisma.yourModel.create({
      data: {
        ...body,
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/your-endpoint error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PUT — auth-protected + ownership check
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    // Verify ownership
    const existing = await prisma.yourModel.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.yourModel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/your-endpoint error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — auth-protected + ownership check
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    const existing = await prisma.yourModel.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.yourModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/your-endpoint error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
```

### 3. Add tests

```bash
touch apps/client/__tests__/api/your-endpoint.test.ts
```

See `06-TESTING-GUIDE.md` for the API test pattern.

---

## Adding a New Database Model

### 1. Add model to schema

Edit `apps/client/prisma/schema.prisma`:

```prisma
model YourModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  title     String
  userId    String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 2. Add the relation to the User model

```prisma
model User {
  // ... existing fields
  yourModels YourModel[]
}
```

### 3. Push to development database

```bash
# For development/prototyping (no migration file)
npx prisma db push

# For production-ready changes (creates migration file)
npx prisma migrate dev --name add-your-model
```

### 4. Regenerate the Prisma client

```bash
npx prisma generate
```

### 5. Add seed data

Edit `apps/client/prisma/seed.js` — use the upsert pattern for idempotency:

```javascript
await prisma.yourModel.upsert({
  where: { id: "seed-your-model-1" },
  update: {},
  create: {
    id: "seed-your-model-1",
    title: "Seeded Item",
    userId: seedUser.id,
  },
});
```

### 6. Create API routes and UI

Follow the API endpoint and page guides above.

---

## Adding a New UI Component

### 1. Decide where it lives

- **UI primitive** (reusable, design-system level): `components/ui/peak-your-component.tsx`
- **Domain component** (feature-specific): `components/YourDomain/YourComponent.tsx`

### 2. Template for a UI primitive

```tsx
"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";

// Types
export type YourComponentVariant = "default" | "highlighted" | "subtle";

export interface YourComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: YourComponentVariant;
  children: ReactNode;
  className?: string;
}

// Utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Variant styles
const variantStyles: Record<YourComponentVariant, string> = {
  default: "bg-white border-peak-stone shadow-peak-md",
  highlighted: "bg-peak-forest-50 border-peak-forest-200 shadow-peak-lg",
  subtle: "bg-peak-cream border-transparent shadow-peak-sm",
};

// Component
export const YourComponent = forwardRef<HTMLDivElement, YourComponentProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-peak-lg border p-4",
          "transition-all duration-250 ease-out",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

YourComponent.displayName = "YourComponent";
export default YourComponent;
```

### 3. Compound sub-components (if needed)

```tsx
// Add sub-components like PeakCard.Header pattern
YourComponent.Header = function Header({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-display text-lg text-peak-charcoal mb-2", className)}>{children}</div>;
};
```

### 4. Design system tokens

Always reference `lib/design-system.ts` for:
- Colors → use Tailwind `peak-*` classes
- Shadows → use `shadow-peak-*` classes
- Border radius → use `rounded-peak-*` classes
- Typography → use `font-display`, `font-body`, `font-mono`

---

## Adding a New Equipment Category

Edit `apps/client/lib/categories.ts`:

```typescript
export const EQUIPMENT_CATEGORIES = [
  "Telehandler",
  "Boom Lift",
  "Scissor Lift",
  "Skid Steer",
  "Excavator",
  "Compactor",
  "ICF Bracing",
  "Formwork",
  "Concrete Tools",
  "Your New Category",  // ← Add here
  "Other",
] as const;
```

The category list is consumed by the equipment form, search filters, and admin analytics.

---

## Adding a Treasure Chest

### Option A: Via seed script

Edit `apps/client/prisma/seed.js`:

```javascript
await prisma.treasureChest.upsert({
  where: { id: "chest-your-id" },
  update: {},
  create: {
    id: "chest-your-id",
    title: "Your Chest Title",
    description: "What's inside",
    peaksCost: 100,           // Peaks required to open
    prizeType: "discount",    // "discount" | "physical_item" | "feature_unlock" | "badge"
    prizeValue: "20_percent_off_next_rental",
    available: true,
  },
});
```

### Option B: Via Prisma Studio

```bash
npx prisma studio
# Navigate to TreasureChest table → Add record
```
