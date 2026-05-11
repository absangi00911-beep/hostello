# HostelLo — Mobile App Design Specification

> Feed this file directly into your design tool or AI design agent. Every value is final. No placeholders. No vague intent.
> This document is the mobile app counterpart to the original web design spec. All decisions are native-mobile-first.
> If a section feels opinionated, that is the point.

---

## 1. Product Identity & Design Philosophy

**Product name:** HostelLo
**Tagline:** Find your room. Not a phone number.
**One-line purpose:** A mobile app where Pakistani students find, compare, and book verified hostel accommodation near their university — entirely on their phone, without calling anyone.

**The emotion this product must produce:** Confidence. A student opens HostelLo two weeks before they move cities and the app makes them feel: *I can sort this today.* Not delight. Not awe. Just clear, calm, trustworthy momentum.

**Design philosophy — three rules everything answers to:**

1. **Clarity over completeness.** Students are stressed and time-pressured. Show what matters. Cut the rest. A hostel card that shows price, gender type, distance, and one photo is more useful than one that shows eight amenity icons and a paragraph of description.

2. **Native patterns, deliberate character.** Use the navigation conventions, gesture behaviors, and component patterns users already know from their phone. Character comes from color, type, and spacing — not from reinventing how swipe or tab navigation works. The interface should disappear; the hostels should not.

3. **Earned trust at every step.** Verified badges mean something. Review counts are real. Price is the full price. Booking confirmation is immediate and clear. Every design decision either builds trust or it gets cut.

**Who this product is for:** A 20-year-old from Faisalabad who just got into UET Lahore. They're on their phone 90% of the time — probably WhatsApp and YouTube. They've never booked accommodation online before; they'd normally ask a cousin. They don't trust things that look cheap. They don't read paragraphs. They need the price, the photos, and a way to contact the owner without calling a stranger.

They are using a mid-range Android (likely Samsung Galaxy A-series or Xiaomi Redmi). They may have a slow 4G connection. The app must feel fast on this device, in sunlight, with one hand.

Hostel owners are typically 40–55, running 20–80 beds, already managing on WhatsApp. They're skeptical of tech. Their screens (listing creation, booking management) must look serious — like something built for a real business, not a student project.

**What this product must never feel like:**

- An Airbnb clone. White cards, bleed-to-edge photography, coral CTAs, big rounded fonts.
- A government portal. Flat gray screens, crowded forms, no visual hierarchy.
- A startup demo. Animated onboarding sequences, abstract SVG illustrations, "We're building the future of student housing."
- A Pakistani bank app. Navy, gold, formal. Trust is earned by clarity here, not by looking expensive.

---

## 2. Platform Targets

**Primary platform:** Android (target SDK 33+, minimum SDK 26)
**Secondary platform:** iOS (target iOS 15+)

Design every screen for both platforms. Where native patterns diverge, specify both. Where they converge, one spec covers both.

**Reference device dimensions:**

| Device class | Dimensions | Notes |
|---|---|---|
| Small Android | 360×800dp | Minimum supported — test all screens here |
| Standard Android | 393×851dp | Primary design canvas (Pixel 7 / Galaxy A54) |
| Large Android | 412×915dp | Common high-end Android |
| Standard iPhone | 390×844pt | Primary iOS canvas (iPhone 14) |
| Large iPhone | 430×932pt | iPhone Pro Max — check for stretch artifacts |

**Safe areas (non-negotiable):**

- Android: Status bar 24dp, navigation bar 48dp (gesture nav) or 56dp (3-button nav). Always design for gesture navigation first.
- iOS: Status bar dynamic island / notch area + home indicator 34pt. Use `SafeAreaInsets` on every screen.
- Never place interactive elements inside safe area zones.

**One-handed use:** The primary usage context is one-handed, on a bus, in sunlight. Primary actions must live in the thumb-reachable zone: the bottom 40% of the screen.

---

## 3. Brand & Visual Language

### Theme Decision

**Physical scene that forces the answer:**

> A 20-year-old sits on a Daewoo coach from Faisalabad to Lahore at 2pm. Window seat. Sun directly on their phone screen. 38% battery. They need to shortlist two hostels before they land. They squint.

This is the primary usage context. The app must be light, high-contrast, and outdoors-readable. Dark mode is supported for evening use but is not the default. Do not design for dark-mode-first and invert it.

---

### Color System

**Color strategy: Committed on marketing surfaces, Restrained on product surfaces.**

The brand color — a warm amber-gold — carries visual weight on the home screen hero, onboarding, and hostel detail heroes. On listing screens, booking flows, and owner panels, it drops to accent-only: active tab indicators, primary badges, and focus rings. The amber is never a full-screen background on dense product screens.

All colors are defined in OKLCH. The hex values below are the closest sRGB approximations.

#### Brand Colors

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-primary` | `oklch(0.62 0.17 65)` | `#C28B1A` | Brand identity, active tab indicators, illustration accents |
| `--color-primary-dark` | `oklch(0.52 0.16 65)` | `#9E6F0E` | Active pressed states for brand elements |
| `--color-primary-deep` | `oklch(0.42 0.13 65)` | `#7A5308` | Price text, active icon fills, focus ring |
| `--color-primary-light` | `oklch(0.90 0.08 65)` | `#F5DFA3` | Tag backgrounds, badge tints, selected row backgrounds |
| `--color-primary-faint` | `oklch(0.96 0.04 65)` | `#FDF3DC` | Alert backgrounds, selected state backgrounds |

#### CTA / Action Color

The CTA is forest green — opposite the amber on the hue wheel. Amber = identity/brand. Green = action/confirm.

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-action` | `oklch(0.45 0.14 148)` | `#2A6545` | Book Now, Confirm, Pay, Submit — primary action buttons only |
| `--color-action-dark` | `oklch(0.37 0.12 148)` | `#1F5035` | Pressed state for action buttons |
| `--color-action-pressed` | `oklch(0.30 0.10 148)` | `#173D28` | Deep pressed state |
| `--color-action-light` | `oklch(0.92 0.06 148)` | `#D3EDE1` | Action button ghost background on press |

#### Backgrounds

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-bg-page` | `oklch(0.98 0.006 65)` | `#FDF8F0` | Screen background, the universal canvas |
| `--color-bg-card` | `oklch(0.995 0.003 65)` | `#FEFCF8` | Card surfaces, bottom sheets, modal surfaces |
| `--color-bg-tab-bar` | `oklch(0.995 0.003 65)` | `#FEFCF8` | Bottom navigation bar background |
| `--color-bg-raised` | `oklch(0.975 0.005 65)` | `#FAF5EC` | Input backgrounds, chip backgrounds, floating pills |
| `--color-bg-overlay` | `oklch(0.965 0.007 65)` | `#F3EBD9` | Pressed row backgrounds, selected list items |

Note: `#FFFFFF` and `#000000` are never used. Every white is amber-tinted. Every black is a warm amber-tinted dark brown.

#### Text Colors

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-text-heading` | `oklch(0.18 0.016 65)` | `#2A2318` | All headings, screen titles, hostel names |
| `--color-text-body` | `oklch(0.30 0.014 65)` | `#4A3C2C` | Body copy, descriptions, list item text |
| `--color-text-muted` | `oklch(0.52 0.010 65)` | `#857060` | Secondary labels, timestamps, metadata |
| `--color-text-placeholder` | `oklch(0.68 0.008 65)` | `#B0A090` | Input placeholder text |
| `--color-text-disabled` | `oklch(0.78 0.006 65)` | `#CABFB0` | Disabled state text and icons |
| `--color-text-inverse` | `oklch(0.97 0.004 65)` | `#F9F5EE` | Text on dark/amber backgrounds |
| `--color-text-link` | `oklch(0.42 0.13 65)` | `#7A5308` | Tappable inline links |

