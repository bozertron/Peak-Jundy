# Peak — web client

The web app at the heart of Peak. See the repo-root `docs/` for vision, architecture, roadmap, and deployment guide. This package is the Next.js 14 + TypeScript + Tailwind + Prisma + NextAuth + Stripe Connect client that ships v0 as a responsive website.

## Quick start (local dev)

1. **Install deps**
   ```bash
   npm install
   ```

2. **Set up Postgres.** Pick one:
   - **Local Docker** (no signup):
     ```bash
     docker compose up -d
     ```
   - **Neon** (https://neon.tech, free tier): create a project, copy the pooled connection string.

3. **Configure env**
   ```bash
   cp .env.example .env.local
   # Then edit .env.local — set DATABASE_URL, NEXTAUTH_SECRET, etc.
   ```
   Minimum to boot the app: `DATABASE_URL`, `NEXTAUTH_SECRET`. Stripe/email/Mapbox can stay placeholder until you exercise those flows.

4. **Sync the schema and seed**
   ```bash
   npx prisma db push        # schema -> DB (no migration history)
   npm run db:seed           # users, equipment, vouches, conversations, chests
   ```

5. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

For production deploys, see `../../docs/deploy.md`.

## Stripe setup notes

- Configure Stripe webhook endpoint to `POST /api/stripe/webhook`
- Use `STRIPE_WEBHOOK_SECRET` from your Stripe CLI or dashboard
- Owners must complete Connect onboarding to receive payouts

## Roles

- USER: browse/search/rent
- OWNER: list equipment + connect Stripe
- ADMIN: view analytics dashboard (unfulfilled searches)

