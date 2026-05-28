# Codebase Performance Evaluation

> Static review of `interview-platform` on branch `fix/timer-cross-question-kick`,
> dated 2026-05-12. Covers backend (DB, route handlers, runners) and frontend
> (rendering, hydration, bundle, network) with concrete line refs.
>
> Severity legend: **P0** = user-visible lag now · **P1** = will hurt under load
> or on slow devices · **P2** = bundle/architecture tax · **P3** = polish.
>
> **Lighthouse not run** (needs a running dev server + auth session). Lighthouse
> would mainly add: real CWV numbers (LCP, INP, CLS), unused-JS bytes, and TTFB.
> Recommend running it against a prod build after Phase 5 of `PRODUCTION_MIGRATION_PLAN.md`.

---

## Headline Findings

The two biggest wins available right now:

1. **`force-dynamic` on every meaningful page** — `app/questions/page.tsx:11`, `app/questions/[slug]/page.tsx:14`, `app/discuss/page.tsx:4`. Every request runs all queries fresh. The question list especially does **multiple Prisma queries on every navigation** even though the data changes hourly at most.
2. **`getSubmissionStats` does a full-table scan of the user's submissions** on every question-list view — no aggregation, no limit, no index hint. Already cataloged but worth amplifying.

Everything else is hardening / second-order.

---

## P0 — User-Visible Lag

### 1. Question list re-runs all DB queries on every visit

`app/questions/page.tsx:11` declares `dynamic = 'force-dynamic'`. On every navigation the server runs:
- `getCurrentServerUser()` (auth check)
- `listPublishedQuestions()` — `findMany` over all published questions
- `getSubmissionStats()` — `findMany` over **every submission this user has ever made**
- `getUserStreak()` — likely another submission scan

On Vercel cold start + Supabase pooler latency, this is the slowest page in the app. The question catalog changes maybe once a day; submission stats change only when the user submits.

**Fix path (pick one):**
- **Cheapest:** Switch the questions query to `revalidate = 60` ISR (works on App Router) for the *catalog portion*. Pull user-specific overlays (status, streak) via a separate `'use cache'` or client fetch.
- **Better:** Move to Next.js 16 Cache Components (already on `next@^16.2.4`) — mark `listPublishedQuestions` with `'use cache'` + `cacheTag('questions')`, invalidate via `updateTag('questions')` on admin question save. The user-specific overlay then runs alone, much smaller query.

### 2. `getSubmissionStats` aggregates client-side over unbounded rows

`app/questions/page.tsx:99-117`:
```ts
const submissions = await prisma.submission.findMany({
  where: { userId },
  select: { questionId: true, status: true },
});
for (const sub of submissions) { ... }
```
- No `take`. Power users with 1000+ submissions ship 1000 rows over the wire just to compute pass counts.
- No index hinted; schema has `@@index([userId, status])` at `prisma/schema.prisma:317` — good — but the query doesn't filter by status, so the index is partially useful only.

**Fix:** Replace with a single SQL aggregation:
```ts
prisma.submission.groupBy({
  by: ['questionId'],
  where: { userId, status: 'PASSED' },
  _count: { _all: true },
})
```
+ one cheap query for "any attempted at all" status. Or merge both into a raw SQL with `FILTER (WHERE status = 'PASSED')`.

### 3. Question detail page hits DB twice serially

`app/questions/[slug]/page.tsx:42-70`:
1. `await getCurrentServerUser()` — auth
2. `await getQuestionDetailBySlug(slug, user.id)` — question + entitlement (already parallelized inside)
3. `await resolveTimerState(...)` — timer row
4. `await prisma.codeDraft.findMany(...)` — drafts

These are sequential when they could be parallel. With Supabase pooler RTT ~15-50ms each, that's an avoidable 100-150ms.

**Fix:** Run timer + draft queries in `Promise.all` after the question is known to exist, or parallelize with the question fetch using two `Promise.all` waves.

