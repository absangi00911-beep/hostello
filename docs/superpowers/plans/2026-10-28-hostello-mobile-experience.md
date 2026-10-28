# Hostello Mobile Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Hostello's student mobile Explore and account pages closer to the supplied reference while preserving desktop and product behavior.

**Architecture:** Keep the existing Next.js App Router, Auth.js guards, and APIs. Add a reusable mobile tab bar, make the current Explore components responsive, reuse the existing favorite routes and account APIs, and add server-guarded Wishlist, Trips, and Profile pages. Do not change API contracts or persistence.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, CSS in `src/app/globals.css`, Vitest, Playwright, and existing `lucide-react` icons.

**Spec:** [2026-10-28-hostello-mobile-experience-design.md](../specs/2026-10-28-hostello-mobile-experience-design.md)

## Global Constraints

- Apply the new Explore composition and bottom navigation only at mobile widths. Preserve the existing desktop composition and controls.
- Preserve current search/filter semantics, server-side role authorization, accurate hostel and booking data, visible focus, and explicit request errors.
- Do not add a design or icon package, migration, API route, or database change.
- Support narrow screens down to 320 CSS pixels without horizontal page overflow.
- Respect safe-area insets, keyboard focus visibility, semantic headings, reduced-motion preferences, and useful image alternatives.
- Before writing Next.js application code, read the applicable Next.js 16.4 guides under `node_modules/next/dist/docs/`.
- Never fabricate listing facts or booking success, expose another user's data, or remove/skip existing tests to make checks pass.

## Review Focus

1. **Nested card actions:** Save buttons must be siblings of hostel detail links, not nested interactive controls; test that heart activation never navigates to the detail page.
2. **Favorite state hydration:** Existing saved hostels beyond the first favorites page must still appear saved on Explore; test pagination and a failed favorites request.
3. **Signed-out and wrong-role access:** New student routes must redirect anonymous users through login with a safe callback and deny non-students; test each access boundary.
4. **Truthful trip dates/status:** Render the API's actual check-in, check-out, and booking status without inventing confirmed state; test pending and confirmed examples.
5. **Responsive fixed navigation:** The bar must respect safe-area insets and never obscure content/focus or create horizontal page overflow; test 320px and 375px viewports.

## File Structure

- `src/components/layout/MobileTabNavigation.tsx` — shared mobile student navigation.
- `src/components/home/` — existing Explore components plus reusable mobile category navigation and responsive search behavior.
- `src/components/student/` — Wishlist, Trips, and Profile data views.
- `src/app/{wishlists,trips,profile}/page.tsx` — authenticated, student-only route entries.
- `src/app/messages/page.tsx` — show student tabs only to students; do not replace owner messaging navigation.
- `src/app/globals.css` — mobile-only layout, dialog, card-action, and bottom-bar styles.
- Existing Vitest and Playwright suites — focused component and browser regression coverage.

## Dependency Graph

```text
MobileTabNavigation
  ├── Explore integration ── mobile Explore layout/search ── favorite hearts
  ├── Wishlists
  ├── Trips
  ├── Profile
  └── student Messages integration

Existing APIs/auth guards ── each account page
```

## Tasks

### Task 1: Add shared mobile tab navigation

**Files:**
- Create: `src/components/layout/MobileTabNavigation.tsx`
- Create: `src/components/layout/MobileTabNavigation.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/messages/page.tsx`

**Interfaces:**
- Produce `MobileTabNavigation({ activeTab }: { activeTab: "explore" | "wishlists" | "trips" | "messages" | "profile" })`.
- Render semantic links to `/`, `/wishlists`, `/trips`, `/messages`, and `/profile`, with text labels and `aria-current="page"` on the active item.
- Render the bar only at mobile widths, with safe-area padding and touch-sized controls. On Messages, render it only for `STUDENT`; preserve owner messaging as-is.

- [x] **Step 1: Write failing component tests** named `renders_all_five_tab_links` and `marks_only_the_active_tab_current`, asserting exact destinations/labels and one active `aria-current="page"`.
- [x] **Step 2: Run `npm run test -- --run src/components/layout/MobileTabNavigation.test.tsx`**; expected: FAIL because the component does not exist.
- [x] **Step 3: Implement the component and mobile-only styles**, then integrate it in `src/app/messages/page.tsx` for students only.
- [x] **Step 4: Run the focused component test and `npm run typecheck`**; expected: PASS with no owner navigation change.

### Task 2: Reshape mobile Explore hierarchy and category controls