#### Borders & Dividers

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--color-border-default` | `oklch(0.88 0.012 65)` | `#E0D4C0` | Card borders, input borders, list dividers |
| `--color-border-strong` | `oklch(0.74 0.015 65)` | `#BEA888` | Active input borders, focused states |
| `--color-border-subtle` | `oklch(0.93 0.007 65)` | `#EDE6D9` | Very subtle separators, skeleton edges |

#### Semantic Colors

| Role | Main | OKLCH | Background | OKLCH bg |
|---|---|---|---|---|
| Success | `#2A7A50` | `oklch(0.52 0.14 148)` | `#E8F5EF` | `oklch(0.96 0.03 148)` |
| Warning | `#C4900A` | `oklch(0.68 0.15 72)` | `#FEF6E0` | `oklch(0.97 0.035 72)` |
| Error | `#C43B28` | `oklch(0.52 0.18 22)` | `#FEEEED` | `oklch(0.97 0.02 22)` |
| Info | `#3B6E9E` | `oklch(0.52 0.09 245)` | `#EEF3FB` | `oklch(0.97 0.02 245)` |

Token naming: `--color-success`, `--color-success-bg`, `--color-success-text` (same pattern for warning, error, info).

#### Dark Mode

Dark mode respects `prefers-color-scheme`. Users can override in Settings. The toggle is in Settings → Account.

Dark mode uses a warm near-black surface hierarchy. Elevation is expressed through surface lightness — not shadow.

| Light token | Dark equivalent hex | Notes |
|---|---|---|
| `--color-bg-page` `#FDF8F0` | `#1C1710` | Warm very-dark amber-brown |
| `--color-bg-card` `#FEFCF8` | `#241E14` | Slightly lighter than page |
| `--color-bg-tab-bar` `#FEFCF8` | `#1A1510` | Tab bar surface |
| `--color-bg-raised` `#FAF5EC` | `#2C2519` | Input backgrounds, chip surfaces |
| `--color-text-heading` `#2A2318` | `#EDE5D8` | Near-white with amber tint |
| `--color-text-body` `#4A3C2C` | `#C8BAA8` | Warm mid-light |
| `--color-text-muted` `#857060` | `#8A7B6A` | Same visual weight |
| `--color-border-default` `#E0D4C0` | `#3A3025` | Subtle warm dark border |
| `--color-primary` `#C28B1A` | `#D4A030` | Slightly brighter for dark surfaces |
| `--color-action` `#2A6545` | `#38885E` | Lightened for dark background contrast |

No glows. No colored halos around elements. Shadows are minimal, warm-tinted, and reduced 40% in opacity from light mode values.

---

### Typography

HostelLo uses two typefaces. One for headings, one for everything else. Not three.

**Heading font: Bricolage Grotesque**
Wide proportions, slight quirk. Modern without being tech-neutral. Hostel names and screen titles feel hand-typeset, not generated. Load from Google Fonts.

**Body font: DM Sans**
Clean, slightly warm, excellent at small sizes on low-quality Android screens. Better for labels and body copy than Inter at the sizes mobile requires.

**Monospace font: JetBrains Mono**
Used for booking reference IDs, transaction IDs, and OTP code display only.

**Mobile type scale:**

All sizes in sp (Android) / pt (iOS). Base: 16sp/pt = 1rem equivalent.

| Name | Size | Weight | Line-height | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Display | 36sp | 800 | 1.05 | -0.02em | Onboarding hero, 404 numbers |
| H1 | 28sp | 700 | 1.10 | -0.02em | Screen titles, hostel names (detail) |
| H2 | 22sp | 700 | 1.15 | -0.015em | Section headers, card hostel names |
| H3 | 18sp | 600 | 1.20 | -0.01em | Sub-section headers, modal titles |
| H4 | 16sp | 600 | 1.28 | 0em | List item titles, form section headers |
| H5 | 15sp | 600 | 1.35 | 0em | Tab labels, small card titles |
| Body Large | 16sp | 400 | 1.65 | 0em | Description text, onboarding body |
| Body Default | 14sp | 400 | 1.65 | 0em | Standard body text, form helper text |
| Body Small | 13sp | 400 | 1.60 | 0em | Secondary info, supporting metadata |
| Label | 13sp | 500 | 1.40 | 0.01em | Input labels, button text (sm) |
| Caption | 12sp | 400 | 1.50 | 0.02em | Timestamps, fine print |
| Overline | 11sp | 600 | 1.50 | 0.10em | Category labels — always uppercase via transform |

**Minimum font size:** 12sp/pt on any mobile screen. Caption (12sp) is the absolute floor.

Display and H1–H2 use Bricolage Grotesque. H3 onward uses DM Sans on product screens. Bricolage Grotesque on marketing surfaces (onboarding, hostel detail hero).

Body line length caps at 42ch on all prose content within the app. Wider than that on a phone screen strains reading.

---

### Iconography

**Library:** Lucide
Consistent 1.5px stroke width. No filled icons; no duotone. Filled states (saved favorite) use same icon with color change, not a filled variant.

| Size name | dp/pt | Usage |
|---|---|---|
| Small | 16dp | Inline in text, compact badge icons |
| Default | 20dp | Standard UI icons in buttons, nav bar items, inputs |
| Medium | 24dp | Section headers, tab bar icons |
| Large | 32dp | Empty states, onboarding step icons |
| XL | 44dp | Error screens, full-screen empty states |

**Tap target rule:** Any tappable icon must have a minimum 44×44dp tap area, even if the icon itself renders smaller. Use invisible padding to achieve this — never shrink the tap target to match the visual icon size.

---

### Imagery & Illustration Style

**Photography (hostel photos):** Real photos uploaded by owners. No stock photography. The app must not break when photos are low resolution, portrait-oriented, or poorly lit.

Photo display rules:
- Always use `object-fit: cover` with a defined aspect ratio (16:9 for hero images, 4:3 for cards)
- Add a subtle gradient overlay at the bottom (0→30% opacity black, over 64dp height) when text appears over images
- Broken images fall back to an amber-tinted skeleton with a building icon centered

**Illustration style:** None. HostelLo does not use decorative illustration. Empty states use Lucide icons (Large/XL size) with a short heading and CTA — not custom illustrations.

**Skeleton / loading style:**
- Warm amber-tinted: `#E8DFCE` base, `#F0E8D8` shimmer
- Shimmer animation: left-to-right sweep, 1.6s duration, ease-in-out, linear infinite
- Border radius matches the element being loaded

---

## 4. Spacing, Layout & Grid System

**Base unit: 4dp/pt**

All spacing is a multiple of 4. Use these tokens; do not use arbitrary values.

