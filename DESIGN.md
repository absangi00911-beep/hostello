---
name: HostelLo
description: A student-first hostel marketplace with a quiet, accessible blue-accented interface.
colors:
  canvas: "#f6f8fb"
  surface: "#ffffff"
  surface-muted: "#f1f5f9"
  ink: "#0f172a"
  muted: "#586579"
  line: "#e2e8f0"
  line-strong: "#cbd5e1"
  brand: "#2563eb"
  brand-dark: "#1d4ed8"
  brand-soft: "#e0e7ff"
  warm: "#f59e0b"
  danger: "#c13515"
  warn-ink: "#583c13"
  warn-soft: "#fbf4e6"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  base: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  xxl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.75rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  status-danger:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
  status-warning:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn-ink}"
    rounded: "{rounded.md}"
---

# Design System: HostelLo

## Overview

**Creative North Star: "Clear, trustworthy student utility."**

HostelLo is a listings-first web marketplace. Its visual character is restrained and scanable: pale blue-gray surroundings, white content surfaces, dark slate text, fine borders, and blue reserved for clear actions and orientation. The interface should feel dependable rather than promotional.

Keep discovery and real listing data at the center. Use typography, spacing, and contrast to establish hierarchy instead of decorative effects or oversized marketing treatments.

**Key Characteristics:**
- Blue is the primary action and focus color.
- White cards and surfaces sit on a pale blue-gray canvas.
- Dark slate text and explicit secondary text keep hierarchy clear.
- Fine borders separate compact operational regions.
- Primary actions use a subtle press and depth treatment; most surfaces remain flat.

## Colors

The palette is cool, neutral, and utility-focused. Blue supplies brand recognition and action emphasis; warm and red tones are reserved for status and warning feedback.

