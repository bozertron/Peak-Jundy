# Peak — Architecture

> Technical decisions, system boundaries, and patterns. Pairs with `vision.md` (the why) and `roadmap.md` (the when).

---

## 1. Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Client shell | **Tauri 2.0** | One codebase → Linux + Android in v1; iOS/macOS/Windows deferred. WebView-based; ~5–10× less memory/battery than Electron. |
| Frontend framework | **Vite + React + TanStack Router** | Type-safe routing, fast HMR, native fit for Tauri's static-file model. No SSR (not applicable). |
| Native side | **Rust** (Tauri commands + plugins) | SQLite, BLE, Wi-Fi, CRDT engine, filesystem, secure storage. |
| Local storage | **SQLite** via `tauri-plugin-sql` | Single source of truth on-device. |
| ORM (client) | **Drizzle** | Works in Tauri's runtime (Prisma doesn't). Same schema everywhere. |
| Sync model | **Local-first with CRDTs** | Automerge for concurrent data (messages, conversations). Last-write-wins for user-owned scalars. |
| Identity | **Ed25519 keypair**, generated on first run | Stored in OS keychain via `tauri-plugin-stronghold`. |
| P2P / mesh | **rust-libp2p** OR **Aegis** (under evaluation) — see `_research/aegis/` and pending research | Final choice gated on the agent reviews now in flight. |
| Transports | **Internet · Wi-Fi mesh · BLE** in v1; **LoRa via companion hardware** deferred | Transport-agnostic message envelope; same signed payload over any channel. |
| Maps | **MapLibre Native** + offline regions | Native renderer (not GL JS). Integration path TBD by current research; `maplibre-rs` (pure Rust, WebGPU) also under evaluation. |
| Payments | **Stripe Connect** (destination charges) | Online-only operation; queued and replayed when reachable. |
| Server (v2+) | None in v1. Eventually a slim **Hono** or **Rust/Axum** relay. | Pure local + mesh in v1 forces correctness; cloud added as optimization. |

### Platform scope for v1
- **Primary**: Linux desktop (Fedora 43, Wayland) and Android.
- **Deferred**: iOS (no Multipeer Connectivity work in v1), macOS, Windows.
- **Demo target**: two Fedora laptops on the same Wi-Fi network, no internet, mutual vouch + chat over the mesh.

## 2. Local-first principles

These are non-negotiable:

1. **Reads never block on network.** Every screen renders from local SQLite. Sync is background.
2. **Writes are local-first.** User actions commit to local DB immediately, then queue for sync.
3. **Conflicts are explicit, not silent.** CRDTs where concurrent edits are plausible; explicit merge UI elsewhere.
4. **Identity is sovereign.** No central authority can impersonate a user. Signed messages, not session tokens.
5. **No special "offline mode".** Offline is the default. "Online" is an opportunistic capability that surfaces additional features (discovering new peers, syncing distant network state, processing payments).

## 3. Client architecture

### 3.1 Frontend

```
apps/client/src/
├── routes/                # TanStack Router file-based routes
│   ├── _layout.tsx        # App shell
│   ├── index.tsx          # Home / map
│   ├── network.tsx        # Trust network visualization
│   ├── cards.tsx          # Contact card gallery
│   ├── profile/$id.tsx
│   ├── chat/$id.tsx
│   ├── equipment/$id.tsx
│   └── (owner|admin)/...  # Role-gated sub-trees
├── features/              # Feature folders — UI + hooks + local logic
│   ├── trust/
│   ├── peaks/
│   ├── chat/
│   ├── map/
│   ├── cards/
│   ├── equipment/
│   └── stripe/
├── lib/                   # Shared client-only utilities
│   ├── db/                # Drizzle schema + queries
│   ├── sync/              # CRDT bindings, queue, conflict resolution
│   ├── mesh/              # Transport abstraction, peer discovery
│   ├── identity/          # Keypair, signing, verifying
│   └── tauri/             # Wrappers around Tauri commands
└── styles/                # Global CSS, tokens
```

### 3.2 Rust side

```
apps/client/src-tauri/
├── src/
│   ├── main.rs
│   ├── commands/          # Tauri commands invoked from JS
│   │   ├── db.rs
│   │   ├── identity.rs
│   │   ├── mesh.rs
│   │   └── sync.rs
│   ├── crdt/              # Automerge integration
│   ├── transports/        # ble.rs, wifi.rs, internet.rs (libp2p)
│   └── plugins/           # peak-mesh-ble, peak-mesh-wifi (custom plugins)
└── Cargo.toml
```

