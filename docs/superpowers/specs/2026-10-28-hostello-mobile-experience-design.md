# Hostello Mobile Experience Design

## Context and intent

Improve Hostello's student-facing mobile experience using the user-provided
Airbnb mobile homepage as a composition reference, not as a source of branding,
copy, or listing facts. The user wants to refine the mobile experience while
keeping the existing desktop product intact.

This is an implementation slice of the existing `web-foundation` and
`student-marketplace` capabilities in [the capability map](../../../HOSTELLO-CAPABILITY-MAP.md).
It does not add or rename capability IDs.

## Goals

- Give the mobile Explore page a compact search entry point, horizontally
  scrollable category filters, city-grouped horizontal listing rows, and a
  persistent student tab bar.
- Make the mobile Explore search pill the first app element; move “Become a
  host” from the Explore header to the Profile page.
- Add basic Wishlist, Trips, and Profile pages that use existing authenticated
  APIs and present useful loading, empty, and error states.
- Keep the five-item mobile navigation consistent across student pages:
  Explore, Wishlists, Trips, Messages, and Profile.
- Preserve current search and filter meanings, hostel pricing and listing
  details, authorization, APIs, and database behavior.
- Keep desktop layouts and navigation unchanged.

## Non-goals

- Reworking desktop pages or owner/admin navigation.
- Changing search filters, API contracts, database schema, authentication, or
  booking/favorite persistence.
- Adding nightly pricing, guest-favorite labels, or other unsupported listing
  claims.
- Adding booking cancellation, profile editing, or new account settings.
- Copying Airbnb branding, proprietary text, or imagery.

## Scope and behavior

### Mobile Explore

- At mobile widths, replace the expanded search form's visual footprint with a
  compact search pill as the first app element on Explore. Do not show the
  existing Hostello brand/“Become a host”/account header row on this mobile
  surface. Tapping the pill opens the existing destination, date, and guest
  inputs in a full-screen search surface; submitting preserves their current
  `/search` behavior.
- Present the existing `all`, `women`, `top-rated`, and `budget` filters as
  horizontally scrollable pill-style controls below search. Their labels and
  filtering semantics do not change.
- Retain city-grouped listings. Each row is a horizontal carousel with a
  prominent photo card and a partial next-card preview where there are more
  listings. Cards continue to use Hostello's existing hostel image, name,
  location, monthly price, and rating data.
- Add a save/unsave heart over each mobile listing photo. It toggles through
  the existing `POST`/`DELETE /api/hostels/[param]/favorite` endpoints, reflects
  the server-confirmed saved state, prevents duplicate submission while the
  action is pending, and announces success or failure accessibly. Reuse the
  existing signed-out save prompt and sign-in dialog pattern. Do not add a new
  API or persistence path.
- Do not add unsupported badges or nightly prices.
- Move the “Become a host” link from the mobile Explore header to the Profile
  page. This is a navigation link only; it does not add profile editing or
  owner-management behavior.
- Reserve enough bottom space that the fixed tab bar never obscures the last
  listing or focused controls.

### Student pages

- **Wishlists:** show the signed-in student's active saved hostels using
  `GET /api/favorites`. The page is a read-only list; cards link to the existing
  hostel detail route. Show an empty state when there are no active favorites.
- **Trips:** show the signed-in student's booking history using
  `GET /api/bookings`. Display the hostel identity, city, stay dates when
  available, and booking status. Do not add booking mutations or imply a
  booking is confirmed when its returned status says otherwise.
- **Profile:** show a compact read-only summary using `GET /api/profile`:
  avatar, display name, city when present, member-since date, and available
  booking/favorite/review counts. Do not expose edit controls, email, or phone
  in this initial mobile profile surface. Include the “Become a host” entry
  point here.
- Requests must render explicit loading, empty, and error states. API failures
  must not be presented as empty success states.

### Navigation and access

- On student-facing mobile pages, show a fixed bottom navigation with Explore,
  Wishlists, Trips, Messages, and Profile. Each item has a text label, an
  accessible name, a visible active state, and a touch target suitable for
  mobile use. Use semantic links and `aria-current="page"` for the active
  route, for example:

  ```tsx
  <Link href="/trips" aria-current={active ? "page" : undefined}>
    <TripsIcon aria-hidden="true" />
    <span>Trips</span>
  </Link>
  ```
