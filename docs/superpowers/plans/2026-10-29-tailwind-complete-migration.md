# Complete Tailwind CSS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all app-owned page and component CSS selectors with Tailwind utilities while preserving the existing HostelLo UI and behavior.

**Architecture:** Keep the existing Tailwind v4 foundation and semantic tokens. Move each component's styles into its rendered TSX elements, then delete only that slice's selectors from `globals.css`; retain token declarations, global/base rules, and necessary keyframes. Migrate sequentially because all slices share and edit the same stylesheet.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS 4.3.3, Playwright, Vitest.

**Spec:** `../specs/SPEC-tailwind-complete-migration.md`

## Global Constraints

- Preserve the current palette, typography, spacing, responsive behavior, interactions, accessibility, and reduced-motion behavior.
- Do not add a dependency, redesign the UI, change copy, or alter business logic.
- Use Tailwind utilities in the TSX element that receives the styling; use existing semantic color tokens where applicable.
- Keep `globals.css` limited to Tailwind imports/theme tokens, genuinely global browser defaults, and necessary keyframes.
- Remove migrated selectors from `globals.css` in the same task as the component migration.
- Preserve the existing uncommitted favorite-button changes (7px image inset and `brightness(0.95)`) when migrating the card.
- Keep the unrelated paused owner room-inventory plan and all unrelated worktree changes untouched.

## Review Focus

- **CSS cascade:** unlayered legacy selectors override Tailwind utilities; remove each migrated selector in the same change and verify computed styles in-browser.
- **Responsive sizing:** carousel counts, content gutters, calendar layouts, and mobile navigation vary by viewport; test desktop, tablet, and mobile at each owning slice.
- **Interactive state:** hover, focus-visible, active, disabled, `aria-*`, and `data-*` selectors must remain tied to the same user-visible states; test the affected interaction.
- **Reduced motion and contrast:** preserve media-query behavior and verify utility variants or retained keyframes honor the same user preferences.
- **Dynamic utility scanning:** keep conditional utility class names statically discoverable by Tailwind; run build and test rendered states for dynamic classes.

## Task List

Track tasks and dependencies in the session `todos` table. Execute tasks sequentially in this checkout; parallel changes to `globals.css` risk overwriting each other's removals.

### Phase 1: Shared UI

### Task 1: Migrating shared headers and account menus

**Files:**
- Modify: `src/components/home/BrowseHeader.tsx`
- Modify: `src/components/auth/BrowseAccountActions.tsx`
- Modify: `src/components/auth/BrowseAccountMenu.tsx`
- Modify: `src/app/globals.css` (shared header/account selectors only)
- Test: `BrowseAccountActions.test.tsx`, `BrowseAccountMenu.test.tsx`, `e2e/web-foundation.spec.ts`

**Interfaces:**
- Consumes: foundation tokens/utilities and the current component props/state.
- Produces: shared header/account UI styled by element-level Tailwind utilities.

- [ ] Record desktop/mobile baseline and run the two focused auth component tests.
- [ ] Migrate shared-header/account classes, responsive rules, and interaction states.
- [ ] Remove only the migrated shared-header/account CSS selectors.
- [ ] Re-run the focused tests, `npm run typecheck`, and browser checks at 1440px and 390px.
- [ ] Commit this slice.

### Task 2: Migrating mobile tab navigation

**Files:**
- Modify: `src/components/layout/MobileTabNavigation.tsx`
- Modify: `src/app/globals.css` (mobile tab navigation selectors only)
- Test: `src/components/layout/MobileTabNavigation.test.tsx`

**Interfaces:**
- Consumes: foundation tokens and the navigation component's current route/active state.
- Produces: responsive mobile navigation rendered with Tailwind utilities.

- [ ] Run the existing mobile navigation tests and record the desktop/mobile baseline.
- [ ] Migrate layout, active/focus states, safe-area spacing, and responsive visibility.
- [ ] Remove only the migrated navigation selectors.
- [ ] Re-run the focused tests and check at mobile and desktop widths.
- [ ] Commit this slice.

### Task 3: Migrating login dialog and login route

**Files:**
- Modify: `src/components/auth/LoginDialog.tsx`
- Modify: `src/components/auth/LoginDialogTrigger.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/globals.css` (login dialog and login route selectors only)

**Interfaces:**
- Consumes: foundation tokens and existing authentication states/handlers.
- Produces: modal and login route presentation through Tailwind utilities.

