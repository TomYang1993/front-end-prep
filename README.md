# Interview Platform

React-first coding interview platform with premium questions, subscriptions, one-time packs, submission history, official solutions, and discuss features.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + Postgres
- Prisma ORM
- Stripe (via billing gateway abstraction)

## Quick Start
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill required values
3. Run migrations: `npm run prisma:migrate`
4. Seed sample data: `npm run prisma:seed`
5. Start app: `npm run dev`

## Auth Notes
- Production flow uses Supabase magic-link auth via `/auth`.
- Development fallback user is `demo@interview.dev` (seeded) if Supabase env vars are not set.

## Billing Notes
- Billing logic goes through `lib/billing/gateway.ts` interface.
- Stripe implementation lives in `lib/billing/stripe-gateway.ts`.
- Configure `STRIPE_PRO_PLAN_PRICE_ID` and pack `stripePriceId` values in DB/admin.

## Data Scripts

### Backup
Export all application data (users, questions, billing, submissions) as JSON:
```bash
npx tsx prisma/backup-data.ts
```
Outputs to `backups/<timestamp>/`. Run before risky migrations or periodically.

For a full Postgres dump (requires `pg_dump` installed):
```bash
pg_dump "$DIRECT_URL" --format=custom --no-owner -f backup.dump
```

### Backfill renderData
After modifying question content directly in the DB, rebuild the denormalized render cache:
```bash
npx tsx prisma/backfill-render-data.ts
```

### Full rebuild from scratch
```bash
npm run prisma:migrate        # apply schema
npm run prisma:seed            # seed demo data
npx tsx prisma/backfill-render-data.ts  # compute renderData
```

## Admin CMS
- `/admin` includes question creation.
- `POST /api/admin/solutions` allows adding official solutions.
- Admin access requires the `ADMIN` role in `user_roles`.

## API Surface
- `GET /api/questions`
- `GET /api/questions/:slug`
- `POST /api/playground/run-public`
- `POST /api/submissions/judge-hidden`
- `GET /api/submissions/history`
- `POST /api/discuss/threads`
- `POST /api/discuss/comments`
- `POST /api/discuss/likes`
- `POST /api/billing/checkout`
- `POST /api/billing/webhook/stripe`
- `GET /api/admin/questions/:id`
- `POST /api/admin/questions`
- `POST /api/admin/solutions`
