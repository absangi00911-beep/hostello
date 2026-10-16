# HostelLo Whole-Web UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every Next.js website route around a warm, Pakistan-specific hostel marketplace, preserve role workflows, and add privacy-safe near-me discovery.

**Architecture:** Keep the Next.js App Router and existing Tailwind/Radix/Lucide/Framer Motion stack as the default. Refine the shared design tokens and public/student/owner/admin shells, then apply them in route-family slices. Implement near-me as an optional end-to-end search capability with validated coordinates and transient server-side distance ranking; leave ordinary search and booking behavior unchanged.

**Tech Stack:** Next.js 16.4, React 19, TypeScript 6, Tailwind CSS 4, Radix UI, Lucide, Framer Motion, Prisma, Typesense JS client 3, Vitest 4, Playwright 1.64.

**Spec:** [HostelLo Unified Discovery Web Redesign](../specs/2026-10-13-hostello-unified-discovery-web-redesign-design.md)

## Global Constraints

- Keep scope to the Next.js website; do not redesign `apps/mobile`.
- Use HostelLo's existing wordmark, configured fonts, and refined existing brand tokens; do not add remote font or image dependencies.
- Use natural, human typography and Pakistan-specific wording where accurate; avoid exaggerated claims, urgency, and unsupported promises.
- Present rent as listed monthly rent in PKR; do not imply utilities, food, deposits, or other charges are included unless data says so.
- Show only real listing/trust data; do not turn verification, rating, safety score, or availability into a guarantee.
- Ask for browser location only after an explicit user action. Never put coordinates in a URL, persistent storage, logs, or analytics.
- Near-me ordering is approximate straight-line distance, must happen before pagination, and must retain listings without valid coordinates after located listings.
- Preserve existing route access, roles, actions, search filters, booking/payment/verification policies, and loading/error/empty states.
- Preserve existing uncommitted auth and other worktree changes; integrate with them rather than replacing them.
- Respect visible keyboard focus, touch targets, and `prefers-reduced-motion`; do not hijack scrolling or make actions depend on animation.
- Do not add a production UI-library dependency without documenting a concrete gap and getting user approval.
- After each task's focused checks pass, commit only that task's tracked source/test files; never stage pre-existing unrelated changes.
- Before changing Next.js framework behavior, read the relevant installed guide under `node_modules/next/dist/docs/`.
- Every commit must include `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.

## Review Focus

- **Denied, unsupported, or timed-out geolocation:** manual search remains available and no location request happens until “Near me” is activated. Test in Task 6.
- **Missing, partial, non-finite, out-of-range, and zero-valued coordinates:** only valid pairs rank by distance; missing-distance listings remain in the result set. Test in Tasks 2–4.
- **A page crossing from located to unlocated results:** totals and offsets remain correct, located listings sort first, and existing sort order remains stable for ties/unlocated listings. Test in Task 4.
- **Auth modal/direct-route and callback behavior:** direct login/register URLs, intercepted modal routes, role redirects, validation, and recovery states still work. Test in Task 12.
- **Mobile, keyboard, and reduced-motion use across shared shells:** navigation remains reachable and legible without animation or horizontal clipping. Test in Task 14.

---

## Task List

### Phase 1: UI Foundation and Discovery

### Task 1: Comparing the UI-library options

**Description:** Run the requested bounded library comparison before choosing the production component foundation.

**Files:**
- Create: `.superpowers/hostello-ui-library-spike/package.json`
- Create: `.superpowers/hostello-ui-library-spike/src/main.tsx`
- Create: `.superpowers/hostello-ui-library-spike/src/styles.css`
- Create: `.superpowers/hostello-ui-library-spike/index.html`

**Interfaces:**
- Compare the current Tailwind + shadcn-configured Radix primitives against Mantine using equivalent navigation, form/dialog, and data-table examples.
- Keep all spike dependencies and code isolated under ignored `.superpowers/`; do not import the spike into `src/`.

- [ ] Create a minimal scratch manifest and component gallery for the current stack and Mantine; keep production manifests untouched.
- [ ] Run both options in a local browser at desktop and mobile widths and compare keyboard operation, accessible names/focus, theming effort, visual fit, App Router/server-component fit, and production bundle implications.
- [ ] Record the comparison and a concrete recommendation in the existing spec or plan notes; retain the current stack unless an alternative clearly solves a demonstrated gap.
- [ ] If a production dependency change appears justified, stop for user approval before changing the root package manifest.

**Dependencies:** None.
**Estimated scope:** Small.

### Task 2: Defining coordinate validation and distance helpers

**Description:** Establish the coordinate contract used by the search index, server ranking, and UI.

**Files:**
- Create: `src/lib/geo-distance.ts`
- Test: `src/lib/geo-distance.test.ts`

**Interfaces:**
- Export `Coordinates` as `{ latitude: number; longitude: number }`.
- Export `isValidCoordinates(latitude: number | null | undefined, longitude: number | null | undefined): boolean`.
- Export `calculateDistanceMeters(origin: Coordinates, destination: Coordinates): number`; throw `RangeError` for invalid pairs.
- Valid ranges are latitude `-90..90` and longitude `-180..180`, inclusive.

- [ ] Test missing, partial, `NaN`, infinite, out-of-range, valid boundary, and zero-valued coordinate pairs.
- [ ] Test a known Haversine distance within a documented tolerance and assert invalid pairs throw `RangeError`.
- [ ] Run `npx vitest run src/lib/geo-distance.test.ts`; confirm the new tests fail before implementation.
- [ ] Implement the helpers and rerun the focused test; confirm all cases pass.
- [ ] Commit the helper and test after verification, with the required co-author trailer.

**Dependencies:** None.
**Estimated scope:** Small.

### Task 3: Indexing optional hostel coordinates in Typesense

**Description:** Make valid listing coordinates available for distance sorting without dropping existing index records.

**Files:**
- Modify: `src/lib/typesense.ts`
- Modify: `src/lib/typesense-sync.ts`
- Modify: `src/lib/typesense-sync.test.ts`
- Create: `src/lib/typesense.test.ts`

**Interfaces:**
- Persist a Typesense geopoint in `[latitude, longitude]` order only when both coordinates pass `isValidCoordinates`.
- Keep coordinate fields optional so listings without map locations remain indexable.

- [ ] Add failing tests for new-collection schema, additive updates to existing collections, and document conversion with absent, partial, valid, and zero-valued coordinates.
- [ ] Run `npx vitest run src/lib/typesense.test.ts src/lib/typesense-sync.test.ts`; confirm the new assertions fail before implementation.
- [ ] Implement additive schema and document conversion; retain the existing sync/fallback behavior.
- [ ] Run the focused suites and verify `npm run typesense:setup` still initializes the schema and performs the existing active-listing sync. Do not run this against production credentials.
- [ ] Commit only the index/schema and test files after verification, with the required co-author trailer.

**Dependencies:** Task 2.
**Estimated scope:** Medium.

### Task 4: Ranking near-me results in search and API responses

**Description:** Add validated transient origin input and global distance ordering while preserving totals and pagination.

**Files:**
- Modify: `src/lib/hostel-search.ts`
- Modify: `src/lib/hostel-search.test.ts`
- Modify: `src/lib/typesense.ts`
- Create: `src/app/api/hostels/search/route.ts`
- Create: `src/app/api/hostels/search/route.test.ts`

**Interfaces:**
- Add optional `origin?: Coordinates` to `SearchParams`.
- Add optional `distanceMetersById?: Record<string, number | null>` to `SearchResult`.
- `POST /api/hostels/search` accepts bounded JSON containing existing search filters, page/limit, and optional origin; retain `GET /api/hostels` and listing-creation `POST /api/hostels` contracts.
- Return `distanceMeters` for matching records in the HTTP body; use `null` where a listing has no valid coordinates.

- [ ] Add failing tests for invalid request bodies/ranges, Typesense distance sorting, selected-sort tie breaking, missing-coordinate ordering, totals, and pagination crossing the located/unlocated boundary.
- [ ] Test Prisma fallback ordering/pagination across the complete filtered result set before slicing the requested page.
- [ ] Run `npx vitest run src/lib/hostel-search.test.ts src/app/api/hostels/search/route.test.ts`; confirm new tests fail before implementation.
- [ ] Validate input shape and coordinate ranges, rate-limit the public endpoint, and assert logs/errors do not contain origin values.
- [ ] Implement the endpoint and service changes without changing ordinary GET search or listing creation.
- [ ] Rerun the focused suites and confirm ordering, totals, and privacy assertions pass.
- [ ] Commit only the endpoint/service and test files after verification, with the required co-author trailer.

**Dependencies:** Tasks 2 and 3.
**Estimated scope:** Medium.

### Task 5: Connecting destination search to existing routes

**Description:** Route city, university, and free-text destinations into the existing search experience without suggesting unsupported campus proximity.

**Files:**
- Modify: `src/components/landing/HeroSearch.tsx`
- Modify: `src/components/landing/HeroSearch.test.tsx`
- Modify: `src/app/university/[slug]/page.tsx`
- Modify: `src/app/hostels/in/[city]/page.tsx`
- Modify: `e2e/homepage.spec.ts`

**Interfaces:**
- Preserve the current city/university result routes and the existing search filter URL contract.
- Free-text hostel/area input remains a normal search query; university routes remain city-wide unless actual campus coordinates exist.

- [ ] Add failing component tests for selecting a city, selecting a university, keyboard-operating suggestions, and submitting arbitrary area/hostel text.
- [ ] Run `npx vitest run src/components/landing/HeroSearch.test.tsx`; confirm new tests fail before implementation.
- [ ] Implement the destination routing and truthful city-wide university wording, metadata, and result labels.
- [ ] Extend the homepage browser test to submit a city and a university destination and verify the resulting routes/content.
- [ ] Run the component suite and `npm run e2e -- e2e/homepage.spec.ts`; confirm existing homepage role redirects remain unchanged.
- [ ] Commit only destination-search, result-copy, and test changes after verification, with the required co-author trailer.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 6: Adding explicit near-me controls to search results

**Description:** Connect the explicit browser location action to the new transient API and communicate distance accurately.

**Files:**
- Modify: `src/app/hostels/SearchPageClient.tsx`
- Modify: `src/components/hostel/HostelCard.tsx`
- Modify: `src/components/hostel/HostelCard.test.tsx`
- Modify: `e2e/search.spec.ts`

**Interfaces:**
- Send origin only in the Task 4 JSON request body.
- Keep near-me state in memory only; do not write coordinates or near-me state to the URL, local/session storage, logs, or analytics.
- Label ranked values as approximate straight-line distance; label missing coordinates as unavailable.

- [ ] Add a browser test that stubs geolocation and proves no location request/API origin occurs before the user activates “Near me”.
- [ ] Test permission denied, unsupported browser, timeout/error, disable/restore selected sort, missing-distance cards, and reload behavior.
- [ ] Run the failing focused tests before implementation.
- [ ] Implement explicit user-triggered geolocation, recoverable error messaging, manual-search continuity, and ephemeral state.
- [ ] Run `npx vitest run src/components/hostel/HostelCard.test.tsx` and `npm run e2e -- e2e/search.spec.ts`.
- [ ] Commit only near-me UI and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 4.
**Estimated scope:** Medium.

### Phase 2: Public Marketplace and Booking

### Task 7: Redesigning the public homepage story

**Description:** Make the home route express the approved warm/campus-energy direction and drive students into honest search.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/landing/MarketingSections.tsx`
- Modify: `src/components/landing/PhotoImage.tsx`
- Modify: `src/components/landing/Reveal.tsx`
- Modify: `src/components/landing/Reveal.test.tsx`
- Modify: `e2e/homepage.spec.ts`

