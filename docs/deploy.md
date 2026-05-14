# Peak — deployment guide (v0)

Ship the web app at a real domain. Stack: Next.js + Postgres + Stripe + magic-link email + Mapbox.

This guide assumes you're deploying to **Vercel + Neon**. They have the best Next.js/Postgres combo, both have generous free tiers, and the setup is minutes. Alternatives are noted at the end.

---

## 0. Prerequisites

Pick a domain. `peak.com` is taken — likely candidates as of writing:

- `peak.app`
- `peak.community`
- `peakrentals.app`
- `peak.is`
- `getpeak.app`

Register at the domain registrar of your choice (Cloudflare, Namecheap, Porkbun). Keep the registrar's nameservers for now — Vercel will give you a CNAME / A record to point at.

You'll also need accounts at:

- **Vercel** (https://vercel.com) — free
- **Neon** (https://neon.tech) — free tier covers v0
- **Stripe** (https://stripe.com) — free; we use test mode for v0
- **Resend** (https://resend.com) — free tier for magic-link emails
- **Mapbox** (https://mapbox.com) — free tier (50K loads/month)

---

## 1. Database — Neon Postgres

1. Sign in to Neon → create a project named `peak`.
2. In the project dashboard, copy the **pooled** connection string (starts with `postgres://`). It looks like:
   ```
   postgres://USER:PASS@ep-xxx-pooler.us-east-1.aws.neon.tech/peak?sslmode=require
   ```
3. Keep it on your clipboard — you'll paste it into Vercel as `DATABASE_URL` in a moment.

> **Why pooled?** Vercel runs each API route as a short-lived serverless function. The pooled URL routes through Neon's pgBouncer, which is essential for serverless. The non-pooled URL is for migrations (next step).

4. Copy the **non-pooled / direct** connection string too — we'll use it once for the initial migration.

---

## 2. Stripe

1. Stripe dashboard → API keys → copy:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`)
2. For webhooks: this is set up after the app is deployed (we need the production URL). Skip for now; come back in step 7.

---

## 3. Email — Resend

1. Sign in to Resend → API Keys → generate one.
2. Pick a sending domain (Resend onboarding wizard). For v0, you can ship using their `resend.dev` sandbox.
3. SMTP credentials Peak needs:
   ```
   EMAIL_SERVER_HOST=smtp.resend.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=resend
   EMAIL_SERVER_PASSWORD=<your Resend API key>
   EMAIL_FROM="Peak <hello@your-sending-domain>"
   ```

---

## 4. Mapbox

1. Sign in to Mapbox → Account → Access tokens → copy the default public token (`pk.eyJ...`).
2. This goes in `NEXT_PUBLIC_MAPBOX_TOKEN`.

---

## 5. NextAuth secret

Generate locally:

```bash
openssl rand -base64 32
```

Copy the output — it goes in `NEXTAUTH_SECRET`.

---

## 6. Vercel — deploy

1. Push the `peak_vision_tree_1` branch to GitHub (already done by the dev workflow).
2. Vercel dashboard → **Add New** → **Project** → import the repo.
3. **Configure project**:
   - Root directory: `apps/client`
   - Framework preset: Next.js (auto-detected)
   - Build command: `prisma generate && next build`
   - Install command: leave default
4. **Environment variables** — paste each of:

   ```
   DATABASE_URL=<pooled Neon URL from step 1>
   DIRECT_URL=<direct Neon URL from step 1>           # optional, see migration note below
   NEXTAUTH_SECRET=<from step 5>
   NEXTAUTH_URL=https://your-domain.com               # use your actual domain
   EMAIL_SERVER_HOST=smtp.resend.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=resend
   EMAIL_SERVER_PASSWORD=<Resend API key>
   EMAIL_FROM=Peak <hello@your-sending-domain>
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=                              # filled in step 7
   PLATFORM_FEE_BPS=1000
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
   ```

5. Click **Deploy**. Wait for the build to finish (~2–3 min).
6. Once deployed, Vercel gives you a `<project>.vercel.app` URL. Visit it — the home page should load even before the DB is migrated; API routes will 500 until the next step.

### Run the first migration

The build container can't run `prisma migrate deploy` automatically against a fresh Neon DB. Two options:

**Option A — one-time local push:**

```bash
cd apps/client
DATABASE_URL="<direct Neon URL>" npx prisma db push
DATABASE_URL="<direct Neon URL>" node prisma/seed.js
```

**Option B — generate migrations and let CI deploy them:**

```bash
cd apps/client
DATABASE_URL="<direct Neon URL>" npx prisma migrate dev --name init_peak
git add prisma/migrations && git commit -m "Add initial Peak migration"
git push
# add `prisma migrate deploy` to the Vercel build command
```

Option A is fastest for v0. Option B is the right long-term setup.

After either: the API routes work. Visit `/` and `/browse` to confirm.

---

## 7. Stripe webhooks (post-deploy)

1. Stripe dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - (optional) `account.updated` for Connect status sync
4. Reveal the signing secret (`whsec_...`) → paste into Vercel as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy (Vercel does this automatically on env change).

---

## 8. Domain

1. Vercel project → Settings → Domains → add your domain.
2. Vercel gives you a CNAME (or apex A records). Add at your registrar.
3. DNS propagates in 1–60 min. Vercel auto-provisions Let's Encrypt SSL.
4. Update `NEXTAUTH_URL` env var to the real domain. Redeploy.

---

## 9. Smoke test

Open `https://your-domain.com` and walk through:

- [ ] Home page renders.
- [ ] `/browse` lists seeded equipment.
- [ ] `/equipment/[id]` shows detail page.
- [ ] `/auth/signin` accepts an email; check that the magic-link arrives in your inbox.
- [ ] After signing in, `/dashboard` works.
- [ ] `/map` loads the Mapbox view (will be empty if your account isn't in the seeded trust graph; sign in as `owner@peak.local` after running the seed locally and copying that user's data over to confirm).
- [ ] `/cards` shows your contact cards (if any).
- [ ] `/network` shows your trust graph.
- [ ] Owner onboarding via Stripe Connect (use a test card).

---

## 10. Alternatives

- **Hosting**: Fly.io (Postgres + Next.js in one platform, slightly more setup), Railway (similar), Render (similar). Vercel is fastest for v0.
- **Postgres**: Supabase (Auth + Postgres in one), Vercel Postgres (powered by Neon under the hood), local Docker (`docker compose up -d` from `apps/client/`).
- **Email**: Postmark, SendGrid, Mailgun, Loops. Resend is simplest.
- **Map tiles**: Stadia Maps, MapTiler, self-hosted tileserver-gl. Mapbox free tier is the simplest start.

---

## What this guide does NOT cover (yet)

- CI/CD (GitHub Actions for tests + preview deploys per PR)
- Monitoring (Sentry, Vercel Analytics)
- Custom Stripe Connect account-update sync
- Backup and recovery strategy for the DB
- Content moderation / abuse handling

These are post-v0 cleanups, tracked in `docs/roadmap.md`.