| Token | Value | Common mobile use |
|---|---|---|
| `--space-1` | 4dp | Icon gap, tight internal padding |
| `--space-2` | 8dp | Chip internal padding, icon-to-text gap |
| `--space-3` | 12dp | Input vertical padding, tag padding |
| `--space-4` | 16dp | Screen horizontal margin, card padding |
| `--space-5` | 20dp | Between form fields |
| `--space-6` | 24dp | Section gap within a screen |
| `--space-8` | 32dp | Between major sections |
| `--space-10` | 40dp | Screen top padding beneath navigation |
| `--space-12` | 48dp | Bottom padding before tab bar |

**Screen horizontal margin:** 16dp on all screens, consistently. No screen content touches the edge.

**Grid system:**

| Screen width | Columns | Gutter | Margin |
|---|---|---|---|
| < 400dp | 4 | 12dp | 16dp |
| 400dp–599dp | 4 | 16dp | 16dp |
| 600dp–839dp (tablet) | 8 | 20dp | 24dp |
| ≥ 840dp (tablet landscape) | 12 | 24dp | 32dp |

**Component internal spacing (mobile-calibrated):**

| Component | Padding |
|---|---|
| Buttons (sm) | 8dp vertical, 16dp horizontal |
| Buttons (md) | 12dp vertical, 20dp horizontal |
| Buttons (lg) | 14dp vertical, 24dp horizontal |
| Cards | 16dp uniform |
| Bottom sheets | 20dp horizontal, 24dp top |
| Input fields | 12dp vertical, 16dp horizontal |
| List rows | 16dp vertical, 16dp horizontal |
| Bottom tab bar items | 8dp vertical |

**Thumb-zone awareness:**

Divide the screen into three vertical zones:
- **Natural zone** (bottom 40%): Primary actions live here. Book Now, Search, primary nav.
- **Stretch zone** (middle 40%): Secondary actions, scrollable content, filter chips.
- **Difficult zone** (top 20%): Status bar, back button (system-level), read-only labels. Never put primary CTAs here.

---

## 5. Component Design System

**Border radius tokens:**
```
--radius-sm: 6dp    Tags, small badges, tooltips, chips
--radius-md: 10dp   Buttons, input fields, small cards
--radius-lg: 16dp   Bottom sheets, large cards, image containers
--radius-xl: 24dp   Featured hostel cards, hero image containers
--radius-full: 9999dp  Pills, avatars, toggle thumb, FABs
```

**Shadow tokens (warm amber-hued):**
```
--shadow-xs: 0 1px 2px oklch(0.18 0.016 65 / 0.06)
--shadow-sm: 0 1px 4px oklch(0.18 0.016 65 / 0.08), 0 1px 2px oklch(0.18 0.016 65 / 0.04)
--shadow-md: 0 4px 12px oklch(0.18 0.016 65 / 0.10), 0 2px 4px oklch(0.18 0.016 65 / 0.05)
--shadow-lg: 0 12px 32px oklch(0.18 0.016 65 / 0.12), 0 4px 8px oklch(0.18 0.016 65 / 0.06)
--shadow-xl: 0 24px 48px oklch(0.18 0.016 65 / 0.14), 0 8px 16px oklch(0.18 0.016 65 / 0.07)
```

Shadows are warm, never cool-gray. Bottom sheet shadow is `--shadow-xl`.

---

### Buttons

**Primary button (Book, Pay, Submit, Confirm):**
- Background: `--color-action` (`#2A6545`)
- Text: `#F9F5EE`, 15sp/500
- Border radius: `--radius-md`
- Minimum height: 48dp (touch-friendly)
- Pressed: background `--color-action-pressed`, `scale(0.97)` for 60ms
- Loading: spinner left of label, width locked to prevent layout shift
- Disabled: background `#C4BAB0`, not-interactive

**Secondary button (Save, Cancel, Edit):**
- Background: `--color-bg-card`
- Text: `--color-text-body`
- Border: 1px solid `--color-border-default`
- Pressed: background `--color-bg-overlay`, border `--color-border-strong`
- Minimum height: 48dp

**Amber/Brand button (home screen hero, owner CTAs):**
- Background: `--color-primary` (`#C28B1A`)
- Text: `#2A2318`
- Pressed: background `--color-primary-dark`
- Used on home screen hero and owner onboarding only

**Ghost button:**
- Background: transparent
- Text: `--color-text-body`
- Border: none
- Pressed: background `--color-bg-overlay`
- Used for tertiary actions: Clear filters, Cancel in bottom sheets

**Destructive button:**
- Background: `--color-error` (`#C43B28`)
- Text: `#F9F5EE`
- Pressed: `oklch(0.44 0.17 22)`
- Used in delete confirmation flows only

**Full-width buttons:** All primary and secondary buttons in forms, booking flows, and bottom sheets are full-width. Narrow inline buttons (icon-only or short text) are width-hugging.

**Button sizes (mobile):**

| Size | Height | Font | Padding H | Use |
|---|---|---|---|---|
| sm | 36dp | 13sp/500 | 16dp | Inline actions, row actions |
| md | 44dp | 15sp/500 | 20dp | Standard screens |
| lg | 52dp | 16sp/600 | 24dp | Booking CTAs, primary screen actions |

---

### Input Fields

**Default state:**
- Background: `--color-bg-card`
- Border: 1px solid `--color-border-default`
- Border radius: `--radius-md`
- Text: `--color-text-body`, 15sp
- Placeholder: `--color-text-placeholder`
- Height: 52dp (single line) — larger than web for finger-friendly tapping
- Padding: 14dp vertical, 16dp horizontal

**Focused state:**
- Border: 1.5px solid `--color-primary`
- Box shadow: `0 0 0 3dp oklch(0.62 0.17 65 / 0.15)`

**Filled state:** Border 1px solid `--color-border-strong`

**Error state:**
- Border: 1.5px solid `--color-error`
- Helper text below in `--color-error`, 13sp, with alert-circle icon (16dp) inline

**Disabled state:**
- Background: `oklch(0.94 0.006 65)`
- Text: `--color-text-disabled`
- Not tappable

**Label:** Always above the field. 13sp/500, `--color-text-body`. 6dp gap above input.
**Helper text:** 12sp, `--color-text-muted`, 4dp below input.
**Floating labels: not used.** Placeholder-only inputs: not used. Labels always visible.

**Keyboard types (specify per field):**
- Email: `keyboardType="email-address"`, `autoCapitalize="none"`
- Phone: `keyboardType="phone-pad"`
- Price (PKR): `keyboardType="number-pad"`
- OTP: `keyboardType="number-pad"`, `maxLength=1` per digit box
- Search: `keyboardType="default"`, `returnKeyType="search"`

**Keyboard avoidance:** Every screen with inputs must implement `KeyboardAvoidingView` (React Native) or equivalent. Forms scroll up; primary action buttons remain above the keyboard.

---

### Bottom Sheets

Bottom sheets replace modals, drawers, and filter panels on mobile. They are the primary overlay pattern.

**Types:**
- **Short sheet** (snap at 40% screen height): Simple confirmations, single-action prompts, city pickers
- **Tall sheet** (snap at 80% screen height): Filter panels, booking panels, multi-field forms
- **Full sheet** (snap at 95% screen height, with drag handle): Multi-step forms, message threads, listing creation steps

**Structure:**
- Drag handle: 40×4dp pill, `--color-border-strong`, centered, 12dp from top edge
- Background: `--color-bg-card`
- Corner radius: `--radius-xl` (24dp) at the top two corners only
- Shadow: `--shadow-xl`
- Top padding: 28dp (below handle)
- Horizontal padding: 20dp
- Bottom padding: 20dp + safe area inset

