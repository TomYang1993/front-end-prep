# Codebase Security Evaluation

> Snapshot review of `interview-platform` on branch `fix/timer-cross-question-kick`,
> dated 2026-05-12. Focuses on auth, authorization, input handling, sandboxing,
> webhooks, rate limiting, and data exposure.
>
> Severity legend: **P0** = ship-blocker for prod · **P1** = fix before paying users
> · **P2** = harden when convenient · **P3** = nice-to-have.

---

## P0 — Must Fix Before Production

### 1. Cross-user authorization missing on multiple resources

Discussion/likes/comments routes verify *who you are* but not *what you own*. None of these check `userId` ownership before writing references to arbitrary entities.

- `app/api/discuss/threads/route.ts:24` — accepts `questionId` from client and writes a thread without verifying the question exists or is published. A user can spawn threads on draft / unpublished questions, or on fabricated IDs.
- `app/api/discuss/comments/route.ts:24` — accepts `threadId` and `parentId` without verifying either belongs to the same thread / is not deleted / is not on a thread the user can read. A user can reply to any thread including admin-only ones.
- `app/api/discuss/likes/route.ts:26-45` — accepts `threadId` or `commentId` and creates a like without verifying the target exists. Also `findFirst` + create is racy — duplicate likes possible under concurrency.
- `app/api/questions/[slug]/threads/route.ts:8` — interprets `params.slug` as the **question ID**, not the slug, with no validation. Inconsistent with `/api/questions/[slug]/route.ts`.

**Fix:** Validate referenced rows exist + are reachable; for likes use a DB unique constraint `(userId, threadId)` + `(userId, commentId)` and `create({ skipDuplicates: true })` or `upsert`.

### 2. `IDOR` on `/api/questions/[slug]/submissions` and `hidden-tests`

- `app/api/questions/[slug]/submissions/route.ts:14` — query filters by `questionId: slug`. The `slug` param is the **question ID** (see line comment in `hidden-tests`). Fine, but there is no validation that the question exists or is published. Combined with the user filter it doesn't leak other users' submissions, but it does enable IDs to be probed and pulled for any question — including premium ones.
- `app/api/questions/[slug]/hidden-tests/route.ts:21` — returns `hiddenTestCode` to *any logged-in user*. **Hidden tests are supposed to be hidden.** A free user can fetch hidden tests for premium questions, defeating the entitlement gate (`canAccessQuestion`) used elsewhere.

**Fix:** Apply `canAccessQuestion(question.accessTier, …, entitlement)` here; consider also gating behind the timer state so users can't pre-fetch.

### 3. Python submissions trust client-supplied score

`app/api/submissions/judge-hidden/route.ts:48-71`: for `framework === 'python'` the route accepts `clientResults` from the request body and writes them straight into the `Submission` row including `score`, `status`, `passedCount`, `total`.

A malicious user can POST `{ passedCount: 999, total: 999, score: 100 }` and earn a `PASSED` row, top scores, streak credit, leaderboard position. **There is no server-side re-verification.**

**Fix options:**
- Run Python server-side via Pyodide-in-Node or sandboxed subprocess (`pyodide` Node bundle, isolate-style subprocess with seccomp).
- Or treat Python `PASSED` as advisory — mark as `UNVERIFIED`, not `PASSED`. Don't count for streaks or leaderboards until verified.

### 4. Webhook handlers don't enforce raw-body integrity safely (LS in particular)

`lib/billing/lemonsqueezy-gateway.ts:57-61`:
```ts
if (computedSignature !== signature) {
  throw new Error('Invalid Lemon Squeezy webhook signature');
}
```
Plain string `!==` comparison on the HMAC digest is **timing-vulnerable**. Switch to `crypto.timingSafeEqual()` (Buffer-aware).

Stripe webhook in `app/api/billing/webhook/stripe/route.ts:13-15` delegates to `stripe-gateway`'s `constructEvent` — that one's fine (the SDK uses constant-time compare). LS is the issue.

### 5. `SESSION_SECRET` fallback shipped in code

`lib/auth/session-cookie.ts:15-19`: throws only when `process.env.NODE_ENV === 'production'`. If `NODE_ENV` is anything else (or unset) in production by mistake, a hardcoded secret `'dev-session-secret-not-for-prod'` signs cookies — meaning **anyone with this repo can forge sessions** on a misconfigured deploy.

**Fix:** Throw if missing regardless of NODE_ENV (warn-only in test). Don't carry a dev fallback in source.

### 6. Dev session route exists in compiled output

`app/api/auth/dev-session/route.ts:10-22` — gated only on `NODE_ENV === 'production'`. The route is still in the built bundle in production. If `NODE_ENV` is ever set wrong, **any caller can log in as the seeded `demo@interview.dev` user (which has admin role if seeded that way) without credentials.**

