# Peak — Roadmap

> Live execution plan. Pairs with `vision.md` (why) and `architecture.md` (how).

---

## Operating principles

- **No phase ships until its acceptance criteria pass.** Specifically: typecheck clean, lint clean, tests green, manual smoke pass.
- **Local-first or it doesn't ship.** Every user-facing feature must function offline before it's considered done.
- **Research phases produce decisions, not code.** When a phase says "research X," the deliverable is a one-page decision doc + spike code if needed, not a production feature.
- **Sequence is flexible; priorities are not.** Phase numbers are ordering, not deadlines.

---

## Phase 0 — Foundations (✅ mostly done)

Captured and consolidated in `vision.md` / `architecture.md`. Worktree `peak_vision_tree_1` is live on its own branch with the lean structure.

- [x] Inventory of every Peak asset across working tree + git history.
- [x] Historical value extracted; originals discarded.
- [x] Decision: Tauri 2.0 + Vite + React + TanStack Router.
- [x] Decision: local + mesh only for v1, no cloud server.
- [x] Decision: kebab-case naming convention.
- [x] Three consolidated docs written.

---

## Phase 1 — Code carry-forward & cleanup

Goal: take everything from `apps/client/` (the current Next.js codebase) into a state where we can build on it, but without spending effort yet on the framework swap.

- [ ] **Drop duplicate UI primitives.** Keep `peak-button.tsx`, `peak-card.tsx`, `peak-input.tsx`. Delete `PeakButton.tsx`, `PeakCard.tsx`, `PeakInput.tsx`.
- [ ] **Drop 1-line re-export stubs** in `apps/client/components/` root.
- [ ] **Drop empty stub pages.** `app/browse/page.tsx` (5 LOC), `owner/edit-listing/[id]/page.tsx` (5 LOC), `admin/unfulfilled-searches/page.tsx` (5 LOC).
- [ ] **Rename `Peak Rentals` → `Peak`** in `package.json`, README, and any user-visible strings.
- [ ] **Run `npm run typecheck`** and capture the current error set in `roadmap.md` follow-ups.

**Acceptance**: directory listing is clean; no duplicate primitives; project name reflects "Peak" everywhere.

---

## Phase 2 — Schema completion (critical-path blocker)

Goal: add the 6 missing Prisma models + 7 User fields so the existing API routes and pages have something to read.

- [ ] **Add Prisma models**: `Vouch`, `ContactCard`, `Conversation`, `Message`, `PeaksTransaction`, `TreasureChest`. Exact field definitions in `architecture.md` §4.
- [ ] **Add User fields**: `avatarUrl`, `memberSince`, `foundingMember`, `flavor`, `latitude`, `longitude`, `locationName`, `peaksBalance`, `publicKey`.
- [ ] **Add Booking fields**: `cancelledAt`, `cancellationReason`, `stripeSessionId @unique`, `@@index([status])`.
- [ ] **Add Equipment fields**: `image?`, `location?`, `specs` (JSON string), `@@index([category, location])`.
- [ ] **Run migration** locally; verify existing equipment + booking queries still pass.
- [ ] **Seed script**: extend `prisma/seed.js` with at least one each of Vouch, ContactCard, Conversation, Message, PeaksTransaction, TreasureChest.
- [ ] **Run the existing test suite** (`__tests__/api/peaks/`, `trust/`, `cards.test.ts`, `conversations.test.ts`) — they expect these models. Green tests = schema complete.

**Acceptance**: all six Peak-native test files pass; `npm run dev` boots; manual click-through of the map, network, cards, and chat pages renders something (not a 500).

---

## Phase 3 — Cross-cutting cleanup

Goal: pay down the known debts before the framework swap, so we don't carry them forward.

- [ ] **Next.js upgrade**: 14.0.4 → 14.2.35+ (critical CVEs). Even though we'll leave Next.js eventually, keep the existing app on a secure version while we work.
- [ ] **Fix `lib/prisma.ts:13`** TS error.
- [ ] **Fix `lib/stripe.ts:16`** Stripe API version mismatch.
- [ ] **Add `NEXT_PUBLIC_MAPBOX_TOKEN`** to `.env.example` (will rename when we move to MapLibre).
- [ ] **Resolve TODOs**: online status in `app/chat/[conversationId]/page.tsx`, Stripe placeholder priceId in `Storefront.tsx`.
- [ ] **Run `npm audit fix`** and document any remaining advisories.

**Acceptance**: `npm run typecheck`, `npm run lint`, `npm test` all clean. `npm audit` shows no critical/high.

---

## Phase 4 — Framework swap to Vite + React + TanStack Router

Goal: leave Next.js behind; land on the architecture from `architecture.md` §3.