**Interfaces:**
- Keep existing server-side data sources, role-based redirects, and routes.
- Use actual listing data and configured fonts; use existing brand tokens and truthful monthly PKR prices.

- [ ] Add homepage assertions for search hero, factual trust cues, problem/solution content, city/listing discovery, existing owner/student next steps, and footer presence.
- [ ] Test that the hero works with no featured listing/photo and with a real featured listing; the empty state uses local CSS/placeholder artwork, not the current remote Unsplash fallback.
- [ ] Test `Reveal` with reduced motion enabled: content is visible without animation or delayed interaction.
- [ ] Run `npx vitest run src/components/landing/Reveal.test.tsx` and the homepage E2E before implementation.
- [ ] Implement the hero, trust, problem-to-solution, discovery, and owner/student sections with the approved natural tone; do not invent metrics or guarantees.
- [ ] Run the focused tests and `npm run e2e -- e2e/homepage.spec.ts`.
- [ ] Commit only homepage and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 5.
**Estimated scope:** Medium.

### Task 8: Refining search, listing cards, and hostel detail pages

**Description:** Apply the shared marketplace system to results and details while preserving existing filters, map/list, favorite, and booking actions.

**Files:**
- Modify: `src/app/hostels/page.tsx`
- Modify: `src/app/hostels/in/[city]/page.tsx`
- Modify: `src/app/university/[slug]/page.tsx`
- Modify: `src/app/hostels/SearchPageClient.tsx`
- Modify: `src/app/hostels/[slug]/page.tsx`
- Modify: `src/components/hostel/HostelCard.tsx`
- Modify: `src/components/hostel/HostelCard.test.tsx`
- Modify: `src/components/hostel/TrustSummary.tsx`
- Modify: `src/components/hostel/TrustSummary.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `e2e/search.spec.ts`

- [ ] Add/extend tests for real photos and no-photo fallback, `pricePerMonth` display, verification state, rating/review state, and preserved card destinations/actions.
- [ ] Add browser assertions that list/map, filters, empty/error/loading states, and query URL state remain functional.
- [ ] Implement image-led listing comparison and detail hierarchy using only real fields; use “listed monthly rent” wording and avoid unsupported safety/verification claims.
- [ ] Run `npx vitest run src/components/hostel/HostelCard.test.tsx src/components/hostel/TrustSummary.test.tsx` and `npm run e2e -- e2e/search.spec.ts`.
- [ ] Commit only results/detail and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 6.
**Estimated scope:** Medium.

### Task 9: Clarifying booking, payment, and review journeys

**Description:** Align the existing booking steps and recovery states with the new visual hierarchy.

**Files:**
- Modify: `src/components/booking/BookingSummaryCard.tsx`
- Modify: `src/components/booking/BookingSummaryCard.test.tsx`
- Modify: `src/app/booking/[id]/review/page.tsx`
- Modify: `src/app/booking/[id]/payment/page.tsx`
- Modify: `src/app/booking/[id]/confirmation/page.tsx`
- Modify: `src/app/dashboard/bookings/[id]/review/page.tsx`

- [ ] Add assertions for the existing status, amount/price breakdown, and next action in the booking summary test.
- [ ] Preserve pending, failed, cancelled, successful, and review-submission behavior; do not add booking, payment, or verification states.
- [ ] Run `npx vitest run src/components/booking/BookingSummaryCard.test.tsx src/app/booking/[id]/review/page.test.tsx` before and after the visual change.
- [ ] Run `npm run e2e -- e2e/booking-flow.spec.ts`.
- [ ] Commit only booking/review presentation and test changes after verification, with the required co-author trailer.

**Dependencies:** None.
**Estimated scope:** Medium.

### Phase 3: Account and Operations Workspaces

### Task 10: Refining the student account shell

**Description:** Improve shared student navigation and account hierarchy across all dashboard routes.

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/DashboardTabs.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/dashboard/layout.test.tsx`

