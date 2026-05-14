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
- [x] Decision: Linux (Fedora 43) + Android only for v1; iOS / macOS / Windows / LoRa deferred.
- [x] Decision: rip the band-aid — go to Vite + Tauri immediately after schema, don't waste effort on the dying Next.js scaffolding.
- [x] Decision: headline north-star demo is two laptops on Wi-Fi mesh, no internet, mutual vouch + chat.
- [x] Three consolidated docs written.
- [x] Aegis (https://github.com/Rootbay/Aegis) cloned to `_research/aegis/` and reviewed — see notes in `architecture.md` §7.
- [x] rust-libp2p evaluated — production-grade for TCP/QUIC/WebSocket/mDNS/Relay; BLE and Wi-Fi Direct are out-of-scope for libp2p so we'd build those bridges ourselves anyway. Identity story (Ed25519/Noise/PeerId) is the strongest part. ~70% NAT hole-punch on cellular; mitigate with our own relay infra.
- [x] MapLibre Native research delivered — Path C locked (native MapView under transparent WebView), tiles = Protomaps PMTiles, style authored in Maputnik. Architecture §8 has the details.
- [ ] **Outstanding**: P2P-foundation spike (rust-libp2p direct vs iroh vs Aegis-as-curated-libp2p) — decision lands after the spike in Phase 0.5.a.

---

## Phase 0.5 — Pre-execution research spikes

Two decisions need short prototypes before we lock the architecture in code. Each spike is timeboxed (1–2 days).

### 0.5.a — P2P foundation spike
The Aegis review and the libp2p evaluation both came in clean but each adds nuance. Three credible paths:

| Option | Get for free | Risk |
|---|---|---|
| **rust-libp2p direct** | Mature TCP/QUIC/WebSocket/mDNS/Relay, Ed25519+Noise, broad ecosystem, multi-language interop | ~70% NAT hole-punch success on cellular; we still build BLE/Wi-Fi-Direct ourselves |
| **iroh** | ~90% direct-connect, official Android/iOS support, QUIC-multipath, smaller surface | Younger (pre-1.0), tighter opinions, leans on n0 hosted relays by default |
| **Aegis** (already uses libp2p v0.40 + adds Ed25519 / Noise / Vodozemac E2EE / AERP routing) | Crypto + identity + mesh routing already built in a Tauri+Rust app | Discord-like data model we don't want; BLE/Wi-Fi Direct stubbed; v0.1.0 maturity |

**Spike**: build a 2-peer Automerge sync over each, on Linux + Android via Tauri. Compare ergonomics, build time, APK size, time-to-first-connect on a real cellular network. **Deliverable**: one-page decision doc + recommendation.

### 0.5.b — Map integration spike (decisions locked, build the prototype)
The MapLibre Native research deliverable picked **Path C** (native MapView under transparent WebView). Concrete prototype scope (1.5–2 weeks):

- [ ] Linux-only Tauri window opens directly to Big White Village (49.7231, -118.9367)
- [ ] Loads `assets/map/tiles/big-white-village.pmtiles` via `pmtiles://` MapLibre protocol
- [ ] Applies stub Peak-styled `assets/map/style.json` (cream/brass/snow palette, hand-tuned in Maputnik from Protomaps basemap)
- [ ] Smooth pan/zoom at 60fps with **airplane mode on** (proves true offline)
- [ ] 5 hard-coded HTML overlay markers from a static GeoJSON file
- [ ] Acceptance: the three load-bearing claims confirmed in one shot — MapLibre Native runs in Tauri Rust process, custom style renders correctly, offline-from-PMTiles works zero-network

### 0.5.c — Tile-source decision (locked)
**Protomaps PMTiles**. MIT license, single-file format (perfect for the Big White Village pre-bundle requirement), MapLibre native protocol support. Avoids the MAU-license traps of MapTiler/Stadia for offline use. Build pipeline: OSM PBF → `planetiler` or `tilemaker` → PMTiles, weekly/monthly via CI.

Online fallback (when zoomed-out exploration leaves the bundled region): MapTiler Cloud Free (100K req/mo) for prototyping; reassess at scale.

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

## Phase 5 — Tauri shell, Linux desktop build

Goal: wrap the client in Tauri for Linux (Fedora 43, Wayland). Other desktop platforms deferred.

- [ ] **Scaffold `apps/client/src-tauri/`** with `tauri init` against the Vite app.
- [ ] **Wire up `tauri-plugin-sql`** for the local SQLite. Replace any Node-fs-based local storage.
- [ ] **Wire up `tauri-plugin-stronghold`** for keychain-backed Ed25519 keypair (or libsecret on GNOME if Stronghold is too heavy).
- [ ] **Identity bootstrap**: on first launch, generate keypair, store in keychain, write public key to local DB.
- [ ] **Linux build**: produce a Fedora 43–compatible binary (AppImage and/or RPM). Test on the dev workstation.

**Acceptance**: install on Fedora 43; first-launch flow generates identity; app boots offline and shows local-seeded equipment.

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

Goal: device-to-device discovery and low-bandwidth messaging over Bluetooth, on Linux + Android.

- [ ] **Research deliverable** (partly done): decision doc on libp2p custom transport vs raw `btleplug` integration. From the libp2p evaluation: BLE is not a libp2p first-class transport — we'll build the BLE transport ourselves on `btleplug`, then hand the resulting socket-like channel to libp2p.
- [ ] **Spike**: `btleplug` from `src-tauri`; basic peer discovery + GATT read/write between two devices (Linux↔Linux first, then Linux↔Android).
- [ ] **Android foreground service**: required for sustained BLE advertising on Android 12+. Implement persistent notification + service lifecycle.
- [ ] **Multi-hop relay**: Aegis review noted BLE in upstream is point-to-point only. We extend with relay forwarding so peers act as repeaters.
- [ ] **Integrate into mesh transport layer**: BLE becomes a registered transport. Message envelope unchanged.
- [ ] **Demo target**: two devices with no network, in BLE range, can ping presence and exchange a 100-byte vouch.

**Acceptance**: device-to-device presence ping works at < 30 m. Battery draw < 5%/hour with BLE scanning active.

---

## Phase 8 — Wi-Fi mesh prototype (research → spike → ship)

Goal: higher-bandwidth wilderness peer-to-peer on Linux and Android.

- [ ] **Research deliverable**: decision doc on Wi-Fi Direct (Android) vs Linux ad-hoc/AP-mode + mDNS. Cover OEM Android quirks (Samsung/Xiaomi diverge on Wi-Fi Direct service discovery), group-formation latency (5–15s typical), and battery impact.
- [ ] **Linux spike**: ad-hoc / AP mode Wi-Fi via `nmcli` or `hostapd`, with mDNS for peer discovery. Two laptops, no infrastructure.
- [ ] **Android spike**: Wi-Fi Direct via `WifiP2pManager` from Tauri (JNI bridge). Once L2 link is up, libp2p TCP/QUIC takes over.
- [ ] **Pair with BLE**: BLE handles the "saw a nearby peer" event; Wi-Fi takes over for the actual data link (Wi-Fi Direct discovery is too slow on its own).
- [ ] **Integrate into mesh transport layer**.
- [ ] **Range test**: confirm 200m+ line-of-sight in open environment.

**Acceptance**: two devices, no infrastructure, 200m apart in line-of-sight, can fully sync trust graph + recent messages. **This is the headline demo (Demo C in execution plan).**

---

## Phase 9 — Maps full integration (Linux + Android)

Goal: maps that work without bars, on both Linux and Android, with the full Peak aesthetic.

Builds on the Phase 0.5.b spike. By this point the Linux prototype proves the rendering + offline + style story; this phase productionizes it and adds Android.

- [ ] **Linux**: ship the Phase 0.5.b prototype as the production map view inside the Vite app's `app/map` route (via `GtkGLArea` sibling under Tauri's GTK4 webview).
- [ ] **Android**: write `tauri-plugin-peak-map` — Kotlin `@TauriPlugin` class that embeds `org.maplibre.android.maps.MapView` under a transparent WebView, exposes `setCamera`, `setStyle`, `addPins(geojson)`, `downloadOfflineRegion`.
- [ ] **Full Peak map style**: finalize `assets/map/style.json` — cream/snow base, brass road accents, soft hillshade, minimal labels. Sprites at `assets/map/sprites/peak@1x.png` (+ `@2x`).
- [ ] **Equipment-pin rendering**: HTML overlay markers in React, synced to camera-change events from the native plugin. Trust-graph filtered in Rust before reaching the renderer.
- [ ] **Cluster rendering**: at >100 visible pins, swap to MapLibre symbol layers with `cluster: true` GeoJSON source.
- [ ] **PMTiles build pipeline**: CI job that produces `big-white-village.pmtiles` weekly from OSM PBF via `planetiler`. Bundled via `tauri.conf.json` `bundle.resources`.

