# DESIGN.md — Web Design System

**Status:** design foundation recreated September 2026 and updated October 7,
2026. Project rollout priorities and release gates are in
`docs/superpowers/plans/2026-10-05-project-completion-plan.md`. The earlier
September 15 chunk-by-chunk tracker is not present in this repository. This file had gone missing —
`PROJECT_STRUCTURE.md` flagged it as "confirmed gone, not yet recreated."
This documents the *current* system, which supersedes the terracotta/teal
direction from `docs/superpowers/specs/2026-07-11-design-foundations.md`.

**Scope:** web (`src/`) only. Native mobile has its own doc, `DESIGN_MOBILE.md`
— also gone, not yet recreated, out of scope until the redesign reaches
Phase 13 (mobile).

**Keeping this current:** update this file at the end of a redesign session,
not mid-session, and only once a chunk is actually done — the same discipline
`WEB_APP_PROGRESS.md` calls out. A design doc that's slightly behind the code
is worse than no doc, because nothing here checks itself against `globals.css`
for you.

---

## Direction

Airbnb's design *language* — the visual system and interaction patterns —
adapted to hostel/PG accommodation, not Airbnb's brand. HostelLo keeps its
own name, logo, and identity throughout. The patterns themselves (card grid
+ map, segmented pill search, photo-first listings) are shared across the
whole booking-marketplace category — Booking.com, VRBO, and Zillow all run
some variant — so adopting them isn't adopting one competitor's IP.

Four principles drive every token and component below:

1. **One accent, used sparingly.** Everything else is neutral. Color should
   draw the eye to a CTA, a price, or a save action — not to the chrome
   around them.
2. **Photo is the hero.** UI recedes: quiet borders instead of shadows,
   restrained radius instead of ornament, text sitting below images rather
   than fighting them for attention on top. If a remote photo fails, keep its
   frame and show a muted room-scene illustration so the layout never leaves
   an empty image block.
3. **One type family.** Headline weight comes from size and weight, not a
   second display face.
4. **Elevation is earned.** No shadow by default. A shadow means something
   is actually floating above the page (a hover state, a modal, an open
   sheet) — not "this is a card."

---

## Color

### Accent

| Token | Value | Use |
|---|---|---|
| `--color-primary` / `--color-action` | `#c7334a` | Primary buttons, links, focus rings, prices, the active favorite-heart |
| `--color-primary-dark` / `--color-action-dark` | `#b52f44` | Hover |
| `--color-primary-deep` / `--color-action-pressed` | `#7a1f2e` | Pressed state, high-contrast accent text |
| `--color-primary-light` | `#f7b8c2` | Soft accent surface (e.g. rating badge) |
| `--color-primary-faint` / `--color-action-light` | `#fdf0f1` | Faint accent surface (selected chip, badge fill) |

Deliberately a different hue from Airbnb's own Rausch (`#FF385C`) — same
warmth and weight, distinct enough that this isn't a literal reskin. The
accent stays in the same coral family, with a darker light-theme value so
text and controls pass WCAG AA contrast. Accent surfaces use the theme-aware
`--color-text-inverse` foreground, including in dark mode. The token contrast
regression in `src/app/globals.test.ts` checks both themes.

### Neutrals

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#fafafa` | Page background — a hair off pure white, just enough for cards to lift off it |
| `--color-bg-card` | `#ffffff` | Cards and surfaces |
| `--color-bg-sidebar` | `#f7f7f7` | Sidebars, subtle sections |
| `--color-bg-raised` | `#f2f2f2` | Elevated blocks |
| `--color-bg-overlay` | `#ebebeb` | Image-loading placeholders, overlays |
| `--color-text-heading` / `--color-text-body` | `#222222` | Airbnb's classic near-black — both headings and body use it, undifferentiated |
| `--color-text-muted` | `#686868` | Metadata rows ("2 guests · 1 bedroom"), secondary copy |
| `--color-text-placeholder` | `#686868` | Input placeholders; AA contrast on card and sidebar surfaces |
| `--color-text-disabled` | `#c7c7c7` | Disabled content |
| `--color-border-default` | `#dddddd` | Standard borders |
| `--color-border-strong` | `#b0b0b0` | Inputs, stronger dividers |
| `--color-border-subtle` | `#ebebeb` | Quiet card/section borders |

The legacy secondary and tertiary brand aliases were removed after the
owner/admin redesign. Use neutral surface tokens such as `--color-bg-raised`
and `--color-bg-sidebar`, plus `--color-text-heading` and
`--color-text-muted`, for structural emphasis. Reserve the accent tokens for
brand actions and the semantic tokens below for status.

### Semantic — unchanged

