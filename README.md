# Peak

A trust-first, wilderness-capable, mountain-flavored social platform where equipment rental is the activity that brings people together.

Local-first. Multi-modal mesh communications. Tauri 2.0 on every platform.

## Where to start

- **`docs/vision.md`** — what Peak is, who it serves, the six core systems, glossary.
- **`docs/architecture.md`** — technical decisions, schema, transports, module boundaries.
- **`docs/roadmap.md`** — phased execution plan.

## Repository layout

```
peak/
├── apps/
│   ├── client/          Tauri 2.0 app — desktop + mobile from one codebase
│   └── relay/           (future) slim cloud sync server
├── packages/
│   ├── core/            Domain models, validators, business rules
│   ├── design-system/   Peak aesthetic — tokens + UI primitives
│   ├── peaks-engine/    Tier logic, reward math
│   ├── mesh-protocol/   Wire format, signing scheme, transport interface
│   └── crdt-schemas/    Automerge document shapes
└── docs/                vision · architecture · roadmap
```

The `apps/client/` directory currently holds the inherited Next.js codebase. Phase 4 of `docs/roadmap.md` covers the migration to Vite + React + TanStack Router under Tauri.

## Status

Pre-Phase-1. The vision and architecture are settled; the code lift to match begins next.