- The tabs link to `/`, `/wishlists`, `/trips`, `/messages`, and `/profile`,
  respectively.

- The Messages item links to the existing messages page; this work does not
  redesign messaging.
- Anonymous users who visit student-only pages are sent through the existing
  login flow and returned to their intended page after signing in. Student
  pages remain server-guarded; hiding navigation is not authorization.
- Do not replace owner/admin navigation with student tabs.

## Responsive and visual constraints

- Apply the new Explore composition and bottom navigation only at mobile
  widths. Preserve the existing desktop composition and controls.
- On mobile Explore, the search pill precedes category filters and listings;
  the normal brand/host/account header is omitted from this surface.
- Use Hostello's existing colors, typography, spacing conventions, and icon
  dependencies. Do not add a design or icon package.
- Support narrow screens down to 320 CSS pixels without horizontal page
  overflow. Horizontal scrolling is limited to filter controls and listing
  rows.
- Respect safe-area insets, keyboard focus visibility, semantic headings,
  reduced-motion preferences, and useful image alternatives.
- Reference imagery guides layout and hierarchy only; Hostello content and
  product semantics remain authoritative.

## Existing interfaces and constraints

- Use `GET /api/favorites`, `GET /api/bookings`, and `GET /api/profile` without
  changing their contracts.
- Reuse existing favorite mutations only where a favorite control is shown.
- The save-heart state is based on server-confirmed data; failures retain the
  prior state and display the existing sign-in prompt or an explicit error.
- Use existing auth and page-role guards. Wishlist, Trips, and Profile are
  student-only surfaces.
- No migration, dependency addition, new API route, or database change is
  included.
- Before writing Next.js application code, read the applicable Next.js 16.4
  guides under `node_modules/next/dist/docs/`.

## Project structure

- `src/components/home/` — mobile Explore composition and responsive listing
  presentation, reusing current browse components where practical.
- `src/app/` — student Wishlist, Trips, and Profile routes and shared mobile
  navigation integration.
- `src/app/globals.css` — mobile-only layout and navigation styles, keeping
  desktop rules intact.
- Existing Vitest component tests and Playwright E2E tests — focused behavior
  and responsive checks; do not create a parallel test setup.

## Code style

Follow current TypeScript, React, Next.js, and component conventions in the
repository. Prefer semantic links and buttons, typed API response data, and
existing loading/error patterns. Icons are decorative when their adjacent text
already names the action; active navigation is communicated beyond color alone.

## Testing strategy

- Component tests cover active tab semantics, category filters, API loading,
  empty, and error states, and truthful booking/listing content.
- Browser tests cover student navigation and direct route access, plus mobile
  layout at 320px and 375px. Confirm desktop remains unchanged at 1024px and
  1440px.
- Verify no horizontal page overflow and that the bottom bar does not cover
  content or focused controls.
- Use the repository's existing commands:
  - `npm run test -- --run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run e2e -- --project=chromium`

## Boundaries

- **Always:** Preserve current search/filter semantics, server-side role
  authorization, accurate hostel and booking data, visible focus, and explicit
  request errors.
- **Ask first:** Any database or API contract change, dependency addition,
  desktop redesign, or change to booking/favorite rules.
- **Never:** Fabricate listing facts or booking success, expose another user's
  data, or remove/skip existing tests to make checks pass.

## Success criteria

- Mobile Explore has the compact search entry, existing category filters,
  city-based horizontal listing rows with working save hearts, and an
  unobstructed five-item tab bar. Search leads the page, and the host entry is
  on Profile rather than in the Explore header.
- The tab bar appears consistently and marks the correct active page across
  Explore, Wishlists, Trips, Messages, and Profile.
- Wishlist, Trips, and Profile show data only for the signed-in student and
  render loading, empty, and failure states correctly.
- Anonymous and wrong-role access follows existing server-side page guards.
- Search and filter behavior is unchanged; desktop layout and navigation show
  no regression.
- The tested mobile and desktop widths have no horizontal page overflow.

## Open questions

None at the time of writing. Remaining layout details not affecting product
behavior, such as exact icon choice and spacing values, are implementation
decisions constrained by the existing Hostello design language.
