# Roadmap & Priorities

> How to identify and work on roadmap items for Peak.

---

## Current State

- **v0 web app** is working (Next.js + Prisma + Postgres + Stripe + Mapbox)
- **Vision docs** written (`docs/vision.md`, `docs/architecture.md`, `docs/roadmap.md`)
- **Research spikes** pending (P2P foundation, map integration prototype)
- **Schema** is complete (all 13 models present and seeded)

---

## Phase Priorities (In Order)

### Phase 1: Code Cleanup
**Goal**: Clean up the current codebase before the framework swap.

Tasks:
- Rename "Peak Rentals" → "Peak" everywhere (package.json, README, UI strings)
- Drop duplicate UI primitives (keep `peak-button.tsx`, delete `PeakButton.tsx` if duplicated)
- Drop 1-line re-export stubs in `components/` root
- Drop empty stub pages (browse, owner/edit-listing, admin/unfulfilled-searches if < 5 LOC)
- Run `npm run typecheck` and capture error set

**Acceptance**: No duplicate primitives, project name is "Peak" everywhere.

---

### Phase 2: Schema Completion
**Goal**: Ensure all models, fields, and indexes are present for the full Peak feature set.

Tasks:
- Verify all 13 Prisma models exist with correct fields (already done in current schema)
- Verify all User profile extensions: avatarUrl, memberSince, foundingMember, flavor, lat/lng, locationName, peaksBalance
- Verify Booking fields: cancelledAt, cancellationReason, stripeSessionId @unique, @@index([status])
- Verify Equipment fields: image, location, specs (JSON), @@index([category, location])
- Extend seed script with examples of all model types
- Run existing test suite — green tests = schema complete

**Acceptance**: All test files pass; `npm run dev` boots; map/network/cards/chat pages don't 500.

---

### Phase 3: Cross-Cutting Cleanup
**Goal**: Pay down known debts before the framework swap.

Tasks:
- Upgrade Next.js 14.0.4 → 14.2.35+ (critical CVEs patched)
- Fix `lib/prisma.ts:13` TS error
- Fix `lib/stripe.ts:16` Stripe API version mismatch
- Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.example`
- Resolve TODOs: online status in chat, Stripe placeholder priceId
- Run `npm audit fix`

**Acceptance**: `npm run typecheck`, `npm run lint`, `npm test` all clean. `npm audit` no critical/high.

---

### Phase 4: Framework Swap (Vite + React + TanStack Router)
**Goal**: Leave Next.js behind; adopt the target architecture.

Tasks:
- Scaffold `apps/client` as Vite + React project
- Port routes from Next.js App Router to TanStack Router file-based routes
- Migrate components under `src/features/<domain>/`
- Migrate `lib/` to `src/lib/` + `packages/` structure
- Replace Prisma with Drizzle (client-side SQLite)
- Archive existing API routes to `apps/relay/`
- Update test configuration

**Acceptance**: Vite app boots; all screens render against local Drizzle/SQLite; tests green.

---

### Phase 5: Tauri Shell + Linux Build
**Goal**: Wrap the client in Tauri for Linux desktop.

Tasks:
- Scaffold `src-tauri/` with `tauri init`
- Wire up `tauri-plugin-sql` for local SQLite
- Wire up `tauri-plugin-stronghold` for Ed25519 keypair
- Identity bootstrap on first launch
- Produce Fedora 43-compatible binary (AppImage/RPM)

**Acceptance**: Install on Fedora 43; first-launch generates identity; boots offline with seeded data.

---

### Phases 6–12 (Future)

| Phase | Focus |
|-------|-------|
| 6 | Local-first sync engine (Automerge CRDTs, outbox/inbox, peer sync) |
| 7 | BLE mesh prototype (btleplug, proximity discovery) |
| 8 | Wi-Fi mesh prototype (Wi-Fi Direct, ad-hoc mode, 200m+ range) |
| 9 | Maps full integration (MapLibre Native, PMTiles, offline) |
| 10 | Android build (Tauri mobile, APK, Play Store) |
| 11 | Emergency beacon mode (life-safety, low-power broadcast) |
| 12 | LoRa companion hardware research (post-v1, km+ range) |

---

## How to Identify Work Items

### From the Roadmap
```bash
# Read the full phase list
cat docs/roadmap.md
```

### From TypeScript Errors
```bash
cd apps/client
npm run typecheck
# Each error is a potential fix task
```

### From Lint Issues
```bash
npm run lint
```

### From Security Audit
```bash
npm audit
```

### From Market Data
- Check `SearchLog` data for unfulfilled searches (market gaps)
- Visit `/admin/dashboard` for usage patterns and analytics
- Look at "Unfulfilled Searches" in admin analytics

### From Architecture Questions
14 open questions tracked in `docs/architecture.md` §14:
1. rust-libp2p vs Aegis vs custom
2. MapLibre Native integration path (locked: Path C)
3. Tile-source vendor (locked: Protomaps PMTiles)
4. CRDT pruning strategy
5. Stripe alternatives in remote regions
6. Voucher-acceptance semantics
7. Vouch decay over time
8. Beacon-mode protocol spec
9. Multi-device pairing + recovery
10. Linux Wi-Fi mesh approach

---

## Operating Principles

These guide ALL work on Peak:

1. **No phase ships until tests green.** Typecheck clean, lint clean, tests green, manual smoke pass.
2. **Local-first or it doesn't ship.** Every user-facing feature must function offline.
3. **Research phases produce decisions, not code.** Deliverable is a decision doc + spike code, not a production feature.
4. **Sequence is flexible; priorities are not.** Phase numbers are ordering, not deadlines.

---

## When Starting a New Work Session

1. `git pull` — get latest
2. `npm run typecheck` — see current error state
3. `npm run lint` — see lint state
4. Check `docs/roadmap.md` — know what phase you're in
5. Check this file — understand priorities
6. Pick the highest-priority unfinished task
7. Work it to completion (tests passing)
8. Commit with descriptive message
