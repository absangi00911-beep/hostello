# HostelLo Unified Discovery And Whole-Web Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`, according to the execution approach approved after plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved unified, photo-led student-hostel discovery experience and carry HostelLo's existing visual language consistently across every web route, without changing unrelated product behavior.

**Architecture:** Keep the Next.js App Router, existing design tokens, Prisma, Typesense, React Query, and role-specific layouts. Add an optional Typesense geopoint to the existing hostel index and a transient, body-based search endpoint for distance ordering; keep the normal search URL and the listing-creation endpoint unchanged. Treat the rest of the redesign as route-family presentation work that reuses current shared layouts and components, preserving each route's existing data, access, actions, and recovery states.

**Tech Stack:** Next.js 16.4, React 19, TypeScript 6, Tailwind CSS 4, Prisma, Typesense JS client 3, Vitest 4, Playwright 1.64.

**Spec:** [HostelLo Unified Discovery Web Redesign](../specs/2026-10-13-hostello-unified-discovery-web-redesign-design.md)

## Global Constraints

- Keep this scope to the Next.js web application; do not redesign `apps/mobile`.
- Retain HostelLo's existing wordmark, primary blue, warm-neutral surfaces, and configured fonts; do not add Airbnb branding or remote font/image dependencies.
- Do not claim campus proximity, walking/transit distance, or total housing cost that the data cannot substantiate.
- Ask for browser location only after an explicit user action; send coordinates only for transient API processing, never in the URL, logs, analytics, or persistent storage.
- Rank matching listings by approximate straight-line distance before pagination; retain listings without valid coordinates after coordinate-bearing results.
- Preserve current role access, routes, API behavior, loading/error/empty states, booking/payment/verification policies, and all unrelated worktree changes.

## Review Focus

- **No geolocation permission or unsupported browser:** manual city/search remains usable and no request is sent. Test in Task 5.
- **Invalid, partial, or boundary coordinates:** only finite, in-range latitude/longitude pairs count as locations; valid zero-valued coordinates remain valid. Test in Task 1.
- **Pagination crossing the located/unlocated boundary:** all located results sort first, with existing sort retained for ties and unlocated results; totals and page boundaries remain correct. Test in Task 3.
- **Location privacy:** coordinates never enter URLs, persistent storage, logs, or analytics, and a reload does not silently restore near-me mode. Test in Tasks 3 and 5.
- **University and city results:** results are described as city-wide unless actual proximity data exists. Test in Task 4.

---

## Task List

### Phase 1: Unified Discovery

### Task 1: Adding validated coordinate handling

**Description:** Define and test which hostel coordinates are valid and how approximate straight-line distance is calculated.

**Files:**
- Create: `src/lib/geo-distance.ts`
- Test: `src/lib/geo-distance.test.ts`

**Interfaces:**
- Produce `isValidCoordinates(latitude: number | null | undefined, longitude: number | null | undefined): boolean`.
- Produce `calculateDistanceMeters(origin, destination): number` using the Haversine formula; throw `RangeError` for invalid coordinate pairs, and validate persisted listing coordinates before calling it.

- [ ] Add tests for missing, partial, non-finite, out-of-range, and valid boundary/zero coordinates.
- [ ] Test a known distance result and verify invalid coordinates cannot be used in distance calculation.
- [ ] Run `npx vitest run src/lib/geo-distance.test.ts`; expect all tests to pass.

**Dependencies:** None.
**Estimated scope:** Small.

### Task 2: Extending the Typesense schema for geo sorting

**Description:** Make valid listing coordinates available to Typesense's distance sort without dropping existing indexed listings.

**Files:**
- Modify: `src/lib/typesense.ts`
- Modify: `src/lib/typesense-sync.ts`
- Modify: `src/lib/typesense-sync.test.ts`
- Create: `src/lib/typesense.test.ts`

- [ ] Test that a new collection defines an optional `location` geopoint and a `hasLocation` boolean.
- [ ] Test that an existing collection receives the fields additively without deletion/recreation.
- [ ] Add `[latitude, longitude]` only for valid coordinate pairs and set `hasLocation` for every indexed document.
- [ ] Test document conversion for missing, partial, and valid coordinates, including zero-valued coordinates.
- [ ] Run `npx vitest run src/lib/typesense.test.ts src/lib/typesense-sync.test.ts`; expect all tests to pass.
- [ ] Verify `npm run typesense:setup` still performs the existing full active-listing sync after schema initialization. Do not run it against production credentials during local implementation.