### 4. Editor workspace has 6+ `useEffect`s that fire on mount

`components/editor-workspace.tsx:88,101,133,143,208,219` — six mount/dep effects. Some are cheap (event listeners), but **at least one fetches** (draft autosave on first effective mount). The React workspace (`react-editor-workspace.tsx`, 475 LOC) is similar.

Combined with Monaco loading, Sandpack loading, theme + toast providers, that's a hydration-heavy page. Initial INP score for the editor will be poor on mid-range laptops.

**Fix:**
- Audit each effect for whether it can be replaced with event handlers or `useSyncExternalStore`.
- The autosave effect at line 88 fires on initial mount because of a guard via `initialMount.current` — but the dependency array still triggers reconciliation. Move autosave into a `useEffect` keyed only on `debouncedCode`, not `language` or `questionId` (those are stable per page).

### 5. Submissions/Solutions tabs already had infinite-loop bug; the *fix* still fetches on every tab click

Per `progress.md:492`, the loop was fixed by gating on a `loaded` flag. Good. But the tab content is **refetched every time the user navigates to a new question** — there's no cross-question cache. Common pattern: user opens Q1's submissions, navigates to Q2, comes back to Q1 → re-fetches.

**Fix:** Wrap the fetches in `swr`/`react-query` or a small in-memory map keyed by question ID. Or use React's built-in `cache()` from server side and stream into the page initially.

### 6. Sequential `await` inside the questions detail page for drafts

`app/questions/[slug]/page.tsx:93-112` parses each draft's `code` JSON in a loop. Cheap individually but on Vercel iad1, the prior `await prisma.codeDraft.findMany(...)` is itself blocking the render. This could be a parallel `Promise.all` with the timer state lookup since they don't depend on each other.

---

## P1 — Scales Poorly

### 7. No DB caching layer

`vercel.json` ships no `Cache-Control` headers; `lib/runtime-cache` not used; no Redis cache outside rate limiting. Every page request hits Postgres.

For a content-heavy app where >95% of reads are the same published-question catalog, this is wasteful spend on connection-pool turns and DB CPU.

**Fix:** Adopt **Vercel Runtime Cache** (per the session-start knowledge update — "Vercel Runtime Cache API guidance"). Tag by `question:<id>` and `questions:all`, invalidate on admin write. ~50-100 LOC change, halves DB load on a typical day.

### 8. Prisma client logs `query` in dev — fine; production `error` only — also fine. But no slow-query alerting.

`lib/db/prisma.ts:11`. Add:
- A `$on('query', ...)` listener in non-prod that logs queries > 200ms to console.
- In prod, add a Postgres slow-log threshold in Supabase dashboard (5s default → drop to 500ms).

### 9. `findMany` for discussion threads has no pagination

`app/api/questions/[slug]/threads/route.ts:24` — `take: 20`. OK for now. But the *like* / *comment* endpoints don't show this same care, and the comment fetch path is missing in the audit set (no `GET /threads/[id]/comments` route was found — comments may be fetched eagerly via a join elsewhere, which scales worst).

**Fix:** Establish a hard rule: every list endpoint takes `?cursor=` + `take` capped at 50.

### 10. `Question.renderData` JSON column is read on every page

`lib/questions-snapshot.ts:59` writes a denormalized snapshot — good. But the entire `renderData` JSON (description, tags, starter code, plus more) is selected on every list query (`listPublishedQuestions` does an implicit `SELECT *`). For 50 questions × 5KB JSON each = 250KB shipped to the server every list render, then ~30KB shipped to the browser after filtering.

**Fix:** Add explicit `select` in `listPublishedQuestions` to only pull list-required fields. Drop `starterCode` and `publicTestCode` from the list query — only needed on the detail page.

### 11. `isolated-vm` startup cost per request

