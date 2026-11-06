# Task 2 Report: Restore quality gates and owner form baseline

## Status

Completed. Base commit: `d39fca22e4d621507c36098c14de33b1f1b19f99`.

## Files changed

- Renamed `src/components/owner/listingForm.ts` to `src/components/owner/listing-form.ts`.
- Updated helper imports in:
  - `src/components/owner/ListingForm.tsx`
  - `src/components/owner/ListingForm.test.tsx`
  - `src/components/owner/ListingPhotosField.tsx`
  - `src/components/owner/ListingRoomsEditor.tsx`
  - `src/components/owner/listingForm.test.ts`
  - `src/lib/owner-listing.ts`
- Corrected missing document references in `SYSTEM.md`.

## Root cause

The helper `listingForm.ts` and component `ListingForm.tsx` differed only by case in their shared basename. The owner pages and component tests imported `ListingForm`, while several form modules and the edit data type imported `listingForm`. TypeScript resolved the colliding module path to `ListingForm.ts` in this Windows workspace, producing both `TS1149` case-collision errors and false `TS2305` missing-export errors. The component already exported `ListingForm` and `ListingSubmitted`; no exports or business behavior were changed. Renaming the helper to `listing-form.ts` removes the collision for every caller.

`SYSTEM.md` linked to absent `docs/SECURITY-CONTROLS.md` and `docs/ENGINEERING-PRINCIPLES.md` files twice each. The references now point to the existing security and risk sections in `SYSTEM.md` and the existing shared team instructions. The nonexistent private-bucket setup note was removed; no placeholder documents were added.

## RED evidence

- `npm run typecheck` — failed with `TS1149` for `ListingForm.ts` versus `listingForm.ts`, and `TS2305` for the expected named component exports.
- `npm run test -- --run src/components/owner/ListingForm.test.tsx src/app/owner/listings/new/page.test.tsx 'src/app/owner/listings/[id]/edit/page.test.tsx'` — failed in the component suite and both page-render tests. React reported an invalid/undefined element; 2 tests failed and 8 passed.
- `npm run test -- --run` — 3 failed files, 2 failed tests, 200 passed files, and 1,317 passed tests (1,319 total). The failures were the same owner component and create/edit page render failures.
- `npm run docs:check` — failed with four broken-link reports: two occurrences each for the two absent SYSTEM.md targets.

## GREEN evidence

- `npm run typecheck` — passed.
- `npm run test -- --run src/components/owner/ListingForm.test.tsx src/app/owner/listings/new/page.test.tsx 'src/app/owner/listings/[id]/edit/page.test.tsx' src/components/owner/listingForm.test.ts` — 4 files and 39 tests passed. This includes the component render/edit-mode checks, create/edit route rendering and authorization, payload/schema validation, invalid-input validation, and server-field-error parsing assertions.
- `npm run docs:check` — passed: 74 routes, 7 cron jobs, 65 environment variables read, and 40 Markdown files linked.
- `npm run lint` — passed.
- `npm run test -- --run` — 203 files and 1,331 tests passed.
- `git diff --cached --check` — passed before the code commit.

Vitest emits its existing non-failing warning that `vitest.config.ts` uses `__dirname` with the native config loader. No test or typecheck failures remain. No database, environment files, unrelated full-suite failures, or pre-existing untracked audit/plan files were changed.

## Commits

- `5c1b9af` — `fix: disambiguate owner listing form helper`
- Documentation and this report are committed in a separate commit from the code.

## Review round 1: ListingForm interaction coverage

The pre-change focused run was already green: `npm run test -- --run src/components/owner/ListingForm.test.tsx src/app/owner/listings/new/page.test.tsx 'src/app/owner/listings/[id]/edit/page.test.tsx'` passed 3 files / 22 tests. This review identified a coverage gap, not a failing production behavior, so there was no application code fix to drive red. The first run of the added assertions with that same command had 4 failed / 22 passed: the test harness lacked a `React` runtime import. After adding it, a rerun had 1 failed / 25 passed because the edit fixture was passed in the wrong prop shape. A subsequent harness simplification omitted the existing `ListingRoomsEditor` test import (2 failed / 24 passed); the import was restored. These RED results were test-harness errors, not product failures. No production behavior was changed.

Added component-level submissions to `ListingForm.test.tsx`: create submits POST with the exact validated JSON payload; edit submits PATCH with the stored listing payload; empty required values prevent network submission and expose validation feedback; and a rejected server response is rendered in the form error summary. The component is invoked with a small React hook-state harness because this Vitest project uses Node and has no DOM renderer; tests call the component's real submit handler and inspect its resulting element tree. No dependencies were added.

**Final verification**

- `npm run test -- --run src/components/owner/ListingForm.test.tsx src/app/owner/listings/new/page.test.tsx 'src/app/owner/listings/[id]/edit/page.test.tsx'` — 3 files / 26 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test -- --run` — 203 files / 1,335 tests passed.
- `git diff --check` — passed.

The existing non-failing Vitest warning about `__dirname` in `vitest.config.ts` remains. Only `ListingForm.test.tsx` and this report changed in this review round.
