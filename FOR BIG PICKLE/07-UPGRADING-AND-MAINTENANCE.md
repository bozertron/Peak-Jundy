# Upgrading & Maintenance

> How to keep the Peak codebase healthy, secure, and up-to-date.

---

## Checking for Outdated Packages

```bash
cd apps/client
npm outdated
```

This shows current vs wanted vs latest for each dependency.

---

## Upgrade Strategy

1. **Minor/patch upgrades first** — usually safe, run `npm update`
2. **Major upgrades one at a time** — change one major version, test, then move to the next
3. **After every upgrade** — run the full test suite:

```bash
npm run typecheck && npm run lint && npm run test:all
```

---

## Key Dependencies & Upgrade Considerations

### Next.js (currently 14.2.x)

| From → To | Key Changes | Risk |
|-----------|-------------|------|
| 14.0 → 14.2 | Security patches, stable App Router improvements | Low |
| 14 → 15 | Server Actions promoted, `next/headers` API changes, React 19 requirement | Medium-High |

**Note**: Peak is transitioning to Vite + TanStack Router (Phase 4), so major Next.js upgrades beyond security patches may not be worth the effort. Focus on patching CVEs.

### Prisma (currently 5.22.x)

| Concern | Notes |
|---------|-------|
| Minor upgrades | Generally safe; run `npx prisma generate` after |
| 5 → 6 | Major client API changes expected; wait for stable release |
| After any upgrade | Re-run `npx prisma generate` and verify queries compile |

### Stripe SDK (currently 17.x)

| Concern | Notes |
|---------|-------|
| API version | Stripe pins to dashboard version; SDK upgrade doesn't change API version |
| Breaking changes | Check [Stripe changelog](https://stripe.com/docs/changelog) |
| Webhook compatibility | Verify webhook construction still works after upgrade |

### Mapbox GL (currently 3.x)

| Concern | Notes |
|---------|-------|
| Token format | Ensure `NEXT_PUBLIC_MAPBOX_TOKEN` still valid |
| API changes | GL JS v3 is stable; unlikely to break |
| Future | Will be replaced by MapLibre Native in Phase 9 |

### React (currently 18.3.x)

| From → To | Key Changes | Risk |
|-----------|-------------|------|
| 18.3 → 19 | Concurrent features, `use()` hook, compiler | High |

**Note**: React 19 upgrade aligns with the Vite + TanStack Router migration (Phase 4). Don't upgrade React independently of that work.

### TypeScript (currently 5.4.x)

| Concern | Notes |
|---------|-------|
| Minor upgrades | Usually safe; may surface new type errors (good!) |
| Strict mode | Already enabled — maintain it |
| After upgrade | Run `npm run typecheck` to verify |

### Tailwind CSS (currently 3.4.x)

| Concern | Notes |
|---------|-------|
| Custom peak-* utilities | MUST be preserved in `tailwind.config.ts` |
| 3.x → 4.x | Major rewrite (CSS-first config); significant migration effort |
| Safe path | Stay on 3.4.x until the Vite migration |

---

## Node.js Version

- **Current**: Works with Node.js 18+
- **Optimized for**: Node.js 22 (LTS)
- **Check**: `node --version`
- **Upgrade path**: Use `nvm` or system package manager

---

## Security Maintenance

### Audit

```bash
npm audit
```

Address vulnerabilities by severity:
1. **Critical** — Fix immediately
2. **High** — Fix within the sprint
3. **Moderate** — Track for next maintenance window
4. **Low** — Address when convenient

### Fix automatically (when safe)

```bash
npm audit fix
```

### For stubborn vulnerabilities

```bash
# Check if it's a dev-only dependency (less urgent)
npm audit --omit=dev

# Force fix (may break things — test after!)
npm audit fix --force
```

---

## Database Maintenance

### Before Schema Changes

1. **Back up the database** (especially production/staging)
2. **Use migrations** for production: `npx prisma migrate dev --name descriptive-name`
3. **Test the migration** against a copy of production data if possible

### After Schema Changes

```bash
npx prisma generate      # Regenerate client types
npm run typecheck         # Verify all queries still compile
npm run test             # Verify queries work at runtime
```

### Prisma Studio (Visual DB Browser)

```bash
npx prisma studio        # Opens at http://localhost:5555
```

---

## Tailwind Custom Utilities

When upgrading Tailwind or modifying `tailwind.config.ts`, these custom extensions MUST be preserved:

```typescript
// These are Peak's identity — never remove
colors: {
  'peak-forest': { ... },
  'peak-brass': { ... },
  'peak-burgundy': { ... },
  'peak-navy': { ... },
  'peak-cream': '...',
  'peak-stone': '...',
  'peak-charcoal': '...',
  'peak-snow': '...',
  'peak-slate': '...',
  'peak-wood': { ... },
  'peak-copper': '...',
},
boxShadow: {
  'peak-sm': '...',
  'peak-md': '...',
  'peak-lg': '...',
  'peak-frame': '...',
  'peak-lift': '...',
  'peak-card': '...',
},
borderRadius: {
  'peak-sm': '...',
  'peak-md': '...',
  'peak-lg': '...',
  'peak-xl': '...',
},
fontFamily: {
  'display': [...],
  'heading': [...],
  'body': [...],
},
```

---

## Routine Maintenance Checklist

Weekly:
- [ ] `npm audit` — check for new vulnerabilities
- [ ] `npm outdated` — note new minor/patch releases

Monthly:
- [ ] Apply minor/patch upgrades
- [ ] Run full test suite
- [ ] Check Stripe API changelog for deprecations
- [ ] Review error logs for recurring issues

Quarterly:
- [ ] Evaluate major version upgrades
- [ ] Review and update `.env.example` if new vars needed
- [ ] Prune unused dependencies: `npx depcheck`
- [ ] Update Node.js if new LTS available