### 3.3 Module boundaries (monorepo)

```
peak/
├── apps/
│   ├── client/            # Tauri 2.0 app (the product)
│   └── relay/             # FUTURE: slim sync server (Hono/Axum)
├── packages/
│   ├── core/              # Domain types, validators, business rules (shared with relay)
│   ├── design-system/     # Tokens (lib/design-system.ts) + Peak UI primitives
│   ├── peaks-engine/      # Tier logic, reward math (current lib/peaks.ts, ported)
│   ├── mesh-protocol/     # Wire format, message envelopes, signature scheme
│   └── crdt-schemas/      # Automerge document schemas
└── docs/
    ├── vision.md
    ├── architecture.md
    └── roadmap.md
```

Naming: **kebab-case everywhere** (`peak-button.tsx`, not `PeakButton.tsx`). The duplicate uppercase UI files from the current codebase get dropped during migration.

## 4. Storage & schema

Single SQLite database per device. Schema is the canonical local model — relay (when added) mirrors it. All models present from day one:

```
User                    +avatarUrl, +memberSince, +foundingMember,
                        +flavor, +latitude, +longitude, +locationName,
                        +peaksBalance, +publicKey (Ed25519)
Equipment               +image, +location, +specs (JSON), @@index([category, location])
Booking                 +cancelledAt, +cancellationReason,
                        +stripeSessionId @unique, @@index([status])
SearchLog               (unchanged)
Vouch                   id, voucherId, voucheeId, note?, broadcast, broadcastAt?
ContactCard             id, collectorId, subjectId, origin,
                        @@unique([collectorId, subjectId])
Conversation            id, participants (M2M User), equipmentId?,
                        createdAt, updatedAt
Message                 id, conversationId, senderId, content,
                        signature, transport, deliveredAt?, readAt?,
                        @@index([conversationId, createdAt])
PeaksTransaction        id, userId, amount, reason, referenceId?,
                        referenceType?, createdAt
TreasureChest           id, title, description, peaksCost, prizeType,
                        prizeValue?, available, claimedBy?, claimedAt?
SyncCheckpoint          id, peerId, lastSyncedAt, lastEntityVersion
```

### 4.1 Money — invariants

- **All prices stored in cents (integers). Never floats.** $350/day = `35000`.
- Platform fee constant: `PLATFORM_FEE_BPS = 1000` (= 10%).
- Application fee formula: `applicationFee = Math.round((totalAmount * PLATFORM_FEE_BPS) / 10000)`.
- Owner receives the remainder via Stripe Connect `transfer_data.destination`.

### 4.2 Specs as JSON

`Equipment.specs` is a JSON string column. Flexible per-category schema (telehandler has reach + capacity; skid steer has rated operating capacity; lift has working height). Validation lives in `packages/core/specs/<category>.ts`.

## 5. Identity & security

### 5.1 Keypair-based identity
On first run, the client generates an **Ed25519 keypair** locally. The private key lives in OS keychain (via `tauri-plugin-stronghold`); the public key is the user's stable identifier across devices. Users can pair additional devices by signing a device-add operation with an existing device.

### 5.2 Signed messages
Every cross-device message — vouch, contact card, chat message, peaks transaction broadcast — is signed by its originator's private key. The signature travels with the payload through every transport. A relay server cannot forge identity or alter content.

### 5.3 Trust-gated visibility
- Equipment visibility, chat creation, and contact-card formation all check the trust graph before exposing data.
- A peer over BLE who is **not in your trust graph** is invisible by default. Discovery is opt-in.
- Two unconnected users meeting in the wilderness must establish a vouch before they can exchange anything beyond identity announcements.

### 5.4 Optional E2E encryption
Message content over mesh is signed by default. End-to-end encryption (XChaCha20-Poly1305, key agreement via X25519) is **opt-in for v1**, default for v2. The signing/encryption layer lives in `packages/mesh-protocol`.

## 6. Sync engine

### 6.1 Two strategies, by data shape

