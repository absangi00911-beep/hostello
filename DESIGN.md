# HostelLo — Design System

## Typography

**Display font**: Bricolage Grotesque
- Variable font, all weights
- Used for: h1, h2, h3, hero headlines
- Character: Bold, geometric, modern, slightly playful
- Tracking: -0.04em (h1), -0.032em (h2), -0.025em (h3)

**Body font**: Figtree
- Weights: 300, 400, 500, 600, 700, 800
- Used for: body text, UI labels, form inputs, buttons
- Character: Geometric sans, clean, friendly
- Line-height: 1.65
- Size: 15px base

**Scale**:
- h1: Display-class, major page titles
- h2: Section headers, feature names
- h3: Subsection headers, card titles
- Body: 15px (base)
- Caption: 13px, tracking +0.01em

## Color Palette

### Brand: Electric Green
Primary identity, action-oriented, energetic
- 50: #edfff5
- 100: #d5ffea
- 200: #aeffcf
- 300: #70ffaa
- 400: #00f570
- **500: #00DC62** (primary, most used)
- 600: #00b84f
- 700: #009040
- 800: #007134
- 900: #005C2B
- 950: #002E16

### Neutrals: Light & Warm
Approachable, non-cold grays
- **Text (ink)**: #0A0A0A
- **Text soft (ink-soft)**: #3D3D3D
- **Text muted (ink-muted)**: #6E6E6E
- **Text faint (ink-faint)**: #ADADAD
- **Surface**: #FFFFFF
- **Ground (background)**: #F5F5F5
- **Border**: #E8E8E8
- **Border dark**: #1A1A1A

### Accent: Warm Yellow
Highlights, secondary actions, feedback
- 400: #FFD84D
- **500: #FFC107** (warning, secondary)
- 600: #E5AC00

### Semantic
- **Success**: brand-600 (#00b84f)
- **Warning**: accent-500 (#FFC107)
- **Error**: #EF4444 (or red-500)
- **Info**: brand-500

## Spacing & Layout

**Spatial scale** (8px base):
- xs: 4px (micro spacing)
- sm: 8px (default)
- md: 16px (small sections)
- lg: 24px (section separators)
- xl: 32px (major sections)
- 2xl: 48px (hero, full-width gaps)

**Grid**: 12-column responsive grid
- Mobile (< 640px): 1 column, 16px padding
- Tablet (640–1024px): 2 columns
- Desktop (1024px+): 3–4 columns or full layout
- Max-width: 1280px

## Components & Interaction

### Cards
- Background: surface (#fff)
- Border: 1px solid border (#E8E8E8)
- Radius: 8–12px
- Shadow: card (0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04))
- Shadow on hover: card-hover (0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06))
- Transition: all 200ms ease-smooth
- Padding: 16–20px

### Buttons
- Primary: brand-500 (#00DC62), text ink (#0A0A0A), 600 weight
- Secondary: ink-muted text on ground bg
- Danger: error red, text white
- Disabled: opacity 50%, cursor not-allowed
- Height: 40–44px (touch-friendly)
- Padding: 12px 20px
- Radius: 8px
- Transition: all 150ms ease-smooth

### Forms
- Input height: 40px
- Border: 1px solid border (#E8E8E8)
- Focus ring: 2px brand-500 (brand-500 / 0.1 background)
- Label: ink-muted, 13px, 600 weight, margin-bottom 6px
- Error message: error red, 13px

### Modals & Overlays
- Backdrop: rgba(0, 0, 0, 0.4)
- Content: surface bg, shadow-strong
- Close button: icon, ink-muted → ink on hover
- Padding: 24–32px

## Motion & Animation

**Easing**:
- **smooth**: cubic-bezier(0.4, 0, 0.2, 1) — general purpose
- **spring**: cubic-bezier(0.34, 1.56, 0.64, 1) — playful, delightful

**Duration**:
- Micro: 150ms (button hover, icon change)
- Standard: 200ms (page transition, modal open)
- Slow: 300–400ms (hero animations, large reveals)

**Patterns**:
- Page enters: fade-in + subtle up motion (200ms)
- Buttons: scale 0.98 on press, fade on hover
- Cards: lift on hover (shadow + slight translateY)
- Modals: scale from center + fade (300ms spring)
- Notifications: slide from bottom-right, fade out (200ms)

## Accessibility

- **Contrast**: All text >= 4.5:1 against bg (WCAG AA)
- **Focus**: Visible 2px focus ring on all interactive elements
- **Motion**: Respect prefers-reduced-motion
- **Touch**: Minimum 44px hit target for buttons/links
- **Icons**: All icons paired with text or aria-label
- **Forms**: All inputs have associated labels, error messages linked

## Anti-Patterns to Avoid

❌ Overuse of neon green (causes fatigue)
❌ Serif fonts (wrong for student demographic)
❌ Outdated courier/monospace body text
❌ Animations on page load for every element
❌ Insufficient contrast on muted text
❌ Buttons smaller than 44px height (mobile unfriendly)
❌ Missing form labels (accessibility)
❌ Infinite animations (use sparingly)