**Animation:** Slides up from bottom edge, 300ms, `--ease-out-quart`. Dismisses by dragging down below 30% of sheet height, or tapping the backdrop. Backdrop: `oklch(0.18 0.016 65 / 0.50)`.

**Scrollable sheets:** When content overflows, the sheet scrolls internally. The drag handle remains fixed. A subtle fade at the bottom edge indicates more content.

**Do not use modals (center-screen popups) for:**
- Booking initiation — use dedicated screen
- Filters — use bottom sheet
- Hostel quick preview — use bottom sheet or navigate to detail screen
- Any flow that requires multiple form fields

---

### Dropdowns & Pickers

On mobile, custom dropdowns open as bottom sheets. Native `<select>` or action sheets are acceptable for simple 3–5 option lists only.

**Bottom sheet picker:**
- Option height: 52dp, 16dp horizontal padding
- Option pressed: background `--color-bg-overlay`
- Selected option: `--color-primary-faint` background, checkmark icon right-aligned, `--color-primary-deep` text
- Searchable picker: search input at top, standard input field style

**Date pickers:** Native platform picker on iOS (wheel-style) and Android (calendar dialog). Do not build custom calendar pickers unless native behavior conflicts with brand requirements.

---

### Checkboxes & Radio Buttons

**Checkbox:**
- 22×22dp, `--radius-sm`
- Default: border 1.5px `--color-border-strong`, background `--color-bg-card`
- Checked: background `--color-action`, checkmark icon 14dp
- Tap target: 44×44dp minimum (padding compensates)

**Radio button:**
- 22×22dp circle
- Default: border 1.5px `--color-border-strong`
- Selected: outer ring `--color-action`, inner filled circle 10dp `--color-action`
- Tap target: 44×44dp minimum

---

### Toggle / Switch

On mobile, toggles are used for notification preferences, listing active/suspended status, and settings.

- Track: 52×28dp, `--radius-full`
- Thumb: 22dp circle, `#FEFCF8`, `--shadow-sm`
- Off: track `--color-border-strong`, thumb left
- On: track `--color-action`, thumb right, transition 200ms ease-out
- Tap target for the whole toggle: minimum 44×44dp

---

### Badges & Tags

**Status badges:**
- Height: 22dp, padding 0 8dp, `--radius-full`
- Font: 12sp/600, uppercase via transform
- Variants: amber (`--color-primary-faint` bg, `--color-primary-deep` text), success, warning, error, info

**Amenity/feature tags:**
- Height: 30dp, padding 6dp 12dp, `--radius-md`
- Font: 13sp/500
- Background: `--color-bg-raised`, border 1px `--color-border-default`
- Horizontally scrollable row when more than 3 tags

**Verified badge:** Shield-check icon 14dp + "Verified" text or icon-only depending on context. Amber background, `--color-primary-deep` text.

---

### Toasts / Snackbars

- Position: bottom-center, 16dp from bottom tab bar (or 16dp from screen bottom in fullscreen contexts)
- Width: `calc(100vw - 32dp)`
- Background: `--color-bg-card`, `--shadow-lg`, `--radius-lg`
- Left edge: 4dp solid bar matching semantic type (success/error/warning/info)
- Icon: 20dp, matching type color
- Title: 14sp/600, message: 13sp/400, max 2 lines then truncated
- Duration: success 4s, error 6s, warning 5s, info 4s
- Dismiss: tapping the toast dismisses it. Auto-dismiss continues if not tapped.
- Stacking: max 2 visible; oldest fades out when new one enters

---

### Cards

Hostel cards are the most important component. They must not all look the same.

**Search result card (primary):**
- Full width (single column on phones)
- Image: 16:9 at top, `object-fit: cover`, `--radius-lg` top corners, square bottom corners
- Content padding: 16dp
- Hostel name: H3 weight (18sp/600 Bricolage Grotesque), 1 line with ellipsis
- Price: 18sp/700, `--color-primary-deep`, "PKR X,XXX/mo"
- Rating: star icon (amber) + numeric + review count. Not a star row. Single line.
- Detail chips: max 3 (gender type, distance, one amenity), horizontally inline
- Verified badge: top-left of image, 8dp inset
- Pressed: `scale(0.98)`, 80ms

**Compact card (saved hostels, comparison):**
- Horizontal layout: image 80×80dp left (`--radius-md`), content right
- Height: 96dp total
- No press lift — just background tint on press

**Featured card:**
- Same as search result but image is 4:3 ratio
- "Featured" amber badge top-right of image

**Card divider:** Do not use card grids with gutters smaller than 12dp. On a 4-column grid, cards are full-width (spanning all 4 columns).

---

### Lists & List Rows

Standard list rows are used in: bookings, messages, notifications, settings.

**List row anatomy:**
- Height: minimum 64dp (comfortable thumb target)
- Left: icon or avatar (40dp)
- Center: primary label (15sp/500), secondary label (13sp, muted)
- Right: metadata (13sp, muted) or action icon
- Divider: 1px `--color-border-subtle`, 16dp left inset (aligns with text, not icon)
- Pressed: `--color-bg-overlay` full-row background

**Swipe actions (where applicable):**
- Swipe left on booking: "Cancel" action, `--color-error` background, white text
- Swipe left on saved hostel: "Remove" action, error background
- Swipe left on notification: "Dismiss" action, muted background
- Swipe actions reveal at 72dp; full swipe (>50% of screen width) executes the action
- Action label: 14sp/500, white, centered in the revealed area

---

### Navigation Bar (Bottom Tab Bar)

The primary navigation pattern. Used on all main app sections.

**Structure:**
- 4 items: Search / Saved / Messages / Account
- Height: 56dp + bottom safe area inset
- Background: `--color-bg-tab-bar` with `--shadow-sm` top edge
- Active tab: icon `--color-primary-deep`, label `--color-primary-deep`, 13sp/600
- Inactive tab: icon `--color-text-muted`, label `--color-text-muted`, 13sp/400
- Active indicator: 32dp pill, 4dp height, `--color-primary`, centered above icon
- Tab icons: 24dp Lucide icons
- Unread badge: 18dp circle, `--color-error`, white text, 10sp/600. Positioned top-right of icon.

**Owner navigation (bottom tab bar):**
- 4 items: Overview / Listings / Bookings / Messages
- Same styling as student tab bar

**Do not use:**
- 5-item tab bars (exceeds comfortable thumb spread)
- Tab bars on flow screens (booking, listing creation, onboarding) — these use their own step navigation
- Hamburger menus — secondary navigation lives under the Account tab

---

### App Bar (Top Navigation)

**Standard app bar:**
- Height: 56dp + top safe area inset
- Background: `--color-bg-card`
- Bottom border: 1px `--color-border-subtle` (appears only when content is scrolled beneath it)
- Title: H4 (16sp/600, `--color-text-heading`), centered on iOS, left-aligned on Android
- Leading: back arrow (Android) or back chevron + label (iOS) on inner screens. Hamburger never used.
- Trailing: up to 2 icon actions, 24dp each, 44×44dp tap target

**Transparent app bar (hostel detail, home hero):**
- Overlays the hero image on hostel detail and home screen
- Becomes opaque `--color-bg-card` once user scrolls past hero (200dp threshold)
- Title fades in simultaneously

**Search app bar:**
- Full-width search input replaces title area
- Cancel button right-aligned (text, "Cancel", `--color-text-link`)
- No back arrow — Cancel handles navigation