**Fix per `progress.md:100`:** Delete entirely. Local dev does not need this — Google/GitHub OAuth works at localhost.

### 7. Admin role check uses string equality on `'ADMIN'` from JWT claim

`lib/auth/current-user.ts:83-94` and `session-cookie.ts:11`: roles come from the signed cookie claim. If the cookie ever gets minted with `roles: ['ADMIN']` for a user (e.g. an admin who later loses the role), the cookie remains valid until expiry (24h). **No revocation path.**

**Fix:** Either (a) re-fetch roles from DB on protected admin routes instead of trusting cookie, or (b) add a session version field stored alongside the user that the verifier checks.

---

## P1 — Fix Before Paying Users / Public Launch

### 8. CSRF only mitigated by `SameSite=Lax`

`progress.md:136` already calls this out. Mutation endpoints (`/api/drafts`, `/api/submissions/judge-hidden`, `/api/discuss/*`, `/api/billing/checkout`) accept JSON POST with session cookie. `SameSite=Lax` blocks naive cross-site form POSTs but not all CSRF vectors — e.g. a user is tricked into visiting `evil.com` which `fetch()`s a same-origin URL via subdomain takeover, or a same-site sibling app on the apex. No defense-in-depth.

**Fix:** Require a custom header (`X-Requested-With: fetch`) on every mutation; reject otherwise. Cheap, no token plumbing.

### 9. Rate limiter graceful-disable when env missing

`middleware.ts:53` only enforces if `UPSTASH_REDIS_REST_URL` is set. Per `progress.md:551`, rate limiting is **wired but never tested end-to-end**. If env vars are missing in prod (typo, deleted accidentally), the app **silently runs with zero rate limiting**, including on auth endpoints — credential stuffing, brute-force OTP, spam thread creation.

**Fix:** In production mode (`NODE_ENV === 'production'`), fail closed: log a CRITICAL warning and either refuse to start or block auth endpoints when limiters are unconfigured.

### 10. Auth callback doesn't validate `next` redirect target

`app/auth/callback/route.ts:8` and `app/api/auth/dev-session/route.ts:30` accept `?next=` directly into `NextResponse.redirect(new URL(next, req.url))`. Because Next.js `new URL('https://attacker.com', req.url)` will treat absolute URLs as absolute, **this is an open redirect.**

