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