- [ ] Record the current dialog/login appearance and verify existing auth tests.
- [ ] Migrate form, feedback, disabled, focus, overlay, viewport, and reduced-motion styles.
- [ ] Remove only the migrated auth/login selectors.
- [ ] Verify keyboard focus and desktop/mobile rendering; run affected tests and typecheck.
- [ ] Commit this slice.

### Checkpoint: Shared UI

- [ ] All shared UI tests pass.
- [ ] Home and hostel detail shared headers remain correct at desktop and mobile widths.
- [ ] Shared UI selectors have been removed from `globals.css`.

### Phase 2: Discovery

### Task 4: Migrating browse page shell and search controls

**Files:**
- Modify: `src/components/home/ProductHome.tsx`
- Modify: `src/components/home/BrowseCategoryNav.tsx`
- Modify: `src/components/home/HostelSearchBar.tsx`
- Modify: `src/app/globals.css` (browse shell, category, and search-control selectors only)
- Test: `ProductHome.test.tsx`, `BrowseCategoryNav.test.tsx`, `HostelSearchBar.test.tsx`

**Interfaces:**
- Consumes: shared header/account UI and foundation tokens.
- Produces: home/browse shell, category controls, and search form styled with Tailwind.

- [ ] Run focused home component tests and record the current page at desktop/tablet/mobile widths.
- [ ] Migrate layout, responsive rules, filter/search states, and accessibility states.
- [ ] Remove only the migrated browse-shell/category/search selectors.
- [ ] Run focused tests and `e2e/web-foundation.spec.ts`; verify at 1440px, 800px, and 390px, including consistent desktop gutters.
- [ ] Commit this slice.

### Task 5: Migrating hostel listing cards

**Files:**
- Modify: `src/components/home/HostelRow.tsx`
- Modify: `src/app/globals.css` (shared card, carousel, favorite, and card-hover selectors only)
- Test: `src/components/home/HostelRow.test.tsx`, `e2e/web-foundation.spec.ts`

**Interfaces:**
- Consumes: semantic foundation tokens and current card props/actions.
- Produces: reusable hostel card and carousel styles in the component.

- [ ] Run existing card tests and record carousel counts at desktop, tablet, and mobile widths.
- [ ] Migrate card layout, carousel sizing, image, favorite control, and hover/focus behavior.
- [ ] Preserve the existing brightness-only image hover, transparent darker favorite fill, and uncommitted 7px/brightness button adjustments.
- [ ] Remove only the migrated card/carousel selectors.
- [ ] Verify the 7.15/4.15/2.15 visible-card targets (within 0.1 card), image `brightness(0.90)` without zoom, transparent darker favorite control, focused tests, and typecheck.
- [ ] Commit this slice.

### Task 6: Migrating search results

**Files:**
- Modify: `src/app/search/SearchPageClient.tsx`
- Modify: `src/app/search/page.tsx` only if it renders styled elements.
- Modify: `src/app/globals.css` (search-result selectors only)
- Test: `e2e/web-foundation.spec.ts` and existing search tests

**Interfaces:**
- Consumes: shared header/account UI, shared hostel-card behavior where reused, and foundation tokens.
- Produces: search results, filters, map preview, pagination, and footer styled with Tailwind.

- [ ] Run existing search tests and record desktop/tablet/mobile layout.
- [ ] Migrate result layout, filters, map preview, pagination, and responsive states.
- [ ] Remove only the migrated search selectors.
- [ ] Verify search filtering, route behavior, overflow, desktop gutters consistent with browse, focused tests, and typecheck.
- [ ] Commit this slice.

### Checkpoint: Discovery

- [ ] Home and search browser tests pass.
- [ ] Hostel card carousel and hover behavior remain correct at all target viewports.
- [ ] No discovery/card selectors remain in `globals.css`.

### Phase 3: Hostel Detail

### Task 7: Migrating detail shell, gallery, and overview

**Files:**
- Modify: `src/app/hostels/[param]/page.tsx`
- Modify: `src/components/hostel-detail/HostelDetailGallery.tsx`
- Modify: `src/components/hostel-detail/HostelDetailOverview.tsx`
- Modify: `src/components/hostel-detail/HostelAmenitiesSection.tsx`
- Modify: `src/app/globals.css` (detail shell/gallery/overview/amenity selectors only)
- Test: existing gallery and overview component tests

