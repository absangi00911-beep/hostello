# HostelLo — Project Design Specification

> Feed this file directly into Google Stitch. Every value is final. No placeholders. No vague intent.
> If a section feels opinionated, that is the point.

---

## 1. Product Identity & Design Philosophy

**Product name:** HostelLo
**Tagline:** Find your room. Not a phone number.
**One-line purpose:** A marketplace where Pakistani students find, compare, and book verified hostel accommodation near their university — without calling anyone.

**The emotion this product must produce:** Confidence. A student opens HostelLo two weeks before they move cities and the interface makes them feel: *I can sort this today.* Not delight. Not awe. Just clear, calm, trustworthy momentum.

**Design philosophy — three rules everything answers to:**

1. **Clarity over completeness.** Students are stressed and time-pressured. Show what matters. Cut the rest. A hostel card that shows price, gender type, distance, and one photo is more useful than one that shows eight amenity icons and a paragraph of description.

2. **Familiar structure, deliberate character.** Standard navigation patterns, expected form behaviors, conventional table layouts. Character comes from color, type, and spacing — not from reinvented affordances. The interface should disappear; the hostels should not.

3. **Earned trust at every step.** Verified badges mean something. Review counts are real. Price is the full price. Booking confirmation is immediate and clear. Every design decision either builds trust or it gets cut.

**Who this product is for:** A 20-year-old from Faisalabad who just got into UET Lahore. They're on their phone 90% of the time, probably WhatsApp and YouTube. They've never booked accommodation online before — they'd normally ask a cousin. They don't trust things that look cheap. They don't read paragraphs. They need the price, the photos, and a way to contact the owner without calling a stranger.

Hostel owners are typically 40-55, running 20-80 beds, already managing on WhatsApp. They're skeptical of tech. The interface they see (listing creation, booking management) must look serious — like something built for a real business, not a student project.

**What this product must never feel like:**

- An Airbnb clone. White cards, bleed-to-edge photography, coral CTAs, big rounded fonts. The moment it looks like Airbnb, Pakistani students will assume it doesn't actually have Pakistani hostels.
- A government portal. Flat gray tables, Times New Roman, crowded forms.
- A startup demo. Gradient hero sections, empty marketing copy, animated SVG illustrations, "We're building the future of student housing."
- A Pakistani bank app. Navy, gold, formal. Trust is earned by clarity here, not by looking expensive.

---

## 2. Brand & Visual Language

### Theme Decision

**Physical scene that forces the answer:**

> A 20-year-old sits on a Daewoo coach from Faisalabad to Lahore at 2pm. Window seat. Sun directly on their phone screen. 38% battery. They need to shortlist two hostels before they land. They squint.

This is the primary usage context. The interface must be light, high-contrast, and outdoors-readable. Dark mode is supported for evening use but is not the default. Do not design for a dark-mode-first aesthetic and invert it.

---

### Color System

**Color strategy: Committed on marketing surfaces, Restrained on product surfaces.**

The brand color — a warm amber-gold — carries 30–40% of the visual surface on landing pages, hostel detail heroes, and onboarding. On dashboards, booking flows, and admin panels, it drops to accent-only: buttons, active states, and focus rings. The amber is never a background on dense product screens.

All colors are defined in OKLCH. The hex values below are the closest sRGB approximations.

#### Brand Colors

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-primary` | `oklch(0.62 0.17 65)` | `#C28B1A` | Brand identity, hover states for secondary elements, illustration accents |
| `--color-primary-dark` | `oklch(0.52 0.16 65)` | `#9E6F0E` | Primary button hover, active state |
| `--color-primary-deep` | `oklch(0.42 0.13 65)` | `#7A5308` | Primary button pressed state, focus ring |
| `--color-primary-light` | `oklch(0.90 0.08 65)` | `#F5DFA3` | Tag backgrounds, badge tints, hover backgrounds for list items |
| `--color-primary-faint` | `oklch(0.96 0.04 65)` | `#FDF3DC` | Alert backgrounds, highlight regions |

#### CTA / Action Color

The CTA is forest green. It sits on the opposite side of the hue wheel from amber (hue 148 vs hue 65). Together they create a natural stop/go contrast: amber = identity/brand, green = action/confirm.

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-action` | `oklch(0.45 0.14 148)` | `#2A6545` | Book Now, Confirm, Pay, Submit — primary action buttons only |
| `--color-action-dark` | `oklch(0.37 0.12 148)` | `#1F5035` | Action button hover |
| `--color-action-pressed` | `oklch(0.30 0.10 148)` | `#173D28` | Action button active/pressed |
| `--color-action-light` | `oklch(0.92 0.06 148)` | `#D3EDE1` | Action button ghost/outline background on hover |

#### Backgrounds

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-bg-page` | `oklch(0.98 0.006 65)` | `#FDF8F0` | Page background, the universal canvas |
| `--color-bg-card` | `oklch(0.995 0.003 65)` | `#FEFCF8` | Card surfaces, modals, popovers |
| `--color-bg-sidebar` | `oklch(0.96 0.009 65)` | `#F5EFE3` | Sidebar backgrounds, left navigation panels |
| `--color-bg-raised` | `oklch(0.975 0.005 65)` | `#FAF5EC` | Dropdowns, tooltip surfaces, floating panels |
| `--color-bg-overlay` | `oklch(0.965 0.007 65)` | `#F3EBD9` | Subtle hover regions, selected list rows |

Note: `#FFFFFF` and `#000000` are never used. Every white is amber-tinted. Every black is amber-tinted dark brown.

#### Text Colors

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-text-heading` | `oklch(0.18 0.016 65)` | `#2A2318` | All headings H1–H6, display text |
| `--color-text-body` | `oklch(0.30 0.014 65)` | `#4A3C2C` | Body copy, descriptions, paragraph text |
| `--color-text-muted` | `oklch(0.52 0.010 65)` | `#857060` | Secondary labels, supporting text, timestamps |
| `--color-text-placeholder` | `oklch(0.68 0.008 65)` | `#B0A090` | Input placeholder text |
| `--color-text-disabled` | `oklch(0.78 0.006 65)` | `#CABFB0` | Disabled state text and icons |
| `--color-text-inverse` | `oklch(0.97 0.004 65)` | `#F9F5EE` | Text on dark/amber backgrounds |
| `--color-text-link` | `oklch(0.42 0.13 65)` | `#7A5308` | Inline links, not underlined by default, underlined on hover |

#### Borders

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-border-default` | `oklch(0.88 0.012 65)` | `#E0D4C0` | Card borders, input borders, dividers |
| `--color-border-strong` | `oklch(0.74 0.015 65)` | `#BEA888` | Active input borders, focused dividers |
| `--color-border-subtle` | `oklch(0.93 0.007 65)` | `#EDE6D9` | Very subtle separators, skeleton edges |

#### Semantic Colors

| Role | Main | OKLCH | Background | OKLCH bg |
|---|---|---|---|---|
| Success | `#2A7A50` | `oklch(0.52 0.14 148)` | `#E8F5EF` | `oklch(0.96 0.03 148)` |
| Warning | `#C4900A` | `oklch(0.68 0.15 72)` | `#FEF6E0` | `oklch(0.97 0.035 72)` |
| Error | `#C43B28` | `oklch(0.52 0.18 22)` | `#FEEEED` | `oklch(0.97 0.02 22)` |
| Info | `#3B6E9E` | `oklch(0.52 0.09 245)` | `#EEF3FB` | `oklch(0.97 0.02 245)` |

Token naming for semantic tokens:
- `--color-success`, `--color-success-bg`, `--color-success-text`
- `--color-warning`, `--color-warning-bg`, `--color-warning-text`
- `--color-error`, `--color-error-bg`, `--color-error-text`
- `--color-info`, `--color-info-bg`, `--color-info-text`

#### Dark Mode

Dark mode uses a warm near-black, not `#000000` or `#1a1a1a`. The surface hierarchy creates depth through lightness, not shadow.