- [ ] Add/extend tests for student role access, active route state, all existing account tabs, and sign-in redirect behavior.
- [ ] Apply a responsive student shell to overview, bookings/reviews, saved, alerts, messages, notifications, and profile routes without changing their actions.
- [ ] Run `npx vitest run src/app/dashboard/layout.test.tsx src/components/layout/WorkspaceMobileNav.test.tsx`.
- [ ] In the browser, verify no sidebar/tab clipping at 390px and keyboard navigation remains visible.
- [ ] Commit only student-shell and test changes after verification, with the required co-author trailer.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 11: Refining the owner workspace

**Description:** Apply the approved operations-oriented presentation to every owner route through its shared shell.

**Files:**
- Modify: `src/components/layout/OwnerLayout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/owner/layout.test.tsx`
- Modify: `e2e/owner-flow.spec.ts`

- [ ] Test owner role guard, active route states, mobile navigation, and existing pending/action badges.
- [ ] Apply the task-first hierarchy to overview, analytics, listing create/edit/success, bookings, messages, reviews, earnings, plan, and settings.
- [ ] Preserve all existing route actions, status values, subscription details, and payout workflows.
- [ ] Run `npx vitest run src/app/owner/layout.test.tsx` and `npm run e2e -- e2e/owner-flow.spec.ts`.
- [ ] Commit only owner-shell and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 10.
**Estimated scope:** Medium.

