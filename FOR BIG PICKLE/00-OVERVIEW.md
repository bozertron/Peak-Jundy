# Peak — Project Overview

> Quick-reference guide for coding agents working on the Peak codebase.

---

## What is Peak?

Peak is a **trust-first, wilderness-capable, mountain-community equipment rental platform**. It inverts the typical marketplace model:

- **Discovery is relational** — you only see equipment from people in your trust network
- **Participation is rewarded** — "Peaks" (a narrative currency) accumulate for community actions
- **Communication works off-grid** — peer-to-peer messaging over BLE, Wi-Fi mesh, or internet

Geographic anchor: **Big White Village, BC** (49.7231, -118.9367).

---

## Current State (v0 — what's running now)

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 via Prisma 5 |
| Auth | NextAuth 4 (magic-link email) |
| Payments | Stripe Connect (destination charges) |
| Maps | Mapbox GL JS |
| Styling | Tailwind CSS 3.4 + custom `peak-*` utilities |
| Testing | Jest 30 + Playwright |
| Runtime | Node.js 18+ |

## Future State (v1 — where we're going)

| Concern | Technology |
|---------|-----------|
| Shell | Tauri 2.0 (Linux + Android) |
| Frontend | Vite + React + TanStack Router |
| Native side | Rust (BLE, Wi-Fi, CRDT, SQLite) |
| Local storage | SQLite via `tauri-plugin-sql` |
| ORM | Drizzle (client-side) |
| Sync | Local-first with Automerge CRDTs |
| Identity | Ed25519 keypair (OS keychain) |
| P2P/Mesh | rust-libp2p or Aegis (under evaluation) |
| Maps | MapLibre Native + PMTiles (offline) |
| Payments | Stripe Connect (online-only, queued offline) |

---

## Repository Layout

```
peak/
├── apps/
│   └── client/                    # The main application
│       ├── app/                   # Next.js App Router pages & API routes
│       │   ├── (dashboard)/       # Auth-protected routes (admin, owner, user dashboard)
│       │   ├── api/               # API route handlers
│       │   ├── auth/              # Auth pages (signin, error)
│       │   ├── browse/            # Public browse page
│       │   ├── cards/             # Contact cards page
│       │   ├── chat/              # Chat pages
│       │   ├── equipment/[id]/    # Equipment detail
│       │   ├── map/               # Map discovery page
│       │   ├── network/           # Trust network visualization
│       │   ├── peaks/             # Peaks economy page
│       │   └── profile/[id]/      # User profiles
│       ├── components/            # React components by domain
│       │   ├── Admin/             # Admin dashboard components
│       │   ├── Equipment/         # Equipment CRUD components
│       │   ├── Navigation/        # Navbar, Sidebar, UserMenu
│       │   ├── Search/            # Search bar
│       │   ├── Stripe/            # Payment components
│       │   ├── cards/             # Contact card components
│       │   ├── chat/              # Chat/messaging components
│       │   ├── map/               # Map and pin components
│       │   ├── peaks/             # Peaks economy components
│       │   └── ui/                # Design system primitives (peak-button, peak-card, peak-input)
│       ├── lib/                   # Shared utilities & business logic
│       │   ├── auth.ts            # NextAuth configuration
│       │   ├── categories.ts      # Equipment category list
│       │   ├── design-system.ts   # Design tokens (colors, typography, shadows)
│       │   ├── hooks.ts           # React hooks
│       │   ├── peaks.ts           # Peaks economy pure functions
│       │   ├── prisma.ts          # Prisma client singleton
│       │   ├── stripe.ts          # Stripe service layer
│       │   ├── types.ts           # TypeScript type definitions
│       │   ├── utils.ts           # General utilities
│       │   ├── validation.ts      # Input validation functions
│       │   └── weblink.ts         # Legacy mesh reference
│       ├── prisma/
│       │   ├── schema.prisma      # Database schema (13 models)
│       │   └── seed.js            # Seed data script
│       ├── styles/
│       │   └── globals.css        # Global styles + Tailwind imports
│       ├── __tests__/             # Test suites (unit, api, e2e)
│       ├── types/                 # TypeScript declarations
│       ├── docker-compose.yml     # Local Postgres container
│       ├── package.json           # Dependencies & scripts
│       ├── tailwind.config.ts     # Tailwind with peak-* extensions
│       ├── tsconfig.json          # TypeScript config (strict)
│       ├── jest.config.js         # Jest multi-project config
│       └── playwright.config.ts   # E2E test config
├── docs/
│   ├── architecture.md            # Technical architecture decisions
│   ├── roadmap.md                 # Phased execution plan (0-12)
│   ├── vision.md                  # Product vision & principles
│   └── deploy.md                  # Deployment guide
└── FOR BIG PICKLE/                # This directory — agent guides
```

---

## Key File Locations by Concern

| Concern | File(s) |
|---------|---------|
| Database schema | `apps/client/prisma/schema.prisma` |
| Auth config | `apps/client/lib/auth.ts` |
| Stripe logic | `apps/client/lib/stripe.ts` |
| Peaks economy | `apps/client/lib/peaks.ts` |
| Design tokens | `apps/client/lib/design-system.ts` |
| Validation | `apps/client/lib/validation.ts` |
| Categories | `apps/client/lib/categories.ts` |
| UI primitives | `apps/client/components/ui/peak-*.tsx` |
| Tailwind config | `apps/client/tailwind.config.ts` |
| Environment vars | `apps/client/.env.example` |
| API routes | `apps/client/app/api/` |
| Protected pages | `apps/client/app/(dashboard)/` |
| Middleware | `apps/client/middleware.ts` |

---

## How to Run

All commands run from `apps/client/`:

```bash
cd apps/client

# Development server (http://localhost:3000)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Tests
npm run test          # Jest (unit + API)
npm run test:unit     # Unit tests only
npm run test:api      # API tests only
npm run test:e2e      # Playwright E2E
npm run test:all      # Jest + Playwright

# Database
npm run db:push       # Push schema changes (dev)
npm run db:seed       # Seed data
npm run prisma:studio # Visual DB browser
```

---

## The Six Core Systems

### 1. Trust Network
Directed vouch graph. Degree 1 = direct vouch, Degree 2 = friend-of-friend. Equipment visibility, chat, and contact cards are all gated by the trust graph.

### 2. Peaks Economy
5-tier reward currency (Explorer → Alpine Elite). Earned through community actions, spent on Treasure Chests. Immutable append-only ledger. Pure functions in `lib/peaks.ts`.

### 3. Map-First Discovery
Spatial UI — the map IS the interface. Equipment pins filtered through trust graph. Custom pin design with emoji category icons, forest-green selected state, brass borders. Works offline.

### 4. Peak Mesh (Communications)
Transport-agnostic messaging: Internet → Wi-Fi mesh → BLE. Trust-gated conversations. CRDTs for concurrent message sync. Signed with Ed25519.

### 5. Contact Cards
Collectible "trading cards" of people in your network. Auto-created from mutual vouches. Display avatar, name, flavor tagline, tier, trust provenance.

### 6. Sophisticated Ski Chalet Aesthetic
Mountain lodge premium feel. Forest green primary, brass accent, burgundy secondary. Libre Baskerville serif headings, Inter sans body. Wood-tone gradient accents, hover-lift animations, generous whitespace.