---

### Empty States

Structure: icon (Lucide Large/XL, `--color-text-muted`) → heading (H3, `--color-text-heading`) → description (Body Default, `--color-text-muted`, max 36ch) → CTA button (full-width or centered).

Center-aligned vertically on the screen when the list is empty. Horizontally centered.

Honest and practical copy. No mascot. No illustration.

Examples:
- No search results: "No hostels match your filters" → "Try removing a filter or nearby area"
- No bookings: "No bookings" → "You haven't booked a hostel yet" → "Search Hostels" (primary button)
- No saved hostels: "Nothing saved" → "Tap the bookmark on any hostel to save it" 
- No messages: "No messages yet" → "Message an owner after viewing a hostel"

---

### Loading States

**Skeleton screens:** Replace content before data loads. Use for: hostel cards, booking list rows, notification rows, profile data.
- Amber shimmer: base `#E8DFCE`, shimmer `#F0E8D8`
- Sweep left-to-right, 1.6s, linear infinite
- Match the exact layout of the real content — same heights, same proportions

**Inline spinner:** 20dp circle, 1.5dp stroke, `--color-primary` active segment. Used inside buttons and loading regions only. Never centered on a full screen.

**Pull-to-refresh:** Standard platform pull-to-refresh indicator. Tinted amber (`--color-primary`) on both platforms. Triggers data reload on all list screens and dashboards.

**Progress bar (multi-step flows):**
- Height: 4dp, `--radius-full`
- Track: `--color-border-subtle`
- Fill: `--color-primary`
- Full-width below app bar on booking and listing creation flows

---

## 6. Screen Layouts

### Splash Screen

Centered HostelLo wordmark (Bricolage Grotesque, 32sp/800) + tagline (DM Sans, 14sp, `--color-text-muted`).
Background: `--color-bg-page`.
No animation sequence. Displays while app hydrates. Maximum 1.5 seconds before home screen loads.

---

### Onboarding Flow (New Student)

Shown on first launch only. 3 screens maximum. No skip button (students need context before searching).

**Screen 1:** Wordmark large, tagline, one-line description, "Get started" (brand amber button, full-width)
**Screen 2:** How HostelLo works — 3 numbered steps. Numbers in Bricolage Grotesque 48sp/800, `--color-primary-faint`. Two lines per step.
**Screen 3:** "Search near your university" — city selector chips (Lahore, Karachi, Islamabad, Peshawar, Faisalabad) + "Continue" button

Progress: 3-dot indicator. Back arrow on screens 2 and 3.

**Onboarding for new hostel owners:**
Full-screen flow triggered after registration if owner has no listings. 5 steps matching the web spec. Progress bar at top. Data auto-saves between steps. Back never clears data.

---

### Authentication Screens

**Login screen:**
- Standard app bar: "Sign in" title, no back button (entry point)
- Form: email input, password input (with show/hide toggle), "Sign in" (full-width primary button)
- "Forgot password?" text link below button, centered
- Divider: "or" with lines either side
- "Create an account" ghost button, full-width
- Logo above form: 28dp height, centered

**Register screen:**
- Same structure as login
- Fields: Full name, email, phone, password
- Role selector: two pill chips — "I'm a student" / "I'm a hostel owner" — above the form
- "Create account" primary button, full-width

**Forgot password:**
- Email input only
- "Send reset link" primary button
- Instructional body text above input: 14sp, `--color-text-muted`

**OTP verification:**
- 6 individual input boxes in a row, each 48×56dp, `--radius-md`, spaced 8dp apart
- Auto-advance on digit entry, auto-backspace on delete
- Resend code: "Resend in 0:45" countdown, switches to "Resend code" link when timer expires
- `keyboardType="number-pad"` for all boxes

**All auth screens:** Full-screen, `--color-bg-page` background. No card treatment on mobile. Form content centered vertically at 45% of screen height. Bottom padding accounts for keyboard.

---

### Home Screen (Student-Facing)

**App bar:** Logo left, city selector chip center, notification bell icon right

**Above fold:**
- Search bar: full-width, 52dp height, search icon left, "Search hostels in Lahore..." placeholder, tapping navigates to search screen with keyboard open
- Below search: "Popular cities" horizontal scroll — chip pills (Lahore · Karachi · Islamabad · Peshawar · Faisalabad)

**Section: Featured hostels**
- "Verified hostels near you" — H3 label, `--color-text-heading`
- Horizontal scroll of featured cards (card width 280dp, visible 1.2 cards to signal scrollability)
- No "View all" button — tapping the section header navigates to search pre-filtered by city

**Section: How it works**
- 3 rows: Find → Contact → Book
- Each row: step number (Bricolage Grotesque, 40sp/800, `--color-primary-faint`) left, 2-line step description right
- No icons, no cards. Numbers are the visual.

**Section: For hostel owners**
- Amber background panel (`--color-primary-faint`), full-width
- Heading: "List your hostel" (H3)
- 2-line description
- "Register as owner" amber brand button, full-width

**Bottom tab bar** present on this screen.

---

### Search / Listing Screen

**App bar:** "Search" title + filter icon button (right, shows active filter count badge)

**Filter chips row:** Horizontal scroll below app bar — City, Gender, Price Range, More Filters. Active filters shown with filled chip style (`--color-primary-faint` background). 52dp scroll area.

**Results header:** "23 hostels in Lahore" — 14sp, `--color-text-muted`

**Results list:** Full-width cards, 12dp vertical gap between cards, 16dp horizontal margin.

**Map toggle:** Floating pill button, bottom-center, above tab bar. "Map" with map icon. Tapping switches to map view.

**Map view:** Full-screen Leaflet map with amber markers. Floating card at bottom showing selected hostel (compact card, dismissible). "List" pill button to return to list view.

**Filter bottom sheet (opens from filter icon or chip tap):**
- Tall sheet (80% height)
- Drag handle at top
- Sections: City (select), Gender (3 radio buttons), Price range (dual-handle slider with PKR inputs), Amenities (checkable list)
- Footer (sticky at bottom of sheet): "Reset" ghost button left, "Apply X filters" primary button right
- Filter count badge on apply button updates live as filters change

**Sort bottom sheet (opens from separate sort option):**
- Short sheet (40% height)
- 5 sort options as radio list: Recommended / Price: Low to High / Price: High to Low / Highest Rated / Newest
- No explicit apply button — tapping an option applies and closes

**Pagination:** "Load more" button at bottom of list. Not infinite scroll. Not numbered pages.

---

### Hostel Detail Screen

**App bar:** Transparent over hero image, back arrow left, share icon + bookmark icon right. Becomes opaque on scroll.

**Image gallery:**
- Full-width swipe gallery, 56vw height, dot indicators at bottom
- Tapping opens fullscreen lightbox with swipe navigation

**Hostel overview (below gallery):**
- Hostel name: H1 (28sp/700 Bricolage Grotesque)
- City badge + verified badge: inline, row
- Rating: star icon + numeric + "(42 reviews)" — all on one line, 14sp
- Price: "PKR 8,500 / month" — 20sp/700, `--color-primary-deep`

**Sticky bottom bar:**
- Height: 72dp + safe area inset
- Background: `--color-bg-card`, `--shadow-lg` top edge
- Left: price repeat (16sp/600, `--color-primary-deep`)
- Right: "Request booking" primary button (lg size)

