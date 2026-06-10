# Responsive Adaptation Plan

Strategy decided with owner (2026-06-10): **desktop is the workbench, mobile is the storefront.**
Mobile (< 768px) gets full browsing — home, question list, pricing, auth, discuss, legal — but the
code workspace is desktop-gated with an on-brand prompt instead of a crammed editor.

Breakpoints: stick to Tailwind defaults already in use — `max-md:` (< 768px) as the primary mobile
switch, `max-sm:` (< 640px) for fine-tuning. No new CSS files; utility classes per project conventions.

---

## Phase 1 — Header & global

### `components/site-header.tsx`
| Line | Change |
|---|---|
| 14 | Add `max-md:hidden` to the "Whack The Fullstack Interview" `<span>` — logo square alone identifies the site on phones (owner's example) |
| 16 | Nav links: bump tap targets on mobile — `max-md:[&_a]:py-2 max-md:[&_a]:px-3` (~44px target) |
| 11 | Already has `max-md:px-4` — keep |

### `styles/globals.css`
- Add a global `@media (prefers-reduced-motion: reduce)` block disabling `animate-pulse`, `flame-flicker`, hero entrance animations (allowed in globals.css per conventions — media-query/keyframe concern).
- Cleanup opportunity (optional): lines 648–680 target `.questions-sidebar`, `.stats-bar`, `.questions-table`, `.stat-widgets`, `.questions-filter-bar` — these classes no longer exist in any TSX (components migrated to Tailwind). Dead rules; delete.

## Phase 2 — Home page (`app/page.tsx`)

| Line | Change |
|---|---|
| 16 | Hero section: `pt-32 pb-24` → add `max-md:pt-20 max-md:pb-16`; `min-h-[88vh]` → `max-md:min-h-[72vh]` |
| 18–19 | Decorative orbs: shrink on phones (`max-md:w-[180px] max-md:h-[180px]`) — 320px orb overwhelms a 375px viewport |
| 60 | Bento section: `py-24 px-8` → add `max-md:py-16 max-md:px-5` |
| 70, 87, 99, 114 | Cards: `p-8` → add `max-md:p-6` |
| 114–141 | Languages strip: dividers (`w-[1px] h-6`) look broken when items wrap — `max-sm:hidden` on the three dividers, and give items `min-w-[40%]` on mobile so they wrap 2×2 cleanly |
| 147 | Footer grid already `grid-cols-1 sm:grid-cols-2 md:…` — fine |

## Phase 3 — Questions list

### `components/questions-list-client.tsx`
| Line | Change |
|---|---|
| 58 | Toolbar `flex-nowrap` overflows phones (search + divider + icon + 3 selects). Change to `flex-wrap`; search box `max-md:max-w-none max-md:basis-full` (full-width first row, filters wrap below) |
| 70–73 | Decorative `\|` divider and `SlidersHorizontal` icon: `max-md:hidden` |
| 67 | Search input `text-[0.88rem]` → `max-md:text-base` — **16px also prevents iOS Safari zoom-on-focus** |

### `components/questions-filters.tsx`
| Line | Change |
|---|---|
| 5–6 | `selectClass`: add `max-md:text-sm max-md:py-2` (readable + ~44px tap target) |

### `components/questions-table.tsx`
| Line | Change |
|---|---|
| 53, 100 | Description column already `hidden sm:table-cell` — keep |
| 51, 54 | `max-sm`: tighten Status col to ~48px, Difficulty to ~80px |
| 123 | Pagination footer: add `flex-wrap gap-3` so "Showing X–Y" and page buttons stack on narrow screens |

### `components/questions-stats-bar.tsx`
| Line | Change |
|---|---|
| 41, 50 | Hero chips (Streak/Solved): add `flex-1 max-sm:min-w-[45%]` so the pair shares one row on phones |
| 39 | `mb-8` → consider `max-md:mb-5` (less vertical scroll before the table) |

## Phase 4 — Question detail: desktop gate (browse-only mobile)

New component: `components/desktop-only-gate.tsx`
- CSS-only (no hydration risk): wrapper renders `{children}` inside `hidden md:contents` (or `md:block`),
  plus a `md:hidden` panel showing question title/difficulty/time and an on-brand message, e.g.
  *"This editor deserves a real keyboard. Hop on a desktop to start solving."* + "Back to questions" link.
- v1 ships CSS-only; note: Monaco/Sandpack still mount while hidden. Optional v2: `matchMedia('(min-width: 768px)')`
  in a client component to skip mounting entirely on phones.

Apply in `app/questions/[slug]/page.tsx`:
| Location | Change |
|---|---|
| ~72–83 (start screen) | Wrap `<QuestionStartScreen>` in gate — phones can read title/meta but get the desktop prompt instead of Start button. Alternatively gate just the Start button inside `question-start-screen.tsx` so description metadata stays visible |
| ~110–127 (`EditorWorkspace`) | Wrap in gate |
| ~132–145 (`ReactEditorWorkspace`) | Wrap in gate |
| 54–64 (premium lock) | No gate — readable upsell is fine on mobile |

`components/question-start-screen.tsx`
| Line | Change |
|---|---|
| 60 | Tags row: add `flex-wrap justify-center` (long tag lists overflow) |

Workspaces themselves (`editor-workspace.tsx`, `react-editor-workspace.tsx`, `bottom-panel.tsx`): **no responsive work** — desktop-gated by decision. The `min-w-[400px]` panes, 64px rail, and resizable split stay desktop-only.

## Phase 5 — Remaining pages (small fixes)

| Page | State | Change |
|---|---|---|
| `app/pricing/page.tsx` | Already good (`max-md:grid-cols-1`, Pro card `-order-1`) | None |
| `components/auth-form.tsx` | `max-w-[400px]` fluid | Verify inputs ≥16px font (iOS zoom) |
| `app/discuss/page.tsx` | Plain stacked cards | Check `.meta-row` wraps; likely fine |
| `app/submissions/page.tsx` | `.history-table-wrap` gets `overflow-x: auto` at 720px (globals.css:594) | Verify only |
| `components/cheatsheet-modal.tsx` | `w-[90vw] max-w-[750px]` | Fine; maybe `max-md:p-4` on content |
| `app/coffee/page.tsx` | Not yet audited | Audit during implementation |
| `app/admin/**` | Internal tool | Out of scope — desktop only |

## Phase 6 — Verification

- DevTools at 320 / 375 / 768 / 1024 px, then a real phone against the preview deployment.
- Check all three themes (light/dark/focus) — gate panel uses tokens, no hardcoded colors.
- iOS focus-zoom check on search input and auth form.
- `npm run lint && npm run build` before commit.

## Out of scope (explicit)
- Mobile code editing (owner decision: browse-only mobile)
- Hamburger menu — nav has only one link + theme toggle + auth; fits without one
- Admin pages
