# Hostel Detail Reference Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the complete HostelLo hostel-detail page to the supplied Airbnb screenshot’s style, spacing, layout, and sizing while retaining HostelLo identity, truthful listing content, and working interactions.

**Architecture:** Keep the existing Next.js server page and detail components, changing the gallery-photo presentation helper to combine unique listing and room photos with accurate alt text. Apply the visual match in scoped detail-page CSS, then verify the rendered desktop and responsive layouts with the existing Playwright suite.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-hostel-detail-reference-match-design.md`

## Global Constraints

- The supplied Airbnb screenshot is the authoritative reference for the proportions and spacing visible at its captured viewport.
- Keep the HostelLo wordmark and existing deep-green brand accents; do not use Airbnb’s coral-red.
- Use only real listing cover/gallery photos and actual room photos belonging to the displayed hostel; do not invent photos or listing claims.
- Preserve the existing booking rules, save/share behavior, review content, approximate-map privacy, and host-inquiry behavior.
- Avoid horizontal overflow at 320, 375, 768, 1024, and 1440 CSS pixels.
- Do not add a dependency or change unrelated product surfaces.

## Review Focus

- Listings with no cover, gallery, or room images must retain an honest empty state and no broken image dialog. Test in Task 1.
- Duplicate image URLs across cover/gallery/rooms must not create duplicate mosaic tiles; retain the first source’s accurate alternative text. Test in Task 1.
- Long listing/room names and area strings must not force horizontal overflow on mobile. Test in Task 2.
- Narrow tablet widths must stack the reservation card before its controls become cramped, while desktop keeps it beside the overview. Test in Task 2.
- Listings without ratings, category scores, rooms, coordinates, or reviews must keep existing truthful empty states through visual restyling. Test in Task 3.

---

### Task 1: Compose truthful gallery imagery

**Files:**
- Modify: `src/lib/hostel-detail-presentation.ts`
- Modify: `src/lib/hostel-detail-presentation.test.ts`
- Modify: `src/app/hostels/[param]/page.tsx`
- Modify: `src/components/hostel-detail/HostelDetailGallery.tsx`
- Modify: `src/components/hostel-detail/HostelDetailGallery.test.tsx`

**Interfaces:**
- Produces: `HostelDetailPhoto = { src: string; alt: string }`.
- Produces: `getHostelGalleryPhotos(hostelName: string, coverImage: string | null, images: string[], rooms: readonly { name: string; images: string[] }[]): HostelDetailPhoto[]`.
- Consumes: the existing `hostel.coverImage`, `hostel.images`, and `hostel.rooms_rel` page data.
- The helper returns all unique usable photos in cover/gallery/room order. `HostelDetailGallery` displays at most five in its mosaic and retains all returned photos in the photo dialog.

- [ ] **Step 1: Write helper tests** for cover-first ordering; unique URLs across listing and room photos; room-specific alt text for room images; ignored whitespace URLs; and empty input returning no photos.
- [ ] **Step 2: Run `npm test -- --run src/lib/hostel-detail-presentation.test.ts`** and confirm the new helper tests fail before implementation.
- [ ] **Step 3: Implement `HostelDetailPhoto` and `getHostelGalleryPhotos(...)`** in `src/lib/hostel-detail-presentation.ts`; trim URLs, preserve first occurrence, and label listing photos with the hostel name and room photos with the room name.
- [ ] **Step 4: Pass the composed photo objects from the detail route** and update `HostelDetailGallery` to render `src` and each photo’s `alt` in both mosaic and dialog.
- [ ] **Step 5: Update gallery tests** to assert the five-tile mosaic limit, the complete photo dialog, accurate alt text, and the empty state.
- [ ] **Step 6: Run `npm test -- --run src/lib/hostel-detail-presentation.test.ts src/components/hostel-detail/HostelDetailGallery.test.tsx`** and confirm all tests pass.
- [ ] **Step 7: Commit** as `feat: include real room photos in hostel gallery`.

### Task 2: Match the first viewport geometry

**Files:**
- Modify: `src/app/globals.css` (hostel detail header, title/actions, gallery, overview, and reservation-card rules and breakpoints)
- Modify: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- Consumes: `HostelDetailPhoto[]` from Task 1.
- Preserves the existing header form, gallery dialog/save/share controls, overview data, reservation form, and date-selection provider APIs.

- [ ] **Step 1: Add Playwright assertions** to the existing detail layout test for title/actions above the gallery; the mosaic showing up to five unique photos; a wide, shallow gallery; and desktop overview and booking card sharing a row.
- [ ] **Step 2: Run `npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts -g "centered content"`** with `PLAYWRIGHT_BASE_URL=http://localhost:3000`; confirm the new reference geometry assertions fail against the current styling.
- [ ] **Step 3: Update the detail-specific CSS** to match the supplied screenshot’s compact header, centered approximately 1120px shell, title/action scale, wide shallow mosaic, summary/sidebar proportions, fine dividers, and compact reservation card; retain the green brand accent and existing state styles.
- [ ] **Step 4: Add/update responsive assertions** at 320px, 375px, 768px, 1024px, and 1440px for visible destination search, non-overflowing text, and side-by-side versus stacked reservation layout.
- [ ] **Step 5: Run the focused Playwright test** and verify all new geometry and responsive assertions pass.
- [ ] **Step 6: Inspect a desktop and mobile screenshot** against the supplied reference; correct only measurable differences in first-viewport proportions and spacing.
- [ ] **Step 7: Commit** as `style: align hostel detail first viewport with reference`.