| Light token | Dark equivalent hex | Notes |
|---|---|---|
| `--color-bg-page` `#FDF8F0` | `#1C1710` | Warm very-dark amber-brown |
| `--color-bg-card` `#FEFCF8` | `#241E14` | Slightly lighter than page |
| `--color-bg-sidebar` `#F5EFE3` | `#1A1510` | Slightly darker than page |
| `--color-bg-raised` `#FAF5EC` | `#2C2519` | Dropdown/tooltip surfaces |
| `--color-text-heading` `#2A2318` | `#EDE5D8` | Near-white with amber tint |
| `--color-text-body` `#4A3C2C` | `#C8BAA8` | Warm mid-light |
| `--color-text-muted` `#857060` | `#8A7B6A` | Same visual weight as light mode |
| `--color-border-default` `#E0D4C0` | `#3A3025` | Subtle warm dark border |
| `--color-primary` `#C28B1A` | `#D4A030` | Slightly brighter in dark mode |
| `--color-action` `#2A6545` | `#38885E` | Lightened for dark background contrast |

Dark mode does not use glows. Elevation is expressed through surface color only: page (`#1C1710`) → card (`#241E14`) → raised (`#2C2519`). Shadows are minimal and warm-tinted.

---

### Typography

HostelLo uses two typefaces. One for headings, one for everything else. Not three.

**Heading font: Bricolage Grotesque**
A variable grotesque with wide proportions and deliberate quirk. It feels modern without being tech-neutral. The slightly irregular letter-spacing makes hostel names and page titles feel like they were typeset by a person, not generated. Load from Google Fonts: `Bricolage Grotesque:wght@400;500;600;700;800`.

**Body font: DM Sans**
Clean, slightly warm, excellent at small sizes on low-quality mobile screens. Better for UI labels and body copy than Inter — it has slightly more personality without sacrificing readability. Load from Google Fonts: `DM Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400`.

**Monospace font: JetBrains Mono**
Used for booking reference IDs, payment transaction IDs, and any fixed-width data display.

**System fallback stack:**
```css
--font-heading: 'Bricolage Grotesque', 'Arial Black', system-ui, sans-serif;
--font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
```

**Type scale:**

All sizes in rem. Base: 16px = 1rem.

| Name | Size | rem | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Display | 56px | 3.5rem | 800 | 1.05 | -0.03em |
| H1 | 40px | 2.5rem | 700 | 1.10 | -0.025em |
| H2 | 32px | 2rem | 700 | 1.15 | -0.02em |
| H3 | 24px | 1.5rem | 600 | 1.20 | -0.015em |
| H4 | 20px | 1.25rem | 600 | 1.28 | -0.01em |
| H5 | 17px | 1.0625rem | 600 | 1.35 | 0em |
| H6 | 14px | 0.875rem | 600 | 1.40 | 0.01em |
| Body Large | 18px | 1.125rem | 400 | 1.65 | 0em |
| Body Default | 15px | 0.9375rem | 400 | 1.65 | 0em |
| Body Small | 13px | 0.8125rem | 400 | 1.60 | 0em |
| Label | 13px | 0.8125rem | 500 | 1.40 | 0.01em |
| Caption | 11px | 0.6875rem | 400 | 1.50 | 0.02em |
| Overline | 11px | 0.6875rem | 600 | 1.50 | 0.10em |

Overline is always uppercase via `text-transform: uppercase`. No other text element uses uppercase transform.

Display and H1–H2 use Bricolage Grotesque. H3 onward uses DM Sans for product surfaces (dashboards, forms) and Bricolage Grotesque for marketing surfaces (landing, hostel detail hero).

Body line length caps at 68ch on all prose content. Data tables and compact UI are exempt.

---

### Iconography

**Library: Lucide**
Lucide icons. Consistent 1.5px stroke width. No filled icons anywhere in the UI; no duotone. Filled states (e.g., a saved favorite) use the same icon with color change, not a filled variant.

| Size name | px | Usage |
|---|---|---|
| Small | 14px | Inline in text, badge icons, compact table actions |
| Default | 18px | Standard UI icons in buttons, inputs, nav labels |
| Medium | 22px | Section headers, feature highlights |
| Large | 28px | Empty states, onboarding steps, standalone icon treatments |
| XL | 40px | Error pages, marketing feature icons |

Icons standalone (no label) require `aria-label`. Icons next to a visible label have `aria-hidden="true"`.

---

### Imagery & Illustration Style

**Photography (hostel photos):** Real photos uploaded by owners. No stock photography anywhere in the UI except placeholder states. The interface assumes photos are imperfect: small rooms, uneven lighting, phone-quality. Design must not break when photos are low resolution or wrongly oriented.

Photo display rules:
- Always use `object-fit: cover` with a defined aspect ratio (16:9 for hero, 4:3 for cards)
- Images always have a subtle inner shadow overlay at the bottom edge (0→30% opacity black gradient over 80px) to ensure text legibility when overlaid
- Broken images fall back to a warm amber-tinted skeleton with a building icon

**Illustration style:** None. HostelLo does not use decorative illustration. Empty states use Lucide icons (XL size) with a short heading and CTA — not custom illustrations. This is intentional: custom illustrations signal "startup" and reduce perceived seriousness for the owner demographic.

**Skeleton / loading style:**
- Warm amber-tinted gray: `#E8DFCE` base, `#F0E8D8` shimmer
- Shimmer animation: left-to-right sweep, 1.6s duration, `ease-in-out`
- Border radius matches the element being loaded

---

## 3. Spacing, Layout & Grid System

**Base spacing unit: 4px**

All spacing values are multiples of 4. The scale below covers every token needed.

| Token | Value | Common use |
|---|---|---|
| `--space-1` | 4px | Icon gap from text, tight badge padding |
| `--space-2` | 8px | Compact component internal padding |
| `--space-3` | 12px | Input internal padding (vertical) |
| `--space-4` | 16px | Standard component padding, card gap |
| `--space-5` | 20px | Form field vertical gap |
| `--space-6` | 24px | Section internal padding, sidebar item gap |
| `--space-8` | 32px | Card internal padding, modal padding |
| `--space-10` | 40px | Section gap on mobile |
| `--space-12` | 48px | Section gap on tablet |
| `--space-16` | 64px | Section gap on desktop |
| `--space-20` | 80px | Large section breathing room |
| `--space-24` | 96px | Page-level top/bottom rhythm |
| `--space-32` | 128px | Hero sections only |

**Grid system:**

| Breakpoint | Name | Columns | Gutter | Margin |
|---|---|---|---|---|
| < 640px | Mobile | 4 | 16px | 16px |
| 640px–1023px | Tablet | 8 | 24px | 24px |
| 1024px–1279px | Desktop | 12 | 24px | 32px |
| ≥ 1280px | Wide | 12 | 32px | auto |

Container max-width: **1280px**, centered.

**Breakpoint tokens:**
```css
--breakpoint-sm: 640px;
--breakpoint-md: 1024px;
--breakpoint-lg: 1280px;
--breakpoint-xl: 1440px;
```

**Section padding rhythm:**
- Mobile: `--space-10` (40px) top and bottom per section
- Tablet: `--space-12` (48px) top and bottom
- Desktop: `--space-16` (64px) top and bottom
- Hero sections: `--space-24` (96px) top and bottom

**Component internal padding:**
- Buttons sm: 8px vertical, 14px horizontal
- Buttons md: 10px vertical, 18px horizontal
- Buttons lg: 12px vertical, 24px horizontal
- Cards: 20px padding, uniform
- Modals: 28px padding
- Sidebar items: 10px vertical, 16px horizontal

---

## 4. Component Design System