`lib/runners/adapters/function-js.ts:34` constructs a brand-new isolate per submission. Cold-start cost on Fluid Compute is meaningful — let's say ~50-150ms per isolate. Run + submit during a coding session = a few hundred ms wasted per cycle.

**Fix:** Per the Vercel knowledge update — **Fluid Compute reuses function instances**. Pool isolates at module scope:
```ts
const isolatePool: ivm.Isolate[] = [];
function acquireIsolate(): ivm.Isolate { return isolatePool.pop() ?? new ivm.Isolate({...}); }
function releaseIsolate(iso: ivm.Isolate) { isolatePool.push(iso); }
```
With Fluid Compute keeping the instance warm across concurrent invocations, this cuts steady-state run latency by ~50%. Cap pool size + drop disposed isolates.

### 12. `esbuild.transform` is loaded dynamically on every run

`lib/runners/adapters/function-js.ts:25`:
```ts
const esbuild = await import('esbuild');
```
Dynamic import resolves once but the function call still has overhead. Bigger issue: `esbuild.transform` for `'ts'` loader spins up Go workers. Long term, consider switching the JS runner to skip TS transformation entirely when the code is plain JS — fast-path detection via `/\bas\s+\w+\b|:\s*\w+/.test(code)` or a `language` field.

### 13. Pyodide initialization downloads from CDN every page load

`public/pyodide-worker.js:6-9` imports Pyodide from `cdn.jsdelivr.net` on each new worker. The worker is recreated per page navigation (the hook unmounts + remounts). On a question-hop session, the user re-downloads ~10MB of Pyodide each time.

**Fix:**
- Mount the Pyodide worker at the layout level (or in a context provider) so it persists across question navigations.
- Or use `caches.open()` Service Worker to cache Pyodide artifacts locally.

### 14. Sandpack iframes spin up per-question

React workspace mounts `<SandpackProvider>` per question. Sandpack downloads its own bundler shim into an iframe — multi-MB. With back/forward between questions, each remount = full re-load.

**Fix:** `next/dynamic` is already supported. Keep the provider mounted at the workspace level (it is), but consider preloading Sandpack's bundle on the questions list page via `<link rel="prefetch" href="<sandpack-bundle>">`.

### 15. No `loading.tsx` for slow routes

Next.js App Router supports streaming via `loading.tsx`. None present in `app/questions/`. While the page server-renders, the user sees a blank tab.

**Fix:** Add a skeleton `app/questions/loading.tsx` and `app/questions/[slug]/loading.tsx`. With Cache Components / PPR, the static shell streams immediately and dynamic regions arrive later.

---

## P2 — Bundle and Architecture Tax

### 16. 82% of components are client components

`grep -c "'use client'" components/*.tsx` = 23/28 files. Every one of these JS bundles is shipped on first navigation. Some examples that probably don't need `'use client'`:
- `components/markdown-prose.tsx` — actually does need it (uses syntax highlighter), OK.
- `components/auth-gate.tsx`, `components/premium-upsell.tsx` — likely static.

**Fix:** Audit each `'use client'`. Convert leaf-only-interactive components to use a small client island inside a server wrapper. Common Next.js win — often 20-40% off initial JS.

### 17. `lucide-react` imports — already optimized but check

`next.config.mjs:4` has `optimizePackageImports: ['lucide-react']`. Good. Verify by running `npm run build -- --analyze` (with `@next/bundle-analyzer`) that tree-shaking works.

### 18. Monaco Editor + monaco-editor types shipped

`components/editor-workspace.tsx:5-6` imports `@monaco-editor/react` and `monaco-editor` (types only). Monaco itself is ~6MB. `@monaco-editor/react` loads it lazily by default. Confirm the chunk is split: lazy boundary should be at editor mount, not at workspace import.

**Fix:** Wrap `<Editor>` in `next/dynamic({ ssr: false, loading: () => <Skeleton /> })`. Right now it's a direct import which means SSR tries to render it even though it's a `'use client'` boundary — wastes hydration cycles.

