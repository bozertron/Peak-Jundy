# Environment & Configuration Reference

> Complete reference for all environment variables, config files, and infrastructure setup.

---

## Environment Variables

All env vars are documented in `apps/client/.env.example`. Copy to `.env.local` for local development:

```bash
cp apps/client/.env.example apps/client/.env.local
```

### Database

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://peak:peak@localhost:5432/peak?schema=public` | PostgreSQL connection string |

- For local dev: use the docker-compose Postgres (`localhost:5432`)
- For cloud: use Neon (https://neon.tech) free tier — pooled connection string
- Prisma reads this from `.env` or `.env.local` in the working directory

### Authentication (NextAuth)

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output | Session encryption secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | Base URL for auth callbacks |

### Email (Magic Link)

| Variable | Example | Description |
|----------|---------|-------------|
| `EMAIL_SERVER_HOST` | `localhost` (dev) / `smtp.resend.com` (prod) | SMTP server host |
| `EMAIL_SERVER_PORT` | `1025` (dev/Mailpit) / `587` (prod) | SMTP port |
| `EMAIL_SERVER_USER` | (empty for dev) / `resend` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | (empty for dev) / API key | SMTP password |
| `EMAIL_FROM` | `Peak <noreply@peak.local>` | From address on emails |

**Local dev**: Use Mailpit (SMTP on 1025, Web UI on 8025). All emails are caught and viewable at http://localhost:8025.

### Stripe (Payments)

| Variable | Example | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Server-side Stripe key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Client-side Stripe key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook signature verification |
| `PLATFORM_FEE_BPS` | `1000` | Platform fee in basis points (1000 = 10%) |

**Get test keys**: https://dashboard.stripe.com/test/apikeys
**Webhook secret**: Output of `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Maps

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ1...` | Mapbox GL access token |

**Get token**: https://account.mapbox.com/access-tokens/
Free tier: 50K map loads/month.

---

## Important: `NEXT_PUBLIC_` Prefix

Variables prefixed with `NEXT_PUBLIC_` are **exposed to the client browser** (bundled into JS at build time).

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — safe, it's the publishable key
- `NEXT_PUBLIC_MAPBOX_TOKEN` — safe, it's a public token
- **NEVER** prefix secret keys with `NEXT_PUBLIC_`

After changing `NEXT_PUBLIC_*` vars, you **must restart the dev server**.

---

## Security Rules

- `.env.local` is gitignored — **NEVER commit secrets**
- `.env.example` is the template (committed, contains no real values)
- Production secrets go in the hosting platform's env var configuration (Vercel, Fly, etc.)
- Rotate `NEXTAUTH_SECRET` periodically
- Use test-mode Stripe keys for development

---

## Config Files

### `next.config.js`

```javascript
// Minimal Next.js config
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration options
};
module.exports = nextConfig;
```

### `tsconfig.json`

Key settings:
- **Strict mode**: `"strict": true`
- **Target**: `"ES2022"`
- **Path alias**: `"@/*": ["./*"]` (so `@/lib/prisma` resolves to `./lib/prisma`)
- **Module**: `"ESNext"` with `"moduleResolution": "bundler"`

### `tailwind.config.ts`

Extended with Peak's custom design system:
- `peak-forest`, `peak-brass`, `peak-burgundy`, `peak-navy` color scales
- `peak-cream`, `peak-stone`, `peak-charcoal`, `peak-snow`, `peak-slate` utility colors
- `shadow-peak-*` custom shadows
- `rounded-peak-*` custom border radii
- Custom font families (`display`, `heading`, `body`)

### `jest.config.js`

- Preset: `next/jest` (handles transforms and .env loading)
- Multiple test projects: unit, api, components
- Module alias: `@/*` → `<rootDir>/*`
- Setup files for mocks and Web API polyfills

### `playwright.config.ts`

- Test dir: `__tests__/e2e`
- Base URL: `http://localhost:3000`
- 5 browser projects (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- Auto-starts dev server with `webServer` config
- Screenshots on failure, traces on first retry

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: peak-postgres
    environment:
      POSTGRES_USER: peak
      POSTGRES_PASSWORD: peak
      POSTGRES_DB: peak
    ports:
      - "5432:5432"
    volumes:
      - peak_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U peak -d peak"]
      interval: 5s
```

---

## Container Setup

### PostgreSQL

| Property | Value |
|----------|-------|
| Image | `postgres:16-alpine` |
| Container name | `peak-postgres` |
| Port | `5432` (host) → `5432` (container) |
| User | `peak` |
| Password | `peak` |
| Database | `peak` |

### Mailpit (Email Testing)

| Property | Value |
|----------|-------|
| SMTP Port | `1025` |
| Web UI | `http://localhost:8025` |
| Purpose | Catches all emails from dev server |

Install: `go install github.com/axllent/mailpit@latest` or use a container.

---

## Commands Quick Reference

```bash
cd apps/client

# Start infrastructure
podman-compose up -d              # Postgres (port 5432)

# Database setup
npx prisma db push                # Apply schema
npx prisma generate               # Generate client
npm run db:seed                   # Seed data

# Development
npm run dev                       # Next.js dev server (port 3000)

# Verification
npm run typecheck                 # TypeScript check
npm run lint                      # ESLint
npm run test                      # Jest tests
npm run test:e2e                  # Playwright E2E

# Database tools
npx prisma studio                 # Visual DB browser (port 5555)
npx prisma migrate dev            # Create migration
```

---

## Deployment

See `docs/deploy.md` for full deployment guide.

**Current deployment target**: Vercel + Neon

| Service | Purpose | Provider |
|---------|---------|----------|
| App hosting | Next.js server | Vercel |
| Database | PostgreSQL | Neon (free tier) |
| Email | SMTP relay | Resend |
| Payments | Stripe Connect | Stripe |
| Maps | Tile server | Mapbox |

**Future deployment** (post-Phase 5): Self-contained Tauri binary — no server needed for core functionality.