### Task 12: Refining the admin operations shell

**Description:** Make admin review work scannable while preserving permissions, queues, and decisions.

**Files:**
- Modify: `src/components/layout/AdminLayout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/admin/layout.test.tsx`

- [ ] Add failing layout tests for admin-only access, active navigation, listing/verification count badges, and mobile menu labels.
- [ ] Apply a clear review hierarchy to dashboard, listings, verifications/analytics, bookings, payments, payouts, reviews, roommate reports, and search sync.
- [ ] Preserve review drawers, rejection reasons, existing actions, and all moderation/payout policies.
- [ ] Run `npx vitest run src/app/admin/layout.test.tsx src/app/owner/layout.test.tsx`.
- [ ] Commit only admin-shell and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 11.
**Estimated scope:** Medium.

### Phase 4: Auth, Supporting Pages, and Verification

### Task 13: Unifying authentication and recovery presentation

**Description:** Integrate the approved visual system with the existing in-progress auth changes.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/@auth/default.tsx`
- Modify: `src/app/@auth/(.)login/page.tsx`
- Modify: `src/app/@auth/(.)register/page.tsx`
- Modify: `src/app/@auth/[...catchAll]/page.tsx`
- Modify: `src/components/auth/AuthCardLayout.tsx`
- Modify: `src/components/auth/AuthCardLayout.test.tsx`
- Modify: `src/components/auth/AuthModal.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/RegisterForm.tsx`
- Modify: `src/components/auth/RegisterForm.test.tsx`

- [ ] Add/extend tests for direct routes and intercepted modal routes, validation/errors/loading, focus handling, and callback/role redirects.
- [ ] Restyle auth and recovery without removing or replacing any pre-existing uncommitted work.
- [ ] Run `npx vitest run src/components/auth/AuthCardLayout.test.tsx src/components/auth/RegisterForm.test.tsx` and `npm run e2e -- e2e/auth.spec.ts`.
- [ ] Commit only auth changes that can be cleanly separated from the existing uncommitted auth edits; if they cannot be separated safely, leave them uncommitted and ask before staging.

**Dependencies:** None.
**Estimated scope:** Medium.

### Task 14: Unifying public navigation, footer, and support pages

**Description:** Carry the public shell and humane content hierarchy across all marketing, owner-entry, help, and legal routes.

**Files:**
- Modify: `src/components/layout/PublicLayout.tsx`
- Modify: `src/components/Navbar.tsx`
- Create/modify: `src/components/Navbar.test.tsx`
- Modify: `src/components/Footer.tsx`
- Create/modify: `src/components/Footer.test.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/help/page.tsx`
- Modify: `src/app/list-your-hostel/page.tsx`
- Modify: `src/app/notifications/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/profile/settings/page.tsx`
- Modify: `src/app/report/page.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/verify-email-sent/page.tsx`

- [ ] Test navigation links and role-aware owner/account entries, mobile menu accessibility, footer route destinations, and legal/support links.
- [ ] Apply the public shell to all remaining public/support routes, including forgot/reset password, verification sent, notifications, profile, and university/city pages where they use it.
- [ ] Preserve route content, policy text, validation, and access behavior; only change copy where needed to remove unsupported claims.
- [ ] Run `npx vitest run src/components/Navbar.test.tsx src/components/Footer.test.tsx src/components/layout/AccountMenu.test.tsx`.
- [ ] Commit only public-shell and test changes after verification, with the required co-author trailer.

**Dependencies:** Task 7.
**Estimated scope:** Medium.

### Task 15: Verifying every route family

**Description:** Confirm the integrated UI and search behavior at representative desktop/mobile sizes and across every route family.

**Files:** No additional source files; use existing route tests and add only focused coverage for discovered gaps.

- [ ] Run focused Vitest suites from Tasks 2–14, then `npm run typecheck` and `npm run lint`.
- [ ] Run `npm run e2e -- e2e/homepage.spec.ts e2e/search.spec.ts e2e/booking-flow.spec.ts e2e/owner-flow.spec.ts e2e/auth.spec.ts`.
- [ ] Inspect representative public, student, owner, and admin routes at 390px and 1440px, including keyboard navigation, dialogs, map/list controls, loading/empty/error states, and reduced motion.
- [ ] Check each route family listed in the spec for preserved role access and primary actions; record any blocked route/test explicitly.
- [ ] Run `git diff --check` and confirm all unrelated pre-existing worktree changes remain unchanged.
- [ ] Commit any route-verification tests or documentation updates after checks, with the required co-author trailer.

**Dependencies:** Tasks 1–14.
**Estimated scope:** Large.

## Checkpoint: Complete

- [ ] All route families in the approved spec have been checked for retained access, data, actions, and recovery states.
- [ ] Public search, optional near-me ordering, booking, student account, owner, and admin journeys work at desktop and mobile sizes.
- [ ] No unapproved production UI library or remote font/image dependency was added.
- [ ] Review the completed changes with the user before integration or release.
