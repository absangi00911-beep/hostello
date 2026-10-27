# Hostel Detail Reference Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the user-provided listing screenshot's page composition while preserving HostelLo branding, truthful listing content, and existing detail-page behavior.

**Architecture:** Keep the server-rendered hostel detail route and its existing components. Add a native destination GET form to the detail header, hydrate that query in the current search page, and reshape the existing summary/gallery/booking layout with focused component and E2E tests.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, CSS in `src/app/globals.css`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-hostel-detail-reference-layout-design.md`

## Global Constraints

- Keep HostelLo's name, green visual identity, typography, real listing content, and existing user interactions.
- Do not copy Airbnb branding, proprietary text, or photography.
- Do not invent guest-favorite badges, beds/baths, host review totals, or listing facts not present in HostelLo data.
- Do not imply unsupported date or guest filters work in discovery.
- Preserve booking rules, persistence, API access, authentication, share/save, reviews, rooms, and inquiry behavior.
- Avoid horizontal overflow at 320, 375, 768, 1024, and 1440 CSS pixels.

## Review Focus

- Empty/short/malformed `city` query values must not break search-page loading or create misleading selected-city results. Test in Task 1.
- Search city names containing spaces or punctuation must survive GET encoding and be safely rendered. Test in Task 1.
- Detail pages with 0–5 photos must show only available images and keep the show-all interaction valid. Test in Task 2.
- Zero reviews and unverified listings must not show invented rating/trust claims. Test in Task 3.
- Long hostel names/locations at mobile widths must wrap without pushing the booking controls or viewport horizontally. Test in Task 3.

---

### Task 1: Add destination search to the detail header

**Files:**
- Modify: `src/app/hostels/[param]/page.tsx`
- Modify: `src/app/search/page.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- Produces a native GET form with `action="/search"`, a `city` input, and an accessible submit control.
- `/search?city=<destination>` initializes the existing city search and loads results through the current `/api/hostels` request.

- [ ] **Step 1: Write the failing browser test**

Add a Playwright test that opens a detail page, submits `"Rawalpindi"` via the header destination form, and asserts `/search?city=Rawalpindi`, the selected city state, and the existing hostel results request. Add a second assertion for a destination containing a space to verify URL encoding and decoded display.

- [ ] **Step 2: Run the test to verify it fails**

Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`
Expected: the detail header search control is not found.

- [ ] **Step 3: Implement the native header form and query initialization**

In `page.tsx`, add a labeled city GET form with `name="city"` and a submit button, retaining current brand and account actions. In `SearchPage`, read the initial query once after mount, trim the `city`, and set both the input query and selected city so the existing effect and result/error states perform the search. Ignore an absent or whitespace-only value. Add compact input/button styling and reflow the header search below the brand/account row at mobile widths so the new control does not introduce horizontal overflow.

- [ ] **Step 4: Run focused browser tests**

Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`
Expected: destination navigation and existing detail/search scenarios pass; OAuth-only scenario may remain skipped if credentials are unavailable.

- [ ] **Step 5: Commit**

```bash
git add src/app/hostels/[param]/page.tsx src/app/search/page.tsx src/app/globals.css e2e/hostel-detail-entry.spec.ts
git commit -m "feat: add destination search to hostel details"
```

### Task 2: Align the detail header, gallery, and page width

**Files:**
- Modify: `src/app/globals.css`
- Test: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- Consumes the destination form from Task 1.
- Preserves existing `HostelDetailGallery` props and share/save/photo-dialog behavior.

- [ ] **Step 1: Write failing layout browser tests**