### Primary
- **Action Blue** (`{colors.brand}` — #2563eb): Primary buttons, active controls, links, focus rings, and selected states.
- **Pressed Blue** (`{colors.brand-dark}` — #1d4ed8): Hovered or active blue controls.
- **Blue Tint** (`{colors.brand-soft}` — #e0e7ff): Selected backgrounds and low-emphasis blue state surfaces.

### Secondary
- **Warm Amber** (`{colors.warm}` — #f59e0b): Sparse status accents only.
- **Warning Ink** (`{colors.warn-ink}` — #583c13): Text on warm warning surfaces.
- **Warning Surface** (`{colors.warn-soft}` — #fbf4e6): Informational, pending, or caution panels.
- **Danger** (`{colors.danger}` — #c13515): Validation and destructive-feedback text.

### Neutral
- **Canvas** (`{colors.canvas}` — #f6f8fb): Page background.
- **Surface** (`{colors.surface}` — #ffffff): Cards, dialogs, inputs, headers, and raised content regions.
- **Muted Surface** (`{colors.surface-muted}` — #f1f5f9): Tinted controls and subdued sections.
- **Ink** (`{colors.ink}` — #0f172a): Headings and primary text.
- **Muted Text** (`{colors.muted}` — #586579): Secondary text and metadata.
- **Line** (`{colors.line}` — #e2e8f0): Default borders and dividers.
- **Strong Line** (`{colors.line-strong}` — #cbd5e1): Stronger structural boundaries.

**The Blue Scarcity Rule.** Use brand blue for actions, selection, and focus. Do not turn decorative areas or status text into blue accents.

## Typography

**Display and Heading Font:** Inter, loaded through Next.js font/self-hosting support.
**Body Font:** The system sans-serif stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif).

The type pairing separates task-oriented headings from comfortable interface copy. Inter carries hierarchy and emphasized values; the system stack keeps body controls native and legible across devices.

### Hierarchy
- **Display:** 30–48px responsive, 700 weight, 1.1 line-height, for major page titles.
- **Headline:** 24px, 700 weight, 1.25 line-height, for page and section headings.
- **Title:** 18px, 700 weight, 1.35 line-height, for cards and subsection labels.
- **Body:** 16px, 400 weight, 1.55 line-height, for paragraphs and form copy.
- **Label:** 14px, 600 weight, 1.25 line-height, for buttons and compact controls.
- **Metadata:** 12–14px in `{colors.muted}` for secondary facts and supporting text.

Keep line length near 65–75 characters for paragraphs. Left-align interface copy; avoid centered layouts unless the component is inherently modal or empty-state oriented.

## Layout

The interface uses responsive flex and CSS grid layouts with Tailwind utility spacing. Desktop pages use broad but controlled containers; dense data views preserve stable table or card columns instead of stretching text across the viewport.

The page gutter uses a total 128px desktop allowance, 64px at tablet widths, and 40px on mobile. On compact screens, stack right rails below primary content and keep the main task within a single column.

Use a tight 4px-based rhythm:
- 4px (`xs`) for icon and label gaps.
- 8px (`sm`) for compact controls and row spacing.
- 12px (`md`) for related groups.
- 16px (`base`) for component gutters.
- 24px (`lg`) for card and section separation.
- 32px (`xl`) for major groups.
- 48px (`xxl`) for large page sections.

The browsing and detail surfaces stay listings-first: images, listing facts, and actions remain more prominent than explanatory chrome.

## Elevation & Depth

Depth is structural and restrained. Surfaces are usually flat; tonal color separation and 1px borders carry hierarchy instead of large shadow systems.

Primary blue buttons receive a short soft shadow, a light inset highlight, and a reduced, inset press state. Secondary controls receive a slight inset highlight and a small resting shadow. Both include a visible blue focus ring.

**The State-Depth Rule.** Do not add shadows to static cards solely for decoration. Depth should communicate action, pressed state, or a floating control.

## Shapes

HostelLo uses moderate corners rather than pill-shaped app chrome. Cards commonly use 12px radius, buttons and inputs use 8px radius, and compact icon controls or avatars use full rounding.

Keep borders 1px wide and use `{colors.line}` by default. Interactive form controls use a stronger edge where border contrast is needed. Avoid decorative gradients, hard edges, glass effects, and oversized rounded containers.

## Components

### Buttons
- **Primary:** `{colors.brand}` fill, `{colors.surface}` text, 8px radius, 10–16px vertical/horizontal padding, and the global primary depth treatment.
- **Secondary:** `{colors.surface}` fill, `{colors.ink}` text, 1px `{colors.line-strong}` or project-defined border, 8px radius, and a quiet raised or pressed state.
- **Text and link actions:** No filled surface; use `{colors.brand}` or `{colors.ink}` according to context.
- **Disabled:** Reduced opacity or disabled fill; preserve readable text and clear not-allowed behavior.
- **Focus:** 2–3px blue outline with 2–4px offset.

### Inputs
- White surface, ink text, 8px radius, and 10–12px internal padding.
- Default 1px edge; use the stronger 1.4.11-compatible edge treatment for fields.
- Keep labels adjacent and explicit; do not rely on placeholder text.
- Keep mobile text controls at least 16px to prevent Safari zoom.

### Cards and Containers
- `{colors.surface}` surface, ink text, 12px radius, and 24px internal padding for substantial panels.
- Use `{colors.line}` for 1px borders.
- Mobile listings may become denser and image-led; keep title, price, location, and save action independently scanable.

### Dialogs
- Centered white surface over a dimmed backdrop.
- Keep close controls and keyboard focus discoverable.
- Preserve the page context where the dialog is secondary to the task.
- Use no marketing copy or third-party branding inside HostelLo account flows.

### Status and Feedback
- **Danger:** `{colors.danger}` text on `{colors.warn-soft}` surfaces.
- **Warning:** `{colors.warn-ink}` text on `{colors.warn-soft}` surfaces.
- **Success and selection:** Use `{colors.brand}` or `{colors.brand-soft}` for positive selection states; do not replace all status semantics with a single color.

## Do's and Don'ts

- **Do** use the tokens in [globals.css](/C:/Projects/Personal/hostello/src/app/globals.css) as the source of truth.
- **Do** keep the listings-first, student-oriented hierarchy.
- **Do** preserve accessible contrast, focus states, keyboard operation, and reduced-motion behavior.
- **Do** use Inter for headings and emphasized values where already established.
- **Do** stack dense two-column layouts cleanly on mobile.
- **Do not** introduce third-party marketplace branding, copy, logos, or visual patterns.
- **Do not** replace the palette with red, pink, purple, or pill-heavy Airbnb styling.
- **Do not** add marketing hero sections to core discovery pages.
- **Do not** expose exact student or listing-location data outside approved product flows.