### 19. `react-syntax-highlighter` — Prism build, OK

`components/markdown-prose.tsx:5` uses `Prism` (~lighter than full hljs). Already a good choice. But it pulls all language definitions if you do `Prism as SyntaxHighlighter` from the default barrel. Confirm only the languages you use are imported.

**Fix:** Use `react-syntax-highlighter/dist/esm/light` with explicit `SyntaxHighlighter.registerLanguage(...)` calls for `js`, `ts`, `python`, `css`. Cuts ~200KB.

### 20. `styles/globals.css` is 2,095 lines

The CLAUDE.md convention says Tailwind-first. `progress.md:335` lists "Refactor `globals.css` to Tailwind" as a post-launch item. 2095 lines of CSS is shipped to every page — but most is unused outside specific routes.

**Fix:** Migration is already on the backlog. In the meantime, audit for unused selectors with PurgeCSS / Tailwind's content-aware build (it doesn't purge `globals.css` rules automatically — they're hand-written).

### 21. Fonts loaded with `display: 'block'`

`app/layout.tsx:21,28` sets `display: 'block'` for both Google fonts. This is the **slowest** option for FOUT/FOIT — text is invisible until the font loads. Typical recommendation is `display: 'swap'` for better LCP.

**Fix:** Change `display: 'block'` → `display: 'swap'`. Or `'optional'` if you want zero CLS at the cost of occasionally rendering fallback. Already using `next/font` so preload + self-host is automatic — just flip this flag.

### 22. No `<Image>` usage — only one `<img>`

`app/coffee/page.tsx:35` uses plain `<img>` for `paypal-qr.png`. Single image, low impact, but should be `next/image` for automatic format + sizing. Currently no images on landing or any other page — so this is minor.

### 23. Decorative orbs use `animate-pulse` always

`app/page.tsx:10-11` two blurred `animate-pulse` divs run constantly. `blur-[100px]` + `animate-pulse` triggers continuous compositing on every frame. On low-end mobile, this can chew 5-10% CPU just sitting on landing.

**Fix:** Pause animation when `prefers-reduced-motion` or when tab is hidden (`visibilitychange`). Or drop one of the two orbs.

### 24. `<HeaderWrapper>` + `<UserProvider>` + `<ThemeProvider>` + `<ToastProvider>` all in layout

`app/layout.tsx:43-51`. Four context providers wrapping every page. Each is a client component, each adds a hydration boundary. None of them are individually expensive — but together they hydrate on every navigation.

**Fix:** `ToastProvider` and `ThemeProvider` can probably be merged into one tiny provider. UserProvider can be a server component if it only passes the user as a constant (no context updates after mount).

### 25. No service worker / asset caching

No `sw.js`, no `manifest.json` in `public/`. Repeat visits redownload all CSS, JS, fonts. Vercel handles this via `Cache-Control` on `_next/static/*` (immutable, long-lived), so this is partially handled — but a service worker would let Pyodide and Sandpack chunks persist between sessions.

---

## P3 — Polish

### 26. `force-dynamic` on `/discuss`

`app/discuss/page.tsx:4` — same problem as questions page but on a less-trafficked route. Worth a `revalidate = 60` once you understand the access pattern.

### 27. `Analytics` component runs on every page

`app/layout.tsx:53` — Vercel Analytics ships a small script (~3KB). Fine. Consider adding `<SpeedInsights />` too (`@vercel/speed-insights`) — measures real user Core Web Vitals so you stop guessing.

### 28. No `<link rel="preconnect">` to Supabase

OAuth callback hits `<project>.supabase.co`. Adding a preconnect hint in the auth page would shave ~50ms off TLS handshake. Low ROI but free.

### 29. Markdown rendering on every keystroke?