Add a desktop E2E assertion that the detail header exposes a destination search and the listing shell is no wider than 1120px at a 1440px viewport. Extend the responsive test to assert that the centered search remains visible at 375px and the one-photo gallery spans its available columns.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`
Expected: the detail header search and centered shell assertions fail against the current implementation.

- [ ] **Step 3: Implement the header and gallery composition**

Refine the header search placement into balanced brand/search/account columns on desktop while preserving the tablet/mobile reflow from Task 1. Set the detail content shell to a centered 1120px maximum width with 32px minimum side gutters. Preserve the existing five-position CSS mosaic; ensure count-specific layouts use only present images and the one-image case fills the gallery.

- [ ] **Step 4: Run focused component and responsive browser tests**

Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`
Expected: the page remains within its viewport at 320, 768, 1024, and 1440px, and the header search is usable.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css e2e/hostel-detail-entry.spec.ts
git commit -m "style: center hostel detail header and gallery"
```

### Task 3: Match the listing summary and booking-card hierarchy

**Files:**
- Modify: `src/components/hostel-detail/HostelDetailOverview.tsx`
- Modify: `src/components/hostel-detail/HostelDetailGallery.tsx`
- Modify: `src/app/hostels/[param]/page.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/hostel-detail/HostelDetailOverview.test.tsx`
- Test: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- Consumes the existing hostel detail projection, real room list, rating, review count, and verification state.
- Retains the `HostelBookingCard` interface and its existing booking/date/guest behavior.

- [ ] **Step 1: Write failing overview tests**

Add tests for a normal listing showing its real gender category, city, capacity, room count, rating, review count, and verified state. Add a zero-review/unverified case asserting no numeric rating or guest-favorite claim appears, while the description remains available.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- --run src/components/hostel-detail/HostelDetailOverview.test.tsx`
Expected: new summary labels/structure assertions fail before implementation.

- [ ] **Step 3: Implement the summary hierarchy**

Move the area/city descriptor from the gallery intro to the summary below the mosaic. Replace the current vertical “Stay highlights” presentation at the top of the overview with a concise listing-type/city heading, an optional factual area label, and one capacity/room metadata line. Render a compact rating/review trust strip using the listing's own rating and review count, plus the existing verified state only when true. Keep the hostel description. Do not add unsupported guest-favorite, bedroom, bed, bath, or host-rating claims.

Set the desktop detail layout to a left listing-summary column and right sticky monthly booking card, matching the reference hierarchy while preserving the current rental controls. Stack the booking card below the summary when the viewport cannot comfortably support both columns.

- [ ] **Step 4: Run component tests and complete browser scenarios**

Run: `npm test -- --run src/components/hostel-detail/HostelDetailOverview.test.tsx`
Expected: all overview tests pass.

Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`
Expected: the complete available hostel detail suite passes with no horizontal overflow. Keep existing credential-dependent skips unchanged.

- [ ] **Step 5: Verify type safety and lint**

Run: `npm run typecheck`
Expected: `tsc --noEmit` exits 0.

Run: `npx eslint src/app/hostels/[param]/page.tsx src/app/search/page.tsx src/components/hostel-detail/HostelDetailOverview.tsx src/components/hostel-detail/HostelDetailOverview.test.tsx e2e/hostel-detail-entry.spec.ts`
Expected: no lint errors.

- [ ] **Step 6: Inspect desktop and mobile rendering**

Compare the rendered detail page at 1440px and 375px against the provided screenshot. Confirm the search submit, gallery show-all, booking inputs, and inquiry are reachable; no content outside the scope is removed.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/hostels/[param]/page.tsx src/app/search/page.tsx src/components/hostel-detail/HostelDetailGallery.tsx src/components/hostel-detail/HostelDetailOverview.tsx src/components/hostel-detail/HostelDetailOverview.test.tsx e2e/hostel-detail-entry.spec.ts
git commit -m "style: align hostel detail summary with reference"
```

### Final verification

- [ ] Run `npm test -- --run`; expected: the full Vitest suite passes.
- [ ] Run `npm run typecheck`; expected: exit code 0.
- [ ] Run `git diff --check`; expected: no whitespace errors.
- [ ] Inspect `git status --short`; stage/commit only files owned by this task and preserve all unrelated user changes.