**Dependencies:** Task 1.
**Estimated scope:** Medium.

### Task 3: Ranking near-me results in the search service and API

**Description:** Add a transient, validated API contract that returns globally distance-ranked, correctly paginated results.

**Files:**
- Modify: `src/lib/hostel-search.ts`
- Modify: `src/lib/hostel-search.test.ts`
- Modify: `src/lib/typesense.ts`
- Create: `src/app/api/hostels/search/route.ts`
- Create: `src/app/api/hostels/search/route.test.ts`

**Interfaces:**
- Extend `SearchParams` with an optional origin `{ latitude: number; longitude: number }`.
- Extend `SearchResult` with an optional per-hostel distance-in-meters map, using `null` for unavailable distances in the HTTP response.
- `POST /api/hostels/search` accepts the existing search filters, pagination, and an optional origin in bounded JSON. Keep `GET /api/hostels` and `POST /api/hostels` unchanged.

- [ ] Add failing tests for Typesense ordering, selected-sort tie breaking, missing-coordinate ordering, totals, and a page that crosses from located to unlocated results.
- [ ] Run `npx vitest run src/lib/hostel-search.test.ts src/app/api/hostels/search/route.test.ts`; expect the new cases to fail before implementation.
- [ ] Test Prisma fallback ranking and pagination across the complete matching set before slicing the requested page.
- [ ] Validate body shape and coordinate ranges; rate-limit the public endpoint; ensure error/operational logs contain no origin coordinates.
- [ ] Return the same listing fields as regular search plus `distanceMeters` for near-me results; return `null` when a matched listing lacks valid coordinates.
- [ ] Implement the service and endpoint, then rerun the focused command; expect all tests to pass.

**Dependencies:** Tasks 1 and 2.
**Estimated scope:** Medium.

### Task 4: Routing destinations through unified search

**Description:** Make city, university, and free-text area/hostel search converge on the existing discovery experience.

**Files:**
- Modify: `src/components/landing/HeroSearch.tsx`
- Modify: `src/components/landing/HeroSearch.test.tsx`
- Modify: `src/app/university/[slug]/page.tsx`
- Modify: `src/app/hostels/in/[city]/page.tsx`
- Modify: `e2e/homepage.spec.ts`

- [ ] Add failing component tests for city selection, university selection, and arbitrary hostel/area text submission.
- [ ] Run `npx vitest run src/components/landing/HeroSearch.test.tsx`; expect the new cases to fail before implementation.
- [ ] Make one keyboard-operable destination search resolve known city and university selections to existing routes; keep arbitrary hostel/area text as a normal search query.
- [ ] Keep university selection honest: it may lead to city-wide listings, but the page title, result label, FAQ, and metadata must not imply campus proximity.
- [ ] Preserve current homepage role-based redirects and keep the existing student search entry point.
- [ ] Add focused component/browser assertions for city and university destination routing and truthful city-wide wording.
- [ ] Implement the destination search and truthful city/university copy, then run `npx vitest run src/components/landing/HeroSearch.test.tsx src/app/page.test.tsx` and `npm run e2e -- e2e/homepage.spec.ts`; expect both commands to pass.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 5: Connecting explicit geolocation to search results

**Description:** Add the user-controlled near-me state and truthful distance labels to the search results.

**Files:**
- Modify: `src/app/hostels/SearchPageClient.tsx`
- Modify: `src/components/hostel/HostelCard.tsx`
- Modify: `src/components/hostel/HostelCard.test.tsx`
- Modify: `e2e/search.spec.ts`

