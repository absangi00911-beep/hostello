# Task 11 Completion Report — Date-aware availability alerts

## Scope and implementation status

Resumed from HEAD `486c39e`, preserving the existing criteria normalization commit `da9e0af` and availability-alert model, migration, API, service, and matcher groundwork commit `486c39e`. Completed the in-progress lifecycle, notification, student UI, marketplace entry points, cron registration, documentation, and associated tests.

- Availability is evaluated synchronously on create and criteria edit. HOSTEL and SEARCH evaluation use `getHostelStayAvailability` for the requested date range and guest count; SEARCH candidates use the canonical public-search filters only (`q`, city, gender, min/max price, amenities, verified, explicitly supplied nearby coordinates), without sort, pagination, or inferred location.
- Alert state is row-locked and updated with `matchVersion`; only unmatched-to-matched transitions create one in-app English notification in the same transaction. The unique notification key is `(availabilityAlertId, availabilityAlertTransition)`. Matched-to-unmatched resets the state for a later availability cycle.
- Re-evaluation is connected to booking creation and cancellation, owner/admin booking decisions, abandoned/unanswered booking expiry, room/capacity/listing edits and listing status transitions, blocked-date create/remove, and owner-account listing suspension/deletion. Relevant alert changes and notifications share the inventory/business transaction.
- Alerts expire when the Pakistan calendar check-in date begins; GET/evaluation enforces logical expiry and the registered cron performs cleanup.
- Student-only, rate-limited, bounded and user-scoped list/create/edit/pause/resume/delete APIs and a student-only management page support both alert types. Expired alerts remain deletable and can be replaced. Notifications route to the student alert manager, and approved search/detail surfaces prefill safe internal links.
- Updated `SYSTEM.md` API, notification, cron and generated repository-facts documentation.

## Verification

- Initial focused Task 11 run: **8 files, 40 tests passed**.
- Expanded Task 11-focused run: **18 files, 127 tests passed**.
- The first full Vitest run found two stale expectations that did not list the new expiry cron. Updated those expectations and verified the focused cron tests: **2 files, 6 tests passed**.
- Review found that expired alerts lacked a delete action. The updated component test reproduced the gap before the fix and passed afterward.
- Final full suite: `npm test -- --run` — **234 files passed, 1 skipped; 1,496 tests passed, 7 skipped**.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run docs:check` — passed: **80 routes, 9 cron jobs, 65 environment variables read, 41 Markdown files linked**. The first run identified missing Task 11 API/cron documentation and stale generated facts; these were corrected before the passing run.
- Vite emitted its existing `configLoader: 'native'` / `__dirname` deprecation warning during Vitest; it did not fail tests.

## Safety limits and residual verification

- Did not apply the Prisma migration, connect to any database/provider, or run browser E2E. No verified disposable local PostgreSQL/browser prerequisites were established, and those actions were explicitly excluded.
- Consequently, real-PostgreSQL concurrent/retry behavior and browser flows remain unverified in this environment; the implementation is covered by unit/API/component tests, typecheck, lint, and docs checks.
- `git diff --check` reported apparent trailing whitespace on added lines in `src/app/api/hostels/[param]/route.ts`. A byte-level scan of added lines (excluding CRLF terminators) and new Task 11 files found **no actual trailing spaces or tabs**; this is a CRLF line-ending artifact, so line endings were left unchanged. Unrelated existing worktree paths (`docs/team/`, `.github/agents/`, `docs/audits/`, and the plan file) were not included in Task 11 changes.

The continuation commit contains only Task 11 implementation, related tests/docs, and this report; the two prior Task 11 commits remain in history.

## Review fix round 1

Addressed the three review findings:

- **Concurrent false matches:** availability reads/evaluations and inventory mutations now acquire the same transaction-scoped PostgreSQL advisory lock before taking hostel, room, booking/hold, or alert row locks. Alert creation/edit/evaluation and inventory changes retain state/notification transaction coupling and the unique transition key. Converted the owner listing edit transaction to ReadCommitted so a transaction waiting for the advisory lock does not continue with a pre-wait snapshot; its conditional status update remains the optimistic concurrency guard. The exact-availability route also takes the lock before reading inventory. Regression tests verify lock-before-alert-write/evaluation ordering.
- **SEARCH notification destination:** notifications now use a validated fixed same-origin `/search` URL populated from saved filters, stay dates, and guest count. HOSTEL alerts continue to link to the alert manager. URL builder and notification/page tests cover the destinations and unsafe input.
- **Integration evidence:** added an opt-in PostgreSQL concurrency/retry/idempotency test guarded by an explicit environment flag and a disposable loopback `*_test` database check, plus discoverable Playwright create/manage flows for HOSTEL and SEARCH alerts guarded by safe test-auth and database prerequisites.

Verification for this round:

- `npm test -- --run src/app/api/hostels/[param]/availability/exact/route.test.ts src/lib/availability-alerts.test.ts src/lib/room-availability-service.test.ts src/lib/availability-alert-links.test.ts src/app/notifications/page.test.tsx src/app/api/notifications/route.test.ts src/app/search/search-params.test.ts --reporter=dot` — **7 files passed, 48 tests passed**.
- `npm test -- --run --reporter=dot` — **234 files passed, 2 skipped; 1,503 tests passed, 9 skipped**.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run docs:check` — passed: **80 routes, 9 cron jobs, 65 environment variables read, 41 Markdown files linked**.
- `npm run e2e -- --list e2e/availability-alerts.spec.ts` — discovered both HOSTEL and SEARCH management specs (**2 tests**); browser execution not performed.
- PostgreSQL integration test not run: no disposable loopback database and safe test auth were verified. No DB connection or migrations were attempted.