**Interfaces:**
- Consumes: shared header/account UI and the detail page's existing data and states.
- Produces: responsive detail shell, gallery, overview, and amenities using Tailwind.

- [ ] Run existing gallery/overview tests and record desktop/mobile browser layout.
- [ ] Migrate detail shell, gallery photo-count states, overview, and amenity styles.
- [ ] Remove only the migrated selector rules.
- [ ] Verify tests, detail route rendering, and responsive gallery layouts.
- [ ] Commit this slice.

### Task 8: Migrating booking and date selection

**Files:**
- Modify: `src/components/hostel-detail/HostelBookingCard.tsx`
- Modify: `src/components/hostel-detail/HostelDateCalendar.tsx`
- Modify: `src/components/hostel-detail/HostelDateSelectionProvider.tsx` only if it renders styled elements.
- Modify: `src/app/globals.css` (booking/calendar selectors only)

**Interfaces:**
- Consumes: existing booking/date state, handlers, and shared design tokens.
- Produces: responsive booking and calendar presentation in Tailwind.

- [ ] Run existing affected component tests and record booking/calendar desktop/mobile behavior.
- [ ] Migrate date selection, calendar navigation/selection/disabled states, and booking styles.
- [ ] Remove only the migrated selector rules.
- [ ] Verify selection/disabled behavior, mobile layouts, and typecheck.
- [ ] Commit this slice.

### Task 9: Migrating inquiry and room sections

**Files:**
- Modify: `src/components/hostel-detail/HostelInquiryForm.tsx`
- Modify: `src/components/hostel-detail/HostelRoomSection.tsx`
- Modify: `src/app/globals.css` (inquiry/room selectors only)

**Interfaces:**
- Consumes: existing inquiry handlers, room data, and foundation tokens.
- Produces: inquiry and room section styles expressed in Tailwind utilities.

- [ ] Run affected tests and record the sections' current responsive layout.
- [ ] Migrate inquiry form validation states and room presentation.
- [ ] Remove only the migrated selector rules.
- [ ] Verify behavior, responsive rendering, and typecheck.
- [ ] Commit this slice.

### Task 10: Migrating host, location, and reviews

**Files:**
- Modify: `src/components/hostel-detail/HostelHostSection.tsx`
- Modify: `src/components/hostel-detail/HostelLocationSection.tsx`
- Modify: `src/components/hostel-detail/HostelReviewsSection.tsx`
- Modify: `src/app/globals.css` (host/location/review selectors only)
- Test: existing host and review component tests

**Interfaces:**
- Consumes: detail page data and foundation tokens.
- Produces: host, location/map, and review presentation through Tailwind utilities.

- [ ] Run existing host/review tests and record detail route layout.
- [ ] Migrate content, form/reply states, location/map layout, and responsive rules.
- [ ] Remove only the migrated selector rules.
- [ ] Verify tests and detail page behavior on desktop/mobile.
- [ ] Commit this slice.

### Checkpoint: Hostel Detail

- [ ] All existing detail component tests pass.
- [ ] Gallery, booking, reviews, and location remain usable on desktop and mobile.
- [ ] No hostel-detail selectors remain in `globals.css`.

### Phase 4: Student Pages

### Task 11: Migrating student profile

**Files:**
- Modify: `src/components/student/ProfilePage.tsx`
- Modify: `src/app/profile/page.tsx` only if it renders styled elements.
- Modify: `src/app/globals.css` if any profile selectors exist.
- Test: `src/components/student/ProfilePage.test.tsx`, `e2e/mobile-student-experience.spec.ts`

**Interfaces:**
- Consumes: existing profile data/loading/error states and shared navigation.
- Produces: profile route UI styled with Tailwind utilities.

- [ ] Run profile tests and record desktop/mobile rendering.
- [ ] Migrate all profile component presentation and interactive states.
- [ ] Remove migrated profile selectors, if present.
- [ ] Verify focused tests and profile browser flow on mobile/desktop.
- [ ] Commit this slice.

### Task 12: Migrating student trips

**Files:**
- Modify: `src/components/student/TripsPage.tsx`
- Modify: `src/app/trips/page.tsx` only if it renders styled elements.
- Modify: `src/app/globals.css` if any trips selectors exist.
- Test: `src/components/student/TripsPage.test.tsx`, `e2e/mobile-student-experience.spec.ts`

