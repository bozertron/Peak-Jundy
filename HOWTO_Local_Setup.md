# Peak — local setup on Fedora 43

A complete, opinionated walkthrough for getting Peak running locally on **Fedora 43 Workstation** (GNOME 49 / Wayland / x86_64).

> Audience: a coding assistant (or a person comfortable in a terminal) following each step in order. Verification commands are included at the end of each section. If a step doesn't behave as described, stop and check before moving on.

---

## 0. Overview

You're setting up a Next.js 14 + TypeScript + Tailwind + Prisma + Postgres + Stripe + Mapbox web app.

End state when you're done:

- `http://localhost:3000` shows the Peak home page with **live seeded community stats**.
- You can sign in with a magic link captured locally (no real email server needed).
- The map page works (assuming a free Mapbox token).
- Treasure chests, vouches, contact cards, and the full marketplace catalog are clickable.

Expected wall-clock time on a fresh Fedora 43 install with no prereqs: **20–30 minutes**.

---

## 1. System prerequisites (one-time)

Open **Terminal** (GNOME Terminal or `ptyxis`, whichever ships with Fedora 43 / GNOME 49).

```bash
sudo dnf upgrade -y
sudo dnf install -y \
    git \
    nodejs npm \
    postgresql postgresql-server postgresql-contrib \
    podman podman-compose
```

What each package gives us:

