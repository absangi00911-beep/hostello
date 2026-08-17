# Design Foundations — July 11, 2026

Date: 2026-07-11
Status: Foundations shipped (tokens + shared components). Page-level adoption is a separate, later pass — nothing on existing pages changes visually yet except typography, which is global.

## Why

The product looked, in the founder's words, like "generic AI slop." Diagnosis, from reading the actual code rather than the design docs describing it:

1. **The fonts never loaded.** `globals.css` declared `'Bricolage Grotesque'` and `'DM Sans'` by name, but nothing anywhere in the codebase — no `next/font`, no Google Fonts `<link>`, no `@font-face` — ever fetched them. Every page has been rendering in each OS's plain system font (Arial Black/San Francisco/Segoe UI) this entire time. This alone explains a meaningful share of the complaint.
2. **The card+table+pill-badge shape is the single most common admin-dashboard template that exists**, structurally identical regardless of the color values poured into it. Every admin/owner surface built this session used it.
3. **Bricolage Grotesque was a second-order cliché anyway** — a "safe, distinctive-looking alternative to Inter" that's converged on by enough AI design tools to become its own tell, even before accounting for the fact it was never actually rendering.
4. **The design system exists but is only partly adopted.** `Button` and `Card` (both shadcn primitives) have zero real usages anywhere in the app — every page hand-rolls its own inline button/card styling instead, which drifts page to page. `Input` is genuinely used (11 files). This matters: the fix isn't "invent a new system," it's "fix the one that's there, then actually use it."

## What changed

- **Fonts actually load now.** `src/app/layout.tsx` loads Fraunces (display/heading), DM Sans (body — was never the problem, just never fetched), and JetBrains Mono (code/reference IDs) via `next/font/google`, exposed as CSS variables consumed by the existing `--font-heading`/`--font-body`/`--font-mono` tokens in `globals.css`. Fraunces replaces Bricolage Grotesque: a warm variable serif, deliberately outside the geometric-grotesque-display wave (Bricolage, Space Grotesk, Cabinet Grotesk are all the same family right now), fitting a housing product's "trust and home" register better than a tech-tool typeface.
- **`--radius-brand: 28px`** added alongside the existing scale — for committed, generous feature moments on student-facing surfaces (hostel cards, hero elements), distinct from the tighter radii tool chrome should keep using.
- **`StatusBadge` gained a `tone` prop** (`"pill"` default, `"dot"` new) — `dot` renders a plain colored dot + text with no fill or border, for dense tool tables where a row of filled pills reads as decoration rather than information. `pill` is unchanged and stays right for brand-facing, featured status (a booking confirmation, a hostel's verified badge).
- **New `ListRow` / `ListRowGroup`** in `shared.tsx` — a bordered-row primitive for dense lists (bookings, payouts, verification queues), meant to replace the card-wraps-a-table default. Pairs with `StatusBadge tone="dot"`.
- **`Card`'s default shadow is now opt-in**, not automatic (`shadow-[var(--shadow-sm)]` via `className` when a surface is genuinely elevated, rather than every card floating identically). Currently has no visible effect anywhere, since nothing imports `Card` yet — see below.

## What this doesn't cover yet

- **No existing page has been touched.** Every admin/owner table built this session, and everything that predates it, still inline-implements its own card+table+pill styling. The foundations are ready to adopt; nothing has adopted them.
- **`Button` and `Card` are still unused** by any real page — fixing their internals doesn't help until pages actually import and use them instead of reimplementing similar styles inline.
- **The student-facing "Committed" color treatment** (amber as a real background, not a border accent) is a direction, demonstrated in a mockup, not yet built into any component or page.
- **Build verification is incomplete.** `next/font/google` fetches font files from Google's servers at build time; this sandbox's network doesn't reach `fonts.googleapis.com`/`fonts.gstatic.com`, so `npm run build` couldn't be run here to confirm it completes. `tsc --noEmit` and the full Vitest suite both pass clean (320 tests, same one pre-existing unrelated mobile failure as every check this session) — but run `npm run build` in your own environment before trusting this in production, the same caveat as the Prisma migration earlier in this session.

## Suggested next step

Pick one real surface — the roadmap discussion suggested either the admin/owner tool pages or the student discovery pages — and migrate it to the new primitives (`ListRow`/`StatusBadge tone="dot"` for tool surfaces, or the committed-amber treatment for discovery) as a concrete, reviewable example before propagating further.