`components/markdown-prose.tsx` re-renders the entire markdown tree on every prop change. If used for live preview anywhere (e.g. admin question form), this can drop frames. For static prompt rendering on detail page: fine.

**Fix (only if used live):** Memoize `<MarkdownProse>` with `React.memo` on `content`.

### 30. `lib/server-timing.ts` is in place — use the data

`app/questions/page.tsx:19` and `[slug]/page.tsx:41` already wrap queries with a timer. The summary is logged server-side. Pipe these to Vercel `Server-Timing` headers so they appear in browser DevTools and let you debug latency without redeploys.

**Fix:** `headers().set('Server-Timing', t.toHeader())` in the route handlers.

### 31. `_next/static` chunk strategy

Next.js 16 + Turbopack splits chunks by route by default. With `optimizePackageImports` for `lucide-react`, you should see icon chunks dedup'd. Verify with `@next/bundle-analyzer` to make sure shared chunks (Monaco, Sandpack, syntax highlighter) aren't duplicated in per-route chunks.

### 32. Pagination is client-side but data is fully loaded

`progress.md:230-244` calls out the decision: full dataset is ~30KB gzipped, so client-side pagination is fine. Confirmed reasonable until ~5000 questions. Add a comment in the code linking to that decision so a future contributor doesn't "fix" it.

---

## Concrete Win-Stack (Highest ROI First)

These are ordered by user-visible impact ÷ engineer time:

1. **Cache the question list** with Next.js 16 Cache Components or `unstable_cache` — 1 day work, halves TTFB on `/questions` (P0 #1 + P1 #7 + #10).
2. **Fix `getSubmissionStats` with `groupBy`** — 1 hour, eliminates an O(submissions) load on every list render (P0 #2).
3. **Parallelize the question detail page queries** — 30 min (P0 #3 + P0 #6).
4. **Fonts: `display: 'swap'`** — 2 lines, better LCP on first paint (P2 #21).
5. **Pyodide worker hoisted to layout-level singleton** — 2 hours, eliminates 10MB re-download per question (P1 #13).
6. **Wrap Monaco in `next/dynamic({ ssr: false })`** — 1 hour, cuts hydration burst (P2 #18).
7. **Isolated-vm pool** — 3 hours, ~50% faster Run/Submit feedback (P1 #11).
8. **`loading.tsx` skeletons + server-timing headers** — 2 hours, perceived performance (P1 #15 + P3 #30).

---

## Tools to Actually Measure (Recommended order)

1. `npm run build` → check final route bundle sizes Next.js prints. Targets: any first-load JS > 300KB on a public page = problem.
2. **Lighthouse** on prod URL after Phase 5 of `PRODUCTION_MIGRATION_PLAN.md`:
   - Run authenticated: log in, open DevTools → Lighthouse → check "Use mobile device" + "Performance" + "Best practices".
   - Capture LCP, INP, CLS, Total Blocking Time.
   - Target: Performance score > 85 on `/questions`, > 75 on `/questions/[slug]` (editor pages are heavy by nature).
3. **`@next/bundle-analyzer`** — wire into `next.config.mjs` behind `process.env.ANALYZE`. Run `ANALYZE=true npm run build`, look for duplicated dependencies.
4. **Vercel Speed Insights** — add `@vercel/speed-insights` to capture real-user CWV in prod. Free, 1-line install.
5. **Supabase slow query log** — Settings → Database → drop slow query threshold to 500ms in prod.
6. **PostgreSQL `EXPLAIN ANALYZE`** on `listPublishedQuestions` and `getSubmissionStats` queries — make sure they're index-using, not seq-scanning.

---

## What I Did Not Check

- Actual bundle sizes (needs `next build`).
- Real Core Web Vitals (needs Lighthouse or RUM).
- Postgres query plans (needs DB connection).
- Memory profile of `isolated-vm` under concurrent load.
- Hydration timing in Chrome Performance recording.

These all require a running environment. Want me to walk through any of them?