### Task 3: Match the lower-page section rhythm

**Files:**
- Modify: `src/app/globals.css` (room, amenity, calendar, review, location, and host rules and breakpoints)
- Modify: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- Consumes the current room, amenity, calendar, review, location, and host components and their existing data contracts.
- Must not change API, booking, date-selection, review, map-privacy, or inquiry behavior.

- [ ] **Step 1: Add or update Playwright assertions** for the existing section order; compact two-column room and amenity grids where space allows; review category/content alignment; map and host section spacing; and no horizontal overflow across the five required viewport widths.
- [ ] **Step 2: Run the focused hostel-detail Playwright suite** and confirm any new layout assertions expose the current styling mismatch.
- [ ] **Step 3: Restyle the existing lower sections** with the reference’s restrained typography, thin separators, light surfaces, modest rounding, and tighter vertical rhythm, preserving all current text, controls, empty states, and factual metrics.
- [ ] **Step 4: Adjust responsive CSS** so grids collapse before content becomes cramped and preserve calendar navigation and readable map/host content.
- [ ] **Step 5: Run the focused Playwright suite** and confirm layout and existing interactions pass.
- [ ] **Step 6: Inspect the full-page desktop and mobile renders** against the supplied screenshot and fix any clearly measurable spacing, sizing, or overflow defects.
- [ ] **Step 7: Commit** as `style: match hostel detail section rhythm`.

### Task 4: Verify the complete page and review the final diff

**Files:**
- Verify: all files changed in Tasks 1–3.

- [ ] **Step 1: Run `npm test -- --run`** and confirm the full Vitest suite passes.
- [ ] **Step 2: Run `npm run typecheck`** and confirm TypeScript passes.
- [ ] **Step 3: Run focused ESLint** on changed TypeScript/TSX files and confirm it passes.
- [ ] **Step 4: Run `npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`** with `PLAYWRIGHT_BASE_URL=http://localhost:3000`; confirm all non-OAuth-config-dependent tests pass.
- [ ] **Step 5: Review `git diff --check` and the complete feature diff**; confirm unrelated worktree changes remain untouched and no unsupported content or image sources were introduced.
- [ ] **Step 6: Commit any required final correction separately** with a descriptive message and the repository’s required Copilot co-author trailer.

---

## Self-review

- **Spec coverage:** Real cover/gallery/room photo selection and alt text are covered in Task 1; first-viewport geometry and responsive composition in Task 2; all lower page sections and truth-preserving empty states in Task 3; whole-change quality gates in Task 4.
- **Step scan:** Each task starts with a failing or discriminating test, makes one coherent implementation change, verifies it, and ends with a commit.
- **Type consistency:** The photo helper returns `{ src, alt }` values and the gallery consumes that exact shape; page wiring passes the route’s existing listing and room data.
- **Review focus:** All five identified failure modes map to explicit tests in their owning tasks.
- **Proportion:** Four tasks separate image-source behavior, first viewport, lower-page styling, and final verification without splitting the continuous page into unrelated projects.
