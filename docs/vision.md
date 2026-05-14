# Peak — Vision

> A trust-first, wilderness-capable, mountain-flavored social platform where equipment rental is the activity that brings people together.

---

## 1. What Peak is

Peak is a peer-to-peer platform for **specialized communities** — starting with people who own and need heavy / recreational equipment in mountain regions, beginning at Big White Village. It is built around three inversions of the typical marketplace model:

- **Discovery is relational, not catalog-based.** You only see equipment from people inside your trust network. The map *is* the interface, not a feature.
- **Participation is rewarded, not just transactions.** "Peaks" — a narrative currency — accumulate for vouches, completed rentals, profile completion, referrals. Five tiers from Explorer to Alpine Elite. Spent on Treasure Chests.
- **Communication is intimate, private, and works off-grid.** Direct peer-to-peer messaging over BLE, Wi-Fi, or internet. Trust-gated. End-to-end signed.

Peak is **wilderness-capable**. Every interaction the app plausibly supports must work offline and sync when a network is reachable. This is not an enhancement — it is a foundation, because the people we serve are often out of reach of cell towers.

## 2. The wilderness principle

This is the differentiator. Everything else flows from it.

- **Local-first by default.** All user data lives on-device first. The server (when one exists) is a sync relay, not a source of truth.
- **Multi-modal communication.** Internet when available, Wi-Fi mesh in line-of-sight wilderness, Bluetooth for proximity, eventually LoRa for true long-range.
- **Signed messages, no central auth.** Identity is a local Ed25519 keypair. Signatures travel with every message, through every transport. The relay server cannot impersonate.
- **Offline maps.** MapLibre Native offline regions, cached aggressively. You can navigate, browse equipment, send messages, and queue vouches without bars.
- **Life-saving potential.** "I'm here, send help" is a deliberate design target. Beacon mode with low-power transports is on the roadmap. We design knowing skiers, climbers, and trail crews will sometimes rely on this in real emergencies.

### Platform scope for v1

- **Primary targets**: Linux desktop (Fedora 43, Wayland, GNOME 49) and Android.
- **Deferred**: iOS, macOS, Windows. The wilderness principle and mesh transports are tested on the platforms where we actually develop and ship; other platforms come once Linux + Android are battle-hardened.
- **LoRa companion hardware**: deferred. Phone-native BLE + Wi-Fi cover the v1 wilderness story.

## 3. Mission

Enable people in geographically-bound communities to discover each other, build trust, share resources, and stay connected — on or off the grid.

## 4. The six core systems

### 4.1 Trust Network
Directed graph of vouches. **Degree 1** = direct vouch. **Degree 2** = vouched by someone you've vouched for. A `broadcast` flag promotes a vouch from private to network-visible, expanding what's discoverable. Equipment, contact cards, and conversation gates all key off this graph.

### 4.2 Peaks — narrative reward currency
Five tiers: Explorer (0) → Trailblazer (100) → Summit Seeker (500) → Peak Patron (1,500) → Alpine Elite (5,000+). Earned for community-building actions (vouching, profile completion, first rental, referrals, founding-member bonus). Spent on Treasure Chests — limited rewards, discounts, special items. Peaks are reputation, not currency: not transferable, not cashable, tied to identity.

### 4.3 Map-first discovery
Spatial UI, not search-bar UI. Mapbox/MapLibre with custom pin design (emoji-based category icons, forest-green selected state, brass borders). Equipment pins are filtered through the trust graph — you see what your network makes visible. Geographic anchor: Big White Village (49.7231, -118.9367). Map works offline with cached tiles.

### 4.4 Peak Mesh — local-first multi-modal communications
What was "WebLink" becomes **Peak Mesh**: a transport-agnostic messaging layer. Same signed messages can flow over:
- **Internet** (WebSocket/HTTPS to a relay, when reachable)
- **Wi-Fi mesh** (Wi-Fi Direct on Android, Multipeer on iOS, ~200–500m line-of-sight in wilderness)
- **BLE** (proximity, very low power, for "who's around" discovery and micro-messages)
- **LoRa companion hardware** (future, kilometers of range for emergencies)

Chat is trust-gated. Conversations optionally linked to equipment context. CRDTs handle concurrent edits when peers reconnect.

### 4.5 Contact Cards
People become collectible trading cards. Auto-created when you vouch for someone or start a conversation. Display: avatar, name, "flavor" tagline, member tier, founding-member badge, trust-chain provenance ("introduced by X"). Cards form a personal gallery — your visible network.

