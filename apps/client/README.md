# Peak — web client

The web app at the heart of Peak. See the repo-root `docs/` for vision, architecture, and roadmap. This package is the Next.js 14 + TypeScript + Tailwind + Prisma + NextAuth + Stripe Connect client that ships v0 as a responsive website.

## Quick start

1) Install deps
```bash
npm install
```

2) Create `.env.local` (copy from `.env.example`)
```bash
cp .env.example .env.local
```

3) Initialize DB
```bash
npx prisma migrate dev --name init
npx prisma generate
```

4) Run
```bash
npm run dev
```

## Stripe setup notes

- Configure Stripe webhook endpoint to `POST /api/stripe/webhook`
- Use `STRIPE_WEBHOOK_SECRET` from your Stripe CLI or dashboard
- Owners must complete Connect onboarding to receive payouts

## Roles

- USER: browse/search/rent
- OWNER: list equipment + connect Stripe
- ADMIN: view analytics dashboard (unfulfilled searches)