- [ ] **Scaffold `apps/client` as Vite + React** project. Copy over `tailwind.config.ts`, `tsconfig.json` (adapted), `postcss.config.js`.
- [ ] **Port routes** from `app/` (Next.js app router) to `src/routes/` (TanStack Router file-based). Keep the same URL structure.
- [ ] **Migrate components** under `src/features/<domain>/`. No logic changes — same components, new home.
- [ ] **Migrate `lib/`** to `src/lib/` (client-side) and `packages/core/`, `packages/peaks-engine/`, `packages/design-system/` for shared.
- [ ] **Replace Prisma with Drizzle** (client-side). Schema mirrors §4 of architecture. Generate types.
- [ ] **Move the existing API routes** to `apps/relay/` as a future-proof archive — they won't run in v1 but we keep the code for v2.
- [ ] **Update `__tests__/`** for the new structure. Jest still works under Vite; Playwright config gets updated for the dev server URL.

**Acceptance**: `pnpm dev` (or npm) brings up the Vite app; all current screens render against local Drizzle/SQLite; existing test suite green.

---

## Phase 5 — Tauri shell, desktop builds

Goal: wrap the client in Tauri for native macOS/Windows/Linux.

- [ ] **Scaffold `apps/client/src-tauri/`** with `tauri init` against the Vite app.
- [ ] **Wire up `tauri-plugin-sql`** for the local SQLite. Replace any Node-fs-based local storage.
- [ ] **Wire up `tauri-plugin-stronghold`** for keychain-backed Ed25519 keypair.
- [ ] **Identity bootstrap**: on first launch, generate keypair, store in keychain, write public key to local DB.
- [ ] **Build matrix**: produce signed builds for macOS (arm64 + x86_64), Windows (x86_64), Linux (x86_64). CI optional in this phase.

**Acceptance**: install Peak.dmg/MSI/AppImage; first-launch flow generates identity; app boots offline and shows local-seeded equipment.

---

## Phase 6 — Local-first sync engine

Goal: the meat of local-first. Outbound queue, CRDT-backed message sync, signed envelopes.

- [ ] **Implement message envelope** in `packages/mesh-protocol`. Fields: `sender`, `signature`, `timestamp`, `payload`, `transport`. Ed25519 signatures.
- [ ] **Automerge bindings** for `Conversation` + `Message`. Each conversation is one Automerge document.
- [ ] **Outbox**: local `outbox` table. Background worker drains it over the highest-available transport.
- [ ] **Inbox**: dedup + signature verification before write to local DB.
- [ ] **Sync checkpoint** per peer.
- [ ] **Test**: two devices on the same Wi-Fi network can mutually vouch and exchange messages without internet. (Hold this as the acceptance demo for the phase.)

**Acceptance**: two-laptop demo — Wi-Fi only, no internet — successful trust handshake + message exchange.

---

## Phase 7 — BLE mesh prototype (research → spike → ship)

Goal: phone-to-phone discovery and low-bandwidth messaging over Bluetooth.

- [ ] **Research deliverable**: one-page decision doc on libp2p vs custom GATT profile. Cover binary-size impact, iOS background limitations, Android API maturity.
- [ ] **Spike**: Rust crate `btleplug` from `src-tauri`; basic peer discovery + GATT read/write between two devices.
- [ ] **Integrate into mesh transport layer**: BLE becomes one of the registered transports. Message envelope unchanged.
- [ ] **iOS background behavior**: confirm we can advertise + scan in background within Apple's limits.
- [ ] **Demo target**: two phones with no network, in BLE range, can ping presence and exchange a 100-byte vouch.

**Acceptance**: phone-to-phone presence ping works at < 30 m. Battery draw < 5%/hour with BLE scanning active.

---

## Phase 8 — Wi-Fi mesh prototype (research → spike → ship)

Goal: higher-bandwidth wilderness peer-to-peer.

- [ ] **Research deliverable**: decision doc on Wi-Fi Direct (Android) + Multipeer Connectivity (iOS) vs Wi-Fi Aware (NAN). Cover platform parity, range testing, battery impact.
- [ ] **Android spike**: Wi-Fi Direct peer discovery + connection from Tauri.
- [ ] **iOS spike**: Multipeer Connectivity bridge — likely needs custom Swift code accessible via Tauri.
- [ ] **Integrate into mesh transport layer**.
- [ ] **Range test**: confirm 200m+ line-of-sight in open environment.

**Acceptance**: two phones, no infrastructure, 200m apart in line-of-sight, can fully sync trust graph + recent messages.

---

## Phase 9 — Offline maps

Goal: maps that work without bars.