Test: visit `/auth/callback?code=…&next=https://evil.com` — after auth, user is redirected to evil.com with a freshly-set session cookie (the cookie itself doesn't leak, but the pattern is classic phishing scaffolding).

**Fix:** Validate `next` starts with `/` and not `//`, or whitelist allowed paths.

### 11. ReactMarkdown rendering of user-controlled content

`components/markdown-prose.tsx:172,201` renders markdown via `react-markdown` without `rehype-raw`, which is good (raw HTML is escaped by default). However:

- Discussion thread `title` (`app/api/discuss/threads/route.ts`) and `body` only enforce length, not content. If markdown is rendered anywhere for these bodies (it should be — check `components/discuss-thread.tsx` if present), an attacker can craft `[click](javascript:alert(1))` style links. `react-markdown` v10 sanitizes `href` by default; verify the version stays current.
- `OfficialSolution.explanation` is admin-controlled, so trust is OK, but document the assumption.

**Fix:** Add a markdown-link allowlist (`https:`/`http:`/`mailto:`/relative) explicitly in the markdown components, plus length/character validators on user titles.

### 12. Webhooks accept any `BILLING_PROVIDER` mismatch silently

`app/api/billing/webhook/lemonsqueezy/route.ts:7-9` returns 400 if provider isn't LS. Fine. But the stripe webhook `app/api/billing/webhook/stripe/route.ts` has no such check — it always tries to verify and handle, regardless of `BILLING_PROVIDER`. If you switch providers mid-flight, the old endpoint stays live and active. Old webhooks could still mutate state.

**Fix:** Both webhook handlers should refuse when `BILLING_PROVIDER` is not their provider.

### 13. `enqueueJob` and `judgeHiddenSubmission` run inline in the request

`app/api/submissions/judge-hidden/route.ts:85-94` calls `enqueueJob` whose `run` is awaited before the response. So a submission with infinite loop user code holds the HTTP request open up to the runner's 5s timeout per test × N tests + isolate startup. Combined with 30s `maxDuration` (`vercel.json`), an attacker submitting many requests can exhaust function concurrency.

**Fix:**
- Add per-user concurrency cap (e.g. max 1 in-flight submission per user via DB row lock or Redis lock).
- Lower per-isolate timeout for the run-public path to ~2s.
- Consider moving hidden judging to a real queue (Vercel Queues, mentioned in the platform context) so the HTTP request returns immediately with a `submissionId` and clients poll.

### 14. `prisma.user.upsert` race on first login

`app/auth/callback/route.ts:24-35` and `lib/auth/current-user.ts:46-59` both `upsert` users keyed by `supabaseId`. If two requests arrive for a brand-new user simultaneously (browser pre-fetch + back navigation, etc), there's a race between the `findUnique` and `create` paths in `current-user.ts`. The `upsert` should be safe, but the `findUnique`-then-`upsert` pattern is not — first request can find nothing, then both create rows, and `supabaseId @unique` will reject one with a 500.

**Fix:** Use only `upsert`; remove the speculative `findUnique`.

### 15. Submission `code` field can be unbounded

`app/api/submissions/judge-hidden/route.ts:14` validates `code: z.string().min(1)` — no max. A user can POST a 50MB string; Prisma writes it to Postgres; storage and reads suffer. Same for `code` in drafts, `body` in comments (already capped at 5000, OK), `prompt` and `explanation` in admin solutions.

**Fix:** Cap at e.g. `.max(100_000)` for code, `.max(50_000)` for solution explanations.

### 16. No abuse signal — submission spam, thread spam

There is no per-user mutation rate limit beyond the global Upstash limiter (30/min). New accounts can immediately:
- Create 30 threads/min.
- Submit 30 graded submissions/min, each spinning up an isolate.
- Re-attempt timer-protected questions by deleting/recreating timers via `POST /api/questions/[slug]/timer`.

**Fix:** Add per-action limits (e.g. 5 threads/hour for accounts <24h old, 10 submissions/min). The current `mutationLimiter` doesn't differentiate by action type.

### 17. `app/api/questions/[slug]/timer/route.ts` lets users restart timers freely

Lines 28-37: if `remainingMs <= 5000`, the existing timer is deleted and a new one created. Combined with no upper bound on restarts, a user can effectively get unlimited extensions by repeatedly hitting the endpoint near expiry. Probably *acceptable* given `progress.md:313` says "Timer is a soft guide, not a hard cutoff" — but if you later count completion time for ranking, this becomes an exploit.

**Fix:** Track attempts in DB (a `QuestionTimerAttempt` row with `attemptNumber`). Show user the attempt count.

---

## P2 — Hardening / Defense in Depth

### 18. Stack traces leaked in `/api/playground/run-public`

`app/api/playground/run-public/route.ts:49-53` — on any unexpected error, `error.message` is returned to the client. esbuild syntax errors leak file paths and internal stack. Same in `app/api/drafts/route.ts:42-44` (returns `serverError()`, OK) but the playground route doesn't sanitize.

**Fix:** Return a generic 500; log details server-side only.

### 19. No CSP headers configured

`next.config.mjs` has no `headers()` rule. With `react-markdown` rendering user content and Monaco loading external scripts, a strong Content-Security-Policy would block accidental XSS escalation. Also no `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`.

**Fix:** Add `headers()` to `next.config.mjs` with a baseline: `default-src 'self'; script-src 'self' 'unsafe-inline' …`. Monaco needs `worker-src 'self' blob:`. Sandpack iframes need `frame-src https://codesandbox.io` and similar — research is required.

### 20. Cookie security flags

`lib/auth/session-cookie.ts:60-66`: cookie is `httpOnly`, `secure` only in production, `sameSite: 'lax'`, no `__Host-` prefix. Mostly fine. Two notes:
- Consider `__Host-` prefix (`__Host-app-session`) to require Secure + same path + no Domain attribute. Strongest cookie integrity.
- `sameSite: 'lax'` is correct for OAuth redirect flows; `'strict'` would break the post-OAuth landing.

### 21. Supabase service role key handling

`lib/auth/supabase.ts` and `current-user.ts` use the publishable key for verifying tokens. Make sure `SUPABASE_SECRET_KEY` (service role) is **never** imported in client bundles. It's not currently misused that I can see, but the env var name is generic. A grep of `process.env.SUPABASE_SECRET_KEY` in components would be wise periodically.

### 22. `lib/db/prisma.ts` connection management

Not read in detail. Verify it uses the standard "global singleton" pattern for hot reload and that `DATABASE_URL` uses pgbouncer pooler in prod (port 6543) — bypass leads to connection exhaustion under load.

### 23. CORS not configured

Next.js defaults to no CORS headers. API routes are only meant to be called from the same origin, but if any third-party origin (e.g. a future native app) needs them, you'll handcraft CORS — at which point review `Access-Control-Allow-Origin` carefully. Today: safe by default.

### 24. Audit log opportunities missed

`createAuditLog` exists and is used in `/api/admin/questions` and `/api/admin/solutions`. It is **not** called for:
- Admin login (no record of who became admin when).
- User account changes (email change via Supabase metadata roundtrip).
- Subscription state changes triggered by webhooks (those just update DB, no audit row).

**Fix:** Log billing webhook actions and any state change initiated by external services.

### 25. Discussion content is unmoderated

Threads/comments accept up to 5000 chars of arbitrary text. No profanity filter, no report endpoint, no admin moderation queue. Not strictly a security issue, but combined with public landing and free signups it becomes a spam attack surface.

**Fix:** Future: report button + admin moderation queue. Now: at minimum, hide unreviewed comments from logged-out users.

---

## P3 — Nice to Have

### 26. JWT algorithm choice

`session-cookie.ts:42` uses `HS256`. Symmetric is fine for single-service signing. If you ever split workers (e.g. background queue verifies tokens), rotate to RS256/EdDSA so the secret doesn't leak across processes.

### 27. No 2FA for admins

Admin role gates entire CMS (`/api/admin/*`). Compromise of a single Google/GitHub account = full content control. Either enforce 2FA at the IdP level (Google Workspace) or add app-level admin step-up auth (re-enter password, TOTP).

### 28. No account deletion (`P5` in `progress.md`)

GDPR / CCPA exposure. Required if you target EU/CA users.

### 29. Backups not encrypted at rest

`prisma/backup-data.ts` produces JSON; storage strategy isn't documented. Make sure any cloud bucket holding backups has bucket-level encryption and access logs.

### 30. Email enumeration via auth flow

Supabase OAuth currently has no email-step, so this isn't directly exploitable. If email OTP comes back, ensure timing-equal responses for "email exists / doesn't exist" so attackers can't enumerate users.

### 31. Logging hygiene

`console.error('[auth/callback] OAuth exchange failed:', error.message, error)` in `app/auth/callback/route.ts:16` logs the whole error object, which may include the OAuth `code`. With a log-drain plugged in (Phase 9 of prod plan), this lands in retained logs.

**Fix:** Log message + name only; never the full error in auth paths.

### 32. `prisma/seed.ts` likely seeds an admin user

`README.md:14` mentions `demo@interview.dev` is the dev fallback. If seed gives this user admin, do not run `prisma:seed` against production — or audit `prisma/seed.ts` to ensure no admin promotion happens there. (Verify before prod cutover.)

---

## Cross-Cutting Observations

- **Slug vs ID confusion.** Multiple routes use `params.slug` to mean question **ID** instead of slug (e.g. `/api/questions/[slug]/threads`, `/timer/route.ts` uses slug, `/hidden-tests` uses id). This inconsistency makes it easy to ship a bug where a real slug is interpreted as an ID lookup or vice versa, with security consequences (404 vs 500 vs accidental match). **Standardize.**
- **Auth surface duplicated.** Two entry points exist: `getCurrentUserFromRequest` (request-aware, supports Bearer + dev header) and `getCurrentServerUser` (server-component-only). Make sure they apply identical entitlement and rate-limit guards. Today they diverge — e.g. the dev `x-user-id` header is only respected by `getCurrentUserFromRequest`.
- **Zod usage is inconsistent.** Some routes validate with Zod, others manually destructure (`drafts/route.ts:11-15`). Standardize on Zod for every POST/PATCH body.
- **No automated security tests.** `progress.md:583-589` plans Phase 3 sandbox stress tests. Until those run, sandbox-escape regressions in `isolated-vm` won't be caught.

---

## Priority Stack for Remediation

Suggested order, mapped to the production migration plan:

1. **P0 #3 (Python score forgery)** — gate streaks/leaderboards; mark Python `UNVERIFIED` until server-verified.
2. **P0 #2 (hidden-tests entitlement gate)** + **P0 #1 (cross-user authz on discuss)** — small server-side patches.
3. **P0 #6 (delete dev-session route)** before first prod deploy.
4. **P0 #5 (SESSION_SECRET fallback)** — drop the dev default, fail-closed.
5. **P0 #4 (timing-safe HMAC compare for LS)** — one-line `crypto.timingSafeEqual`.
6. **P1 #8 (CSRF header)** + **P1 #10 (open redirect)** — both ~1h.
7. **P1 #9 (rate-limit fail-closed)** + **P1 #13 (per-user submission concurrency)**.
8. **P2 #19 (CSP)** + **P2 #18 (stack-trace leakage)** — pre-public-launch.
9. **P3** items as backlog.

Most of P0 + P1 sums to under a day of focused work. Land them on a `security-hardening` branch before flipping DNS in Phase 6 of `PRODUCTION_MIGRATION_PLAN.md`.