**Interfaces:**
- Consumes: existing trip data/states and shared navigation.
- Produces: trips route UI styled with Tailwind utilities.

- [ ] Run trips tests and record desktop/mobile rendering.
- [ ] Migrate trip cards, empty/error/loading states, and interactive controls.
- [ ] Remove migrated trips selectors, if present.
- [ ] Verify focused tests and trips browser flow on mobile/desktop.
- [ ] Commit this slice.

### Task 13: Migrating student wishlists

**Files:**
- Modify: `src/components/student/WishlistsPage.tsx`
- Modify: `src/app/wishlists/page.tsx` only if it renders styled elements.
- Modify: `src/app/globals.css` if any wishlist selectors exist.
- Test: `src/components/student/WishlistsPage.test.tsx`, `e2e/mobile-student-experience.spec.ts`

**Interfaces:**
- Consumes: existing wishlist data/states, shared hostel cards, and navigation.
- Produces: wishlist route UI styled with Tailwind utilities.

- [ ] Run wishlist tests and record desktop/mobile rendering.
- [ ] Migrate wishlist cards, empty/error/loading states, and interactive controls.
- [ ] Remove migrated wishlist selectors, if present.
- [ ] Verify focused tests and wishlist browser flow on mobile/desktop.
- [ ] Commit this slice.

### Checkpoint: Student Pages

- [ ] Profile, trips, and wishlist tests pass at supported breakpoints.
- [ ] No student-page selectors remain in `globals.css`.

### Phase 5: Account and Messaging

### Task 14: Migrating messaging

**Files:**
- Modify: `src/app/messages/page.tsx`
- Modify: `src/components/messages/MessagesInbox.tsx`
- Modify: `src/components/messages/ConversationList.tsx`
- Modify: `src/components/messages/ConversationThread.tsx`
- Modify: `src/app/globals.css` (messages selectors only)
- Test: `src/components/messages/MessagesInbox.test.tsx`

**Interfaces:**
- Consumes: existing message data, conversation state, and shared navigation.
- Produces: messaging layout and conversation states in Tailwind utilities.

- [ ] Run messaging tests and record desktop/mobile layout.
- [ ] Migrate inbox, list/thread, loading/error/empty states, and responsive behavior.
- [ ] Remove only the migrated messages selectors.
- [ ] Verify tests, conversation behavior, and mobile/desktop rendering.
- [ ] Commit this slice.

### Checkpoint: Account and Messaging

- [ ] Login and messaging flows preserve their existing behavior.
- [ ] No account or messaging component selectors remain in `globals.css`.

### Phase 6: Global CSS audit

### Task 15: Removing remaining component CSS and verifying the migration

**Files:**
- Modify: `src/app/globals.css`
- Modify: any in-scope TSX component or page discovered by the selector audit
- Test: focused tests for any remaining selectors, full test suite, E2E suites

**Interfaces:**
- Consumes: all previously migrated modules.
- Produces: a minimal stylesheet containing Tailwind imports/theme tokens, genuine global/base rules, and necessary keyframes only.

- [ ] Inventory every remaining selector in `globals.css` and classify global/base versus component/page styling.
- [ ] Migrate any remaining app-owned component/page rule and delete it from the stylesheet.
- [ ] Verify the remaining stylesheet has no component/page class or ID selectors.
- [ ] Run `npm run test -- --run`, `npm run e2e -- e2e/web-foundation.spec.ts`, `npm run e2e -- e2e/mobile-student-experience.spec.ts`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Review desktop and mobile pages for visual regressions; commit the final audit.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing uncommitted edits overlap shared CSS | High | Preserve the current favorite-button CSS; migrate it with the card; stage only task-owned hunks |
| Tailwind utility order changes cascade results | High | Delete migrated unlayered selectors in the same slice and verify computed styles |
| Large components become hard to maintain | Medium | Add utilities at the styled elements and avoid unrelated component restructuring |
| Arbitrary variant or dynamic class is not generated | Medium | Keep class tokens statically discoverable and verify production build plus browser states |
| Single shared stylesheet causes merge conflicts | Medium | Execute sequentially and commit each verified slice |

## Open Questions

- None. Scope, visual preservation, stack, existing foundation, and module order follow the user's request and approved migration map. Sequential execution is used in this checkout to avoid concurrent edits to the shared stylesheet.