**Content tabs (below overview):**
- Underline tab style: Details / Rooms / Reviews / Location
- Tab height: 48dp, tab bar full-width, tabs share equal width
- Active: 2dp bottom border `--color-primary`, text `--color-text-heading`/600
- Inactive: `--color-text-muted`/400

**Details tab:** Description (body text, max 200 chars then "Read more"), amenities chips (horizontal scroll), house rules list

**Rooms tab:** List of room types — each as a card row: name, capacity, price, availability badge, "Request" action button

**Reviews tab:**
- Aggregate: large numeric rating (40sp/800) + review count + category bars (cleanliness/location/value/safety)
- Review list: avatar, name, date, rating, text. First 5 shown, "Show more" loads next 5.
- Owner reply: indented below parent review, `--color-bg-raised` background

**Location tab:** Embedded map (Leaflet), full-width, 250dp height, amber marker. Address text below map.

**"Message owner" ghost button:** Appears below tabs content, above sticky bar area.

---

### Booking Flow

**Navigation:** Dedicated stack — removes bottom tab bar. App bar: "Request booking" + step counter (e.g., "Step 1 of 3") + back button.

**Progress bar:** 4dp, full-width, below app bar.

**Step 1 — Review:**
- Compact horizontal hostel card at top
- Selected room, check-in date, check-out date, guest count (each as tappable row that opens picker)
- Price breakdown: each line item, total bold at bottom
- "Continue to payment" primary button, sticky at bottom above safe area

**Step 2 — Payment:**
- Payment method selector: pill chips (Safepay / JazzCash / EasyPaisa)
- Selected method context: "You'll be redirected to Safepay to complete payment."
- Cancellation policy: amber info inline banner above CTA
- "Pay PKR X,XXX" primary button (amount in button label), sticky at bottom

**Step 3 — Confirmation:**
- Centered: checkmark icon (48dp, `--color-action`) + "Booking confirmed" (H1)
- Booking reference: JetBrains Mono, 16sp, `--color-bg-raised` background, `--radius-md`, padding 12dp
- "What happens next" numbered list: 3 items, 14sp
- Two buttons: "View my booking" (primary) + "Message owner" (secondary), stacked, full-width

---

### Student Dashboard

**App bar:** "My account" title + settings icon (right)

**Top section:** Avatar (48dp), name (H3), email (Caption, muted)

**Quick stat row:** 3 tiles: Active bookings / Saved hostels / Unread messages. Each: number (H2, Bricolage) + label (Caption, muted). `--color-bg-card`, `--shadow-xs`, `--radius-md`.

**Section tabs:** My Bookings / Saved / Messages / Alerts — horizontal scroll tab row below stats

**My Bookings tab:**
- Pill tabs: Pending / Confirmed / Completed / Cancelled — horizontal scroll
- Each booking: full-width card with hostel thumbnail (80×80dp), name, dates, total, status badge, action row
- Swipe-left on pending: "Cancel booking"

**Saved tab:**
- Full-width compact cards, 12dp gap
- Swipe-left: "Remove"
- Empty state: "Nothing saved. Tap the bookmark on any hostel."

**Messages tab:**
- Conversation list: rows with hostel thumbnail + name + last message preview + timestamp + unread dot
- Tapping opens full-screen message thread (new screen, app bar "Back" to conversation list)
- Message thread: chronological bubbles. Student right-aligned (amber-light background). Owner left-aligned (`--color-bg-raised`). Input + send at bottom, keyboard-aware.

**Alerts tab:**
- List of active price alerts: hostel name / current vs target price / active toggle / delete
- "Add alert" button at top right

---

### Owner Dashboard

**Tab bar (owner-specific):** Overview / Listings / Bookings / Messages

**Overview screen:**
- App bar: "Overview"
- 2×2 stat tile grid (full-screen width): Listings / Active Bookings / Pending Requests / This Month's Inquiries
- Each tile: label (13sp/400, muted) top, number (28sp/700 Bricolage) below. `--color-bg-card`, `--shadow-xs`, `--radius-md`.
- Zero states: every zero has a 1-line action prompt beneath it. "0 listings — Add your first hostel."
- Recent booking requests: list rows, last 10

**Listings screen:**
- List of hostels: compact card row + status badge + active/suspended toggle + edit icon
- "Add listing" floating action button (FAB): 56dp, `--radius-full`, `--color-primary`, building icon, bottom-right corner, 16dp from edges. Above tab bar.

**Listing creation/edit:** Multi-step full-sheet flow. Steps: Basic Info → Location → Rooms → Photos → Rules → Submit. Progress bar. Auto-saves every 2 seconds after last input.