| Data | Strategy | Reason |
|---|---|---|
| Messages, conversation state | **Automerge CRDT** | Naturally concurrent across devices and peers. Conflict-free merge. |
| Vouches, contact cards | **Append-only log + signature** | Vouches are atomic events; no concurrent edits. Replay-safe. |
| Peaks transactions | **Append-only log, server-arbitrated for online actions** | Ledger semantics; offline-earned Peaks reconcile via timestamp + signature. |
| User profile, peaksBalance cache | **Last-write-wins by signed timestamp** | Single-writer per device; rare conflicts. |
| Equipment listings | **Last-write-wins, owner-only writes** | One writer (owner). |

### 6.2 Sync queue
Outbound operations queue in a local `outbox` table. Background workers attempt delivery over the highest-available transport (internet > Wi-Fi > BLE). Successful sync advances the queue; failures retry with exponential backoff.

### 6.3 No central server in v1
All sync flows peer-to-peer through the mesh transport layer. Peers discovered on local network sync to depth-2 of the trust graph. Internet-connected peers can relay updates between geographically-separated network islands. This is **the local-first wilderness model in practice**.

## 7. Mesh transport layer

Single abstraction (`packages/mesh-protocol`) over the transports below. Each implements a common interface: `discover()`, `connect()`, `send()`, `receive()`, `disconnect()`.

### v1 transports (Linux + Android)

| Transport | Range | Bandwidth | Power | Where | Use |
|---|---|---|---|---|---|
| Internet (TCP/QUIC/WebSocket) | global | high | medium | both | Default when reachable; long-distance sync |
| Wi-Fi Direct | 200m+ | high | medium | Android | Full sync between nearby peers without infrastructure |
| Wi-Fi ad-hoc / AP mode | 200m+ | high | medium | Linux | Linux equivalent for the wilderness laptop demo |
| mDNS local discovery | local LAN | n/a | low | both | Find Peak peers on the same Wi-Fi network |
| BLE (custom GATT profile) | 10–100m | low | very low | both | Proximity discovery, low-bandwidth status pings |

### Deferred (post-v1)

| Transport | Status |
|---|---|
| Multipeer Connectivity (iOS) | iOS deferred — not in v1 |
| Wi-Fi Aware (NAN) | Worth re-evaluation when Android coverage is solid |
| LoRa (companion hardware) | Deferred — phone-native transports cover v1 wilderness story |

### Foundation choice (under evaluation)

Two candidates being researched in parallel:

