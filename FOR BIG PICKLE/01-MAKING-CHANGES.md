# Making Changes to Peak

> How to safely and correctly modify the codebase.

---

## Before Changing Anything

1. **Understand the file's role** — Read the file header comments. Check which domain it belongs to.
2. **Check for existing patterns** — Look at similar files in the same directory for conventions.
3. **Identify dependencies** — Search for imports of the file you're changing. Ripple effects matter.
4. **Check the test suite** — Is there a test file for what you're changing? (`__tests__/api/`, `__tests__/unit/`)

---

## Component Changes

### Pattern: Compound Components

UI components follow the compound component pattern (e.g., `PeakCard` with `PeakCard.Header`, `PeakCard.Body`, `PeakCard.Footer`).

### Variant System

`PeakButton` has **5 variants × 4 sizes**:
- Variants: `primary` (forest green), `secondary` (burgundy), `accent` (brass), `outline` (forest border), `ghost` (minimal)
- Sizes: `sm`, `md`, `lg`, `xl`

```tsx
// Always use the variant/size prop system
<PeakButton variant="primary" size="lg">Action</PeakButton>
<PeakButton variant="accent" leftIcon={<Icon />}>Special</PeakButton>
```

### Required Patterns

- Use `React.forwardRef` for library-level components
- Use `"use client"` directive for any component with interactivity (state, effects, event handlers)
- Always use `peak-*` Tailwind utilities for colors, shadows, and border radii
- Support a `className` prop for composition
- Use the `cn()` utility for class merging

### Tailwind Classes to Use

```tsx
// Colors
className="text-peak-forest-500"     // Primary text/icons
className="bg-peak-brass-500"        // Accent backgrounds
className="border-peak-stone"        // Borders
className="bg-peak-cream"            // Page backgrounds

// Shadows
className="shadow-peak-sm"           // Subtle elevation
className="shadow-peak-md"           // Cards
className="shadow-peak-lg"           // Elevated elements
className="shadow-peak-frame"        // Framed objects
className="shadow-peak-lift"         // Hover state

// Border Radius
className="rounded-peak-sm"          // 4px - subtle
className="rounded-peak-md"          // 8px - standard
className="rounded-peak-lg"          // 12px - cards
className="rounded-peak-xl"          // 16px - modals

// Interactions
className="hover:-translate-y-0.5 transition-all duration-250 ease-out"
```

---

## API Route Changes

### Standard Template

Every API route follows this structure:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse & validate input
    const body = await req.json();
    // ... validation with lib/validation.ts

    // 3. Prisma query
    const result = await prisma.model.create({ data: { ... } });

    // 4. Return response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/resource error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
```

### Key Conventions

- Use `NextResponse.json()` for all responses
- Session via `getServerSession(authOptions)` — import from `@/lib/auth`
- Error shape is always `{ error: "Human-readable message" }`
- Validation errors: `{ error: "Validation failed", errors: { field: "message" } }`
- Log errors with context: `console.error("METHOD /api/path error:", error)`

---

## Library (`lib/`) Changes

### Principles

- **Pure functions preferred** — like `lib/peaks.ts`, no side effects, deterministic
- **No Prisma in pure logic** — keep DB queries in API routes, pure math/logic in lib
- **Explicit TypeScript types** — export types alongside functions
- **Design for portability** — these functions will eventually move to Rust/WASM

### Example Pattern (from `lib/peaks.ts`):

```typescript
// Export types
export type PeaksMemberTier = 'Explorer' | 'Trailblazer' | ...;

// Export constants
export const PEAKS_AMOUNTS = { ... } as const;

// Export pure functions
export function determineTier(lifetimePeaks: number): PeaksMemberTier { ... }

// Default export as namespace
export default { determineTier, ... } as const;
```

---

## Style Changes

### Design System Tokens

Always use the design system tokens from `lib/design-system.ts`:

| Token | Hex | Usage |
|-------|-----|-------|
| `peak-forest` | #2D5A47 | Primary — buttons, links, focus rings |
| `peak-brass` | #B8860B | Accent — CTAs, highlights, left stripe on cards |
| `peak-burgundy` | #722F37 | Secondary — availability badges, secondary buttons |
| `peak-navy` | #1E3A5F | Depth — metadata, tertiary elements |
| `peak-cream` | #FAF7F2 | Background — page backgrounds |
| `peak-stone` | #E7E5E4 | Borders — dividers, subtle separators |
| `peak-charcoal` | #2C3E50 | Text — body text, headings |

### Typography

- **Headings**: `font-display` or `font-heading` (Libre Baskerville, serif)
- **Body text**: `font-body` or `font-sans` (Inter, sans-serif)
- **Code/specs**: `font-mono` (JetBrains Mono)

### Interaction Patterns

- Hover lift: `hover:-translate-y-0.5` (subtle) or `hover:-translate-y-1` (cards)
- Transitions: `transition-all duration-250 ease-out` (never bounce/spring)
- Shadow on hover: combine `shadow-peak-sm` → `hover:shadow-peak-lift`
- Focus rings: `focus:ring-2 focus:ring-peak-forest-500/50 focus:ring-offset-2`

### Wood Accent Bar

The signature 4px gradient bar at the bottom of cards:
```css
/* Gradient: light oak → brass → mahogany */
background: linear-gradient(90deg, #D4A574, #B8860B, #5D4037);
```

---

## After Making Changes

Run these in order from `apps/client/`:

```bash
# 1. Type check — catches type errors
npm run typecheck

# 2. Lint — catches style/pattern issues
npm run lint

# 3. Run relevant tests
npm run test              # All Jest tests
npm run test:unit         # If you changed lib/ functions
npm run test:api          # If you changed API routes
```

### Pre-push Checklist

```bash
npm run typecheck && npm run lint && npm run test
```

If all three pass, the change is safe to commit.
