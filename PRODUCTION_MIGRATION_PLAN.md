# Production Migration Plan

> Move current Vercel + Supabase setup to a fully isolated production environment,
> keeping the existing project as staging. New Supabase project, new Vercel project,
> custom domain attached.
>
> Drafted 2026-05-12. References `progress.md`, `vercel.json`, `prisma/schema.prisma`,
> `lib/env.ts`, `.env.example`.

---

## Architecture Decision First

**Yes, create a second Vercel project.** Don't reuse the existing one. Rationale:

- Current Vercel project = `front-end-prep-sigma.vercel.app` (per `progress.md:351`). Keep it as staging — points at current Supabase project, gets every git push to `main`.
- New Vercel project = production. Connects to a **new Supabase project**, only deploys from a `production` branch (or `main` with staging on `staging` branch). Production domain attached.
- Reason: env vars, OAuth callback URLs, DB, rate-limit Redis, and billing webhooks all key off the deployment URL + provider keys. Splitting projects gives full isolation, independent rollback, and lets you break staging without taking down production.

Two clean Vercel projects sharing the same GitHub repo = standard pattern.

---

## Phase 0 — Pre-flight (do before touching cloud)

1. **Decide branch model.**
   - Option A: `main` → staging, `production` → prod. Promote via fast-forward merge or PR.
   - Option B: `main` → prod, `staging` → staging. (Less safe — risky pushes hit prod.)
   - Recommend **Option A**.

2. **Lock current state.**
   - Branch off current work: `git checkout -b production` from `main` once `fix/timer-cross-question-kick` is merged.
   - Tag the snapshot: `git tag v1.0.0-prod-cutover && git push --tags`.

