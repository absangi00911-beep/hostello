# HostelLo Unified Discovery Web Redesign

**Date:** 2026-10-16  
**Status:** Draft for approval

## Intent

Redesign the Next.js website so students can find and compare affordable
monthly hostel stays across Pakistan, while owners and admins can complete
their existing work with less friction. The selected direction blends a warm,
photo-led neighborhood marketplace with confident campus energy: human
typography and neutral surfaces, balanced with crisp blue/green accents and
small saffron highlights.

Use one search-and-browse journey for city, university, or area, with real
listing photos and listed monthly PKR rent. Keep language natural and specific
to Pakistan, and describe only capabilities, trust signals, and listing data
that actually exist. Public discovery, student accounts, owner operations, and
admin review should feel like one product without forcing them into one
generic shell.

## Goals

- Give public/student discovery one unified search-and-browse entry point for
  city, university, or area.
- Make actual listing photos, the listed monthly price in PKR, location, and
  existing verification/review details easy to compare.
- Add optional "near me" discovery using browser geolocation only after an
  explicit user action, with clear permission-denied and unavailable states.
- Carry a consistent, restrained marketplace visual language through booking,
  student account, owner, admin, authentication, and supporting web pages.
- Make owner and admin workspaces practical to scan, with the next existing
  action easy to find.
- Give public routes a clear navigation and useful, route-aware footer;
  maintain distinct student, owner, and admin navigation for signed-in routes.
- Improve mobile and desktop legibility, navigation, and responsive behavior
  without changing the underlying booking or operations flows.
- Use purposeful motion for feedback and orientation, with accessible
  reduced-motion behavior and no scroll hijacking.
- Compare the existing component stack with suitable alternatives in a
  throwaway UI-library spike before deciding whether any new dependency is
  justified.

## Non-goals and anti-goals

- Do not redesign `apps/mobile`; this scope is the Next.js web application.
- Do not claim campus-to-hostel distance, walk/transit estimates, or campus
  proximity without reliable campus and hostel location data.
- Do not add a routing-service integration, or change booking/payment/
  verification policies, user roles, or business calculations.
- Do not fabricate listing details, trust claims, ratings, savings, total
  housing costs, or commute times.
- Do not copy Airbnb's name, wordmark, proprietary fonts, imagery, or exact
  brand treatment. Borrow category-level patterns, not another company's
  identity.
- Do not overwrite or revert pre-existing worktree changes. In particular,
  integrate with the current authentication and intercepted-route work in
  `src/app/layout.tsx`, `src/app/login`, `src/app/register`,
  `src/app/@auth`, and `src/components/auth`.

## Current product constraints

- University records currently provide a name, short name, city, and optional
  area in `packages/shared/src/constants/universities.ts`; they do not identify
  a precise campus location or carry coordinates.
- The university landing page currently selects active hostel listings by
  city. It does not establish proximity to that university.
- Hostel records provide city/area and may provide their own latitude and
  longitude. Existing maps may continue to show available listing locations,
  but must not imply a campus distance.
- Current listing and result data exposes `pricePerMonth`; it does not establish
  that utilities, food, deposits, or other charges are included. Present it as
  the listed monthly rent, and do not call it an all-in total.
- Current listing/trust data includes a `verified` boolean, review rating and
  count, optional safety score, owner/listing details, room availability, and
  whether a map location is present. Use the available field and its real state;
  do not turn a badge, score, or availability value into a safety, quality, or
  booking guarantee.
- Existing `GET /api/hostels` search supports query, city, gender, rent,
  amenities, verification, sorting, and pagination through Typesense with a
  Prisma fallback. It does not currently accept an origin or rank by distance.
  The near-me flow therefore requires the separately scoped transient search
  endpoint and ranking work described above.
- Hostel coordinates are optional. "Near me" can order coordinate-bearing
  listings by approximate straight-line distance, but cannot truthfully report
  distance for listings without coordinates or walking/transit travel time
  without a routing service.
- Existing routes, actions, loading/error/empty states, and API contracts remain
  authoritative except for the explicitly scoped, transient location input and
  distance ordering required by "near me". Where a proposed screen suggests a
  capability not already present, retain only the visual treatment for existing
  data and actions.

## Design decisions

### Brand and visual language

- Use one unified search-and-browse flow rather than five separate discovery
  tiles. Search can start from a city, university, or area and should connect
  to existing search, university, and city results.
