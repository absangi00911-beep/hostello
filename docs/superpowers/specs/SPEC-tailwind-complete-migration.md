# Spec: Complete Tailwind CSS Migration

## Intent

Move all app-owned component and page styling from named CSS selectors in
`src/app/globals.css` into Tailwind utility classes at their React elements.
The installed Tailwind v4 foundation is already active. The goal is to make
the app's UI styling understandable and customizable where each component is
rendered, without changing how HostelLo looks or behaves.

## Goals

- Migrate all styled app routes and reusable UI components to Tailwind
  utilities.
- Preserve the current palette, typography, spacing, responsive behavior,
  interactions, accessibility, and reduced-motion behavior.
- Remove migrated component/page selector rules from `globals.css` as each
  slice is completed.
- Keep CSS only for Tailwind imports/theme tokens, genuinely global browser
  defaults, and keyframes that cannot be represented without keyframe CSS.
- Use the already-installed Tailwind v4 and PostCSS configuration; add no
  dependency.

## In Scope

- Shared site/account UI and mobile tab navigation.
- Home/browse and search pages, including shared hostel cards.
- Hostel detail page and its gallery, booking, date, inquiry, host, review,
  amenity, and location sections.
- Student profile, trips, and wishlist pages.
- Login and messaging pages and components.
- Responsive breakpoints, hover/focus/active/disabled states, data/ARIA
  states, and accessibility/reduced-motion variants currently implemented
  in CSS.

## Out of Scope

- Visual redesign, new features, copy changes, and behavior changes.
- Changing the existing color palette or typography.
- Migrating styles owned by third-party packages.
- Reworking business logic or component architecture unrelated to styling.

## Constraints and Decisions

- Use Tailwind utilities directly in the component or page that renders the
  styled element. Follow existing conditional-class patterns where state
  affects appearance.
- Prefer existing semantic color utilities such as `bg-canvas`, `text-ink`,
  `bg-surface`, and `text-muted`.
- Arbitrary values and variants are acceptable for one-off values and
  selectors that Tailwind cannot express through its standard utilities.
- Preserve complex behavior such as carousel sizing, calendar states, map
  artwork, focus indicators, favorite controls, and responsive navigation.
- Preserve the established hostel-card targets (7.15 cards on desktop, 4.15
  on tablet, 2.15 on mobile), brightness-only `brightness(0.90)` image hover
  without zoom, transparent darker favorite control, and consistent desktop
  content gutters across browse and search.
- Keep shared/global defaults in `globals.css`; do not leave page or component
  class selectors there after their migration slice is complete.
- Retain the current uncommitted favorite-button changes in
  `globals.css` when migrating that component: its 7px image inset and
  `brightness(0.95)` appearance are intentional.

## Success Criteria

- All application page and component styling is expressed with Tailwind
  utilities in TSX.
- `globals.css` contains no remaining app component/page selector styling;
  it contains only imports, theme tokens, global/base rules, and necessary
  keyframes.
- Existing interactions and route behavior remain unchanged.
- Existing and added focused tests pass, including mobile/desktop browser
  checks for the migrated routes.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Module Order

Follow [TAILWIND-MIGRATION-MAP.md](../../../TAILWIND-MIGRATION-MAP.md):
the foundation is complete; migrate shared UI first, then discovery,
hostel details, student pages, and account/messaging. Work sequentially
because each slice removes styles from the shared global stylesheet.