**Acceptance**: full map navigation with airplane mode on, no degraded UX in the bundled region. Pinch/pan smooth at 60fps on a mid-range Android phone.

---

## Phase 10 — Android build

Goal: Android shipping. iOS remains deferred.

- [ ] **`tauri android init`** scaffolding via `cargo-mobile2`. NDK r28+ for the 16 KB page-size requirement Google Play now enforces.
- [ ] **Mobile UI pass**: touch targets, gesture handling, safe areas, navigation patterns.
- [ ] **APK size budget**: target < 30 MB per ABI; use `--split-per-abi` (libp2p alone is ~6–10 MB).
- [ ] **Confirm transports end-to-end**: BLE foreground service, Wi-Fi Direct group formation, internet QUIC.
- [ ] **Play Store metadata**, icons, privacy disclosures.
- [ ] **Internal Track** beta.

**Acceptance**: signed APK on Play Internal Track; internal beta with at least 10 testers using BLE/Wi-Fi mesh in real-world conditions.

---

## Phase 11 — Emergency beacon mode

Goal: deliberate, life-saving feature. Skiers, climbers, trail crews can rely on it.

- [ ] **Protocol spec**: what does "I need help" look like over BLE and Wi-Fi? Standardize the payload (location, identity, severity, free-text). LoRa version comes later (Phase 12+, post-v1).
- [ ] **Power-aware UX**: low-screen-brightness mode; minimal CPU; maximize beacon-radio duty cycle.
- [ ] **Relay rules**: any Peak device in range opportunistically relays beacons toward internet-connected peers, regardless of vouch graph (life safety overrides trust gating).
- [ ] **Bridge to emergency services**: research feasibility of forwarding beacons to local SAR (Search & Rescue) APIs or text-911 in supported regions.
- [ ] **False-positive guardrails**: confirmation flow, automatic clear, no accidental activation.

**Acceptance**: tested cold-storage demo with two devices, one set to beacon, the other receiving and relaying. Spec reviewed by at least one SAR practitioner.

---

## Phase 12 — LoRa companion hardware research (post-v1)

Goal: extend mesh range to kilometers. **Explicitly post-v1** — phone-native transports cover the v1 wilderness story. Don't start until v1 ships.

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