**Border radius tokens:**
```css
--radius-sm: 6px;    /* Tags, small badges, tooltips */
--radius-md: 10px;   /* Buttons, inputs, cards */
--radius-lg: 16px;   /* Modals, large cards, panels */
--radius-xl: 24px;   /* Featured hostel cards, hero chips */
--radius-full: 9999px; /* Pills, avatars, toggle thumb */
```

**Shadow tokens:**
```css
--shadow-xs: 0 1px 2px oklch(0.18 0.016 65 / 0.06);
--shadow-sm: 0 1px 4px oklch(0.18 0.016 65 / 0.08), 0 1px 2px oklch(0.18 0.016 65 / 0.04);
--shadow-md: 0 4px 12px oklch(0.18 0.016 65 / 0.10), 0 2px 4px oklch(0.18 0.016 65 / 0.05);
--shadow-lg: 0 12px 32px oklch(0.18 0.016 65 / 0.12), 0 4px 8px oklch(0.18 0.016 65 / 0.06);
--shadow-xl: 0 24px 48px oklch(0.18 0.016 65 / 0.14), 0 8px 16px oklch(0.18 0.016 65 / 0.07);
```

Shadows are warm (amber-hued), never cool-gray. The modal shadow is `--shadow-xl`.

---

### Buttons

**Primary button (Book, Pay, Submit):**
- Background: `--color-action` (`#2A6545`)
- Text: `#F9F5EE`
- Border: none
- Hover: background `--color-action-dark` + `translateY(-1px)` + `--shadow-md`
- Active: background `--color-action-pressed` + `translateY(0)`
- Focus: 2px offset ring in `--color-action-light` (`#D3EDE1`), 2px wide
- Disabled: background `oklch(0.78 0.004 65)` (`#C4BAB0`), cursor not-allowed
- Loading: spinner left of label, width locked to prevent layout shift

**Secondary button (Save, Shortlist, Cancel):**
- Background: `--color-bg-card` (`#FEFCF8`)
- Text: `--color-text-body` (`#4A3C2C`)
- Border: 1px solid `--color-border-default` (`#E0D4C0`)
- Hover: background `--color-bg-overlay` (`#F3EBD9`), border `--color-border-strong`
- Active: background `oklch(0.93 0.010 65)` (`#EDE0CC`)
- Focus: 2px offset ring in `--color-primary` (`#C28B1A`), 2px wide
- Disabled: opacity 0.45

**Amber/Brand button (used on landing page hero and owner CTAs only):**
- Background: `--color-primary` (`#C28B1A`)
- Text: `#2A2318`
- Hover: background `--color-primary-dark` (`#9E6F0E`), text `#1C1710`
- Same focus/disabled rules as Primary

**Ghost button:**
- Background: transparent
- Text: `--color-text-body`
- Border: none
- Hover: background `--color-bg-overlay`
- Used for tertiary actions only: Cancel (in dialog), Clear filters

**Destructive button:**
- Background: `--color-error` (`#C43B28`)
- Text: `#F9F5EE`
- Hover: `oklch(0.44 0.17 22)` (`#A83020`)
- Used only in confirmed-deletion dialogs

**Icon-only button:**
- 36px × 36px square with `--radius-md`
- Background: transparent, hover `--color-bg-overlay`
- Always has `aria-label`

**Button sizes:**

| Size | Height | Font | Padding H | Padding V | Radius |
|---|---|---|---|---|---|
| sm | 32px | 13px/500 | 14px | 8px | `--radius-md` |
| md | 40px | 15px/500 | 18px | 10px | `--radius-md` |
| lg | 48px | 17px/600 | 24px | 12px | `--radius-md` |

---

### Input Fields

**Default state:**
- Background: `--color-bg-card` (`#FEFCF8`)
- Border: 1px solid `--color-border-default` (`#E0D4C0`)
- Border radius: `--radius-md` (10px)
- Text: `--color-text-body`
- Placeholder: `--color-text-placeholder`
- Height: 42px (single line), 100px min (textarea)
- Padding: 10px vertical, 14px horizontal

**Focused state:**
- Border: 1.5px solid `--color-primary` (`#C28B1A`)
- Background: `--color-bg-card`
- Box shadow: `0 0 0 3px oklch(0.62 0.17 65 / 0.15)`
- No color change inside the field

**Filled state (has value):**
- Border: 1px solid `--color-border-strong` (`#BEA888`)

**Error state:**
- Border: 1.5px solid `--color-error`
- Box shadow: `0 0 0 3px oklch(0.52 0.18 22 / 0.12)`
- Helper text below in `--color-error` at 13px

**Disabled state:**
- Background: `oklch(0.94 0.006 65)` (`#EDE4D6`)
- Text: `--color-text-disabled`
- Cursor: not-allowed
- Border: 1px solid `--color-border-subtle`

**Label position: always above the field.** Floating labels are not used. Label: 13px/500 DM Sans, `--color-text-body`, 6px gap above input.

**Helper text:** 12px, `--color-text-muted`, appears 4px below the input. Replaced by error text when in error state.

---

### Dropdowns & Selects

- Trigger: same visual as input fields, chevron-down icon right-aligned (18px, `--color-text-muted`)
- Dropdown panel: `--color-bg-card` background, `--shadow-lg`, `--radius-lg`, 1px solid `--color-border-default`
- Max height: 320px with scroll
- Option height: 38px, 16px horizontal padding
- Option hover: background `--color-bg-overlay`, no border
- Option selected: background `--color-primary-faint`, text `--color-primary-deep`, checkmark icon right-aligned
- Searchable: search input at top of dropdown panel, `--color-bg-sidebar` background

Multi-select shows selected items as dismissible pill tags inside the trigger.

---

### Checkboxes & Radio Buttons

**Checkbox:**
- 18px × 18px, `--radius-sm` (6px)
- Default: border 1.5px `--color-border-strong`, background `--color-bg-card`
- Checked: background `--color-action`, border `--color-action`, white checkmark icon (12px)
- Indeterminate: background `--color-action`, horizontal bar
- Hover: border `--color-primary`
- Disabled: border `--color-border-subtle`, background `--color-bg-sidebar`, opacity 0.55
- Focus ring: 2px offset, `--color-primary-light`

**Radio button:**
- 18px × 18px circle
- Default: border 1.5px `--color-border-strong`, background `--color-bg-card`
- Checked: outer ring `--color-action` 1.5px, inner filled circle 8px diameter `--color-action`
- Same hover/focus/disabled rules as checkbox

---

### Toggle / Switch

- Track: 42px × 24px, `--radius-full`
- Thumb: 18px circle, white (`#FEFCF8`), `--shadow-sm`
- Off: track `--color-border-strong` (`#BEA888`), thumb left
- On: track `--color-action` (`#2A6545`), thumb right, transition 150ms ease-out
- Disabled off: track `oklch(0.88 0.006 65)`, opacity 0.55
- Disabled on: track `oklch(0.62 0.10 148)`, opacity 0.55

---

### Badges & Tags

**Badges** (status, counts):
- Height: 20px, padding 0 8px, `--radius-full`
- Font: 11px/600, uppercase, `--font-body`
- Variants: primary amber (`--color-primary-faint` bg, `--color-primary-deep` text), success, warning, error, info — using their respective bg/text tokens
- Verified badge: amber background, shield-check icon 12px

**Tags** (amenities, room types):
- Height: 28px, padding 6px 12px, `--radius-md`
- Font: 13px/500 DM Sans
- Default: `--color-bg-sidebar` bg, `--color-text-body` text, 1px `--color-border-default` border
- Dismissible: × icon appears on hover, 14px, right side

---

### Tooltips

- Background: `oklch(0.22 0.014 65)` (`#332A1E`) — warm very dark
- Text: `--color-text-inverse` (`#F9F5EE`), 12px/400
- Border radius: `--radius-sm` (6px)
- Max width: 240px
- Arrow: 6px equilateral triangle, same background color
- Delay: 400ms show, 100ms hide
- Placement: top preferred, auto-flip to bottom/left/right when edge detected

---

### Modals & Dialogs