1. **rust-libp2p** — mature P2P stack in Rust. Modular transports (TCP, QUIC, WebSocket, mDNS, Noise). BLE and Wi-Fi mesh likely require custom integration. Sized for production.
2. **Aegis** (https://github.com/Rootbay/Aegis) — already a Tauri app with Rust P2P layer. Cloned to `_research/aegis/` for review. May give us a head start; tradeoff is alignment with our specific transport mix and the licensing terms.

The decision lands in the next iteration once both research deliverables are in. Whichever wins, the `mesh-protocol` package wraps it so we can swap underneath without touching application code.

Prior art also worth study: **Bridgefy** (BLE mesh SDK), **Berty** (libp2p + BLE chat), **Briar** (Tor + BT + Wi-Fi mesh), **Meshtastic** (LoRa). See `roadmap.md` Phase 5–6 for research scope.

## 8. Maps

Decisions locked in based on the MapLibre Native research deliverable. Caveat: `maplibre-rs` (the pure-Rust WebGPU port) was **archived January 2026** and is off the table. The active Rust binding is `maplibre-native-rs` (CXX over the C++ engine), v0.4.5, monthly auto-updates.

### Renderer
- **MapLibre Native** — C++17/20 GPU-accelerated vector tile renderer, BSD-2 licensed. (https://github.com/maplibre/maplibre-native)
- Backends: OpenGL/OpenGL ES (Linux + Android primary), Vulkan and WebGPU available.

### Integration path: **Path C — native MapView under transparent WebView**
- **Android**: custom Tauri plugin (`tauri-plugin-peak-map`) embeds `org.maplibre.android.maps.MapView` (org.maplibre.gl:android-sdk:13.x) in the activity's root `FrameLayout` *under* a transparent WebView. Plugin exposes `@Command` methods for `setCamera`, `setStyle`, `addPins(geojson)`, `downloadOfflineRegion(bbox, zoomRange)`. Adds ~5–7 MB per ABI; minSdk 24.
- **Linux**: `maplibre-native-rs` Continuous mode rendered into a `GtkGLArea` sibling of Tauri's GTK4 webview. Wayland-native via EGL.
- **Rejected**: Path A (GL JS in WebView — no first-class offline regions, worse mobile performance). Path B (texture readback to WebView — IPC bandwidth and pointer-event latency would be visibly bad for pinch/pan). Path D (`maplibre-rs` — archived).

### Tiles: **Protomaps PMTiles**
- Single-file format, MIT license, native MapLibre protocol support via `pmtiles://path/to/file.pmtiles`. (https://docs.protomaps.com/pmtiles/maplibre)
- **Big White Village pre-bundled**: regional PMTiles file ships in the installer. Path: `assets/map/tiles/big-white-village.pmtiles`. ~50–200 MB.
- Future on-demand region downloads: host PMTiles files on cheap object storage (R2/S3, ~$0.50/mo), MapLibre uses HTTP range requests.
- Build pipeline: OSM PBF → `planetiler` or `tilemaker` → PMTiles, run weekly/monthly via CI. ~2 hours per refresh.
- Avoids the MAU-license traps of MapTiler/Stadia for offline use.
- Online fallback for zoomed-out exploration outside downloaded regions: MapTiler Cloud Free (100K req/mo) for prototyping.

### Offline regions
- Bundled-PMTiles approach handles v1 (one region: Big White Village).
- v2: dynamic per-region downloads via MapLibre's `OfflineManager` API on Android. Note: `maplibre-native-rs` v0.4.5 does not yet expose `OfflineManager` — Linux desktop sticks with bundled or pre-baked PMTiles for now.

### Style authoring
- **Maputnik** (https://maputnik.github.io/) — open-source, BSD, browser-based, exports MapLibre Style Spec JSON.
- Start from Protomaps "basemap" style → fork → adjust palette: cream `#F5EFE0` base, snow `#FAFAF7` highlights, brass road accents `#B8924A`, soft hillshade overlay.
- Stored at `assets/map/style.json` in the monorepo root (referenced by both Linux and Android builds).
- Sprites and glyphs under `assets/map/sprites/peak@1x.png` (+ `@2x`) and `assets/map/glyphs/`. Bundled via Tauri `bundle.resources` in `tauri.conf.json`.

### Equipment pins
- **HTML overlay markers** in the React layer (not MapLibre symbol layers).
  - Reason: emoji-based icons + brass borders + selected-state forest-green ring + scale animations are trivial in CSS; symbol layers would require pre-rasterizing emoji to a sprite sheet (the OS emoji font can't render in MapLibre's symbol pipeline).
  - HTML markers comfortable up to ~200 visible at 60fps.
- Camera-change events stream from the native plugin → React projects GeoJSON points to screen coords.
- Above ~500 visible pins → swap to MapLibre symbol layers with `cluster: true` GeoJSON source. Threshold tunable.

### Trust-network filtering
- Done in Rust before the GeoJSON ever reaches the renderer: filter `equipment` by `vouch_graph.contains(equipment.owner_id)`, emit only that subset as the marker source. Renderer stays dumb; trust logic centralized.

## 9. Payments

Stripe Connect is **online-only**. The product cannot complete a charge offline (this is a hard constraint of the payment processor).

- **Account model**: Platform Account (holds platform fees) + Express Accounts (per owner).
- **Flow**: owner onboarding → renter checkout → destination charge → fee split.
- **Auto-promotion**: `USER` role becomes `OWNER` on Stripe Connect account creation.
- **Webhook events**: `v2.core.account.requirements.updated`, `v2.core.account.configuration.recipient.capability_status_updated`, plus standard `checkout.session.*` events.
- **Cancellation fields**: `Booking.cancelledAt`, `Booking.cancellationReason`, `Booking.stripeSessionId @unique` for refund logic.
- **Webhook signature validation**: required on every inbound webhook.

When offline, the UI can collect intent (e.g., "request rental") but cannot finalize payment. Intent gets queued and surfaced when a network becomes available.

## 10. RBAC

Three roles: `USER`, `OWNER`, `ADMIN`. Promotion rules:
- `USER` → `OWNER` on Stripe Connect onboarding completion.
- `ADMIN` is manually granted (no self-promotion).

Gates:
- `PUT/DELETE /equipment/[id]` checks `session.user.id === equipment.ownerId`.
- Analytics + admin views check `role === "ADMIN"`.
- Trust-network gates apply on top of role gates.

## 11. API design

### 11.1 Centralized validation
`packages/core/validation/*` houses all validators. Both client and (future) relay import them. Error shape:

```json
{ "errors": { "fieldName": "error message" } }
```

### 11.2 Search with side-effect
`POST /equipment/search` — case-insensitive full-text on `title|description|category`. If `results.length === 0`, **fire-and-forget non-blocking** `SearchLog.create({ fulfilled: false })`. The async pattern keeps search latency unaffected.

### 11.3 Custom hooks
Three core hooks, ported from current `lib/hooks.ts`:
- `useEquipment(id)` → `{ equipment, loading, error }`
- `useAuth()` → wraps local-identity state
- `useSearch()` → `{ results, loading, error, search, clear }`

### 11.4 Rate limiting (relay-side, when added)
- 100 requests/minute per user (authed) or IP
- 429 + `Retry-After` header on overage
- 60-second sliding window

### 11.5 Caching
- `GET /equipment` → `Cache-Control: s-maxage=300, stale-while-revalidate=60`

## 12. Aesthetic implementation

Design tokens live in `packages/design-system/tokens.ts`. Tailwind config consumes them. UI primitives:
- `peak-button` — 5 variants (primary, secondary, accent, ghost, outline), 4 sizes, loading state
- `peak-card` — compound (Header, Body, Footer); variants for equipment, contact, profile
- `peak-input` — input, textarea, select; validation error display
- `peak-frame` — base wrapper for elevated cards (white bg, subtle border, elegant shadow)
- `wood-accent` — 4 px horizontal gradient bar

Shadow scale: `peak-sm`, `peak`, `peak-lg`, `peak-frame`, `peak-lift` (hover).
Border radius: `rounded-peak` = 10 px. Never `rounded-full` on cards.
Animation: 150 ms fast / 250 ms standard / 400 ms slow. Easing: `ease` curves only. No bounces. Hover lift = translateY(-4 px) + shadow expansion.

## 13. Module ownership

| Module | Owns |
|---|---|
| `apps/client` | Everything user-facing on-device. |
| `apps/relay` (future) | Public discovery, internet-distance sync, Stripe webhook receiver. |
| `packages/core` | Domain models, validators, business rules. Shared. |
| `packages/design-system` | Tokens, primitives, Tailwind config. |
| `packages/peaks-engine` | Tier math, reward calculation, transaction validation. |
| `packages/mesh-protocol` | Wire format, signing scheme, transport interface. |
| `packages/crdt-schemas` | Automerge document shapes. |

## 14. Open architectural questions

To resolve during execution (tracked in `roadmap.md`):

1. **rust-libp2p vs Aegis vs build-our-own.** Currently being researched. Choice impacts binary size, transport coverage, and how much foundational code we own.
2. **MapLibre Native integration path.** Three options under evaluation (Path A/B/C/D in §8). Choice impacts Tauri integration complexity and Android performance.
3. **Tile-source vendor.** MapTiler vs Stadia vs self-hosted. Cost and offline licensing decide.
4. **CRDT footprint.** Automerge documents grow over time. Pruning/snapshotting strategy needed before message history gets large.
5. **Stripe vs payment alternatives in remote regions.** Stripe requires internet at point of sale. Should v2+ support cash/IOU bookings with reconciliation when online?
6. **Voucher acceptance.** Does broadcasting require vouchee acceptance, or is it unilateral?
7. **Vouch decay.** Do old vouches expire? After how long?
8. **Beacon-mode protocol.** What does "I'm here, send help" look like over BLE / Wi-Fi? Standard format? Bridge to emergency services?
9. **Multi-device sync.** When a user has laptop + phone, how does identity-pairing work? What if they lose a device — recovery flow?
10. **Linux Wi-Fi mesh approach.** Wi-Fi Direct support in Linux is uneven; AP-mode + mDNS may be the practical path for the two-laptop demo. Spike needed.

### Deferred (intentionally not v1)

- **iOS support.** All Multipeer Connectivity / AWDL / iOS-keychain work is out of scope.
- **macOS / Windows desktop.** Linux desktop only.
- **LoRa companion hardware.** Phone-native transports cover v1.