**Files:**
- Create: `src/components/home/BrowseCategoryNav.tsx`
- Create: `src/components/home/BrowseCategoryNav.test.tsx`
- Modify: `src/components/home/BrowseHeader.tsx`
- Modify: `src/components/home/ProductHome.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Extract the current category options and selected-state behavior into `BrowseCategoryNav({ category, onSelectCategory, className? })`.
- Keep the desktop header and category behavior. Render a mobile category instance below search; hide the brand/account header row on mobile Explore.
- Add the mobile tab bar to Explore without changing owner/admin navigation.

- [x] **Step 1: Write failing tests** named `renders_existing_categories_and_selected_state` and `selecting_category_calls_existing_handler`, asserting existing labels/IDs and `aria-pressed` state.
- [x] **Step 2: Run `npm run test -- --run src/components/home/BrowseCategoryNav.test.tsx`**; expected: FAIL because the extracted component does not exist.
- [x] **Step 3: Extract and wire the navigation**; keep current category IDs (`all`, `women`, `top-rated`, `budget`) and filtering meanings unchanged.
- [x] **Step 4: Add mobile-only styles** so Explore starts with search, then horizontally scrollable pill-style categories, then photo-led city rows sized for about two cards and a partial next-card peek; the desktop header remains unchanged.
- [x] **Step 5: Run the focused test and `npm run typecheck`**; expected: PASS.

### Task 3: Make the existing search a mobile pill and full-screen form

**Files:**
- Modify: `src/components/home/HostelSearchBar.tsx`
- Create: `src/components/home/HostelSearchBar.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Keep the existing `HostelSearchBar({ onSearch }: { onSearch: (destination: string) => void })` contract.
- At mobile widths show a compact “Start your search” pill; activating it opens a full-screen search dialog containing the existing destination, move-in, and guest fields.
- Preserve the current submit behavior: navigate using destination only; do not claim date/guest filtering is supported.

- [x] **Step 1: Write failing component tests** named `renders_mobile_search_trigger_and_full_screen_dialog` and `keeps_existing_search_fields_in_both_surfaces`; Task 8's browser test verifies dialog open/close and trimmed-destination navigation.
- [x] **Step 2: Run `npm run test -- --run src/components/home/HostelSearchBar.test.tsx`**; expected: FAIL for missing mobile pill/dialog behavior.
- [x] **Step 3: Implement the responsive control using the existing form state and no new dependency.**
- [x] **Step 4: Run the focused test and `npm run typecheck`**; expected: PASS, with desktop fields still inline.

### Task 4: Add favorite hearts to Explore cards

**Files:**
- Modify: `src/components/home/ProductHome.tsx`
- Modify: `src/components/home/HostelRow.tsx`
- Create: `src/components/home/HostelRow.test.tsx`
- Create: `src/components/home/ProductHome.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Extend `HostelListing` with the validated `slug` returned by `GET /api/hostels`.
- Give `HostelRow` the saved-slug set, whether the current account may save, and an async toggle callback. Keep the heart button outside the hostel detail link.
- For students, hydrate initial saved slugs from all pages of existing `GET /api/favorites` (limit 50 per page); do not add an API. Anonymous users use the existing `LoginDialogTrigger`; hide save controls for owner/admin accounts.
- Use `POST` to save and `DELETE` to unsave at `/api/hostels/{slug}/favorite`. Change state only on a valid server confirmation; disable while pending and announce errors/status to assistive technology.

- [x] **Step 1: Write failing component tests** named `renders_favorite_action_as_sibling_of_detail_link`, `reflects_server_saved_state`, and `hides_favorite_action_for_owner`; test in `ProductHome.test.tsx` that favorite pagination hydrates saved slugs and a failed request is exposed. Task 8's browser tests verify mutation success/failure, pending disablement, signed-out login, and that heart clicks do not navigate.
- [x] **Step 2: Run `npm run test -- --run src/components/home/HostelRow.test.tsx`**; expected: FAIL because save controls do not exist.
- [x] **Step 3: Implement the card action and favorite-state hydration**, validating response shapes and surfacing failed favorite loads instead of treating them as success.
- [x] **Step 4: Run the focused test and `npm run typecheck`**; expected: PASS for multiple favorites pages and mutation failures.

### Task 5: Implement the student Wishlists page

**Files:**
- Create: `src/app/wishlists/page.tsx`
- Create: `src/app/wishlists/page.test.tsx`
- Create: `src/components/student/WishlistsPage.tsx`
- Create: `src/components/student/WishlistsPage.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Server route calls `auth()`, redirects anonymous users to `/login` with `/wishlists` as a safe callback, and denies non-students using the established route convention.
- Client page loads `GET /api/favorites`, renders active hostel cards linking to `/hostels/{slug}`, and includes `MobileTabNavigation` with `activeTab="wishlists"`.
- Display explicit loading, empty, and error states; preserve pagination when more than one API page exists.

- [x] **Step 1: Write failing tests** named `redirects_anonymous_user_to_login_with_safe_callback`, `denies_non_student_role`, and `renders_initial_favorites_loading_state`; component tests cover populated, empty, error, and detail-link states.
- [x] **Step 2: Run focused tests before implementation**; expected: FAIL because the page component and route do not exist.
- [x] **Step 3: Implement the guarded route and API-backed page**, without changing the favorites API.
- [x] **Step 4: Run focused tests and `npm run typecheck`**; expected: PASS.

### Task 6: Implement the student Trips page