- [ ] **Swap Mapbox → MapLibre GL JS** in the map components.
- [ ] **Tile source decision**: MapTiler vs Stadia Maps vs self-hosted OSM. Decision doc.
- [ ] **Offline region UI**: user picks an area; tiles download for that bounding box; storage budget enforced.
- [ ] **Author Peak map style** — cream/snow palette, brass road accents, soft topo. Stored in `packages/design-system/map-style.json`.
- [ ] **Big White Village pre-bundled**: the founding-community region is included in the install package.

**Acceptance**: full map navigation with airplane mode on, no degraded UX in the seeded region.

---

## Phase 10 — Mobile builds

Goal: iOS + Android shipping.

- [ ] **`tauri ios init` + `tauri android init`** scaffolding.
- [ ] **Mobile-specific UI passes**: touch targets, gesture handling, safe areas.
- [ ] **Mobile-specific transports**: confirm BLE and Wi-Fi mesh work end-to-end on both platforms.
- [ ] **App Store / Play Store metadata**, icons, privacy disclosures.
- [ ] **TestFlight / Internal Track** beta.

**Acceptance**: signed builds in both stores, internal beta with at least 10 testers.

---

## Phase 11 — Emergency beacon mode

Goal: deliberate, life-saving feature. Skiers, climbers, trail crews can rely on it.

- [ ] **Protocol spec**: what does "I need help" look like over BLE, Wi-Fi, future LoRa? Standardize the payload (location, identity, severity, free-text).
- [ ] **Power-aware UX**: low-screen-brightness mode; minimal CPU; maximize beacon-radio duty cycle.
- [ ] **Relay rules**: any Peak device in range opportunistically relays beacons toward internet-connected peers.
- [ ] **Bridge to emergency services**: research feasibility of forwarding beacons to local SAR (Search & Rescue) APIs or text-911 in supported regions.
- [ ] **False-positive guardrails**: confirmation flow, automatic clear, no accidental activation.

**Acceptance**: tested cold-storage demo with two devices, one set to beacon, the other receiving and relaying. Spec reviewed by at least one SAR practitioner.

---

## Phase 12 — LoRa companion hardware research

Goal: extend mesh range to kilometers. Future-facing.

- [ ] **Survey landscape**: Meshtastic ecosystem (LILYGO T-Beam, RAK, etc.), goTenna Mesh, Beartooth (defunct, lessons learned).
- [ ] **Protocol compatibility**: can Peak speak Meshtastic protocol natively, or do we ship a custom bridge?
- [ ] **Hardware partnership / bundle**: identify candidates for a co-branded device.
- [ ] **Decision doc**: build-vs-buy-vs-partner, recommended path.

**Acceptance**: written recommendation with cost-of-acquisition estimates and a proof-of-concept range demo (5 km+) over LoRa.

---

## Cross-cutting items

These don't fit a phase — they run continuously:

### Security
- [ ] **Crypto review**: independent review of Ed25519 signing scheme + key storage before Phase 6 ships publicly.
- [ ] **Penetration test** of the (eventual) relay server before its first public release.
- [ ] **Threat model doc**: who attacks Peak, how, and what's our mitigation.

### Accessibility
- [ ] **WCAG 2.1 AA audit** of all UI components.
- [ ] **Keyboard navigation** for map and chat.
- [ ] **Screen-reader support** for trust-network visualization.

### Payments verification
- [ ] **End-to-end Stripe Connect manual test** (owner onboarding → renter checkout → payout) with real test cards.
- [ ] **Webhook reliability**: handling out-of-order, duplicate, missed events.
- [ ] **Cancellation + refund flow**: explicit test cases.
- [ ] **Dispute handling**: research Stripe Dispute API integration.

### Documentation
- [ ] **CONTRIBUTING.md**: dev environment setup, code style, PR conventions.
- [ ] **Per-package READMEs** as packages stabilize.
- [ ] **Decision log** (`docs/decisions/`) — Architecture Decision Records (ADRs) for every non-trivial decision made during execution.

---

## Open design questions (tracked, not yet answered)

Carried over from `architecture.md` §14:

1. libp2p vs custom mesh stack.
2. iOS BLE background limits.
3. Wi-Fi Direct viability on iOS.
4. CRDT pruning strategy.
5. Map tile licensing.
6. Stripe alternatives in remote regions.
7. Voucher-acceptance semantics (unilateral vs mutual).
8. Vouch decay over time.
9. Beacon-mode protocol spec.
10. Multi-device pairing + recovery flow.
11. Peaks economy fine-tuning — exact reward/cost values per action.
12. Group conversations — add now or later?
13. Dark mode?

---

## Things explicitly NOT in the roadmap (yet)

- Public web version.
- Social-feed-style timeline.
- Public profiles searchable by strangers.
- Peer-to-peer crypto payments.
- AI agents / chatbots inside the app.
- Equipment categories beyond mountain/recreation/specialty for v1.

These may come later. They are not in scope through Phase 12.