- Overlay: `oklch(0.18 0.016 65 / 0.55)` — warm dark with 55% opacity
- Panel background: `--color-bg-card`, `--shadow-xl`, `--radius-lg`
- Sizes: sm (400px), md (560px), lg (720px), full-width drawer on mobile
- Animation: fade-in overlay (150ms), slide-up panel from 12px offset (200ms, ease-out-quart)
- Close behavior: Escape key, click overlay, explicit close button — all three always work
- Close button: top-right, icon-only, 36px, ghost variant
- Do not use modals for booking initiation, filter panels, or hostel previews — use inline flows or drawers

---

### Drawers / Side Panels

- Left drawer (navigation, filter on mobile): width 280px, slides in from left
- Right drawer (hostel quick-view, booking detail): width 440px on desktop, full-width on mobile
- Background: `--color-bg-card`
- Backdrop: same as modal overlay
- Animation: slide in from edge 250ms ease-out-quart, slide out 180ms ease-in-quart
- Handle on mobile: 40px × 4px pill, `--color-border-strong`, top-center

---

### Toasts / Notifications

- Position: bottom-right on desktop, bottom-center on mobile
- Width: 360px desktop, calc(100vw - 32px) mobile
- Background: `--color-bg-card`, `--shadow-lg`, `--radius-lg`
- Left edge: 4px solid colored bar matching type (success/error/warning/info semantic colors)
- Icon: 20px, left-aligned, matching type color
- Title: 14px/600, message: 13px/400, max 2 lines then truncated
- Duration: success 4s, error 6s, warning 5s, info 4s
- Dismiss: always has × button top-right. Auto-dismiss pauses on hover
- Stacking: max 3 visible, oldest dismisses first. New toasts slide in from bottom

**Note on the 4px solid left edge:** this is 4px (not the banned "stripe border" which is >1px border-left as the *only* visual accent). Here the left bar is one element within a multi-element component, not a standalone card's only accent.

---

### Cards

Hostel cards are the most important component in the product. They appear in search results, favorites, and dashboard lists. They must not all look the same.

**Search result card (primary format):**
- Width: fills grid column
- Image: 16:9 aspect ratio at top, `object-fit: cover`, never stretched
- Padding: 16px on content area
- Hostel name: H4 weight, Bricolage Grotesque, 1 line capped with ellipsis
- Price: prominent — 20px/700, `--color-primary-deep`, "PKR X,XXX/mo" format
- Rating: star icon (filled amber) + numeric rating + review count in parens. Not a star row.
- Key detail chips: max 3 (gender type, distance from university, one top amenity)
- Hover: `translateY(-2px)`, `--shadow-md` appears, 180ms ease-out
- Cursor: pointer on whole card
- Verified indicator: shield-check badge overlaid on image, top-left, 8px from edges

**Featured/promoted card:** Same structure, but image is 4:3, has "Featured" amber badge top-right of image.

**Compact card (comparison, favorites list):** Horizontal layout, image 80px × 80px left, all detail right. No hover lift.

---

### Tables

Used in owner booking management, admin panels, and booking history.

- Header: 13px/600 DM Sans, `--color-text-muted`, uppercase-ish (sentence case, not CAPS), 1px border-bottom `--color-border-default`
- Row height: 52px (comfortable density)
- Row hover: background `--color-bg-overlay` (`#F3EBD9`), no border
- Row selected: background `--color-primary-faint` (`#FDF3DC`), 1px solid `--color-primary-light` on left and right edges
- Sorting: caret icon next to sortable column header, amber when active
- Pagination: prev/next buttons + page count, bottom-right, ghost button style
- Mobile: horizontal scroll with sticky first column. Never collapse to card layout for data tables.

---

### Tabs

**Underline tabs** (used on hostel detail page: Photos, Rooms, Reviews, Location):
- Border-bottom: 2px solid `--color-primary` on active tab
- Active tab text: `--color-text-heading` / 600 weight
- Inactive: `--color-text-muted` / 400 weight
- Hover inactive: `--color-text-body`
- Tab height: 44px, no background change
- Gap between tabs: 0, tabs touch

**Pill tabs** (used on dashboard to switch between Pending/Confirmed/Completed bookings):
- Active: `--color-primary-faint` background, `--color-primary-deep` text, 600 weight, `--radius-full`
- Inactive: no background, `--color-text-muted` text
- Height: 32px, padding 0 16px

---

### Breadcrumbs

Shown only when the user is 3 levels deep or more. Hidden on mobile. Hidden on top-level pages.

- Separator: `/` character, `--color-text-muted`, 12px, with 8px horizontal margin
- Current page: `--color-text-body`, not a link
- Ancestor links: `--color-text-muted`, underline on hover
- Font: 13px/400 DM Sans
- Truncation: if more than 4 segments, collapse the middle ones with `…` ellipsis, show first and last two

---

### Avatars

- Shape: circle, `--radius-full`
- Sizes: 24px (inline), 36px (compact list), 48px (profile header), 72px (profile page)
- Fallback: initials in 600 weight on `--color-primary-light` background, `--color-primary-deep` text
- Group/stack: -8px overlap, `--color-bg-card` ring 2px, max 4 visible then "+N" avatar in same style

---

### Loading States

**Skeleton:** Amber-warm shimmer. Base `#E8DFCE`, shimmer `#F0E8D8`, sweep left-to-right 1.6s linear infinite. `--radius-md` to match the element.

**Spinner:** 20px circle, 2px stroke. Track `--color-border-default`. Active segment `--color-primary`. Rotation 700ms linear infinite. Never shown in the middle of content during page load — only inside buttons and explicit loading regions.

**Progress bar:** Height 4px, `--radius-full`. Track `--color-bg-sidebar`. Fill `--color-primary`. Used for multi-step booking progress.

---

### Empty States

Structure: icon (Lucide XL, 40px, `--color-text-muted`) → heading (H4, `--color-text-heading`) → description (Body Default, `--color-text-muted`, max 55ch) → CTA button (centered).

Empty state copy is honest and practical. No "Looks like there's nothing here!" No mascot. No illustration.

Examples:
- No search results: "No hostels match your filters" → "Try removing a filter or searching a nearby area"
- No bookings yet: "No bookings" → "You haven't booked a hostel yet"
- No favorites: "Nothing saved" → "Tap the bookmark on any hostel to save it for later"

---

### Dividers

**Horizontal:** 1px solid `--color-border-subtle`. Full width within its container. Never colored.

**With label:** label text centered with divider on both sides. Used for "or" between auth options. Label: 12px/400, `--color-text-muted`. Background: `--color-bg-page` on label to hide divider behind text.

**Vertical:** 1px solid `--color-border-subtle`. Use height: 20px for inline separators (e.g., between nav items).

---

## 5. Page Layout Templates

### Landing / Home Page

**Layout:** Full-width. Not centered-article layout. The page is a search interface, not a marketing brochure.

**Above the fold (hero):**
- Left two-thirds: H1 headline (2 lines max), one-sentence subheading, the search bar (city picker + gender filter + search button). No background image behind this.
- Right one-third: a rotated stack of 3 real hostel photos at slight angles (5deg, -3deg, 2deg). Not a slideshow. Static.
- Background: `--color-bg-page`. No gradient. No full-bleed image.
- Below the search bar: "Popular cities: Lahore · Karachi · Islamabad · Peshawar" as plain text links

**Section 2: Featured hostels**
- 3-column grid of featured hostel cards on desktop, 1-column on mobile
- Section heading: H3 "Verified hostels in [auto-detected city]"
- No "View all" button — clicking section heading navigates to search pre-filtered by city

**Section 3: How it works**
- 3 steps: Find → Contact → Book
- Not cards. A horizontal numbered list with a short 2-line description per step. Step number in Bricolage Grotesque, 64px/800, `--color-primary-faint`
- No icons. Numbers are the visual.