- Use a clear search-and-browse marketplace pattern: city/university/area
  search, optional refinements, photo-led listing cards, and a direct
  transition from browsing to details. Keep HostelLo branding, student-focused
  copy, and local monthly PKR prices.
- Carry the user's selected blend: warm and welcoming at the base, with
  energetic headlines and focused blue/green/saffron accents. Retain and
  refine existing brand tokens rather than introducing a competing visual
  identity.
- Use the configured font families and prioritize readable, human typography.
  Copy should sound like a helpful local housing service, use familiar
  Pakistan-specific context where it is accurate, and avoid exaggerated
  superlatives, urgency, or unsupported promises.
- Use existing listing photography where available and clear fallbacks when
  it is not. Do not add remote font or image dependencies for the redesign.
- Keep listing imagery prominent. Cards should prioritize real available
  photos, followed by name, city/area, listed monthly rent, and existing
  applicable status/review details. Fallbacks must remain clear when media is
  absent.
- Use modest, consistent radii and mostly flat surfaces; reserve shadows for
  genuinely floating or interactive elements. Maintain visible keyboard focus,
  reduced-motion support, readable contrast, and comfortable touch targets.

### Homepage, navigation, and route shells

- Structure the public homepage around: a clear search-led hero; truthful
  trust/detail signals; a concise problem-to-solution story; city and listing
  discovery; existing student/owner next steps; and a helpful footer.
- Keep the hero's destination search and primary action visible early. Use
  actual listing photography when available, and make location, listed monthly
  rent, and the next step easy to understand without claiming guaranteed
  availability or outcomes.
- The trust section may explain listing review/verification status, monthly
  rent display, and the existing booking/message flow. Do not imply that
  HostelLo guarantees safety, quality, occupancy, or complete verification
  beyond the current process.
- Keep problem/solution copy grounded in the actual product: compare
  available listing details and request bookings in one place. Do not invent
  user research, savings, success rates, or market-wide claims.
- Public navigation should make discovery, owner onboarding, help, and account
  entry clear. The footer should group real explore, owner, support, and legal
  routes; adapt links to the signed-in role without duplicating workspace
  navigation.
- Preserve dedicated navigation patterns for student account pages, owner
  tools, and admin operations. Use consistent tokens and interaction patterns,
  but keep task context, permissions, and mobile navigation appropriate to
  each role.
- Apply the system across every existing Next.js UI route, including public
  marketing/discovery, hostel details, authentication and recovery, booking,
  payments/reviews, student account, owner workspace, admin operations, and
  help/legal/support pages. Do not redesign `apps/mobile`.

### Motion and UI library evaluation

- Use motion to clarify state changes, draw attention to the search/action
  hierarchy, and provide restrained section entrance or feedback. Keep
  interactions usable without animation; respect `prefers-reduced-motion`,
  avoid scroll hijacking, and do not make route changes or form submission
  depend on animation completion.
- Start from the installed Tailwind CSS, shadcn-configured Radix primitives,
  Lucide icons, and Framer Motion. Build a small, isolated comparison of this
  stack with at least one alternative component library on representative
  navigation, form/dialog, and owner/admin data-table patterns.
- Compare accessibility/keyboard behavior, visual fit, theming effort,
  App Router/server-component compatibility, bundle cost, and fit for both
  marketplace and operations pages. A prototype is not permission to add a
  second UI library to the production app: document the result and keep the
  installed stack unless a specific gap justifies a dependency change and the
  user approves it.

### Student discovery and booking

- University pages may identify the selected university and city and show
  city-wide listings. Copy must not imply that listings are close to that
  university without actual proximity data.
- Keep budget limits, cheapest-first sorting, and the existing map/list view as
  optional controls in the browse experience, not as competing homepage modes.
- Add an optional "near me" control. Request browser location only in response
  to an explicit user action, explain why it is needed, and provide a manual
  city/search path if permission is denied, unsupported, or unavailable.
- For "near me", send coordinates to the search API only for transient
  processing needed to rank all matching listings before pagination. Do not
  place coordinates in the URL, persist them, or include them in application
  logs or analytics. Distance takes priority over the selected sort while
  "near me" is active. Rank listings with valid coordinates by approximate
  straight-line distance; treat missing, non-finite, or out-of-range
  coordinates as unavailable and place those listings after coordinate-bearing
  results, preserving their existing sort order. Do not present this as walking
  or transit distance, silently drop otherwise matching listings, or persist
  the user's location. Label unavailable distances accordingly.