`--color-error` (`#ba1a1a`), `--color-success` (`#006a65`), `--color-warning`
(`#8a5a00`), `--color-info` (`#3b6e9e`) — each with a `-bg` and `-text`
pairing. Inherited as-is from the original spec; not part of the Airbnb
re-skin, since status colors are functional, not brand. `StatusBadge` in
`shared.tsx` maps booking/payment/verification states onto these.

### Dark mode

Fully re-valued in parallel — same token names, same relative relationships
(hover lighter than base, deep lighter still, faint darkest), inverted for
dark surfaces. The dark inverse foreground is `#151515`, and placeholder
text is `#a8a8a8`. `globals.css`'s `.dark` block is the source of truth;
nothing extra to opt into, `next-themes` (or whatever's toggling the `dark`
class) picks it up automatically.

---

## Typography

**Plus Jakarta Sans** (headings) + **Inter** (body), replacing the old
Fraunces/Be Vietnam Pro pairing — Airbnb's actual typeface (Cereal) is
proprietary, these are free variable-font substitutes with a similar
geometric warmth. Both load via `next/font/google` in `src/app/layout.tsx`.
**JetBrains Mono** is unchanged, for reference codes and the odd code block.

| Token | Size | Typical use |
|---|---|---|
| `--text-display` | 56px | One-off hero moments only, not in the normal h1–h6 flow |
| `--text-h1` | 48px | Page-level headline |
| `--text-h2` | 32px (28px on mobile — see `.text-h2` override) | Section headline |
| `--text-h3` | 24px | Subsection |
| `--text-h4` | 20px | Card/panel titles |
| `--text-h5` | 18px | Small headings, aligned to body-lg |
| `--text-h6` | 14px | Rarely used, aligned to label weight |
| `--text-body-lg` | 18px | Lead paragraphs, hero subheads |
| `--text-body` | 16px | Default paragraph |
| `--text-body-sm` | 14px | Metadata, captions, helper text |
| `--text-label` | 14px | Form labels |
| `--text-caption` | 12px | Fine print |

`h1`–`h6` get their size/weight/family automatically from base element
styles in `globals.css` — don't set font-size utility classes on real
heading tags. Outside of `h1`–`h6`, sizes aren't exposed as class names
(there's no `text-body-lg` utility) — use `style={{ fontSize: "var(--text-body-lg)" }}`
or the owner/admin-shell convention of `text-[var(--text-h4)]`, matching
whichever pattern the surrounding file already uses.

Weight scale (unchanged from the original spec, just riding the new
typeface): h1 800, h2/h3/h4 700, h5/h6 600.

---

## Spacing, radius, shadow, motion

Spacing (`--space-1` through `--space-32`, 4px base) and the timing tokens
(`--transition-fast` 100ms through `--transition-slow` 350ms, plus
`--ease-out-quart` / `--ease-in-quart` / `--ease-standard`) are **unchanged**
from the original spec — a spacing rhythm isn't really a "brand" decision,
and the existing scale doesn't clash with Airbnb's language.

Radius and shadow did change:

| Token | Value | Note |
|---|---|---|
| `--radius-sm` | 4px | Chips, small badges — unchanged |
| `--radius-md` | 8px | Buttons, inputs — unchanged |
| `--radius-lg` | 12px | Cards — unchanged, already matched Airbnb's card radius |
| `--radius-xl` | 16px | Larger containers — unchanged |
| `--radius-brand` | 16px | **Was 24px.** Hero moments only; tightened for Airbnb's restraint |
| `--radius-full` | 9999px | Pills, avatars, circular buttons |
| `--shadow-xs` → `--shadow-xl` | see `globals.css` | Tighter blur radius, lower opacity than before — a defined lift instead of a diffuse glow. Shadow appears on hover/open state, not by default (see Card, below) |

---

## Components

All in `src/components/ui/`. Import these instead of hand-rolling markup —
closing that gap (primitives existed but had zero real usages) is most of
what Day 2 was.

**`Button`** (`button.tsx`) — `variant`: `default` (solid accent CTA, one
per screen) · `secondary` (light neutral fill) · `outline` (1px neutral
border — not the old 2px brand-color border) · `ghost` (text only) ·
`destructive` · `link`. `size`: `default` · `sm` · `lg` · `icon` ·
`icon-sm`. `shape`: `default` or `pill` (fully rounded — for search-adjacent
triggers, Day 4/6). Also takes `loading` and `asChild` (Radix `Slot`, for
`<Button asChild><Link>…</Link></Button>`).

When combining a text-size token and a color token in button classes, use
Tailwind's explicit arbitrary-value types (for example,
`text-[length:var(--text-caption)]` and
`text-[color:var(--color-text-inverse)]`). The `cn()` merger can otherwise
classify untyped arbitrary text-size and text-color utilities in the same group
and drop the foreground color; primary and destructive buttons must retain the
inverse foreground for contrast.