**Section 4: For hostel owners**
- Split: left = amber-background panel (drenched for this section only), right = white panel with 3 bullet benefits and CTA button
- This is the one place the amber color is used as a section background

**Footer:** 3-column grid. Logo + tagline left. Navigation links center. Contact and legal links right. `--color-bg-sidebar` background.

**Primary user action:** Search. The hero search bar is the first interactive element in tab order.

**Responsive:**
- Desktop: 2-column hero, 3-column featured, 3-column how-it-works
- Tablet: 2-column hero (photo stack moves below), 2-column featured
- Mobile: Single column everything. Photo stack hidden. Search bar full-width with city picker as a dropdown sheet.

---

### Authentication Pages (Login, Register, Forgot Password, Reset Password, Email Verification)

**Layout:** Centered card, max-width 440px, vertical padding `--space-24` from top.

- Background: `--color-bg-page` (the warm off-white, not pure white)
- Card: `--color-bg-card`, `--shadow-md`, `--radius-lg`, 36px padding
- Logo: top of card, centered, 32px height
- Heading: H3, centered
- Form: full-width inputs, 20px vertical gap between fields
- Primary action: full-width button at bottom of form, `--color-action` (green)
- Footer link: "Already have an account? Sign in" below the button, `--color-text-muted`, link in `--color-text-link`

Email verification page shows a single confirmation message with a resend button — not a form.

**Responsive:** Same layout on all breakpoints. Card goes full-width minus 32px margins on mobile (no card border, just the ambient background).

---

### Search / Hostel Listings Page

**Layout:** Left sidebar (filters) + right main content (results). Sidebar: 280px fixed width. Content: flex-grow.

**Sidebar — filters:**
- City: select dropdown (pre-populated from query)
- Gender: 3 radio buttons (Male / Female / Mixed)
- Price range: dual-handle slider with numeric inputs. PKR values. No logarithmic scale.
- Amenities: scrollable checklist (max 12 options shown, "show more" expands)
- Sort: separate control above results — not in sidebar. Dropdown: Recommended / Price: Low to High / Price: High to Low / Highest Rated / Newest
- Apply button: bottom of sidebar (mobile only — desktop applies on change)
- Reset filters: ghost link below apply button

**Main content:**
- Results count: "23 hostels in Lahore" — sentence case, top of results
- Degraded search notice: amber inline alert if `isSearchDegraded: true` — "Search is running in fallback mode. Results may be slower."
- Grid: 2-column card grid on desktop content area, 1-column on tablet/mobile
- Pagination: bottom of results. Page numbers up to 5 visible, ellipsis beyond. Previous/Next.
- Map toggle: a sticky top-right button switches between list view and split map+list view (map via Leaflet, markers in amber)

**Primary user action:** Select a hostel.

**Responsive:**
- Desktop (1024px+): sidebar visible, 2-column grid
- Tablet (640px–1023px): sidebar in drawer (filter button top-left), 1-column grid
- Mobile: sidebar in bottom sheet, 1-column grid, map view is full-screen replacement

---

### Hostel Detail Page

**Layout:** Full-width image gallery at top (no sidebar). Below: 8-column content + 4-column sticky booking panel.

**Image gallery:**
- Full-width, 56vh height, `object-fit: cover`
- Grid of thumbnails below on desktop (first image large, 4 small, "+X more" opens lightbox)
- Mobile: horizontal swipe gallery, dot indicators

**Content area (8 columns):**
- Hostel name (H2), city badge, verified badge, rating + review count
- Tabs: Details / Rooms / Reviews / Location
- Details tab: description paragraph, amenities grid (2-column icon+label), house rules list
- Rooms tab: table of room types with availability, price, capacity, and "Request booking" per row
- Reviews tab: aggregate rating breakdown (cleanliness, location, value, safety bars) + review list. Owner reply shown indented below parent review.
- Location tab: embedded Leaflet map centered on hostel coordinates

**Sticky booking panel (4 columns, stays fixed while scrolling content):**
- Price: "PKR X,XXX / month" (H3 weight, `--color-primary-deep`)
- Availability status badge
- Room type selector
- Check-in / Check-out date inputs
- Guest count
- Total calculation
- CTA: "Request Booking" — full-width, `--color-action` button, lg size
- Below CTA: "Message owner" — ghost button full-width

**Primary user action:** Request Booking.

**Responsive:**
- Desktop: 8+4 column split layout
- Tablet: sticky panel collapses to bottom fixed bar with price and CTA button only. Tapping opens a bottom sheet for the full booking form.
- Mobile: same as tablet. Image gallery is swipe-only. Reviews load paginated.

---

### Booking Flow (Post-Request: Payment)

**Layout:** Centered, max-width 640px. Step indicator at top.

**Steps:** 1 — Review Booking → 2 — Payment → 3 — Confirmation

**Step 1 (Review):**
- Hostel card (compact horizontal), dates, room type, guest count, total
- "Confirm and Pay" button launches Step 2

**Step 2 (Payment):**
- Payment method selection: card pills (Safepay card, JazzCash if enabled, EasyPaisa if enabled)
- Safepay: "You'll be redirected to Safepay to complete payment." → Proceed button
- Clear cancellation policy note before the button

**Step 3 (Confirmation):**
- Large checkmark icon (`--color-action`, 48px)
- "Booking Confirmed" in H2
- Booking reference in JetBrains Mono, `--color-bg-sidebar` background, `--radius-sm`
- What happens next: 3-step numbered list (Owner confirms within 24h / Payment processed / Check in on [date])
- Two buttons: "View Booking" and "Message Owner"

**Responsive:** Single column on all sizes. Booking flow always full-width on mobile.

---

### Student Dashboard

**Layout:** Top navbar (same as search pages) + centered content, max-width 1024px.

**Tabs:** My Bookings / Saved Hostels / Messages / Price Alerts / Notifications

**My Bookings tab:**
- Pill tabs: Pending / Confirmed / Completed / Cancelled
- Each booking: horizontal card with hostel thumbnail, name, dates, total, status badge, and actions
- Actions vary by status: Pending (Cancel), Confirmed (Message Owner, View Details), Completed (Leave Review)

**Saved Hostels tab:**
- 2-column card grid of saved hostels. Compact card format.
- Each card has "Remove" icon-only button top-right
- Empty state: "Nothing saved. Tap the bookmark on any hostel."

**Messages tab:**
- Two-panel layout on desktop: conversation list left (280px), message thread right
- Conversation list: hostel thumbnail + name + last message preview + timestamp + unread dot
- Message thread: chronological bubbles. Student's messages right-aligned (amber-light background). Owner's messages left-aligned (`--color-bg-sidebar`)
- Input: full-width text area at bottom, send button right

**Price Alerts tab:**
- List of active alerts. Per alert: hostel name, current price, target price, active toggle, delete button
- "Add price alert" button opens a drawer where user searches for hostel and sets target price

**Responsive:** On mobile, tabs collapse to a horizontal scroll. Two-panel message layout collapses: list is the default view, tapping opens the thread full-screen.

---

### Owner Dashboard

**Layout:** Fixed left sidebar (240px) + main content area.

**Sidebar navigation items (in order):**
- Overview (home icon)
- My Listings (building icon)
- Bookings (calendar icon)
- Messages (message-circle icon)
- Reviews (star icon)
- Settings (settings icon)

Active item: amber left-edge indicator (4px, `--radius-full`), `--color-primary-faint` background, `--color-primary-deep` text.

**Overview page:**
- 4 stat tiles (not hero-metric cards): Listings, Active Bookings, Pending Requests, This Month's Inquiries
- Tiles are horizontal: label left, number right. No gradient, no trend arrows by default.
- Recent booking requests: table, last 10 rows

**My Listings page:**
- List of owner's hostels with status badge, edit button, and toggle (Active/Suspended)
- "Add New Listing" button top-right, amber (brand button)

**Listing creation/edit:** Multi-step form. Steps: Basic Info → Location → Rooms → Photos → Rules → Submit for Review. Progress bar at top of form.