**Bookings screen:**
- Booking cards (not table — tables don't work on mobile)
- Each card: student name + avatar, hostel name, dates, room, total, status badge, action buttons
- Actions: Confirm (green secondary button) / Decline (red ghost button) / Cancel (ghost)
- Filter chip row at top: All / Pending / Confirmed / Completed
- Pull-to-refresh

**Messages screen:**
- Identical to student messages tab

---

### Admin Panel

**App bar only (no bottom tab bar for admin — rare use case):**
Side drawer navigation instead: hamburger icon top-left opens a slide-in drawer with: Dashboard / Listings / All Bookings / Reviews / Sync Index / Sign out

**Listings screen:**
- Segmented control tabs: Pending / Active / Suspended
- Each listing: name, owner email, city, submitted date, action buttons
- Pending: "Approve" (green ghost) and "Suspend" (red ghost) inline
- Card format, not table — this is a mobile admin tool

---

### Profile / Settings Screen

**App bar:** "Settings" title, no trailing actions

**Sections (vertically stacked, separated by group headers):**

- **Account:** Avatar (tappable to change photo), name, email, phone (with verify inline), bio
- **Preferences:** Dark mode toggle, notification preferences (toggle per type), city default
- **Security:** Change password, active sessions list, sign out of all devices
- **Danger zone:** "Delete account" — red section header, red destructive button. Requires typing "DELETE" to confirm — keyboard input activates confirm button.

**Avatar upload:** Tapping avatar opens action sheet: "Take photo" / "Choose from library" / "Remove photo". Preview immediately on selection.

**Phone verification:** "Verify" link next to phone number → OTP flow inline (sends code, shows 6-digit input below the phone field).

---

### Notification Screen

Accessed via notification bell in app bar or Account tab.

**App bar:** "Notifications" + "Mark all read" text button right

**List:** Full-width notification rows. Unread: `--color-primary-faint` background. Read: `--color-bg-page`. Each row: icon (20dp, semantic color) + title (14sp/600) + description (13sp, muted) + time (12sp, muted). 

Swipe-left: "Dismiss"

Grouped by: Today / Yesterday / Earlier

---

### Error Screens

**404:**
- Centered layout, middle of screen
- "404" — Display size (36sp), `--color-primary-faint` text (muted, not alarming)
- "This page doesn't exist" — H3
- "The hostel or page may have moved or been removed." — Body Default, muted
- "Search hostels" primary button + "Go home" ghost button — stacked, full-width

**500:**
- "Something went wrong" — H2
- "We've been notified. Try again in a moment." — Body Default
- "Reload" primary button, full-width

**No connection:**
- Wifi-off icon (32dp, muted)
- "No connection" — H3
- "Check your internet connection and try again." — Body Default
- "Try again" ghost button

---

## 7. Navigation & Information Architecture

**Navigation type:**
- Students: Bottom tab bar (4 items: Search / Saved / Messages / Account)
- Owners: Bottom tab bar (4 items: Overview / Listings / Bookings / Messages)
- Admin: Slide-in drawer (hamburger top-left)

**Bottom tab items:**

Student:
- Search (search icon)
- Saved (bookmark icon)
- Messages (message-circle icon, unread badge)
- Account (user icon, notification count badge)

Owner:
- Overview (home icon)
- Listings (building icon)
- Bookings (calendar icon, pending count badge)
- Messages (message-circle icon, unread badge)

**Stack navigation:**
- Every inner screen has a back button (left-arrow on Android, chevron-left on iOS)
- Back navigation on Android also responds to hardware/system back gesture
- Tab bar is hidden on: booking flow, listing creation, onboarding, OTP screens, full-screen gallery

**Deep links:** Every major screen must support deep linking. Notification taps navigate directly to the relevant booking, hostel, or message screen.

**Page transitions:**
- Push: new screen slides in from right (both platforms)
- Modal/sheet: slides up from bottom
- Pop: slides out to right
- Tab switch: cross-fade (no slide)

Step-flow screens (booking, listing creation) fade between steps at 150ms. They do not slide — they are not navigation events.

---

## 8. Interaction Design & Motion

**Motion philosophy:** Functional. Every animation conveys state change, confirms an action, or communicates a loading state. Nothing animates for aesthetic reasons alone.

**Durations:**

| Token | Value | Use |
|---|---|---|
| `--transition-fast` | 100ms | Color changes, icon state swaps, border changes |
| `--transition-base` | 150ms | Button press, input focus, checkbox/toggle |
| `--transition-medium` | 200ms | Tab switches, toast appear, badge updates |
| `--transition-enter` | 300ms | Bottom sheets slide in, screen push |
| `--transition-exit` | 200ms | Bottom sheets dismiss, screen pop |
| `--transition-slow` | 350ms | Skeleton screen fade-out |

**Easing curves:**
```
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)      /* Enter, reveal */
--ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0)       /* Exit, hide */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)        /* Move, reorder */
```

No bounce. No spring physics. No elastic overscroll effects layered on top of OS defaults.

**Press feedback:**
- Buttons: `scale(0.97)`, 60ms, snaps back on release
- Cards: `scale(0.98)`, 80ms
- List rows: immediate background tint, no scale
- No ripple effects on iOS. Android: subtle ripple (platform default), tinted `--color-primary-light`

**Gestures used:**
- Swipe left on list items: destructive/action reveal
- Pull-to-refresh on all list screens and dashboards
- Swipe down on bottom sheets: dismiss
- Pinch-to-zoom in image lightbox
- Horizontal swipe in image gallery
- Tap back area (iOS): pop navigation stack

**Micro-interactions:**

- Form submit: button shows spinner left of label. On success, spinner replaced with checkmark for 1.5s then resets.
- Bookmark toggle: icon fills amber at `--transition-base`. On unfavorite, color drains.
- Delete confirmation: button turns `--color-error`, label becomes "Are you sure?" for 3 seconds. Second tap executes. No bottom sheet for low-stakes deletions.
- Notification read: item background fades from `--color-primary-faint` to transparent, 300ms.
- OTP input: auto-advances cursor on digit entry, auto-deletes on backspace.

**`prefers-reduced-motion`:** All transforms disabled. Fades reduced to 80ms. Skeleton shimmer becomes static color.

**Haptic feedback (annotate in specs):**
- `success`: light haptic when booking confirmed, payment successful
- `warning`: medium haptic on destructive actions
- `error`: notification haptic on form validation failure
- `selection`: light haptic on picker selection, radio/checkbox toggle
- iOS: `UIImpactFeedbackGenerator`. Android: `Vibrator` or `HapticFeedbackConstants`.

---

## 9. Forms & Data Entry

**Label position:** Always above the field. 6dp gap. Floating labels: never used.

**Validation timing:** On blur for individual fields. On submit for the full form. Password strength bar shows while typing on registration — not an error state, just a visual indicator.

**Keyboard dismissal:** Tapping outside a focused input dismisses the keyboard. "Done" key on numeric keyboards also dismisses.

**Inline error messages:**
- 4dp below the input
- 13sp/400, `--color-error`, alert-circle icon (14dp) inline before text
- Never blame the user. "Enter a valid email" not "Invalid email". "Phone must start with 03 and be 11 digits."

**Multi-step forms:**
- Progress bar: 4dp height, amber fill, `--radius-full`, full-width
- "Step 2 of 5" caption below bar
- Each step validates independently before Next
- Back button never clears data
- Auto-saves (listing creation only) every 2 seconds after last input. "Saved" indicator with cloud-check icon, 13sp, top-right of screen, fades after 3 seconds.

**Destructive confirmations:**
- Account deletion: type "DELETE" in input to activate confirm button
- Cancel booking: inline confirmation row replaces action row — "Cancel booking?" + reason dropdown (optional) + "Yes, cancel" button + "Keep booking" link
- No bottom sheets or dialogs for low-stakes confirms — use the double-tap pattern

---

## 10. Data Display

**Tables are not used on mobile.** Every data view that would be a table on desktop is rendered as a card-list on mobile: each row becomes a card with the same data organized vertically.

**Booking list card:**
- Hostel thumbnail (60×60dp) + name + dates + total (bold) + status badge + action button row
- Status badge top-right of card

**Stats (owner/admin overview):**
- Label 13sp/400 muted, number 28sp/700 Bricolage Grotesque. Nothing else.
- Zero states always have a 1-line action prompt.

**Review aggregate display:**
- Large numeric (40sp/800) + review count
- Category bars: label left, score right, bar full-width below. Height 6dp, fill `--color-primary`, track `--color-bg-raised`, `--radius-full`.

**Pagination:** "Load more" button at bottom of list. 20 items per page. Not infinite scroll — deliberate.

**Filtering:** Filter chips above the list, not in a modal. Active filters shown as dismissible amber chips. "Clear all" ghost link appears when 2+ filters active.

---

## 11. Accessibility & Inclusive Design

**Color contrast:** WCAG AA minimum on all text. Body text ≥ 4.5:1. Large text (18sp+ or 14sp+ bold) ≥ 3:1.

Key pairs:
- `#4A3C2C` on `#FDF8F0`: ~7.8:1 — passes
- `#F9F5EE` on `#2A6545` (action button): ~7.1:1 — passes
- `#2A2318` on `#C28B1A` (amber button): ~4.8:1 — passes

**Tap target minimum:** 44×44dp on every interactive element. Use transparent hit slop / padding to extend smaller visual elements to the minimum.

**Screen reader support:**
- All icon-only buttons: `accessibilityLabel` describing the action
- Images: `accessibilityLabel` with hostel name (or `accessible={false}` for decorative images)
- Status badges: include in the accessible label of the parent row, not as a separate element
- Loading states: `accessibilityLiveRegion="polite"` on list containers
- Booking confirmation: `accessibilityLiveRegion="assertive"` so screen readers announce it

**Keyboard/hardware navigation (tablet + Bluetooth keyboard users):**
- Tab order follows visual DOM order
- Focus ring: 2dp, 2dp offset, `--color-primary`, `--radius` matches element + 2dp
- Escape closes bottom sheets and lightboxes
- Enter activates focused buttons

**Font scaling:** Support system font scale up to 1.5× without layout breakage. Use `sp` (not `dp`) for all text sizes in Android. Do not override system font scale.

**Right-to-left (RTL):** The primary market is Pakistan (Urdu). The app UI is in English but must be designed with RTL support in mind. Avoid hardcoded left-to-right padding. Use logical properties (`start`/`end`, not `left`/`right`).

---

## 12. Voice & Tone in UI Copy

**Overall tone:** Direct and practical. Not formal, not chirpy. A competent friend — not a customer service script.

**Button labels:** Verb-first. "Submit booking" not "Booking submission". "Delete account" not "Account deletion."

Verbs in use: Search, Book, Request, Confirm, Pay, Cancel, Save, Remove, Send, Upload, Edit, Add, Apply, Reset, Verify, Submit, Sign in, Sign up, Sign out, Continue, Back.

**Error messages:** Never blame. Never be vague.
- "Enter a valid email" ✓
- "Invalid email" ✗
- "Phone number must start with 03 and be 11 digits" ✓
- "Booking couldn't be confirmed. The room may no longer be available." ✓

**Empty state copy:** Honest, brief, actionable. No exclamation points. No "Oops". No "Uh oh". No "It looks like".

**Confirmation copy pattern:**
- Heading: the action. "Cancel your booking?"
- Body: the consequence. "This will cancel your booking for Green Valley Hostel. You won't be charged."
- Confirm: action in red. "Yes, cancel booking."
- Escape: "Keep booking."

**Capitalization:** Sentence case everywhere. "My bookings" not "My Bookings". "Book now" not "Book Now." Exception: "Sign in with Google."

**Overline text:** Uppercase via CSS transform, not typed in caps.

**Copy never uses:** Seamless, Effortless, Powerful, Delightful, Simply, Just, Easy, Unlock, Discover.

---

## 13. Dark Mode Specification

**Activation:** Respects OS `prefers-color-scheme`. User override stored in app settings.

**Surface hierarchy (dark):**
```
Screen background: #1C1710  (oklch 0.14 0.016 65)
Card surface:      #241E14  (oklch 0.18 0.013 65)
Raised/Input:      #2C2519  (oklch 0.21 0.012 65)
Tab bar:           #1A1510  (oklch 0.13 0.014 65)
```

Elevation expressed through surface color only. Shadows minimal, warm-tinted, reduced 40% in opacity.

**No glows.** No colored halos. No glow behind icons or buttons.

**Images in dark mode:** Photos display unchanged. No dimming applied.

**Skeletons in dark mode:** Base `#2C2519`, shimmer `#352D1F`.

**Amber in dark mode:**
- `--color-primary` → `oklch(0.68 0.17 65)` (`#D4A030`) — brighter to maintain contrast
- `--color-action` → `oklch(0.52 0.14 148)` (`#38885E`) — lightened
- `--color-primary-faint` → `oklch(0.20 0.03 65)` (`#2E2416`) — dark amber tint for badge backgrounds

---

## 14. Design Tokens (Mobile-Calibrated Export)

```
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
--color-bg-tab-bar: oklch(0.995 0.003 65);    /* #FEFCF8 */
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

/* === TYPOGRAPHY (mobile sp/pt) === */
--font-heading: 'Bricolage Grotesque', 'Arial Black', system-ui, sans-serif;
--font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Cascadia Code', ui-monospace, monospace;

--text-display: 36sp;
--text-h1: 28sp;
--text-h2: 22sp;
--text-h3: 18sp;
--text-h4: 16sp;
--text-h5: 15sp;
--text-body-lg: 16sp;
--text-body: 14sp;
--text-body-sm: 13sp;
--text-label: 13sp;
--text-caption: 12sp;
--text-overline: 11sp;

/* === SPACING (dp/pt) === */
--space-1: 4dp;
--space-2: 8dp;
--space-3: 12dp;
--space-4: 16dp;
--space-5: 20dp;
--space-6: 24dp;
--space-8: 32dp;
--space-10: 40dp;
--space-12: 48dp;

/* === BORDER RADIUS === */
--radius-sm: 6dp;
--radius-md: 10dp;
--radius-lg: 16dp;
--radius-xl: 24dp;
--radius-full: 9999dp;

/* === SHADOWS === */
--shadow-xs: 0 1dp 2dp oklch(0.18 0.016 65 / 0.06);
--shadow-sm: 0 1dp 4dp oklch(0.18 0.016 65 / 0.08);
--shadow-md: 0 4dp 12dp oklch(0.18 0.016 65 / 0.10);
--shadow-lg: 0 12dp 32dp oklch(0.18 0.016 65 / 0.12);
--shadow-xl: 0 24dp 48dp oklch(0.18 0.016 65 / 0.14);

/* === TRANSITIONS === */
--transition-fast: 100ms;
--transition-base: 150ms;
--transition-medium: 200ms;
--transition-enter: 300ms;
--transition-exit: 200ms;
--transition-slow: 350ms;

--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* === LAYOUT === */
--screen-margin: 16dp;
--tab-bar-height: 56dp;        /* + bottom safe area */
--app-bar-height: 56dp;        /* + top safe area */
--bottom-sheet-radius: 24dp;
--tap-target-min: 44dp;
```

---

## 15. What This Design Must Never Do

1. **Never use an Airbnb visual language.** White cards on white backgrounds, full-bleed photography, coral or blue CTAs. Pakistani students will not trust a Pakistani hostel platform that looks like a vacation rental app from San Francisco.

2. **Never use gradient text.** If a heading needs emphasis, increase weight or size. A gradient on "HostelLo" looks generated, not designed.

3. **Never use glassmorphism.** No `backdrop-filter: blur()` on card backgrounds, no frosted panels. It reads as a trend choice, not a functional one — and degrades on the mid-range Android devices common in this market.

4. **Never place the booking CTA in a modal.** Booking is the primary conversion action. It gets a dedicated screen flow, not a bottom sheet form.

5. **Never show a star row for ratings.** Show one filled star icon + numeric (e.g., "★ 4.3") + review count. Star rows are visual clutter.

6. **Never use WhatsApp green, Pakistan green, or flag-adjacent colors as the brand color.** The amber-gold identity is chosen to break this pattern.

7. **Never animate on screen load.** No staggered card entrances. No fade-in hero text. No welcome choreography. Screens should render instantly and stably.

8. **Never use identical card layouts for all hostel contexts.** Featured cards ≠ search cards ≠ compact saved cards. Same grid width; different information weight.

9. **Never use `#000000` or `#FFFFFF`.** Every dark is warm brown-tinted. Every light is warm amber-tinted.

10. **Never show zero owner stats without a prompt.** "0 bookings" with no guidance is a dead end. Every zero has a one-line action next to it.

11. **Never put primary actions in the top 20% of the screen.** Thumbs reach the bottom. Primary CTAs live in the bottom 40% of every screen.

12. **Never use a hamburger menu for primary navigation.** All primary navigation is in the bottom tab bar. Secondary items belong under the Account tab, not in a hidden drawer.

13. **Never ignore keyboard overlap.** Every screen with an input field must account for the software keyboard. Primary action buttons must stay above the keyboard, not disappear behind it.

14. **Never use horizontal data tables.** On mobile, all tabular data is rendered as a card list. Horizontal-scroll tables are not used anywhere in the mobile app.