**`Card`** (`card.tsx`) — `Card`, `CardHeader`, `CardTitle`,
`CardDescription`, `CardContent`, `CardFooter`. No shadow by default — add
`shadow-[var(--shadow-sm)]` (or stronger) via `className` only for a
genuinely floating moment. A page full of cards doesn't need every one of
them lifting off the page.

**`Input`** (`input.tsx`) / **`Label`** (`label.tsx`) — standard pairing.
`inputCls` is also exported as a raw string for the rare case you need the
same look on a non-`<input>` element (already used by `FilterSidebar` and
`AuthCardLayout`).

**`Badge`** (`badge.tsx`) vs. **`StatusBadge`** (`shared.tsx`) — two
different jobs, don't reach for the wrong one. `Badge` is generic: tags,
amenity chips, "Guest favorite," "New this week" — free-text, `variant`
`default`/`primary`/`outline`. `StatusBadge` carries a *fixed* vocabulary
(`pending`, `confirmed`, `verified`, `male`/`female`/`mixed`, …) mapped onto
the semantic success/warning/error/info colors, with a `tone` of `pill`
(filled, for brand-facing surfaces) or `dot` (colored dot + text, for dense
admin/owner tables — see the July foundations note in `shared.tsx` for why).

**`Avatar`** (`avatar.tsx`) — `Avatar`/`AvatarImage`/`AvatarFallback` on
`@radix-ui/react-avatar`. Circular, unsized by default (set `h-`/`w-` per
call site). Fallback shows initials (pair with `getInitials` from
`@/lib/utils`) on an accent-tinted background, not plain gray — a photo-less
avatar should still read as "a person," the same treatment `StudentBadge`
already used successfully.

`shared.tsx` also has `EmptyState`, `TrustCue`/`TrustCueList`,
`RecoveryNotice`, `PageSpinner`, `InlineError`, `ListRow`/`ListRowGroup`
(dense table rows — pairs with `StatusBadge tone="dot"`), and a full set of
`Skeleton*` loading components. All pre-existing, all already token-driven,
none needed changes for the redesign.

### Keyboard and modal behavior

App-owned modal surfaces share `useModalFocus`: opening moves focus inside,
Tab and Shift+Tab stay in the topmost dialog, Escape closes that dialog when
the current action permits it, and closing restores focus to the opener.
Dialog backdrops block pointer interaction with the page and the page does not
scroll behind an open modal. Photo thumbnails are a labeled group of native
buttons with `aria-pressed`; use the tab pattern only when the widget also
implements tab-specific arrow-key and roving-focus behavior. See the
[WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Live reference

`src/app/dev/style-guide/page.tsx` — a development-only App Router route,
not linked from navigation and hidden with a 404 in production. It renders
every color/type/radius/shadow token and every primitive above, actually
imported and rendering, so you can sanity-check the system in a browser
instead of reading hex codes.

---

## Architecture notes

- Tokens are plain CSS custom properties in `globals.css` (`:root` for
  light, `.dark` for dark), re-exposed to Tailwind via an `@theme inline`
  block, *and* separately mapped in `tailwind.config.js`. That's some
  duplication between two wiring mechanisms — pre-existing, not something
  this redesign changed, not urgent, but a legitimate future cleanup.
- Most components reference tokens directly via Tailwind's arbitrary-value
  syntax (`bg-[var(--color-bg-card)]`) rather than generated named utilities
  (`bg-card`). Both work; the codebase leans toward the explicit
  `var(--...)` form, especially where a generated utility name would be
  ambiguous or double-prefixed (e.g. a color literally named `bg-card`
  generates `.bg-bg-card`). Match whichever file you're editing.
- A separate shadcn-standard variable set (`--background`, `--foreground`,
  `--primary`, `--ring`, etc.) exists alongside the custom `--color-*` set,
  for shadcn/Radix primitives that expect those exact names. Both are kept
  in sync by hand — re-value both when changing a brand color.
- `globals.css` is CRLF (Windows line endings) throughout. Editing it with
  plain find-and-replace tooling that assumes `\n` will silently fail to
  match; preserve `\r\n` or diffs get noisy fast.

---

## What's not here yet

This file documents the design foundations and primitives. The current
working tree includes page-level redesign work, but it has not yet been
checked end to end against these foundations. Track that review and release
readiness in Phase 1 of
`docs/superpowers/plans/2026-10-05-project-completion-plan.md`.