**Bookings page:**
- Table: student name, hostel, dates, room, total, status, actions (Confirm / Decline / Cancel)
- Filterable by status and hostel
- Confirm and Decline are inline table row actions, not modals

**Responsive:** On tablet, sidebar collapses to icon-only (48px wide). On mobile, sidebar becomes a bottom tab bar with 4 primary items.

---

### Admin Panel

**Layout:** Same as Owner Dashboard: fixed 240px sidebar + main content.

**Sidebar navigation:**
- Dashboard
- Listings (with pending count badge)
- All Bookings
- Reviews
- Sync Search Index

**Listings page:**
- Tabbed by status: Pending Review / Active / Suspended
- Table: hostel name, owner email, city, submitted date, actions
- Actions on Pending: Approve + Suspend (inline, no modal required — these are admin actions with full context visible in the table)
- Approve action: green ghost button, `--color-action` text. Suspend: red ghost button, `--color-error` text.
- Clicking a hostel name opens hostel detail in a new tab

---

### Profile / Settings Page

**Layout:** Centered, max-width 720px. Left mini-nav for sections (sticky on desktop).

**Sections:**
- Personal Info (name, email, phone, bio, city, avatar upload)
- Security (change password, active sessions)
- Notifications (toggle email/in-app per notification type)
- Danger Zone (delete account — red section, destructive button)

Avatar upload: click to open file picker, preview immediately, "Save changes" applies. No drag-and-drop on mobile.

Phone verification: inline OTP flow within the form. "Verify" link next to phone field → "Send Code" button → 6-digit OTP input appears → Verified badge appears on success.

---

### Error Pages

**404:**
- Centered layout
- Large "404" in Bricolage Grotesque, 120px/800, `--color-primary-faint` as text color (so it's muted, not alarming)
- H3: "This page doesn't exist"
- Body: "The hostel or page you're looking for may have moved or been removed."
- Two buttons: "Search Hostels" (primary) and "Go Home" (ghost)

**500:**
- Same layout
- "Something went wrong" heading
- "We've been notified. Try again in a moment." — honest, brief.
- One button: "Reload page"

---

### Onboarding Flow (New Hostel Owner)

Triggered after an owner registers and has no listings. Full-screen takeover, not a modal.

**Steps:**
1. Welcome — who you are and what HostelLo does for owners (2 sentences, 1 CTA)
2. Basic Info — hostel name, city, address, gender type
3. Pricing & Rooms — monthly price, number of rooms, capacity
4. First Photo — required before submission (not optional, not skippable)
5. Submit for Review — summary of what happens next, submit button

Progress: 5-dot indicator at top. Back button always visible. Data auto-saves between steps (no data loss on back navigation).

---

## 6. Navigation & Information Architecture

**Global navigation type:** Top navbar for public/student-facing pages. Left sidebar for owner and admin dashboards.

**Top navbar items (left to right):**
- Logo (home link) — leftmost
- City selector (dropdown, pre-populated by IP detection) — near-left
- Search bar (collapsed to icon on mobile) — center
- Notifications bell (unread count badge) — right of center
- Avatar / Account menu — rightmost

**Account menu (dropdown on avatar click):**
- My Bookings
- Saved Hostels
- Settings
- Sign Out

For owners: "Owner Dashboard" appears at the top of this menu.

**Active state treatment:** Underline on current nav item. No background highlight for top nav (sidebar uses amber left-edge + background).

**Mobile navigation pattern:** Hamburger is not used. Bottom tab bar with 4 items: Search / Saved / Messages / Account. Notifications bell moves into the Account tab's page header.

**Breadcrumb usage:** Shown on hostel detail page (Home › City › Hostel Name) and on owner dashboard sub-pages. Hidden on search results, auth pages, and dashboards' root views.

**Back navigation:** Browser native. No custom back buttons except within multi-step flows (booking, listing creation) where a visible "Back" text button in the flow header handles it.

**Page transition:** Instant on navigation (no fade/slide). Loading states use skeleton placeholders that appear within 100ms of navigation. Transitions between steps within flows (booking, onboarding) fade in at 150ms.

---

## 7. Interaction Design & Motion

**Motion philosophy:** Functional. Every animation either conveys state change, confirms an action, or communicates a loading state. Nothing animates for aesthetic reasons alone.

**Durations:**

| Token | Value | Use |
|---|---|---|
| `--transition-fast` | 100ms | Color changes, border changes, icon swaps |
| `--transition-base` | 150ms | Button hover, input focus, checkbox |
| `--transition-medium` | 200ms | Tab switches, toast appear, badge updates |
| `--transition-enter` | 250ms | Panels, drawers, dropdowns sliding in |
| `--transition-exit` | 180ms | Panels, drawers, dropdowns sliding out |
| `--transition-slow` | 350ms | Page-level skeleton fade out |

**Easing curves:**

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);      /* Enter, reveal */
--ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0);       /* Exit, hide */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);        /* Move, reorder */
```

No bounce. No elastic. No spring physics.

**Hover effects:**
- Buttons: background color shift + minor `translateY(-1px)` on primary/secondary. Color shift at `--transition-fast`, transform at `--transition-base`.
- Hostel cards: `translateY(-2px)` + shadow appears at `--transition-base`.
- Links: underline appears at `--transition-fast`. No color change on underline-style links.
- Icon buttons: background tint fills in at `--transition-fast`. No scale.

**Focus ring:**
- Width: 2px
- Offset: 2px from element edge
- Color: `--color-primary` (`#C28B1A`) for most elements; `--color-action` for action-group elements
- Border radius: matches the element's own radius + 2px
- Never hidden. Visible on keyboard navigation only — `focus-visible` pseudo-class, not `:focus`.

**Click/tap feedback:**
- Buttons: `scale(0.97)` on active state, 60ms. Snaps back on release.
- Card: `scale(0.99)` while pressed, 80ms.
- No ripple effects. No ink spread.

**Scroll behavior:** Smooth scroll disabled globally (causes motion sickness; users can enable via OS). Sticky elements: top navbar on scroll (becomes sticky with `--shadow-sm` after 40px scroll), booking sidebar panel on hostel detail page.

**Micro-interactions:**

- Form submit: button shows spinner left of label, width locked. On success, spinner replaced with checkmark for 1.5s then resets to original label.
- Favorite toggle: bookmark icon fills in amber at `--transition-base`. On unfavorite, color drains back. No scale change.
- Delete confirmation: button turns `--color-error`, label changes to "Are you sure?" for 3 seconds. Clicking again within 3 seconds executes. If no second click, reverts. No modal for low-risk deletions.
- Notification read: item background fades from `--color-primary-faint` to transparent over 300ms when marked read.

**`prefers-reduced-motion`:** When active, all transforms are disabled (no translateY, no scale). Fade transitions are reduced to 80ms. Skeleton shimmer becomes a static color.

---

## 8. Forms & Data Entry UX

**Label position:** Always above the field. 6px gap between label and input top edge.

**Validation timing:** On blur for individual fields. On submit for the whole form. Never on every keystroke except: password strength indicator (shown as the user types password on registration, no error state — just a visual strength bar).

**Inline error messages:**
- Position: 4px below the input field
- Font: 13px/400 DM Sans, `--color-error`
- Preceded by an alert-circle icon (14px) inline
- Language: never blames the user. "Enter a valid email" not "Invalid email address". "Price must be at least PKR 1,000" not "Price is too low."

**Required vs optional fields:**
- Required: no marker. All fields are assumed required unless marked.
- Optional: small grey "(optional)" text inline with the label, 12px, `--color-text-muted`. Keep optional fields to a minimum.

**Multi-step forms (listing creation, booking):**
- Progress bar at top: height 4px, amber fill, `--radius-full`
- Step indicator: "Step 2 of 5" in Caption size, `--color-text-muted`, below progress bar
- Each step validates independently before allowing Next
- Back button never clears data

