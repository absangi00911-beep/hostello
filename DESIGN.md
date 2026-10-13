# DESIGN.md — Web Design System

**Status:** design foundation recreated September 2026 and updated October 12,
2026. Project rollout priorities and release gates are in
`docs/superpowers/plans/2026-10-05-project-completion-plan.md`. The earlier
September 15 chunk-by-chunk tracker is not present in this repository. This file had gone missing —
`PROJECT_STRUCTURE.md` flagged it as "confirmed gone, not yet recreated."
This documents the current system, which supersedes the earlier palettes and
typography documented in the design-foundations specification.

**Scope:** web pages and transactional emails in `src/`. The native mobile app
has its own design system.

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
3. **A restrained type system.** Tenor Sans is reserved for expressive
   display moments; Plus Jakarta Sans and Inter keep page headings and body
   copy readable and consistent.
4. **Elevation is earned.** No shadow by default. A shadow means something
   is actually floating above the page (a hover state, a modal, an open
   sheet) — not "this is a card."

### Listing grids

Hostel listing grids show two cards per row on mobile and four on tablet.
Narrow desktop layouts fall back to three columns; wider desktop layouts use
four, expanding to six only on wide 1920px+ displays where cards retain
enough room for listing details. Search-map split view stays at two columns
so cards remain readable beside the map.

---

## Color

### Accent

| Token | Value | Use |
|---|---|---|
| `--color-primary` | Digital blue 500 (`#0066ff`) | Brand accent and focus rings |
| `--color-action` | Digital blue 600 (`#0052cc`) | Primary buttons and calls to action |
| `--color-primary-deep` | Digital blue 700 (`#003d99`) | High-contrast accent text and active navigation |
| `--color-primary-light` | Digital blue 100 (`#cce0ff`) | Soft accent surface |
| `--color-primary-faint` | Digital blue 50 (`#e5f0ff`) | Selected chips and subtle accent fills |

The complete Digital Blue OKLCH scale is defined in `globals.css`. Keep
backgrounds warm and neutral; reserve blue for actions, links, focus states,
and selected items. Email-safe hex equivalents are centralized in
`src/lib/email-templates/layout.ts` because many email clients do not reliably
support modern color syntax.

### Neutrals

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#f6f2eb` | Warm paper page background |
| `--color-bg-card` | `#fffdf8` | Cards and raised surfaces |
| `--color-bg-sidebar` | `#f0eae0` | Sidebars and subtle sections |
| `--color-bg-raised` | `#e9e1d6` | Raised neutral blocks |
| `--color-bg-overlay` | `#e6ddd1` | Placeholders and overlays |
| `--color-text-heading` | `#222b29` | Headings and strong text |
| `--color-text-body` | `#303936` | Default paragraph copy |
| `--color-text-muted` | `#626a65` | Metadata and secondary copy |
| `--color-text-placeholder` | `#626a65` | Input placeholders |
| `--color-text-disabled` | `#c7c0b5` | Disabled content |
| `--color-border-default` | `#ddd4c7` | Standard borders |
| `--color-border-strong` | `#b8aa98` | Inputs and stronger dividers |
| `--color-border-subtle` | `#e9e1d7` | Quiet card and section borders |

The legacy secondary and tertiary brand aliases were removed after the
owner/admin redesign. Use neutral surface tokens such as `--color-bg-raised`
and `--color-bg-sidebar`, plus `--color-text-heading` and
`--color-text-muted`, for structural emphasis. Reserve the accent tokens for
brand actions and the semantic tokens below for status.

### Semantic — unchanged

`--color-error` (`#ba1a1a`), `--color-success` (`#006a65`), `--color-warning`
(`#8a5a00`), and `--color-info` (`#3b6e9e`) each have `-bg` and `-text`
pairings. Status colors remain semantic rather than being replaced with the
brand accent. `StatusBadge` in `shared.tsx` maps booking/payment/verification
states onto these.

### Dark mode

Dark mode uses the same warm-paper relationships adapted for low-light
surfaces, with lighter blue accents and accessible text contrast.
`globals.css`'s `.dark` block is the source of truth.

---

## Typography

**Tenor Sans** is used for prominent display headlines, with **Plus Jakarta
Sans** for interface headings and **Inter** for body text. **Archivo Narrow**
is reserved for selected short labels; **JetBrains Mono** remains for
reference codes and code-like details. Web fonts load through `next/font` in
`src/app/layout.tsx`. Email uses system sans-serif fallbacks because external
web fonts are not reliable across email clients.

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

## Page and email consistency

Public pages and student, owner, and admin workspaces can keep their own
navigation and content hierarchy, but should use the same color, typography,
spacing, surface, and focus-state tokens. On narrow screens, workspace
navigation belongs in the top header menu rather than a fixed bottom bar.
Dashboard overview pages use responsive bento grids to prioritize pending work
while keeping secondary metrics and queues easy to scan.

Transactional emails use the same blue-and-warm-neutral palette through
`emailTheme` in `src/lib/email-templates/layout.ts`. Keep styles inline and
use email-safe hex values and system font fallbacks for client compatibility.
Semantic status colors (such as success and error) remain distinct from the
brand accent.

---

## Spacing, radius, shadow, motion

Spacing (`--space-1` through `--space-32`, 4px base) and the timing tokens
(`--transition-fast` 140ms through `--transition-slow` 420ms, plus
`--ease-out-quart` / `--ease-in-quart` / `--ease-standard`) are **unchanged**
from the original spec — a spacing rhythm isn't really a "brand" decision,
and the existing scale doesn't clash with Airbnb's language.

Radius and shadow did change:

| Token | Value | Note |
|---|---|---|
| `--radius-sm` | 4px | Chips, small badges — unchanged |
| `--radius-md` | 10px | Buttons and inputs |
| `--radius-lg` | 16px | Cards and panels |
| `--radius-xl` | 22px | Larger containers |
| `--radius-brand` | 28px | Hero moments |
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