### 4.6 Sophisticated Ski Chalet aesthetic
The look and feel of a well-appointed mountain lodge. Five principles:
1. Warmth over coldness (wood tones, cream, soft shadows).
2. Framed objects — items appear curated, like art on a wall.
3. Generous breathing room — luxury is space, not density.
4. Natural-material vocabulary — wood, brass, stone, glass.
5. Confident restraint — one accent at a time, never busy.

Colors: Forest Green primary (#2D5A47), Brass accent (#B8860B), Burgundy secondary (#722F37), Navy depth (#1E3A5F), Cream and Snow neutrals, Charcoal text. Typography: Libre Baskerville serif headers, Inter sans body, JetBrains Mono for specs. Signature: 4 px wood-tone gradient accent bars (light oak → brass → mahogany), `rounded-peak` (10 px) corners, hover-lift micro-animations.

## 5. Market positioning

Peak is launching in the **specialized equipment** vertical — heavy and recreational gear in mountain communities, where trust matters as much as inventory and price.

**Three-sided structure**: equipment owners, renters, and an admin layer that surfaces market gaps and unfulfilled demand to grow the supply side. Platform fee is **10% (1,000 basis points)**, configurable, applied as a Stripe Connect destination-charge split.

**Categories seeded for v1**: telehandlers (e.g. JLG 10054), aerial lifts (boom, man, scissor), compact equipment (skid steers, compact track loaders), specialty (jumping jack tampers, packing equipment, ICF bracing/formwork). Recreation and tools follow as the network expands.

**Why niche-then-expand**: trust networks compound inside tight communities. Big White Village is the geographic and cultural seed — ski-resort residents, contractors, ski patrol, trail crews — where reputation already travels by word of mouth. Peak makes that travel structured and persistent.

## 6. What Peak is NOT

- Not a generic equipment-rental marketplace. Browse-by-keyword is intentionally absent at the top of the funnel.
- Not a social network. There is no follow graph, no feed, no public profiles. Visibility is gated by vouches.
- Not a currency. Peaks don't convert to money. There is no transfer, no leaderboard prizing.
- Not anonymous. Real identity matters. Vouches are personal commitments.
- Not always-online. We do not assume cell service, server availability, or even WAN reachability.

## 7. Glossary

| Term | Meaning |
|---|---|
| **Peak** | The product. (Singular. Previously "Peak Rentals.") |
| **Peaks** | The reward currency. Five tiers; not transferable. |
| **Vouch** | One user attests to trust in another. Private by default; can be broadcast. |
| **Broadcast** | Promoting a vouch so it counts toward the voucher's network's visibility. |
| **Degree** | Trust distance — 1° (direct), 2° (via intermediary). |
| **Vouch chain** | The trust graph — gates discovery, messaging, and visibility. |
| **Contact Card** | Auto-collected "trading card" representing someone in your network. |
| **Peak Mesh** | The multi-transport messaging layer (formerly "WebLink"). |
| **Treasure Chest** | Spendable reward unlocked by Peaks balance. |
| **Founding Member** | Early-adopter badge — gold star, awarded by founding-cutoff date. |
| **Explorer / Trailblazer / Summit Seeker / Peak Patron / Alpine Elite** | The five tiers, ascending. |
| **Peak Frame** | Signature card styling — white bg, subtle border, elegant shadow. |
| **Wood Accent** | 4 px horizontal gradient bar (light oak → brass → mahogany). |
| **Big White Village** | Geographic anchor — Big White ski resort, BC (49.7231, -118.9367). |
| **Sophisticated Ski Chalet** | The aesthetic philosophy. |
| **Beacon mode** | (Roadmap) Low-power emergency broadcast over any available transport. |

## 8. Operating principles

These hold across every product decision:

1. **Trust before transaction.** Surface trusted things first; show transactional surfaces only when invited.
2. **Local before cloud.** Every feature designed to function with no network. Server is sync, not source.
3. **Signed before stored.** Identity and integrity travel with the message, not the channel.
4. **Maps before lists.** Discovery is spatial unless the user explicitly asks otherwise.
5. **Restraint before features.** The design favors negative space. Don't add what doesn't earn its place.
6. **Real before gamified.** Peaks reward real community contribution. Never invent fake interactions to farm them.
7. **Safety as a feature, not an afterthought.** If people in the wilderness might rely on it, design accordingly.