**Autosave (listing creation only):**
- Debounced, 2 seconds after last keystroke
- Indicator: small "Saved" text with cloud-check icon (12px), top-right of form panel, appears for 3 seconds then fades out
- Error on save failure: "Couldn't save. Check your connection." inline notice, retries automatically

**Destructive action confirmations:**
- Account deletion: dedicated settings page section, requires user to type "DELETE" before the button activates
- Cancel booking: "Cancel booking?" inline confirmation with reason dropdown (optional) and confirm button. Not a modal.
- Delete review: confirmation prompt replaces the delete button text for 4 seconds (same pattern as general delete micro-interaction)

---

## 9. Data Display & Dashboard UX

**Table density:** Comfortable. Row height 52px. Do not compress to 36px unless user is on a data-heavy admin screen where they explicitly need density.

**Column width behavior:** Fixed widths for status badges and action columns. Fluid width for name/description columns (they stretch to fill remaining space). Text in fluid columns truncates at 1 line with ellipsis.

**Sorting UI:** Clicking a column header sorts by that column. Active sort column shows a caret-up or caret-down icon (14px, `--color-primary`) next to the header text. Default sort is defined per table (bookings: by date descending; reviews: by date descending; listings: by status then date).

**Filtering:** Filter controls sit above the table, not in a modal. Active filters shown as dismissible pill tags between filter controls and the table. "Clear all" ghost link appears when 2+ filters are active.

**Pagination:** Used everywhere. Infinite scroll is not used. Users navigating booking history or review management need to be able to return to a specific page. 20 rows per page default.

**Stat tiles (owner/admin overview):**
- Layout: label on top, number large below. That's it.
- Number: 28px/700 Bricolage Grotesque, `--color-text-heading`
- Label: 13px/400 DM Sans, `--color-text-muted`
- Background: `--color-bg-card`, `--shadow-xs`, `--radius-md`, 20px padding
- No trend arrows. No comparison percentages. No gradient accents. These are counters, not dashboards.

**Review aggregate display:**
- Overall rating: large number (48px/800) + total review count in Body Default
- Category bars (cleanliness/location/value/safety): label left, score right, bar fills between. Bar height 6px, fill `--color-primary`, track `--color-bg-sidebar`, `--radius-full`.

**Data density decision:** Show 20 hostels per search page, 20 bookings per booking page, 10 reviews per hostel by default with "Show more" loading the next 10. No infinite scroll — deliberate.

---

## 10. Accessibility & Inclusive Design

**Color contrast minimum:** WCAG AA. Body text on background must be ≥ 4.5:1. Large text (18px+ regular or 14px+ bold) must be ≥ 3:1. UI components and focus indicators must be ≥ 3:1.

Specific pairs to verify in implementation:
- `--color-text-body` (`#4A3C2C`) on `--color-bg-page` (`#FDF8F0`): approximately 7.8:1 — passes AA and AAA
- `--color-text-muted` (`#857060`) on `--color-bg-page` (`#FDF8F0`): approximately 4.2:1 — verify; may need adjustment on some surfaces
- `#F9F5EE` on `--color-action` (`#2A6545`): approximately 7.1:1 — passes
- `#2A2318` on `--color-primary` (`#C28B1A`): approximately 4.8:1 — passes

**Focus management:**
- Modals: on open, focus moves to the first focusable element inside the modal. On close, focus returns to the trigger element.
- Drawers: same pattern as modals.
- Toasts: not focusable. Screen reader announced via `role="status"` live region.
- Form errors: after failed submit, focus moves to the first field with an error.

**Keyboard navigation:**
- Tab order follows visual DOM order. No `tabindex` > 0 anywhere.
- Escape key closes: modals, drawers, dropdowns, date pickers.
- Enter/Space activates buttons and checkboxes.
- Arrow keys navigate within: tab groups, radio button groups, dropdown option lists.

**ARIA conventions:**
- Icon-only buttons: `aria-label` describing the action ("Save hostel", "Remove from favorites")
- Status badges: `role="status"` or included in accessible label of parent element
- Loading states: `aria-busy="true"` on the loading region, `aria-live="polite"` for content that updates
- Search results count: `aria-live="polite"` region updated when results change

**Touch targets:** Minimum 44px × 44px for all interactive elements on mobile. Icon-only buttons in dense tables are 36px visually but have 44px tap targets via padding.

**Text resizing at 200% zoom:** Layouts switch to single-column. No horizontal scrollbar on the main content area. Truncation removed when text would become too short to read. Test at 200% zoom on 1280px viewport.

---

## 11. Voice & Tone in UI Copy

**Overall tone:** Direct and practical. Not formal, not chirpy. The copy sounds like a competent friend who knows what they're talking about — not a customer service script.

**Button labels:** Verb-first, always. Not "Booking Submission" — "Submit Booking." Not "Account Deletion" — "Delete Account."

Full verb list in use: Search, Book, Request, Confirm, Pay, Cancel, Save, Remove, Send, Upload, Edit, Add, Apply, Reset, Verify, Submit, Sign in, Sign up, Sign out, Continue, Back.

**Error messages:** Never blame. Never be vague.
- Bad: "Invalid input." — doesn't say what's invalid or how to fix it.
- Bad: "You entered an incorrect value." — blames the user.
- Good: "Email already registered. Sign in instead, or reset your password."
- Good: "Phone number must start with 03 and be 11 digits."
- Good: "Booking couldn't be confirmed. The room may no longer be available."

**Empty state copy:** Honest, brief, actionable.
- No exclamation points.
- No "Oops" or "Uh oh."
- No "It looks like."

**Confirmation dialog copy pattern:**
- Heading: the action itself. "Cancel your booking?"
- Body: what will happen. "This will cancel your booking for Green Valley Hostel. You won't be charged."
- Primary: the action in red. "Yes, cancel booking."
- Secondary: escape. "Keep booking."

**Placeholder text style:** Example-based where it helps, instructive where it doesn't.
- Price: "e.g. 8500"
- City: "Lahore, Karachi, Islamabad..."
- Description: "Describe your hostel's location, rules, and what makes it a good choice for students"

**Capitalization rules:**
- Page headings (H1–H3): sentence case. "Find your next hostel" not "Find Your Next Hostel."
- Navigation items: sentence case. "My bookings" not "My Bookings."
- Button labels: sentence case. "Book now" not "Book Now." Exception: brand-specific labels like "Sign in with Google."
- Table column headers: sentence case.
- Overline text: uppercase (CSS, not typed).
- Status badges: sentence case. "Pending review" not "PENDING REVIEW."

**Copy never uses:**
- "Seamless"
- "Effortless"
- "Powerful"
- "Delightful"
- "Simply"
- "Just" (as in "Just click here")
- "Easy" (patronizing)
- Any sentence starting with "Unlock"
- Any sentence starting with "Discover"

---

## 12. Dark Mode Specification

**Activation:** Respects `prefers-color-scheme` by default. User can override and their preference is stored in `localStorage`. Toggle is in Settings > Personal Info, and in the account menu footer.

**Surface hierarchy in dark mode:**
```
Page:    #1C1710 (oklch 0.14 0.016 65)
Card:    #241E14 (oklch 0.18 0.013 65)
Raised:  #2C2519 (oklch 0.21 0.012 65)
Sidebar: #1A1510 (oklch 0.13 0.014 65)
```

These surfaces use color for elevation, not shadow. `--shadow-md` and above are still present but are warm-tinted and subtle (opacity reduced 40% from light mode values).

**No glows.** The product is not a gaming dashboard. Dark mode does not add colored glows around any element.

**Images in dark mode:** Hostel photos display unchanged. Skeletons use `#2C2519` base and `#352D1F` shimmer. No image dimming is applied.