| Package | Why |
|---|---|
| `git` | Clone the repo. |
| `nodejs npm` | Node.js 22.x ships in Fedora 43 — fine for Next 14. Verify below. |
| `postgresql postgresql-server postgresql-contrib` | Optional fallback if you'd rather run Postgres natively instead of via a container. We'll prefer container. |
| `podman podman-compose` | Fedora-native container engine. We use it instead of Docker (it's drop-in compatible with `docker-compose.yml`). |

### Verify

```bash
node --version       # expect v22.x.x (anything 18+ works; 20 LTS or 22 ideal)
npm --version        # expect 10.x or 11.x
git --version        # expect 2.4x+
podman --version     # expect 5.x
podman-compose --version
```

If `node` is older than 18, see **Appendix A — installing Node with nvm**.

### Make rootless Podman just work

Once-per-machine setup so containers can use ports < 1024 if needed and so `podman compose` finds the user socket:

```bash
# Enable the user-level podman socket (used by docker-compose-style tools)
systemctl --user enable --now podman.socket

# Verify
systemctl --user status podman.socket   # should say "active (listening)"
```

> If you ever see `Error: unable to connect to Podman socket`, this is the fix.

---

## 2. Clone the repo + check out the right branch

```bash
mkdir -p ~/code && cd ~/code
git clone <YOUR_REPO_URL> peak
cd peak
git checkout peak_vision_tree_1
```

Replace `<YOUR_REPO_URL>` with the GitHub URL (the user knows it). After cloning, you should see this top-level layout:

```
peak/
├── apps/client/         <- the Next.js web app (everything happens here)
├── docs/                <- vision.md, architecture.md, roadmap.md, deploy.md
├── packages/            <- empty placeholder for the future monorepo
├── HOWTO_Local_Setup.md <- this file
└── README.md
```

### Verify

```bash
ls apps/client
# expect to see: app  components  lib  prisma  public-ish stuff, package.json, docker-compose.yml
```

---

## 3. Install JS dependencies

```bash
cd apps/client
npm install
```

This will install ~750 packages including Next.js 14.2.35, Prisma 5.22, Stripe SDK 17, Mapbox GL, etc. Expect 30–90 seconds on a decent connection.

### Verify

```bash
ls node_modules/.bin/next   # should exist
ls node_modules/.bin/prisma # should exist
```

> If `npm install` complains about deprecated peer deps, ignore — they're upstream warnings, not blockers.

---

## 4. Start Postgres (option A: container — recommended)

The repo ships a `docker-compose.yml` in `apps/client/`. Podman speaks the same format.

```bash
cd ~/code/peak/apps/client
podman-compose up -d
```

This starts a `postgres:16-alpine` container called `peak-postgres`, listening on `localhost:5432`, with:

- user: `peak`
- password: `peak`
- database: `peak`

### Verify

```bash
podman ps
# expect a row with peak-postgres, status Up, port 0.0.0.0:5432->5432/tcp

podman exec -i peak-postgres pg_isready -U peak -d peak
# expect "/var/run/postgresql:5432 - accepting connections"
```

If you see `Error: short-name resolution enforced`, it means Podman wants a fully-qualified image name. Fix:

```bash
podman pull docker.io/library/postgres:16-alpine
podman-compose up -d
```

(Alternative: edit `/etc/containers/registries.conf.d/000-shortnames.conf` to add `docker.io`. Or use the dnf option below.)

### Stopping later

```bash
podman-compose down            # stop
podman-compose down -v         # stop AND wipe the DB volume (start fresh)
```

### Option B: native Postgres via dnf (skip if option A worked)

Use this only if Podman gives you grief.

```bash
sudo postgresql-setup --initdb --unit postgresql
sudo systemctl enable --now postgresql

# Create the peak user + db
sudo -u postgres psql <<'SQL'
CREATE USER peak WITH PASSWORD 'peak' SUPERUSER;
CREATE DATABASE peak OWNER peak;
SQL

# Allow password auth from localhost (Fedora's default is ident, which we don't want)
sudo sed -i 's/^host\s\+all\s\+all\s\+127.0.0.1\/32.*$/host    all    all    127.0.0.1\/32    md5/' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/^host\s\+all\s\+all\s\+::1\/128.*$/host    all    all    ::1\/128         md5/' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql

# Verify
PGPASSWORD=peak psql -h localhost -U peak -d peak -c '\conninfo'
# expect: You are connected to database "peak" as user "peak" on host "localhost"
```

---

## 5. Pick a local SMTP catcher (so magic-link sign-in works)

Peak uses NextAuth's **EmailProvider** — sign-in is a magic link sent to your email. For local dev we don't want to actually send mail; we want a local SMTP server that catches it and lets us click the link.

**Mailpit** is perfect for this — single binary, web UI on `:8025`, SMTP on `:1025`, no auth needed.

### Run Mailpit via Podman (recommended)

```bash
podman run -d --name peak-mailpit \
  -p 8025:8025 \
  -p 1025:1025 \
  --restart unless-stopped \
  docker.io/axllent/mailpit:latest
```

### Verify

```bash
podman ps    # should now show peak-postgres AND peak-mailpit, both Up
xdg-open http://localhost:8025   # opens Mailpit's web UI in Firefox
```

The Mailpit inbox starts empty; we'll send a real magic link to it in Step 9.

> If you prefer to ship real emails to your real inbox, see **Appendix B — Resend** at the end. For local dev, Mailpit is faster and offline-friendly.

---

## 6. Configure environment variables

```bash
cd ~/code/peak/apps/client
cp .env.example .env.local
```

Now edit `.env.local`. Here's a complete, working config for local dev. Open it in your editor of choice (`nano .env.local`, `code .env.local`, etc.) and paste:

```dotenv
# Database — local Postgres via Podman
DATABASE_URL="postgres://peak:peak@localhost:5432/peak?schema=public"

# NextAuth — generate the secret below, before pasting
NEXTAUTH_SECRET="PASTE_NEW_SECRET_HERE"
NEXTAUTH_URL="http://localhost:3000"

# Email — points at local Mailpit (no auth)
EMAIL_SERVER_HOST="localhost"
EMAIL_SERVER_PORT="1025"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="Peak <noreply@peak.local>"

# Stripe — leave blank for now; the app gracefully shows "not configured" notices.
# Fill in when you're ready to test rentals end-to-end.
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
PLATFORM_FEE_BPS="1000"

# Mapbox — needed for the /map page only. Free tier: 50K loads/month.
# https://account.mapbox.com/access-tokens/  (create a "default public token")
NEXT_PUBLIC_MAPBOX_TOKEN=""
```

### Generate `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value of `NEXTAUTH_SECRET` in `.env.local`. **Don't commit this file** — it's in `.gitignore`.

### Verify

```bash
grep NEXTAUTH_SECRET .env.local
# expect a long base64 string, not the placeholder
```

---

## 7. Initialize the database schema + seed

```bash
cd ~/code/peak/apps/client
npx prisma db push
npm run db:seed
```

What this does:

1. **`prisma db push`** — applies the schema in `prisma/schema.prisma` to the empty Postgres DB. Creates all 13 tables (User, Equipment, Booking, Vouch, ContactCard, Conversation, Message, PeaksTransaction, TreasureChest, etc.) and auto-generates the Prisma client for the Next.js app.
2. **`npm run db:seed`** — runs `prisma/seed.js` which populates:
   - 5 users (admin@peak.local, owner@peak.local, owner2@peak.local, renter1@peak.local, renter2@peak.local) with profile data + Big White Village coordinates
   - 4 pieces of equipment around Big White
   - 5 vouches forming a small trust graph
   - Mutual contact cards derived from vouches
   - 11 Peaks-ledger transactions (founding bonuses, vouches, profile completion, etc.) — balances auto-summed
   - 3 treasure chests (Cabin Cocoa Voucher, Founder's Cord Hat, Map Region North Cascades)
   - 1 conversation between owner@peak.local and renter1@peak.local with 3 messages

### Verify

```bash
PGPASSWORD=peak psql -h localhost -U peak -d peak -c "
  SELECT
    (SELECT count(*) FROM \"User\") AS users,
    (SELECT count(*) FROM \"Equipment\") AS equipment,
    (SELECT count(*) FROM \"Vouch\") AS vouches,
    (SELECT count(*) FROM \"TreasureChest\") AS chests;
"
```

Expected:

```
 users | equipment | vouches | chests
-------+-----------+---------+--------
     5 |         4 |       5 |      3
```

### Bonus: open Prisma Studio to inspect

```bash
npx prisma studio
# opens http://localhost:5555 in your browser
```

This is a great way to verify the seed and poke at data manually.

---

## 8. Run the app

```bash
cd ~/code/peak/apps/client
npm run dev
```

Wait for:

```
   ▲ Next.js 14.2.35
   - Local:        http://localhost:3000
   - Environments: .env.local
 ✓ Ready in ~2s
```

Open `http://localhost:3000` in Firefox (the default Fedora browser). You should see:

- The hero ("Equipment rental, the way mountain communities already trust each other.")
- A live community stats strip showing `5 neighbors · 4 pieces of gear · 5 vouches this week · 2 founders`
- Four featured equipment cards (telehandler, boom lift, skid steer, scissor lift)
- The three pillars (Vouch / Map-first / Peaks)

### Verify the API too

In another terminal:

```bash
curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"query":"tele"}' http://localhost:3000/api/equipment/search | head -c 400
```

Expected: a JSON response with the JLG 10054 Telehandler.

---

## 9. Sign in for the first time

Peak doesn't have passwords — every sign-in is a magic link.

1. Open `http://localhost:3000/auth/signin`
2. Enter `admin@peak.local` (or any seeded address) and click **Send magic link**.
3. Open **Mailpit** at `http://localhost:8025`. The new email appears within a second.
4. Click the email → click the **Sign in** link inside it. You'll be dropped into `/dashboard`.

That admin user is a **founding member with ADMIN role**, so you'll see the full sidebar including Admin links.

### Verify

After signing in, walk through:

- `http://localhost:3000/dashboard` — Peaks balance, tier badge, active rentals card
- `http://localhost:3000/network` — your 1° / 2° trust network
- `http://localhost:3000/cards` — collected contact cards
- `http://localhost:3000/peaks` — treasure chests (you should have 530 Peaks, enough to claim the Cabin Cocoa Voucher and the Map Region chest)
- `http://localhost:3000/browse` — the catalog
- `http://localhost:3000/admin/dashboard` — admin analytics (only visible to ADMIN)

If any page 500s, **stop and report** — the smoke tests cover all of these and they should work.

---

## 10. Optional: unlock the map + payments

Both are gracefully off-by-default. The app shows polite "not configured" notices when their env vars are blank.

### Mapbox (free, 50K loads/month)

1. Sign up at https://account.mapbox.com/auth/signup/ — uses email, no card needed.
2. Visit **Access Tokens**, copy the "Default public token" (`pk.eyJ...`).
3. Paste it into `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN=`.
4. Restart `npm run dev` (env vars are read at boot).
5. Visit `http://localhost:3000/map` — you should see Big White Village with equipment pins.

### Stripe (test mode, no live money)

1. Sign up at https://stripe.com.
2. **Developers → API keys** → copy:
   - "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - "Secret key" → `STRIPE_SECRET_KEY`
3. For local webhooks, install the Stripe CLI: `sudo dnf install stripe-cli` (or download the binary from https://github.com/stripe/stripe-cli/releases).
4. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` — it prints a `whsec_...` secret. Paste that into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
5. Restart `npm run dev`. The app now wires through Stripe Connect onboarding for owners and Checkout for renters.

> The seed data leaves all users without a Stripe Connect account, so "Rent now" on any equipment will show "Owner hasn't finished Stripe onboarding yet." To exercise end-to-end checkout, complete onboarding as `owner@peak.local` first.

---

## 11. Day-to-day commands

From `~/code/peak/apps/client`:

```bash
# Run the app
npm run dev

# Typecheck without building
npm run typecheck

# Lint
npm run lint

# Open Prisma Studio (browser-based DB inspector)
npx prisma studio

# Re-seed (additive — uses upsert, won't duplicate users)
npm run db:seed

# Reset DB completely and re-seed
podman-compose down -v && podman-compose up -d && \
  sleep 3 && npx prisma db push && npm run db:seed

# Production build (sanity check)
npm run build && npm start
```

### Container lifecycle

```bash
# Start Postgres + Mailpit
podman-compose up -d
podman start peak-mailpit

# Status
podman ps

# Logs (Postgres or Mailpit)
podman logs -f peak-postgres
podman logs -f peak-mailpit

# Stop both
podman-compose down
podman stop peak-mailpit
```

---

## 12. Troubleshooting

### `Error: P1001: Can't reach database server at localhost:5432`

The Postgres container isn't running. Fix:

```bash
cd ~/code/peak/apps/client
podman-compose up -d
podman ps   # confirm peak-postgres is Up
```

If it's running but you still can't connect, check Fedora's firewall:

```bash
sudo firewall-cmd --add-port=5432/tcp --zone=FedoraWorkstation
# or: sudo systemctl stop firewalld   (lazy, fine for dev)
```

### Magic-link email never arrives in Mailpit

1. Confirm Mailpit is running: `podman ps | grep mailpit`
2. Confirm `.env.local` has `EMAIL_SERVER_HOST="localhost"` and `EMAIL_SERVER_PORT="1025"` (not 587)
3. Watch the dev server logs while clicking "Send magic link" — NextAuth logs the SMTP attempt.

### `prisma db push` says "Environment variable not found: DATABASE_URL"

You're not running it from `apps/client/` (where `.env.local` lives). `cd apps/client` and try again. Prisma reads `.env.local` automatically when run from that directory.

### Port 3000 already in use

```bash
ss -tlnp | grep :3000
# kill whatever is on it, or:
PORT=3001 npm run dev
```

### SELinux denials (uncommon on Fedora 43 Workstation)

If a container can't bind a volume or you see `permission denied` in logs:

```bash
sudo ausearch -m AVC -ts recent | tail -20
# If you see denials, the standard fix for our case:
podman-compose down
podman-compose up -d
# OR add the :Z flag to the volume in docker-compose.yml
```

### `Error: short-name "postgres:16-alpine" did not resolve to an alias`

Podman's strict short-name policy. Fix:

```bash
podman pull docker.io/library/postgres:16-alpine
podman pull docker.io/axllent/mailpit:latest
```

Re-run `podman-compose up -d`.

### `npm run dev` hangs at "Starting..."

Usually a tsc-watch cycle stuck on a file lock from a previous run. Kill any orphan node processes:

```bash
pkill -f "next dev"
pkill -f tsc
npm run dev
```

### Wayland + Firefox + Mapbox pinches feel laggy

Mapbox GL uses WebGL. Intel HD P530 has decent GL drivers in Fedora 43; the experience should be smooth at 60fps. If you see jank, check that hardware acceleration is on in `about:support` (look for "Compositing: WebRender").

---

## 13. What's where (cheatsheet)

```
apps/client/
├── app/                          # Next.js app router
│   ├── page.tsx                  # home (with community stats strip)
│   ├── browse/                   # equipment catalog (server-rendered search)
│   ├── equipment/[id]/           # equipment detail + checkout
│   ├── map/                      # Mapbox view
│   ├── network/                  # trust graph
│   ├── cards/                    # contact-card binder
│   ├── peaks/                    # tier + treasure chests
│   ├── chat/[id]/                # real-time(ish) messaging
│   ├── profile/[id]/             # public profile
│   ├── (dashboard)/              # signed-in routes (middleware-guarded)
│   ├── api/                      # 25 route handlers
│   ├── auth/{signin,error}/
│   ├── booking/{success,cancel}/
│   ├── loading.tsx               # ⛰️ "Warming up the lodge..."
│   ├── not-found.tsx             # 🎿 "Wrong run, wrong trail"
│   └── error.tsx                 # 🌨️ "A storm rolled in"
├── components/
│   ├── ui/                       # peak-button, peak-card, peak-input
│   ├── Equipment/                # card, grid, detail, form
│   ├── Stripe/                   # checkout flow, onboarding, payment status
│   ├── chat/                     # chat window, conversation list, message bubble
│   ├── cards/                    # CardGallery, ContactCard
│   ├── map/                      # PeakMap, EquipmentPin, OwnerCard, etc.
│   ├── Admin/                    # AdminDashboard, MarketGaps, UnfulfilledSearches
│   └── Navigation/               # Navbar, Sidebar
├── lib/
│   ├── peaks.ts                  # tier logic, peak math, reason types
│   ├── design-system.ts          # color/typography/spacing tokens
│   ├── stripe.ts                 # Stripe Connect service (server-only)
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma singleton
│   └── ...
├── prisma/
│   ├── schema.prisma             # 13-model Postgres schema
│   └── seed.js                   # the seed described above
├── styles/globals.css            # Peak design tokens + utility classes
├── docker-compose.yml            # Postgres for local dev
└── .env.example                  # template you copied to .env.local
```

For higher-level context — what Peak is, the architecture decisions, the longer roadmap — see the repo-root `docs/`:

- `docs/vision.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/deploy.md`

---

## 14. Common follow-up tweaks

| Want to… | Edit |
|---|---|
| Change platform fee from 10% | `.env.local` → `PLATFORM_FEE_BPS` (1000 = 10%) |
| Move the map's default anchor | `apps/client/components/map/PeakMap.tsx` — search for `49.7231` |
| Add a treasure chest | `apps/client/prisma/seed.js` — bottom of file; or via Prisma Studio |
| Rename "Peak" → something else | global find/replace in `apps/client/app/` + `package.json` + `app/layout.tsx` |
| Add a new equipment category | `apps/client/lib/categories.ts` |
| Adjust Peaks tier thresholds | `apps/client/lib/peaks.ts` → `PEAKS_TIER_THRESHOLDS` |

---

## Appendix A — installing Node via nvm (if Fedora's Node is too old)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Reload shell so nvm is on PATH
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
```

Verify: `node --version` → `v22.x.x`.

---

## Appendix B — real email via Resend (instead of Mailpit)

If you want sign-in emails to land in your actual inbox:

1. Sign up at https://resend.com (free tier: 3,000 emails/month).
2. Verify a sending domain — for local dev, the **`resend.dev`** sandbox is fine without verifying.
3. Generate an API key.
4. Replace the email block in `.env.local`:

```dotenv
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_YOUR_RESEND_API_KEY"
EMAIL_FROM="Peak <onboarding@resend.dev>"
```

Restart `npm run dev`. Magic links now arrive in your inbox.

---

## Appendix C — what's *not* set up

The following are tracked in `docs/roadmap.md` and **not** part of this v0:

- CI/CD (no GitHub Actions yet — `npm run typecheck && npm run lint && npm run build` is the current smoke test)
- Monitoring / error tracking
- Tauri / mobile build
- Mesh networking (BLE, Wi-Fi Direct, LoRa)
- E2E tests via Playwright (the config is in `playwright.config.ts` but the suites haven't been written for the new schema)

These are deliberately deferred. The v0 ships as a web app.

---

## Sanity-check chain (run this top-to-bottom when you're done)

```bash
cd ~/code/peak/apps/client

# 1. Containers up
podman ps                                       # expect peak-postgres + peak-mailpit

# 2. DB reachable
PGPASSWORD=peak psql -h localhost -U peak -d peak -c "SELECT count(*) FROM \"User\";"

# 3. Code passes
npm run typecheck                               # zero errors
npm run lint                                    # zero warnings
npm run build                                   # green

# 4. App serves
npm run dev &
sleep 3
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/                 # 200
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/browse           # 200
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/auth/signin      # 200
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/this-no-exist    # 404
kill %1
```

If all six lines come back as expected, **you're done**. Open the browser and explore.

Welcome to Peak. 🏔️
