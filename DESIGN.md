# Hostel Discovery Platform — Design System

## Theme & Scene

Student (18–24) browsing on phone, evening, quiet room or campus café, looking for housing. Needs reassurance + speed. Ambient: calm but alert. Design should feel contemporary & approachable, not institutional or playful-to-the-point-of-distraction.

**Register**: Product (utilitarian marketplace; clarity > delight, though delight is welcome)

## Color Strategy: Committed Minimalism

One strong accent (committed ≤30% of surface), tinted neutrals, semantic colors.

### Core Palette

**Primary Accent: Deep Indigo**
Trust, clarity, modernity—non-threatening authority. Used for CTAs, focus states, links.
- 50: `#f0f4ff`
- 100: `#e0e9ff`
- 200: `#c2d5ff`
- 300: `#a3c1ff`
- **400: `#6b8fff`** (interactive, hover)
- **500: `#4f74e6`** (primary brand, buttons, links)
- 600: `#3959cc`
- 700: `#2e46a3`
- 800: `#1f2f75`

**Neutrals: Warm Grays**
Approachable, not cold. Hint of warmth toward tan.
- **Text (ink)**: `#0d0d0d`
- **Text soft**: `#505050`
- **Text muted**: `#8a8a8a`
- **Surface**: `#ffffff`
- **Ground (bg)**: `#fafaf9`
- **Border**: `#e5e5e4`
- **Border dark**: `#0d0d0d` (sparingly)

**Semantic Colors**
- **Success**: `#22c55e` (emerald-500; booking confirmation)
- **Warning**: `#f59e0b` (amber-500; availability, time-sensitive)
- **Error**: `#ef4444` (red-500; validation, issues)
- **Info**: Primary-500

## Typography

**Display**: Inter Variable (neutral, contemporary, high legibility)
- Used for: h1, page titles, hero headlines
- Weights: 700–800
- Tracking: -0.02em (h1), -0.015em (h2)
- Size scale: 2.5rem (h1) → 2rem (h2) → 1.5rem (h3)

**Body**: Figtree Variable (geometric, friendly, warm)
- Weights: 400, 500, 600, 700
- Used for: body text, labels, form inputs, buttons
- Base size: 16px
- Line-height: 1.6 (body), 1.4 (compact labels)
- Line length cap: 65–70ch (comfortable reading)

**Size Hierarchy**
- Display: 2.5rem (700 weight)
- h1: 2rem (700)
- h2: 1.5rem (600)
- h3: 1.25rem (600)
- Body: 16px (400)
- Label: 14px (500)
- Caption: 12px (400)

## Spacing & Layout

**Scale** (4px base):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

**Grid**
- Mobile (< 640px): 1 column, 16px horizontal padding
- Tablet (640–1024px): 2–3 columns
- Desktop (1024px+): 4 columns, max-width 1280px
- Gutter: 16px

**Layouts to favor**
- Single column on mobile (fast scanning)
- Cards for hostel listings (natural grouping)
- Sticky filters on desktop (discoverability)
- Full-width search bar (prominent)
- No nested containers (clarity)

## Components

### Search Bar
- Height: 48px (mobile-friendly tap)
- Background: surface
- Border: 1px solid border
- Icon: muted text, 20px
- Focus ring: 2px primary-500, inset
- Radius: 12px
- Placeholder: text-muted, no italic

### Listing Card
- Background: surface
- Border: 1px solid border
- Radius: 12px
- Shadow: 0 1px 2px rgba(0,0,0,0.05) (subtle depth)
- Shadow hover: 0 12px 24px rgba(0,0,0,0.12)
- Padding: 12px
- Transition: all 200ms ease
- Image: 160px height, object-fit cover, rounded-t
- Content: 12px padding, gap sm
- Title: h3 (1.25rem, 600 weight)
- Metadata: label-size, text-muted, row with 4px gap
- Price: primary-500, 600 weight, 1.25rem
- Rating: icon + text, 14px, text-soft
- CTA: secondary button, full-width

### Filter Panel
- Mobile: modal, overlay
- Desktop: sticky sidebar, 280px, scrollable
- Background: ground
- Border: 1px solid border
- Padding: 16px
- Section gap: 20px
- Labels: 500 weight, 14px, text-soft, margin-bottom 8px
- Options: checkbox/radio, 40px height each, text-muted
- Apply button: primary, full-width

### Buttons
- Primary: bg primary-500, text surface, 600 weight
- Secondary: bg ground, text ink, border 1px border
- Tertiary: bg transparent, text primary-500, no border
- Height: 44px (mobile touch target)
- Padding: 12px 20px
- Radius: 10px
- Transition: all 150ms ease
- Hover: primary → primary-600, scale 1.02
- Active: scale 0.98
- Disabled: opacity 50%, cursor not-allowed

### Form Input
- Height: 44px
- Border: 1px solid border
- Padding: 12px 16px
- Radius: 10px
- Focus: border primary-500, ring 2px primary-500/10%
- Label: 14px, 500 weight, text-soft, margin-bottom 6px
- Error message: 12px, error-500, margin-top 4px

### Badge
- Background: primary-50
- Text: primary-700
- Padding: 4px 12px
- Radius: 20px
- Font: 12px, 500 weight
- Use for: amenities, availability, ratings

## Motion & Animation

**Easing**
- Standard: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- Swift: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (snappy)

**Duration**
- Fast: 150ms (button hover, icon state)
- Standard: 200ms (page transition, modal open)
- Slow: 300ms (hero animation, expand)

**Patterns**
- Link hover: underline fade-in (150ms)
- Button press: scale 0.98 → 1 (150ms)
- Card hover: translateY -4px, shadow increase (200ms)
- Modal open: scale 0.95→1 + fade (300ms)
- Filter apply: slide-in from left (200ms)
- Loading: subtle pulse on text (infinite, 2s)
- Success toast: slide-in bottom-right (200ms), auto-fade after 4s

## Accessibility

- **Contrast**: All text ≥ 4.5:1 (WCAG AA) against backgrounds
- **Focus**: Visible 2px ring on all interactive elements (no color removal)
- **Motion**: Respect `prefers-reduced-motion` (remove animations, keep states instant)
- **Touch**: 44px minimum height for buttons/links
- **Forms**: All inputs labeled, errors linked, helper text optional but welcome
- **Icons**: Paired with text or `aria-label`
- **Skip link**: Present on desktop (skip to main content)

## Responsive Breakpoints

```
Mobile: 320px–639px
Tablet: 640px–1023px
Desktop: 1024px+
```

Mobile-first: design for 375px viewport first, scale up.

## Anti-Patterns to Avoid

❌ Overusing primary accent (limit to 15–20% of surface)
❌ Text < 14px on mobile (legibility suffers)
❌ Animations that loop infinitely on page load
❌ Cards nested inside cards
❌ Buttons < 44px (mobile unfriendly)
❌ Images without alt text
❌ Form labels hidden in placeholders
❌ Modals without close button (mobile friction)
❌ Infinite scroll without clear pagination hint
❌ Hero images that push content off-screen on mobile
