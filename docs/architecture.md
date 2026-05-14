# Peak — Architecture

> Technical decisions, system boundaries, and patterns. Pairs with `vision.md` (the why) and `roadmap.md` (the when).

---

## 1. Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Client shell | **Tauri 2.0** | One codebase → macOS, Windows, Linux, iOS, Android. WebView-based; ~5–10× less memory/battery than Electron. |
| Frontend framework | **Vite + React + TanStack Router** | Type-safe routing, fast HMR, native fit for Tauri's static-file model. No SSR (not applicable). |
| Native side | **Rust** (Tauri commands + plugins) | SQLite, BLE, Wi-Fi, CRDT engine, filesystem, secure storage. |
| Local storage | **SQLite** via `tauri-plugin-sql` | Single source of truth on-device. |
| ORM (client) | **Drizzle** | Works in Tauri's runtime (Prisma doesn't). Same schema everywhere. |
| Sync model | **Local-first with CRDTs** | Automerge for concurrent data (messages, conversations). Last-write-wins for user-owned scalars. |
| Identity | **Ed25519 keypair**, generated on first run | Stored in OS keychain via `tauri-plugin-stronghold`. |
| Transports | **Internet · Wi-Fi mesh · BLE · LoRa (future)** | Transport-agnostic message envelope; same signed payload over any channel. |
| Maps | **MapLibre GL** + offline regions | Open-source Mapbox fork. Aggressive tile caching. |
| Payments | **Stripe Connect** (destination charges) | Online-only operation; queued and replayed when reachable. |
| Server (v2+) | None in v1. Eventually a slim **Hono** or **Rust/Axum** relay. | Pure local + mesh in v1 forces correctness; cloud added as optimization. |

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

Single abstraction (`packages/mesh-protocol`) over four transports. Each implements a common interface: `discover()`, `connect()`, `send()`, `receive()`, `disconnect()`.

| Transport | Range | Bandwidth | Power | Native | Use |
|---|---|---|---|---|---|
| Internet (WebSocket/HTTPS) | global | high | medium | yes | Default when reachable; long-distance sync |
| Wi-Fi Direct (Android) | 200m+ | high | medium | Android | Full sync between nearby peers |
| Multipeer Connectivity (iOS) | 200m+ | high | medium | iOS | Apple's Wi-Fi/BLE hybrid framework |
| Wi-Fi Aware (NAN) | ~100m | mid | low-medium | both, newer | Infrastructure-free discovery + messaging |
| BLE (custom GATT profile) | 10–100m | low | very low | both | Proximity discovery, low-bandwidth status pings |
| LoRa (companion hardware) | 2–15km | very low | very low | hardware add-on | **Emergency beacon, life-saving** |

**Cross-platform abstraction**: leading candidate is **libp2p** (Rust crate `rust-libp2p`) with BLE/Wi-Fi/TCP transports. Fallback: custom Rust integration of `btleplug` (BLE) + platform-specific Wi-Fi adapters.

Prior art to study: **Bridgefy** (BLE mesh SDK), **Berty** (libp2p + BLE chat), **Briar** (Tor + BT + Wi-Fi mesh), **Meshtastic** (LoRa). See `roadmap.md` Phase 5–6 for research scope.

## 8. Maps

- **MapLibre GL JS** in the WebView (open-source Mapbox GL fork; no token required for non-Mapbox tiles).
- **Offline regions**: pre-downloaded by area. Storage budget per region settable per device.
- **Tile sources**: starting with **MapTiler** or **Stadia Maps** (commercial, has offline-friendly licensing), with **OpenStreetMap** as the data layer.
- **Map style**: custom Peak style — cream/snow palette, brass road accents, soft topographic shading, minimal labels. Authored in MapTiler Studio or Maputnik.
- **Equipment pins**: emoji-based category icons over forest-green selected state; brass borders; subtle drop-shadow tail (pushpin aesthetic).

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

1. **libp2p vs custom mesh stack.** libp2p gives a lot for free but is heavy. Worth measuring binary size and battery impact before committing.
2. **iOS BLE background limitations.** iOS restricts background BLE advertising. How aggressively can we discover peers when the app is backgrounded?
3. **Wi-Fi Direct on iOS.** iOS doesn't expose Wi-Fi Direct directly. Multipeer Connectivity is the official path — does it give us what we need, or do we need ad-hoc Wi-Fi via captive portal hacks?
4. **CRDT footprint.** Automerge documents grow over time. Pruning/snapshotting strategy needed before message history gets large.
5. **Map tile licensing offline.** MapTiler offline licensing terms; alternative is self-hosted OSM tiles, which costs us infrastructure. Decision deferred to Phase 7.
6. **Stripe vs payment alternatives in remote regions.** Stripe requires internet at point of sale. Should v2+ support cash/IOU bookings with reconciliation when online?
7. **Voucher acceptance.** Does broadcasting require vouchee acceptance, or is it unilateral?
8. **Vouch decay.** Do old vouches expire? After how long?
9. **Beacon-mode protocol.** What does "I'm here, send help" look like over BLE / Wi-Fi / LoRa? Standard format? Bridge to emergency services?
10. **Multi-device sync.** When a user has laptop + phone, how does identity-pairing work? What if they lose a device — recovery flow?