3. **Inventory secrets to mint.** (Write them into a password manager, not the repo.)
   - `SESSION_SECRET` — fresh `openssl rand -base64 32` (do **not** reuse staging's).
   - Supabase prod project URL + anon (publishable) key + service role (secret) key.
   - New Google OAuth client (prod) — separate from staging.
   - New GitHub OAuth app (prod) — separate from staging.
   - New Upstash Redis instance for prod.
   - Lemon Squeezy or Stripe **live** keys (currently test keys per `.env.example`).
   - Resend API key + domain DKIM (if you turn on email OTP).

4. **Local backup of staging DB.** Run `pg_dump` against current Supabase `DIRECT_URL`:
   ```bash
   pg_dump "$DIRECT_URL_STAGING" --format=custom --no-owner -f staging-pre-cutover.dump
   ```

---

## Phase 1 — New Supabase Production Project

1. **Create new project** at supabase.com (match region with Vercel `iad1` = US East).
2. **Capture connection strings:**
   - `DATABASE_URL` = Transaction pooler URL (port `6543`, `?pgbouncer=true&connection_limit=1`).
   - `DIRECT_URL` = Direct connection URL (port `5432`). Used for migrations.
3. **Apply migrations.** From local with prod URLs in shell env (do **not** commit them):
   ```bash
   DATABASE_URL="<prod-pooler>" DIRECT_URL="<prod-direct>" npx prisma migrate deploy
   ```
   Migrations to apply: 7 (see `prisma/migrations/` — `20260328171017_init_supabase_dev` through `20260418052040_add_react_language_to_timer`).
4. **Seed prod.**
   ```bash
   DATABASE_URL="<prod-pooler>" DIRECT_URL="<prod-direct>" npm run prisma:seed
   ```
5. **Backfill renderData.**
   ```bash
   DATABASE_URL="<prod-pooler>" DIRECT_URL="<prod-direct>" npx tsx prisma/backfill-render-data.ts
   ```
6. **Verify.** Open Supabase Table Editor, confirm `Question`, `QuestionVersion`, `Tag` rows exist, `renderData` non-null.
7. **Make admin user.** After your first prod login (Phase 4), insert your row into `user_roles` with `roleKey = ADMIN` via SQL editor.

---

## Phase 2 — Domain Setup

1. **Where the domain is bought matters less than where DNS lives.** Vercel can manage DNS, or you keep it at the registrar and just point records.
2. **Recommended split for clarity:**
   - Apex `yourdomain.com` → **production** Vercel project.
   - `staging.yourdomain.com` → **staging** Vercel project (optional; you can keep the `.vercel.app` URL for staging).
   - `mail.yourdomain.com` MX/SPF/DKIM → Resend (when you turn on email OTP).
3. **DNS records to add** (Vercel will show exact values after attaching the domain):
   - Apex: `A` record to Vercel's IP (or `ALIAS`/`CNAME` if your DNS supports flattening).
   - `www` → CNAME to `cname.vercel-dns.com`.
   - `staging` (optional) → CNAME to staging project.
4. **TLS** — Vercel provisions Let's Encrypt automatically once DNS propagates.

---

## Phase 3 — Third-Party OAuth + Services (prod credentials)

Do this **before** Phase 4 because Vercel needs the values.

1. **Google OAuth (prod app):**
   - Google Cloud Console → new OAuth Client ID (Web).
   - Authorized redirect URI: `https://<prod-supabase-ref>.supabase.co/auth/v1/callback` (single URI — Google only ever redirects to Supabase).
   - Paste Client ID + Secret into prod Supabase → Auth → Providers → Google.

2. **GitHub OAuth (prod app):**
   - GitHub → Developer Settings → new OAuth App.
   - Homepage URL: `https://yourdomain.com`.
   - Authorization callback URL: `https://<prod-supabase-ref>.supabase.co/auth/v1/callback`.
   - Paste into prod Supabase → Auth → Providers → GitHub.

3. **Supabase Auth URL Configuration (prod project):**
   - Site URL: `https://yourdomain.com`
   - Additional Redirect URLs: `https://yourdomain.com/auth/callback` (explicit, even though Supabase auto-allows Site URL paths per `progress.md:353`).
   - Do **not** include `localhost` here — that lives only on staging.

4. **Upstash Redis (prod):** Create new database in `us-east-1`. Copy REST URL + token.

5. **Billing — switch to live mode:**
   - **Lemon Squeezy:** Switch store from Test → Live in dashboard. Re-create products in live mode (test products don't migrate). Update `PRO_PLAN_PRICE_ID` to live variant ID. Get live API key + webhook secret.
   - **Or Stripe:** Toggle off test mode, create live products/prices, mint live `sk_live_…` key, create live webhook endpoint at `https://yourdomain.com/api/billing/webhook/stripe`, copy its signing secret.
   - **Webhook URLs** must point at prod domain, not staging.

6. **Resend (only if turning on email OTP per `progress.md:39-59`):**
   - Verify `yourdomain.com` in Resend. Add SPF, DKIM, return-path DNS records.
   - In prod Supabase → Settings → Auth → SMTP: host `smtp.resend.com`, port `465`, user `resend`, pass = Resend API key, sender `noreply@yourdomain.com`.
   - Otherwise leave email OTP disabled (current state).

---

## Phase 4 — New Vercel Production Project

1. **Create project.**
   - Vercel Dashboard → New Project → import same GitHub repo.
   - Name: `<yourdomain>-prod` (make staging vs prod obvious).
   - Framework preset: Next.js (auto).

2. **Production Branch setting:** Settings → Git → set "Production Branch" to `production` (per Phase 0 branch model). Disable preview deployments for other branches if you want this project purely prod-only.

3. **Environment variables** (Settings → Environment Variables — set scope to **Production** only):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | prod Supabase **pooler** URL (port 6543) |
   | `DIRECT_URL` | prod Supabase **direct** URL (port 5432) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<prod-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod publishable key |
   | `SUPABASE_SECRET_KEY` | prod service role key |
   | `SESSION_SECRET` | fresh random (NOT staging's) |
   | `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
   | `BILLING_PROVIDER` | `lemonsqueezy` or `stripe` |
   | `LEMONSQUEEZY_API_KEY` / `STRIPE_SECRET_KEY` | live key |
   | `LEMONSQUEEZY_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` | live webhook secret |
   | `LEMONSQUEEZY_STORE_ID` | live store ID (if LS) |
   | `PRO_PLAN_PRICE_ID` | live price/variant ID |
   | `UPSTASH_REDIS_REST_URL` | prod Upstash URL |
   | `UPSTASH_REDIS_REST_TOKEN` | prod Upstash token |

4. **Attach domain.** Settings → Domains → add `yourdomain.com` and `www.yourdomain.com`. Set primary, configure 301 from `www` → apex (or vice versa).

5. **Verify build settings:**
   - Build command — already set in `vercel.json`: `prisma generate && prisma migrate deploy && next build`. This auto-runs migrations on each deploy. **Decide if you want this.**
   - Pro: zero-touch migrations.
   - Con: a bad migration breaks the deploy. Alternative: split out `prisma migrate deploy` into a manual step gated on staging success.
   - **Recommendation:** Keep auto-deploy for now. Revisit if a migration ever needs ordering with code.

6. **Region:** `iad1` from `vercel.json` — fine. Match Supabase region.

7. **Function maxDuration:** 30s in `vercel.json:6-8`. Vercel default is now 300s; 30s is your floor. isolated-vm judging should fit easily.

---

## Phase 5 — First Production Deploy (dry-run on a branch)

1. Push to `production` branch.
2. Watch Vercel build log. Two failure modes to watch:
   - `prisma migrate deploy` errors → migration mismatch with the prod DB you just set up. Should be clean since you migrated via CLI in Phase 1.
   - `isolated-vm` native build fails → already pinned `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in `schema.prisma:3`, and `serverExternalPackages: ['esbuild', 'isolated-vm']` in `next.config.mjs:2`. Should work.
3. Once green, **visit prod URL** without DNS yet — Vercel gives you a `*-prod.vercel.app` URL. Smoke test:
   - Landing page renders.
   - `/questions` loads, ~your seed count.
   - Click into a question → start screen → start timer → run public → submit → check submission count.
   - `/admin` redirects to `/questions` (not yet admin).
4. Promote your user to admin via Supabase SQL editor (`INSERT INTO user_roles …`).
5. Test billing checkout in **live mode** with a real card. Refund yourself after.

---

## Phase 6 — Cut DNS Over

1. Verify TLS cert issued in Vercel.
2. Flip A/CNAME records at registrar.
3. Wait for propagation (`dig yourdomain.com`).
4. **Re-test all flows on the real domain** — OAuth redirects can fail if Site URL in Supabase isn't an exact match for `https://yourdomain.com`.

---

## Phase 7 — Rename Staging + Lock It Down

1. Existing project: rename to `<yourdomain>-staging`. Production branch stays `main`.
2. Add `staging` subdomain (optional) or keep `.vercel.app` URL.
3. **Important:** staging Supabase project should stay in `Free` tier with restricted data. Don't seed real customer info into it. Easy to forget once both exist.
4. Add `noindex` meta or HTTP `X-Robots-Tag` header for staging to keep it out of Google. Quickest fix: middleware-set header for any `staging.yourdomain.com` host, or a Vercel deploy protection password (Settings → Deployment Protection → Vercel Authentication).

---

## Phase 8 — Production Hardening (post-launch backlog)

These are open items from `progress.md` you should land before serious traffic:

- **P1 Dev session route cleanup** (`progress.md:100`) — delete `app/api/auth/dev-session/route.ts` from prod build. It's `NODE_ENV` gated but the safest move is to delete it entirely or gate on a `DEV_SESSION_SECRET` header.
- **P3 Session rotation** (`progress.md:124`) — sliding 24h window.
- **P4 CSRF header check** (`progress.md:136`) — `X-Requested-With` on mutations.
- **P5 Account deletion** (`progress.md:150`) — GDPR. If targeting EU users, this is not optional.
- **Rate-limit verification** (`progress.md:551`) — Upstash is wired but end-to-end untested. Run the 4 checks listed: 429 above limits, `Retry-After: 60` header, user-keyed throttling.
- **Email OTP** — wire after Resend domain verification (Phase 3 step 6).

---

## Phase 9 — Operations

1. **Backups.** Add a cron (Vercel Cron or GitHub Action) running `prisma/backup-data.ts` against prod weekly. Push artifacts to S3 or commit to a private backups repo.
2. **Monitoring.** `@vercel/analytics` is already imported (`app/layout.tsx`). Add Vercel Speed Insights and (free) Vercel Log Drains → BetterStack/Logtail for searchable error logs.
3. **Alerts.** Vercel → Settings → Notifications → enable build failure + function error rate alerts.
4. **Migration discipline.** Going forward:
   - Migrations land on `main` (staging) first.
   - Validate against staging Supabase.
   - Promote `main` → `production` only after staging is green for ~24h.

---

## Files that probably need touching for prod

- `vercel.json:3` — if you split migrations out of build, change the `buildCommand`.
- `lib/env.ts` — currently defaults `appUrl` to `localhost:3000`. Works because Vercel env var overrides it. No code change required.
- `app/api/auth/dev-session/route.ts` — delete or gate before prod (Phase 8).
- `README.md` — refresh prod URLs and remove the "demo@interview.dev" fallback note (line 14) since that path is dev-only.

---

## TL;DR

Two Vercel projects, two Supabase projects, two OAuth apps (Google + GitHub), live billing keys, fresh `SESSION_SECRET`, new Upstash. Apex domain → prod, `*.vercel.app` or `staging.` subdomain → staging. Branch model: `production` branch for prod, `main` for staging. Migrate + seed prod DB before first deploy. Smoke test on `.vercel.app` URL before flipping DNS. Then handle P1/P3/P4/P5 hardening from `progress.md`.

---

## Quick Checklist

- [ ] Phase 0: branch model decided, tag cut, secrets inventoried, staging DB backed up
- [ ] Phase 1: new Supabase project, migrations applied, seeded, renderData backfilled
- [ ] Phase 2: domain DNS plan, records ready
- [ ] Phase 3: Google + GitHub OAuth prod apps, Supabase Auth URLs, Upstash prod, live billing keys, (optional) Resend
- [ ] Phase 4: new Vercel project, env vars set, domain attached
- [ ] Phase 5: first deploy on `*.vercel.app`, full smoke test, admin promoted, live-mode billing test
- [ ] Phase 6: DNS cut over, re-test on real domain
- [ ] Phase 7: staging renamed, deploy-protected / noindex
- [ ] Phase 8: P1/P3/P4/P5 hardening landed
- [ ] Phase 9: backups cron, monitoring, alerts, migration discipline written down