- [ ] Add a browser test that stubs geolocation and verifies no search request is sent before the user activates “Near me”.
- [ ] Verify that the test fails before connecting geolocation to search.
- [ ] Request browser coordinates only after a user activates “Near me”; send them in the Task 3 POST body, never in URL state.
- [ ] Keep near-me state in memory only; do not request location on load, persist coordinates, or restore near-me mode after a reload.
- [ ] While near-me is active, show distance as approximate straight-line distance, put unavailable distances last, and make distance the active sort. On deactivation, restore the user's selected sort.
- [ ] Show explicit, recoverable states for denied permission, unsupported geolocation, and location timeout/error; manual search remains available.
- [ ] Preserve photo-led listing cards, the existing PKR/month price display, and budget, cheapest-first, and map/list controls as optional browse tools.
- [ ] Test that no coordinate is sent before explicit activation and that listing cards show approximate or unavailable distance only in near-me results.
- [ ] Run `npx vitest run src/components/hostel/HostelCard.test.tsx` and `npm run e2e -- e2e/search.spec.ts`; expect both commands to pass.

**Dependencies:** Task 3.
**Estimated scope:** Medium.

### Checkpoint: Discovery
- [ ] Destination search and near-me ordering work end-to-end without changing ordinary search, filtering, or pagination.
- [ ] No campus proximity or route-distance claim is shown without supporting data.

### Phase 2: Student And Operations Workspaces

### Task 6: Clarifying existing booking and payment screens

**Description:** Apply the approved visual language to the existing booking steps while preserving their state transitions.

**Files:**
- Modify: `src/components/booking/BookingSummaryCard.tsx`
- Test: `src/components/booking/BookingSummaryCard.test.tsx`
- Modify: `src/app/booking/[id]/review/page.tsx`
- Modify: `src/app/booking/[id]/payment/page.tsx`
- Modify: `src/app/booking/[id]/confirmation/page.tsx`

- [ ] Align the three existing booking steps around clear status, listed price/total breakdown, and the next existing action; do not add policy, payment, or booking states.
- [ ] Keep pending, failed, cancelled, and successful recovery paths truthful and functional.
- [ ] Assert the existing price/status/next-action content in the summary test and run `npx vitest run src/components/booking/BookingSummaryCard.test.tsx src/app/booking/[id]/review/page.test.tsx`.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 7: Refining the student workspace shell