## Review fix round 2

Addressed the round-2 findings:

- **Global advisory-lock contention:** replaced the constant lock with transaction-scoped, hostel-keyed advisory locks. Multi-hostel acquisitions deduplicate and sort IDs before locking. SEARCH alert evaluation locks only hostels matching its saved public filters, then re-reads current filters and authoritative inventory. Ordinary single-hostel reads/mutations no longer serialize behind an unrelated hostel. Inventory-triggered alert evaluation runs after the inventory transaction commits, one alert transaction at a time; each alert's state transition and notification remain atomic. Late-payment seat-hold reinstatement now also reevaluates alerts after its successful transaction commits.
- **Full-stay SEARCH destination:** saved SEARCH notifications now link to `/search` with validated criteria, explicit `checkIn`, `checkOut`, and `guests`. Public search filters by seat holds overlapping the entire `[checkIn, checkOut)` stay and inclusive blocked dates before pagination; legacy move-in-only search remains compatible. Added coverage for exact dates and updated the notification expectation from `moveInDate` to `checkIn`.
- **Inventory-path audit:** verified booking create/cancel/decision/expiry, room/listing/blocked-date changes, account deletion, and late-payment reinstatement acquire hostel locks for inventory changes and reevaluate only after commit.

Verification:

- Focused availability/search regression command: `npm test -- --run src/app/api/admin/hostels/route.test.ts src/app/api/hostels/nearby/route.test.ts src/app/api/hostels/route.test.ts src/app/api/hostels/[param]/availability/exact/route.test.ts src/app/search/search-params.test.ts src/app/notifications/page.test.tsx src/lib/availability-alert-links.test.ts src/lib/availability-alerts.test.ts src/lib/booking-service.test.ts src/lib/hostel-search.test.ts src/lib/late-payment-resolution.test.ts src/lib/room-availability-service.test.ts --reporter=dot` — **12 files passed (12)**.
- Full Vitest command: `npm test -- --run --exclude "**/*.postgres.integration.test.ts" --reporter=dot` — **234 files passed, 1 skipped (235); exit 0**. The first run exposed a stale assertion expecting `moveInDate`; updated it to `checkIn`, then reran the full suite successfully.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run docs:check` — passed: `docs check passed: 80 routes, 9 cron jobs, 65 env vars read, 41 Markdown files linked.`
- `npm run e2e -- --list e2e/availability-alerts.spec.ts` — discovered the HOSTEL and SEARCH create/pause/edit/delete Playwright specs (**2 tests**); browser tests were not run.
- `git diff --check` reports apparent trailing whitespace on added lines in `src/app/api/hostels/[param]/route.ts`; a byte-level check of its 10 added lines found **0 actual trailing spaces/tabs** (CRLF line endings). Line endings were left unchanged.

The PostgreSQL integration spec was explicitly excluded from the Vitest run. Neither it nor browser execution was attempted because a disposable loopback database and safe test authentication were not verified. No database connection, migration, external provider, deployment, or push was attempted.

## Independent round-2 review and post-commit failure fix

The independent re-review found no additional issues in per-hostel lock ordering or full-stay SEARCH filtering. It identified one Medium failure-path issue: if alert reevaluation failed after the booking transaction committed, `createBooking` propagated the error and the route could respond with HTTP 500 even though the booking and seat holds existed. A client retry could then submit a second booking.

The booking service now catches only the post-commit alert reevaluation failure, emits `booking.availability_alerts.reevaluation_failed` with safe error fields, and returns the already committed booking. A regression test reproduces a `P2034` reevaluation failure and verifies the committed booking is returned and the operational error is recorded. The test failed before the service change and passed afterward.

The reviewer confirmed the fix and found no other actionable issues in the round-2 diff. Final verification after this change:

- `npm test -- --run` — **234 files passed, 2 skipped; 1,512 tests passed, 10 skipped**.
- `npm run typecheck` — passed.
- `npx eslint src/lib/booking-service.ts src/lib/booking-service.test.ts` — passed.
- `git diff --check` — no whitespace errors in the scoped source/test diff.

PostgreSQL concurrency and browser flows remain unverified. The alert-evaluation failure is surfaced in operational logs but is not durably retried; a later inventory transition can trigger another evaluation. Treat isolated PostgreSQL and browser runtime validation as Task 12 evidence gaps, not as verified behavior.