**Amber primary color in dark mode:**
- `--color-primary` becomes `oklch(0.68 0.17 65)` (`#D4A030`) — slightly brighter to maintain 3:1 contrast on dark surfaces.
- `--color-action` becomes `oklch(0.52 0.14 148)` (`#38885E`) — lightened for visibility.
- `--color-primary-faint` becomes `oklch(0.20 0.03 65)` (`#2E2416`) — dark amber tint for badge/alert backgrounds.

---

## 13. Design Tokens (Export-Ready)

```css
/* === BRAND COLORS === */
--color-primary: oklch(0.62 0.17 65);         /* #C28B1A */
--color-primary-dark: oklch(0.52 0.16 65);    /* #9E6F0E */
--color-primary-deep: oklch(0.42 0.13 65);    /* #7A5308 */
--color-primary-light: oklch(0.90 0.08 65);   /* #F5DFA3 */
--color-primary-faint: oklch(0.96 0.04 65);   /* #FDF3DC */

/* === ACTION / CTA === */
--color-action: oklch(0.45 0.14 148);         /* #2A6545 */
--color-action-dark: oklch(0.37 0.12 148);    /* #1F5035 */
--color-action-pressed: oklch(0.30 0.10 148); /* #173D28 */
--color-action-light: oklch(0.92 0.06 148);   /* #D3EDE1 */

/* === BACKGROUNDS === */
--color-bg-page: oklch(0.98 0.006 65);        /* #FDF8F0 */
--color-bg-card: oklch(0.995 0.003 65);       /* #FEFCF8 */
--color-bg-sidebar: oklch(0.96 0.009 65);     /* #F5EFE3 */
--color-bg-raised: oklch(0.975 0.005 65);     /* #FAF5EC */
--color-bg-overlay: oklch(0.965 0.007 65);    /* #F3EBD9 */

/* === TEXT === */
--color-text-heading: oklch(0.18 0.016 65);   /* #2A2318 */
--color-text-body: oklch(0.30 0.014 65);      /* #4A3C2C */
--color-text-muted: oklch(0.52 0.010 65);     /* #857060 */
--color-text-placeholder: oklch(0.68 0.008 65); /* #B0A090 */
--color-text-disabled: oklch(0.78 0.006 65);  /* #CABFB0 */
--color-text-inverse: oklch(0.97 0.004 65);   /* #F9F5EE */
--color-text-link: oklch(0.42 0.13 65);       /* #7A5308 */

/* === BORDERS === */
--color-border-default: oklch(0.88 0.012 65); /* #E0D4C0 */
--color-border-strong: oklch(0.74 0.015 65);  /* #BEA888 */
--color-border-subtle: oklch(0.93 0.007 65);  /* #EDE6D9 */

/* === SEMANTIC === */
--color-success: oklch(0.52 0.14 148);        /* #2A7A50 */
--color-success-bg: oklch(0.96 0.03 148);     /* #E8F5EF */
--color-warning: oklch(0.68 0.15 72);         /* #C4900A */
--color-warning-bg: oklch(0.97 0.035 72);     /* #FEF6E0 */
--color-error: oklch(0.52 0.18 22);           /* #C43B28 */
--color-error-bg: oklch(0.97 0.02 22);        /* #FEEEED */
--color-info: oklch(0.52 0.09 245);           /* #3B6E9E */
--color-info-bg: oklch(0.97 0.02 245);        /* #EEF3FB */

/* === TYPOGRAPHY === */
--font-heading: 'Bricolage Grotesque', 'Arial Black', system-ui, sans-serif;
--font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Cascadia Code', ui-monospace, monospace;

--text-display: 3.5rem;    /* 56px */
--text-h1: 2.5rem;         /* 40px */
--text-h2: 2rem;           /* 32px */
--text-h3: 1.5rem;         /* 24px */
--text-h4: 1.25rem;        /* 20px */
--text-h5: 1.0625rem;      /* 17px */
--text-h6: 0.875rem;       /* 14px */
--text-body-lg: 1.125rem;  /* 18px */
--text-body: 0.9375rem;    /* 15px */
--text-body-sm: 0.8125rem; /* 13px */
--text-label: 0.8125rem;   /* 13px */
--text-caption: 0.6875rem; /* 11px */

/* === SPACING === */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;

/* === BORDER RADIUS === */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

/* === SHADOWS (warm amber-hued) === */
--shadow-xs: 0 1px 2px oklch(0.18 0.016 65 / 0.06);
--shadow-sm: 0 1px 4px oklch(0.18 0.016 65 / 0.08), 0 1px 2px oklch(0.18 0.016 65 / 0.04);
--shadow-md: 0 4px 12px oklch(0.18 0.016 65 / 0.10), 0 2px 4px oklch(0.18 0.016 65 / 0.05);
--shadow-lg: 0 12px 32px oklch(0.18 0.016 65 / 0.12), 0 4px 8px oklch(0.18 0.016 65 / 0.06);
--shadow-xl: 0 24px 48px oklch(0.18 0.016 65 / 0.14), 0 8px 16px oklch(0.18 0.016 65 / 0.07);

/* === TRANSITIONS === */
--transition-fast: 100ms;
--transition-base: 150ms;
--transition-medium: 200ms;
--transition-enter: 250ms;
--transition-exit: 180ms;
--transition-slow: 350ms;

--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* === LAYOUT === */
--container-max: 1280px;
--sidebar-width: 240px;
--breakpoint-sm: 640px;
--breakpoint-md: 1024px;
--breakpoint-lg: 1280px;
--breakpoint-xl: 1440px;
```

---

## 14. What This Design Must Never Do

1. **Never use an Airbnb-style visual language.** White cards on white backgrounds, full-bleed photography, rounded sans-serif at 32px, coral or blue CTAs. Pakistani students will not trust a Pakistani hostel platform that looks like a vacation rental app built in San Francisco.

2. **Never use gradient text.** `background-clip: text` with a gradient is banned. If a heading needs emphasis, increase weight or size. A gradient on "HostelLo" would look like it was generated, not designed.

3. **Never use side-stripe borders as a card's primary accent.** A colored left-border on a hostel card, review block, or stat tile is not design. Replace with a full-border tint, a background color, or nothing.

4. **Never use glassmorphism.** No `backdrop-filter: blur()` on card backgrounds, no frosted panels, no semi-transparent cards overlaid on photos. It reads as a trend choice, not a functional one, and degrades on low-end Android devices common in the Pakistani market.

5. **Never put a modal in front of the booking flow.** Booking is the primary conversion action. If it lives in a modal, users feel trapped and close it. It gets a dedicated page.

6. **Never show a star row (five star icons) for ratings.** Show one filled star icon + the numeric rating (e.g., "★ 4.3") + review count. Five-star rows are visual clutter and become misleading when ratings are fractional.

7. **Never use WhatsApp green, Pakistan green, or any flag-adjacent color as the brand color.** The category reflex for a "Pakistani app" is green. The second reflex is teal. Both are taken. The amber-gold identity is chosen specifically to break this pattern.

8. **Never render the landing page as a marketing brochure.** No headline like "The future of student housing in Pakistan." No animated SVG illustration of a student with a backpack. Students arrive to search, not to read about the product's vision.

9. **Never use identical card grids.** Search results show cards of the same width, but not the same information weight. Featured hostels have a different image ratio. Comparison view is horizontal. Saved hostels are compact. The grid structure is consistent; the cards within it are context-appropriate.

10. **Never use `#000000` or `#FFFFFF` for any element.** Every dark color is a warm-tinted dark brown. Every light color is a warm-tinted near-white. Pure black and pure white exist nowhere in the product, including SVG icons (use `currentColor`).

11. **Never animate on page load.** No staggered card entrances. No fade-in hero text. No choreographed welcome sequence. Users arrive to complete a task. The first render should be instant and stable, not a performance.

12. **Never show empty admin or owner dashboard metrics as zeroes without context.** A new owner dashboard showing "0 bookings" with no guidance is a dead end. Every zero state has a one-line action prompt next to the number.