**Description:** Improve the shared student navigation and overview presentation for all dashboard route families.

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/DashboardTabs.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/dashboard/layout.test.tsx`

- [ ] Apply the shared student hierarchy to dashboard overview, navigation, and content container without changing the role guard or page actions.
- [ ] Check all existing dashboard route families—bookings/reviews, saved listings, messages, notifications, and price alerts—inherit the responsive shell without clipping or inaccessible navigation.
- [ ] Run `npx vitest run src/app/dashboard/layout.test.tsx src/components/layout/WorkspaceMobileNav.test.tsx`; expect role-guard and navigation tests to pass.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 8: Refining owner operations presentation

**Description:** Improve the common owner shell and operations hierarchy without changing owner workflow behavior.

**Files:**
- Modify: `src/components/layout/OwnerLayout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/owner/layout.test.tsx`
- Modify: `e2e/owner-flow.spec.ts`

- [ ] Apply the operations-oriented hierarchy consistently to existing owner dashboard, listings, booking, messaging, review, analytics, earnings, subscription, and settings routes through shared shell/styles.
- [ ] Keep all owner actions, route access, status values, and mobile navigation intact.
- [ ] Run `npx vitest run src/app/owner/layout.test.tsx` and `npm run e2e -- e2e/owner-flow.spec.ts`; expect both commands to pass.

**Dependencies:** Task 7, because both workspace tasks adjust shared route styling.
**Estimated scope:** Medium.

### Task 9: Refining admin review presentation

**Description:** Improve the common admin shell and review hierarchy while keeping decisions and permissions unchanged.

**Files:**
- Modify: `src/components/layout/AdminLayout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/admin/layout.test.tsx`

- [ ] Apply a focused, scannable review hierarchy to all existing admin queues through the shared shell and styles; preserve permissions, queue actions, decision flows, and rejection reasons.
- [ ] Add layout tests for admin navigation, current-route state, and pending-count badges without weakening route access.
- [ ] Run `npx vitest run src/app/admin/layout.test.tsx src/app/owner/layout.test.tsx`; expect both role layout suites to pass.

**Dependencies:** Task 8, because both workspace tasks adjust shared route styling.
**Estimated scope:** Medium.

### Checkpoint: Workspaces
- [ ] Student, owner, and admin layouts preserve role access and existing next actions.
- [ ] Verify representative mobile and desktop workspace screens before moving on.

### Phase 3: Shared Public And Auth Surfaces

### Task 10: Unifying authentication presentation

**Description:** Align the current login, registration, and recovery presentation with the shared web design.

**Files:**
- Modify: `src/components/auth/AuthCardLayout.tsx`
- Modify: `src/components/auth/AuthCardLayout.test.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/RegisterForm.tsx`
- Modify: `src/components/auth/RegisterForm.test.tsx`

- [ ] Align login, registration, and recovery presentations with the approved HostelLo design while preserving the in-progress auth work and all form behavior.
- [ ] Keep validation, error/loading states, modal-vs-page presentation, and role/access redirects unchanged.
- [ ] Run `npx vitest run src/components/auth/AuthCardLayout.test.tsx src/components/auth/RegisterForm.test.tsx` and `npm run e2e -- e2e/auth.spec.ts`; expect both commands to pass.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 11: Applying the public visual system to supporting pages

**Description:** Ensure the shared public layout and navigation carry the design across marketing, support, legal, and account pages.

**Files:**
- Modify: `src/components/layout/PublicLayout.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Navbar.test.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Footer.test.tsx`

- [ ] Check and align the public shell used by marketing, contact/help, legal, report, listing-owner entry, and account pages.
- [ ] Preserve each route's content, localization, validation, and access behavior; improve only shared navigation, page rhythm, and responsive treatment.
- [ ] Run `npx vitest run src/components/Navbar.test.tsx src/components/Footer.test.tsx`; expect both suites to pass.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 12: Verifying the complete web route families

**Description:** Run route-family, role-access, responsive, accessibility, and regression checks after all implementation tasks.

**Files:** No additional source files; run the existing focused suites and browser checks.

- [ ] Run focused Vitest suites from Tasks 1–11, then `npm run typecheck`.
- [ ] Run `npm run e2e -- e2e/homepage.spec.ts e2e/search.spec.ts e2e/booking-flow.spec.ts e2e/owner-flow.spec.ts e2e/auth.spec.ts`.
- [ ] In a real browser, inspect representative public, student, owner, and admin routes at 390px and 1440px; verify keyboard focus, map/list controls, overlays, and reduced-motion behavior.
- [ ] Check every in-scope route family for preserved role access, primary actions, and loading/error/empty states; record any blocked check explicitly rather than claiming it passed.
- [ ] Run `git diff --check` and confirm unrelated worktree changes remain untouched.

**Dependencies:** Tasks 1–11.
**Estimated scope:** Large (verification only).

### Checkpoint: Complete
- [ ] All Task 1–12 acceptance criteria and focused verification pass, or any blocked check is recorded with its reason.
- [ ] The unified search and existing role-based journeys remain functional at desktop and mobile sizes.
- [ ] Confirm the final implementation with the user before integration or release.

## Architecture References

- Typesense geo fields use `[latitude, longitude]`, support distance sorting through `sort_by`, and return `geo_distance_meters`: [Typesense Geosearch](https://typesense.org/docs/30.1/api/geosearch.html).
- Existing Typesense collections can be updated additively: [Typesense Collections](https://typesense.org/docs/30.1/api/collections.html).
- Before implementation, consult the installed Next.js 16.4 guides under `node_modules/next/dist/docs/` for the relevant App Router route-handler and client-interaction patterns, as required by `AGENTS.md`.

## Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing Typesense collections lack the new geopoint fields | Near-me search fails or documents are rejected | Add fields without recreating the collection; run the existing setup script's full active-listing sync after deployment. |
| A requested page straddles the located/unlocated boundary | Missing, duplicated, or misordered results | Test counts and offsets across both Typesense partitions and the Prisma fallback before UI integration. |
| Location leaks through URL or operational telemetry | Privacy violation | Use a bounded JSON POST body, keep coordinates out of route/search state, and assert the request/log shape in tests. |
| Current auth changes are overwritten during visual updates | Regression or lost work | Integrate with the existing auth files and stage/change only files required for each task. |
| The approved mockups imply campus proximity unsupported by data | Misleading housing choice | Preserve city-wide result wording and test university/city headings and metadata. |

## Open Questions

- None. User approved the revised design spec and chose transient API processing for near-me coordinates with distance taking priority over the existing sort.
