# Troubleshooting

> Common issues and their fixes when developing Peak.

---

## Database Connection Issues

### Container not running

**Symptom**: `Error: Can't reach database server`

**Fix**:
```bash
cd apps/client
podman-compose up -d
# or: docker compose up -d
```

**Verify**:
```bash
podman-compose ps
# Should show peak-postgres running and healthy
```

### Prisma can't find DATABASE_URL

**Symptom**: `Error: Environment variable not found: DATABASE_URL`

**Cause**: Prisma reads `.env` from the current working directory.

**Fix**: Must run Prisma commands from `apps/client/`:
```bash
cd apps/client
npx prisma db push
```

Or ensure `.env.local` exists in `apps/client/` with:
```
DATABASE_URL="postgres://peak:peak@localhost:5432/peak?schema=public"
```

---

## Port Conflicts

### Port 3000 in use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`

**Fix**:
```bash
# Find what's using port 3000
ss -tlnp | grep :3000

# Kill the process (replace PID)
kill <PID>

# Or use a different port
PORT=3001 npm run dev
```

---

## TypeScript Errors

### Getting a full report

```bash
cd apps/client
npm run typecheck
```

### Known TS errors in the codebase (tracked for Phase 3)

| File | Line | Issue |
|------|------|-------|
| `lib/prisma.ts` | ~13 | Type inference issue with PrismaClient log levels |
| `lib/stripe.ts` | ~16 | Stripe API version type mismatch |

These are tracked for Phase 3 (Cross-cutting Cleanup). They don't block development.

---

## Email / Magic Link Issues

### Magic link not arriving

**Symptom**: Sign in with email → "Check your email" → nothing arrives

**Checks**:
1. Is Mailpit running?
   ```bash
   # Mailpit should be listening on SMTP port 1025, Web UI on 8025
   ss -tlnp | grep 1025
   ```

2. Check `.env.local` email config:
   ```
   EMAIL_SERVER_HOST="localhost"
   EMAIL_SERVER_PORT="1025"
   EMAIL_SERVER_USER=""
   EMAIL_SERVER_PASSWORD=""
   ```

3. Open Mailpit Web UI: http://localhost:8025
   - All emails sent by the app appear here
   - Click the magic link from there

4. If Mailpit isn't running, install and start it:
   ```bash
   # Or use the docker-compose service if configured
   mailpit
   ```

---

## Stripe Issues

### Webhook secret mismatch

**Symptom**: `Webhook signature verification failed`

**Cause**: `STRIPE_WEBHOOK_SECRET` in `.env.local` doesn't match the output from `stripe listen`.

**Fix**:
```bash
# Start Stripe CLI listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret it outputs (starts with whsec_)
# Put it in .env.local:
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Stripe CLI not forwarding

Ensure the dev server is running on the expected port before starting the Stripe listener.

---

## Mapbox Issues

### Map renders blank

**Symptom**: Map page loads but shows gray/blank area

**Checks**:
1. Is `NEXT_PUBLIC_MAPBOX_TOKEN` set in `.env.local`?
2. Is the token valid? (Check https://account.mapbox.com/access-tokens/)
3. **Restart the dev server** after changing `NEXT_PUBLIC_*` env vars (they're compiled at build time)

```bash
# Kill and restart
pkill -f "next dev"
npm run dev
```

---

## npm Issues

### Install failures / corrupted node_modules

**Symptom**: Weird module resolution errors, missing packages

**Fix**:
```bash
cd apps/client
rm -rf node_modules package-lock.json
npm install
```

### Podman image pull failures

**Symptom**: `Error: failed to resolve reference` when pulling images

**Fix**: Use fully qualified image names:
```yaml
# Instead of:
image: postgres:16-alpine

# Use:
image: docker.io/library/postgres:16-alpine
```

Or try alternative registries:
```bash
podman pull quay.io/sclorg/postgresql-16-c9s
```

---

## SELinux Denials (Fedora)

**Symptom**: Container can't access volume data; permission denied errors

**Fix**:
```bash
# Restart containers (often fixes transient issues)
podman-compose down && podman-compose up -d

# Or add :Z flag to volume mounts in docker-compose.yml:
volumes:
  - peak_pgdata:/var/lib/postgresql/data:Z
```

---

## Next.js Dev Server Issues

### Dev server hanging / not responding

**Symptom**: `npm run dev` hangs, page doesn't load, or infinite loading

**Fix**:
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Clear Next.js cache
rm -rf apps/client/.next

# Restart
cd apps/client
npm run dev
```

### Hot reload not working

**Symptom**: Changes to files don't reflect in the browser

**Checks**:
1. Is the file in the `content` array in `tailwind.config.ts`?
2. For Tailwind class changes, try a full page refresh (Ctrl+Shift+R)
3. For component changes, check you saved the file
4. Clear `.next` cache: `rm -rf .next && npm run dev`

---

## Prisma Issues

### Schema drift

**Symptom**: `The database schema is not in sync with your Prisma schema`

**Fix**:
```bash
cd apps/client
npx prisma db push    # For dev (destructive if needed)
# or
npx prisma migrate dev  # For tracked changes
```

### Prisma generate needed

**Symptom**: TypeScript errors on Prisma model types after schema change

**Fix**:
```bash
npx prisma generate
```

### Reset everything

**Symptom**: Database is in a bad state, seed data corrupted

**Fix**:
```bash
# Nuclear option — drops all data
podman-compose down -v
podman-compose up -d
sleep 3  # Wait for postgres to start
npx prisma db push
npm run db:seed
```

---

## Common Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `MODULE_NOT_FOUND: @prisma/client` | Client not generated | `npx prisma generate` |
| `PrismaClientInitializationError` | DB not running | `podman-compose up -d` |
| `NEXTAUTH_SECRET missing` | Env var not set | Add to `.env.local` |
| `Invalid API Key` (Stripe) | Wrong `STRIPE_SECRET_KEY` | Check `.env.local` |
| `Cannot find module '@/...'` | Path alias issue | Check `tsconfig.json` paths |
| `hydration mismatch` | Server/client render differ | Check for `Date.now()` or random values in render |