- Keep map/directions behavior within available data. Existing listing map
  pins may continue to use listing coordinates. Do not create a campus pin or
  a campus-to-hostel distance estimate from a university name or area alone.
  External map directions may be offered only when an appropriate destination
  is available; do not present route time as app-verified.
- Keep current search, filters, URL state, list/map controls, favorites,
  listing details, booking, payments, account pages, messages, notifications,
  verification, and review actions. Restyle and improve their information
  hierarchy without changing their behavior.
- Continue to use the current PKR/month formatter and real listing data. Do not
  imply that monthly rent includes unrecorded expenses.

### Owner workspace

- Retain the existing owner route structure and actions for dashboard,
  listings, create/edit, bookings, messages, reviews, analytics, subscription,
  earnings, and settings.
- Use an operations-oriented layout: clear page title and context, legible
  statuses, compact lists where appropriate, and emphasis on existing
  actionable work rather than marketplace decoration.
- Where relevant, make listing location and monthly-rent details easier to
  review, but do not require new listing fields or alter owner onboarding.

### Admin workspace

- Retain current admin routes, permissions, queues, review drawers, decision
  flows, and rejection reasons.
- Prefer a focused, scannable operations layout with clear existing review
  states and actions. Keep verified/unverified claims tied to actual system
  state; do not introduce new moderation rules.

### Other web surfaces

- Apply the shared visual system to current public marketing/support pages,
  authentication and account recovery, booking/payment/review steps, student
  dashboards, and shared navigation/components.
- Preserve their existing content, localization, validation, and role/access
  behavior unless an existing presentation defect requires a directly related
  adjustment.
- Integrate with in-progress auth changes rather than overwriting or reverting
  them.

## Scope

All existing Next.js web routes and shared UI in `src/app` and
`src/components`, including:

- Public home, about/contact/help, hostel search, city and university results,
  listing details, and owner onboarding/listing entry.
- Login, registration/signup, intercepted auth modals, email verification,
  password recovery, and reset flows.
- Booking confirmation, payment, and review journeys.
- Student dashboard, bookings/reviews, saved hostels, alerts, messages,
  notifications, and profile/settings.
- Owner dashboard, analytics, listings/create/edit, bookings, earnings,
  messages, reviews, subscription, and settings.
- Admin dashboard, listing and verification queues, verification analytics,
  bookings, payments, payouts, reviews, roommate reports, and search sync.
- Legal, privacy, terms, reporting, support, and all shared navigation,
  footer, form, modal, and responsive-shell components used by those routes.

Shared tokens, primitives, navigation, and responsive shells are in scope
where needed for cross-route consistency. Preserve the active auth changes
listed above and integrate their surfaces into the new visual system.

Explicitly excluded: `apps/mobile`, Prisma schema and migrations, third-party
routing integrations, and any new product capability other than the optional,
client-permission-based "near me" ordering described above. Search API changes
strictly necessary to apply distance ordering before pagination are in scope.

## Success criteria

- Every in-scope web route retains its current role access, data source,
  actions, and recovery states.
- Public discovery reads as an affordable student-hostel marketplace for
  Pakistan, with one unified search, actual listing imagery, and listed monthly
  PKR rent prominent.
- A university-to-city result page does not suggest campus proximity or
  measured commute time that the data cannot substantiate.
- "Near me" asks for location only on explicit user action, does not persist
  coordinates, handles denial/unavailability with a manual-search route, and
  labels distance as approximate straight-line distance.
- Owner/admin pages remain operational and more scannable, rather than being
  converted into public-marketplace layouts.
- No Airbnb marks or proprietary assets are introduced; HostelLo's own brand
  remains intact.
- Every route family in scope is checked for preserved access and primary
  actions. Desktop and mobile layouts are checked on representative public,
  student, owner, and admin screens; changed shared components and relevant
  existing tests pass.
- Existing unrelated worktree changes remain intact.

## Left to the implementer

- Audit the current route groups and reuse existing components/tokens before
  changing page-specific markup.
- Implement in small, verifiable batches, preserving server/client boundaries,
  SEO, URL state, and accessibility.
- Consult the installed Next.js 16.4 documentation under
  `node_modules/next/dist/docs/` before changing framework-specific code.
- Identify concrete layout, contrast, focus, and responsive issues during
  implementation and fix only those within the agreed scope.
- Record any feature or data limitation that prevents a mockup detail from
  being represented truthfully; do not silently invent a workaround.