**Files:**
- Create: `src/app/trips/page.tsx`
- Create: `src/app/trips/page.test.tsx`
- Create: `src/components/student/TripsPage.tsx`
- Create: `src/components/student/TripsPage.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Guard `/trips` as a student-only route; redirect anonymous users to login with a safe `/trips` callback and deny other roles.
- Load the signed-in student's bookings from `GET /api/bookings`, render hostel, city, actual `checkIn`/`checkOut`, and actual booking status, and include `MobileTabNavigation` with `activeTab="trips"`.
- Keep the page read-only and show explicit loading, empty, and error states.

- [x] **Step 1: Write failing tests** named `redirects_anonymous_user_to_login_with_safe_callback`, `denies_non_student_role`, and `renders_initial_bookings_loading_state`; component tests cover pending/confirmed data, empty, and error states.
- [x] **Step 2: Run focused tests before implementation**; expected: FAIL because the page component and route do not exist.
- [x] **Step 3: Implement the guarded route and API-backed read-only page.**
- [x] **Step 4: Run focused tests and `npm run typecheck`**; expected: PASS.

### Task 7: Implement the student Profile page and host entry

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/page.test.tsx`
- Create: `src/components/student/ProfilePage.tsx`
- Create: `src/components/student/ProfilePage.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Guard `/profile` as a student-only route; redirect anonymous users to login with a safe `/profile` callback and deny other roles.
- Load `GET /api/profile`; display avatar, name, optional city, member-since date, and available booking/favorite/review counts without displaying email, phone, or edit controls.
- Put “Become a host” on Profile using the existing `/signup?role=OWNER` destination, and include `MobileTabNavigation` with `activeTab="profile"`.

- [x] **Step 1: Write failing tests** named `redirects_anonymous_user_to_login_with_safe_callback`, `denies_non_student_role`, and `renders_initial_profile_loading_state`; component tests cover the summary, privacy-safe profile model, host entry, and API failure.
- [x] **Step 2: Run focused tests before implementation**; expected: FAIL because the page component and route do not exist.
- [x] **Step 3: Implement the guarded route and API-backed read-only page.**
- [x] **Step 4: Run focused tests and `npm run typecheck`**; expected: PASS.

### Task 8: Verify mobile flows and desktop preservation

**Files:**
- Modify: `e2e/web-foundation.spec.ts`
- Create: `e2e/mobile-student-experience.spec.ts`

- [x] **Step 1: Add Playwright coverage** for the search-first mobile hierarchy, the full-screen search dialog, mobile category filters, signed-out save prompts, Explore tab state, student-page auth redirects, and responsive overflow.
- [x] **Step 2: Measure layout at 320px, 375px, 1024px, and 1440px**; assert no horizontal document overflow, listing-card peek on mobile, bottom-bar clearance, and unchanged desktop header/search.
- [x] **Step 3: Run `npm run e2e -- --project=chromium e2e/web-foundation.spec.ts e2e/mobile-student-experience.spec.ts`**; expected: all focused browser scenarios pass.
- [x] **Step 4: Run `npm run test -- --run`, `npm run lint`, `npm run typecheck`, and `npm run build`**; all pass. Lint reports one pre-existing warning in `src/app/api/admin/listings/route.ts`; build emits the existing Sentry global-error-handler advisory.

### Checkpoint: After Tasks 1-4

- [x] Mobile Explore has the intended search-first hierarchy, scrollable categories, favorite controls, and an unobstructed tab bar.
- [x] Existing search/filter behavior and desktop Explore remain intact.
- [x] Focused component tests, typecheck, and relevant browser tests pass.

### Checkpoint: Complete

- [x] Wishlists, Trips, and Profile are student-guarded and show explicit loading, empty, and error states.
- [x] All five navigation destinations have correct active semantics.
- [x] Mobile and desktop viewport checks pass.
- [x] Focused and full verification commands pass.

Authenticated favorite mutation and pending-state interactions were not exercised in a browser session because no database-backed authenticated test fixture was available; the browser suite covers the signed-out prompt, while component tests cover saved-state rendering and link/button separation.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| An Explore listing is absent from the first favorites page | Heart appears incorrectly unsaved | Load all favorites pages before enabling saved-state controls and test pagination |
| Fixed navigation overlaps device safe areas or focused content | Controls become obscured on mobile | Use `env(safe-area-inset-bottom)`, reserve page bottom space, and test at 320px/375px |
| Existing listing cards contain a link wrapping the whole card | Nested heart button breaks keyboard and pointer behavior | Make the detail link and save button separate sibling controls |
| Owner/admin can reach shared pages that also serve students | Student tabs appear in non-student workflows | Gate tabs by role and test existing owner Messages behavior |
| API data can fail or be malformed | The UI could show empty or misleading successful states | Validate response shapes and expose explicit errors |

## Open Questions

- None. A plan-location conflict was resolved by keeping this work in a separate `docs/superpowers/plans/` file and preserving the paused inventory plan/checklist.
