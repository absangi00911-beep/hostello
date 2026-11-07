# HostelLo Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the eight approved HostelLo capability-map modules, repair code-level P0/P1 blockers, and verify local and sandbox behavior without authorizing live transactions or production changes.

**Architecture:** Follow the capability-map dependency order and preserve the existing Next.js/Prisma application. Make PostgreSQL date-bounded seat holds the single booking-availability authority, then connect student, owner, alert, notification, and payment flows to that contract. Keep deploy, payout-policy changes, and shared-database migrations outside this implementation.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, Vitest, Playwright, QStash, Safepay sandbox.

**Spec:** `HOSTELLO-CAPABILITY-MAP.md`; module specs in `docs/superpowers/specs/SPEC-*.md`; approved late-payment behavior from the project owner: reinstate only when the requested seats are available for the full date range, otherwise refund the full successful payment. Payout behavior is frozen pending qualified review.

## Global Constraints

- Preserve the listings-first home; do not add a marketing homepage.
- Require a specific `roomId` for new bookings and revalidate the room, dates, guests, listing, blocks, and capacity on the server.
- Stays occupy `[checkIn, checkOut)`; normalize date-only inputs to Pakistan-local calendar dates on the server.
- Owner block ranges are inclusive; a block cannot invalidate active holds.
- Keep unpaid 30-minute holds and the paid pending 24-hour owner response window.
- Use one authoritative PostgreSQL seat-hold model for booking writes and exact availability reads; keep legacy columns until a later approved contract migration.
- Do not silently drop or guess mappings for active legacy bookings without rooms; preflight and stop on unresolved conflicts.
- Never use live provider credentials, issue real refunds, change payout rules, deploy, or migrate a shared/production database.
- Keep student/private data server-authorized and minimized; do not expose owner contact or admin-only listing data in public projections.
- Frontend work is mobile-first; target WCAG AA contrast, keyboard access, semantic status announcements, and 44px minimum touch targets.
- Run `npm run typecheck`, `npm run lint`, and `npm run test -- --run`; use a disposable PostgreSQL database for database integration and E2E checks.
- Read the repo's shared instructions and the installed Next.js 16 docs before writing Next.js code.

## Review Focus

- **Legacy active bookings without a room or with conflicting occupancy:** migration preflight must identify all of them and halt without modifying data until explicitly mapped or resolved (Task 4).
- **Date boundaries and concurrent hold/block/capacity writes:** `[checkIn, checkOut)`, inclusive owner blocks, and parallel attempts for the last seats must agree across reads and writes (Tasks 4–5).
- **Late-payment and refund races:** cron/webhook ordering, duplicate deliveries, and sweeper retries must result in one booking reinstatement or one full refund, never a lost or double charge (Task 6).
- **Public and role-scoped data:** unauthenticated student views must not expose owner contact, verification documents, bank details, or unauthorized admin actions (Tasks 7–10).
- **At-least-once delivery:** provider acceptance followed by a process crash must not create duplicate outbox work or repeat a price-alert notification (Task 6).

---

### Task 1: Approve implementation-ready screen designs

**Files:**
- Create/update: `docs/superpowers/specs/2026-11-04-hostello-screen-design.md`
- Reference: `docs/superpowers/specs/SPEC-web-foundation.md`
- Reference: `docs/superpowers/specs/SPEC-student-marketplace.md`
- Reference: `docs/superpowers/specs/SPEC-owner-workspace.md`
- Reference: `docs/superpowers/specs/SPEC-admin-console.md`
- Reference: `docs/superpowers/specs/SPEC-notification-center.md`
- Reference: `docs/superpowers/specs/SPEC-availability-alerts.md`

**Interfaces:**
- Consumes: the approved module behavior and this plan's global constraints.
- Produces: founder-approved mobile/desktop screen and state designs for UI tasks 3, 7–11.

- [ ] **Step 1: Produce one consolidated screen/state design spec** covering each module's purpose, goal, layout, copy, loading/empty/error/success/permission-denied states, and responsive/accessibility behavior. Reconcile existing dated designs; do not invent capabilities or legal/payment policy.
- [ ] **Step 2: Check design criteria** for 360px-wide screens, WCAG AA contrast, visible focus, semantic labels/status, 44px tap targets, reduced motion, listings-first navigation, and only supported sign-in methods.
- [ ] **Step 3: Obtain explicit Founder sign-off** on the visual direction and the consolidated design before implementing UI. Record unresolved product decisions as blockers, not assumptions.

**Acceptance:** Each planned screen can be implemented without guessing its primary layout or required states; no implementation starts before explicit design sign-off.

### Task 2: Restore trustworthy quality gates and fix owner form baseline

**Files:**
- Inspect/modify: `src/components/owner/ListingForm.tsx`, `src/components/owner/listingForm.ts`, owner listing create/edit pages and adjacent tests
- Tests: `src/components/owner/ListingForm.test.tsx`, `src/app/owner/listings/new/page.test.tsx`, `src/app/owner/listings/[id]/edit/page.test.tsx`
- Docs gate: `SYSTEM.md`, `scripts/check-docs.mjs`-validated links

**Interfaces:**
- Consumes: current create/edit listing APIs and existing shared form contracts.
- Produces: type-safe, renderable owner listing create/edit form used by Task 9.

- [ ] **Step 1: Re-run baseline checks** with `npm run typecheck`, the three focused owner tests, `npm run test -- --run`, and `npm run docs:check`; capture current failures rather than relying on the audit's export description.
- [ ] **Step 2: Fix the verified root causes only.** Check case-only module collisions on Windows and rename the helper/component boundary if needed; retain the existing named exports if they are present. Resolve the specific broken documentation links blocking `docs:check`, without creating placeholder documents.
- [ ] **Step 3: Add/adjust focused assertions** proving new/edit pages render and submit the expected validated data; include invalid input and server error state.
- [ ] **Step 4: Verify** with `npm run typecheck`, all focused owner tests, and `npm run docs:check`.

**Acceptance:** Owner form pages typecheck and their focused tests pass; docs validation no longer fails on missing links. Record unrelated suite failures separately for Task 12.

### Task 3: Complete web foundation

**Files:**
- Existing shell: `src/app/layout.tsx`, `src/app/page.tsx`
- Shared UI: `src/components/layout/`, `src/components/states/`, `src/components/auth/`
- Existing tests: `src/components/layout/SiteChrome.test.tsx`, `src/components/layout/MobileTabNavigation.test.tsx`, auth and state component tests
- Browser tests: `e2e/web-foundation.spec.ts`, `e2e/role-redirects.spec.ts`

**Interfaces:**
- Consumes: Task 1 approved designs and Task 2 verified owner form boundary.
- Produces: stable responsive shell, navigation, shared states, and accessible primitives for Tasks 7–11.

- [ ] **Step 1: Add failing component/browser assertions** for role-aware destinations, keyboard navigation/focus, configured auth methods, and loading/empty/error/denied shared states.
- [ ] **Step 2: Implement only approved foundation differences** using the existing shared layout and component patterns; keep the root route listings-first and do not duplicate primitives in feature areas.
- [ ] **Step 3: Run focused unit tests and `npm run e2e -- --list`;** execute browser checks against the disposable E2E configuration after Task 12 environment validation.

**Acceptance:** Shared shell and navigation work for supported roles, auth choices match provider configuration, and foundation tests pass at mobile and desktop viewport sizes.

### Task 4: Add date-aware room inventory and safe migration foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: raw SQL migration under `prisma/migrations/`
- Update: `prisma/MIGRATIONS.md`, `SYSTEM.md`
- Modify: `src/lib/room-inventory-service.ts`, `src/lib/hostel-service.ts`
- Modify: `src/app/api/hostels/route.ts`, `src/app/api/hostels/[param]/route.ts`
- Tests: adjacent room-inventory service/API tests and a PostgreSQL integration test suite

**Interfaces:**
- Consumes: approved seat-hold model; existing Room and Booking IDs and owner-scoped listing mutation APIs.
- Produces: atomic room/listing mutations and a hold persistence contract keyed by `roomId`, `seatNo`, and `[checkIn, checkOut)` for Task 5.

- [ ] **Step 1: Add failing validation/service tests** for stable room IDs, server-derived totals, owner authorization, and rejecting capacity reductions/removal that conflict with active holds.
- [ ] **Step 2: Implement migration preflight and hold schema.** Add a PostgreSQL exclusion constraint preventing overlapping date ranges for the same room seat. Keep `Room.available`, `version`, and nullable legacy `Booking.roomId` during expand-and-contract.
- [ ] **Step 3: Implement transaction-safe room/listing create/edit** preserving room IDs; do not trust client availability counts.
- [ ] **Step 4: Add migration/preflight tests** for roomless active bookings, conflicting mappings, and constraint availability; fail closed on unresolved records or missing PostgreSQL support.
- [ ] **Step 5: Validate** Prisma schema, migration SQL, service tests, and disposable-PostgreSQL constraint behavior; do not deploy the migration.

**Acceptance:** New inventory is represented without destroying legacy fields; owner edits are atomic, preserve IDs, and cannot invalidate active allocations. A preflight report blocks unresolved legacy mapping.

### Task 5: Enforce exact availability, booking holds, and lifecycle

**Files:**
- Modify: `packages/shared/src/validations/index.ts`
- Modify: `src/lib/booking-service.ts`, `src/lib/room-inventory-service.ts`
- Modify: `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`
- Modify: `src/app/api/hostels/[param]/availability/route.ts` or add an exact-range route
- Modify: `src/app/api/owner/hostels/[id]/blocked-dates/route.ts`
- Modify: abandoned-payment and unanswered-booking cron routes
- Tests: adjacent booking, availability, block-date, room-inventory tests; PostgreSQL race tests

**Interfaces:**
- Consumes: Task 4 hold schema.
- Produces: one transactional availability service used by booking writes, exact reads, owner blocks/capacity edits, and payment reinstatement in Task 6.

- [ ] **Step 1: Add failing tests** for required `roomId`, valid future ordered dates, exact full-stay availability, half-open checkout boundaries, inclusive blocked-date conversion, and HTTP 409 for stale capacity.
- [ ] **Step 2: Implement a shared transaction API** that allocates one seat hold per guest and checks listing/room state, blocks, and capacity within the same transaction. Lock the relevant room/block state so concurrent block or capacity changes cannot race allocation.
- [ ] **Step 3: Add exact-range availability** returning per-room capacity, available seats across the whole stay, and fit status only; keep monthly aggregate output informational.
- [ ] **Step 4: Release holds atomically** on cancellation, decline, payment expiry, and abandonment; checkout ends occupancy by interval boundary without a completion cleanup.
- [ ] **Step 5: Run disposable-PostgreSQL tests** proving exactly one winner for parallel last-seat requests; cancel/rebook; expiry; checkout; block-vs-booking race; capacity-edit-vs-booking race; and state-transition occupancy invariants.

**Acceptance:** Reads and booking writes use the same authority; date/block boundaries and concurrency are proven against PostgreSQL; booking conflicts return actionable 409s.

### Task 6: Resolve payment reconciliation and reliable background work

**Files:**
- Modify: `src/app/api/payment/webhook/route.ts`, `src/app/api/cron/cancel-abandoned-payments/route.ts`
- Modify: `src/lib/refunds.ts`, `src/app/api/health/payments/route.ts`, admin refund/payment-event APIs
- Modify: `src/lib/cron-schedules.ts` and QStash scheduler/health plumbing
- Modify: `src/lib/price-alerts.ts`, `src/app/api/cron/check-price-alerts/route.ts`
- Add: outbox schema, migration, transactional enqueue/claim/dispatch service, and QStash drain route
- Modify: `src/lib/email.ts`, auth rate-limit/security files where R-10/R-14 gaps are verified
- Tests: `src/app/api/payment/webhook/route.test.ts`, `src/lib/refunds.test.ts`, `src/lib/refunds-claim.test.ts`, cron and price-alert tests, new outbox tests

**Interfaces:**
- Consumes: Task 5 exact `roomId` hold allocation/release contract; existing refund compare-and-set and audit event mechanisms.
- Produces: idempotent late-payment resolution and durable retryable email work; payout behavior remains unchanged.

- [ ] **Step 1: Add failing webhook/cron race tests** for both cancelled payment states, failed-then-succeeded tracker, duplicate and concurrent deliveries, and late success racing cancellation.
- [ ] **Step 2: Implement the approved policy** transactionally: record late payment and its full refundable amount; reinstate only if Task 5 can atomically claim all required seats for the stay; otherwise issue the full refund using the existing claim/audit/provider flow. Expose unresolved provider outcomes in health and admin queues.
- [ ] **Step 3: Add a refund sweeper** for eligible cancelled/paid positive-refund records. Reuse `processRefund` and its compare-and-set claim; exclude records eligible for reinstatement until policy evaluation is complete.
- [ ] **Step 4: Add an outbox** written in the same transaction as the business event, with leases/claims and stable idempotency through QStash retries. Close the price-alert send-before-deactivate duplicate window.
- [ ] **Step 5: Add retry/failure tests** for concurrent drainers, lease expiry, transaction rollback, provider rejection, accept-then-crash, duplicate price-alert evaluation, and uncertain refund outcome.
- [ ] **Step 6: Fix verified R-10/R-14 code gaps** (credential enumeration/timing, lockout abuse, suspension/admin controls, Resend timeout) with focused tests; do not invent MFA, approval thresholds, retention, or payout policy. Escalate any policy-dependent gaps.
- [ ] **Step 7: Validate locally and in provider sandbox only.** Sandbox round-trip/retry evidence is a release prerequisite; never use live credentials or make a live payment/refund.

**Acceptance:** No attached late payment is silently lost or unrefundable; duplicate deliveries/refund attempts are idempotent and auditable; failed email work is durable; payout code/policy is untouched.

### Task 7: Complete notification center

**Files:**
- Modify: `src/app/notifications/page.tsx`
- Modify: `src/components/notifications/NotificationsPage.tsx`, `useUnreadNotificationCount.ts`
- Modify: `src/components/auth/BrowseAccountMenu.tsx` and shared navigation only as approved
- APIs: `src/app/api/notifications/route.ts`, `src/app/api/notifications/[id]/route.ts`
- Tests: adjacent notification API/component tests and `e2e/` notification flow

**Interfaces:**
- Consumes: Task 3 shell and existing notification API; Task 6 outbox/in-app notification delivery where applicable.
- Produces: paginated, role-safe notification flows for marketplace, owner, admin, and alerts.

- [ ] **Step 1: Add failing tests** for loading, empty, pagination, read-one, read-all, delete, failed action retry, safe destination handling, and user scoping.
- [ ] **Step 2: Implement approved screen states and feedback** without duplicating shell/navigation primitives or exposing cross-user data.
- [ ] **Step 3: Verify component/API tests and keyboard/screen-reader behavior** in the browser suite.

**Acceptance:** All roles have an accessible notification entry and explicit list/action states; user scope and safe navigation are enforced.

### Task 8: Complete student marketplace

**Files:**
- Modify: `src/components/home/ProductHome.tsx`, `src/app/search/`, `src/app/hostels/[param]/`
- Add/modify: public-safe hostel detail API projection and exact availability client consumption
- Modify: booking, payment, trips, wishlist, profile, verification, conversation, review, and roommate surfaces under `src/app/` and `src/components/student/`
- Tests: existing home/search/detail/student component and API tests; `e2e/search-page.spec.ts`, `e2e/mobile-student-experience.spec.ts`

**Interfaces:**
- Consumes: Tasks 3, 5, 6, and 7; existing API contracts only after authorization/output suitability is verified.
- Produces: listings → details → dates/room → booking review → Safepay initiation → booking account journey.

- [ ] **Step 1: Add failing API/UI tests** for public PII redaction, search filters/pagination, date/guest selection, exact availability, room-required booking, and stale-result conflict.
- [ ] **Step 2: Implement public-safe detail projection**; do not use the admin-only hostel endpoint for student detail.
- [ ] **Step 3: Implement responsive search/detail/booking/account states** from Task 1 design, clearly separating payment success, booking pending, and owner confirmation.
- [ ] **Step 4: Run focused tests and browser smoke** for search → detail → date/room selection → booking review, including unavailable-room conflict and 360px layout.

**Acceptance:** Students can discover and request a specific available room without leaking private owner/admin fields or claiming a stay is confirmed prematurely.

### Task 9: Complete owner workspace

**Files:**
- Modify: `src/app/owner/`, `src/components/owner/`
- Modify: owner listing, room, blocked-date, booking, analytics, earnings, review, messaging, and subscription API integrations only as required
- Tests: owner component/API tests including `ListingForm.test.tsx`, blocked-dates, booking, earnings, reviews
- Browser tests: owner workspace E2E specs

**Interfaces:**
- Consumes: Tasks 2–7, especially stable listing form and Task 5 capacity/block contract.
- Produces: owner-scoped listing/room management, booking decisions, and existing workspace flows.

- [ ] **Step 1: Add failing tests** for create/edit/remove room, stable IDs, pending-review state, paid booking confirm/decline, capacity/block conflict, and owner-vs-other-owner authorization.
- [ ] **Step 2: Implement owner screens and conflict feedback** using shared foundation; all mutations remain server-authorized and owner-scoped.
- [ ] **Step 3: Verify listing edit → room update and booking confirm/decline** with disposable data; cover mobile layout and form validation.

**Acceptance:** Owners can manage rooms and existing tools, but cannot create blocks or capacity changes that invalidate active holds.

### Task 10: Complete admin console

**Files:**
- Modify: `src/app/admin/`, `src/components/admin/`
- APIs: existing `src/app/api/admin/` routes only where verified gaps block current documented workflows
- Tests: admin component/API tests for overview, listings, verification, refunds, payouts, reports, payment events, and search sync
- Browser tests: admin review and payment-operations flow with non-production data

**Interfaces:**
- Consumes: Task 3 shell, Task 6 payment/refund status, Task 7 notifications; existing server-side admin authorization.
- Produces: navigable moderation, verification, refund, payout, payment-event, and search-operations UI.

- [ ] **Step 1: Add failing tests** for loading/empty/error/permission-denied/uncertain states, destructive confirmation, action audit visibility, and no unsupported actions.
- [ ] **Step 2: Implement approved queue/detail/action screens**; keep ID documents, bank/payment data, and student PII within already authorized routes and minimum display.
- [ ] **Step 3: Run component/API tests and a non-production browser workflow** for listing review and one payment-operations action.

**Acceptance:** Existing admin workflows have clear states and irreversible actions require confirmation; no new policy or privileged action is invented.

### Task 11: Implement date-aware availability alerts

**Files:**
- Add: availability-alert model, migration, service, and student-only API routes
- Modify: inventory transition services and safe notification link construction
- Add: student alert management page/components under `src/app/` and `src/components/student/`
- Tests: criteria/matching/service/API/PostgreSQL tests and browser tests

**Interfaces:**
- Consumes: Tasks 5 and 7 exact availability and notification contracts.
- Produces: HOSTEL and SEARCH alert create/manage APIs and UI, linked from approved marketplace surfaces.

- [ ] **Step 1: Add failing tests** for criteria normalization, valid future dates/guest bounds, immediate match, unmatched→matched notification, repeated match suppression, matched→unmatched reset, expiry, pause/resume/edit/delete, and student-only scope.
- [ ] **Step 2: Implement matching** against the same authoritative availability service; atomically persist alert transition and one in-app notification. Support only public search filters and store only minimum criteria.
- [ ] **Step 3: Trigger re-evaluation** for booking creation/cancel/expiry, owner decisions, room/capacity edits, blocks, and listing activation changes.
- [ ] **Step 4: Test** concurrent/retried events against disposable PostgreSQL and browser-manage both alert types.

**Acceptance:** Each alert sends one in-app notification per transition to available, never repeats while matched, expires at check-in, and supports all specified management actions.

### Task 12: Reconcile documentation, run full verification, and record release blockers

**Files:**
- Update: `SYSTEM.md`, `HOSTELLO-CAPABILITY-MAP.md`, relevant `docs/superpowers/specs/`, `prisma/MIGRATIONS.md`, `CHANGELOG.md`, `PROJECT_STRUCTURE.md`, `WEB_APP_PROGRESS.md`, `README.md`
- Update: `.github/workflows/` only for verified repository-level CI failures
- Report: `docs/audits/` with an end-of-project evidence-backed re-audit

**Interfaces:**
- Consumes: completed implementation and test evidence from Tasks 1–11.
- Produces: accurate module/risk/test/deployment status and a release checklist separating code gates from account-only actions.

- [ ] **Step 1: Update stale claims** (UI/E2E status, tests, migration ledger, dead links, auth methods, late-payment policy, module statuses) only after verifying them against code and commands.
- [ ] **Step 2: Run** `npm run typecheck`, `npm run lint`, `npm run test -- --run`, `npm run test:scripts`, `npm run docs:check`, `npx prisma validate`, `npx tsc --noEmit` in `packages/shared`, and `npm run e2e -- --list`.
- [ ] **Step 3: Run browser E2E** with a disposable database for student search/booking, owner room/booking, admin operation, notifications, and alerts. Record tests not runnable and why.
- [ ] **Step 4: Complete sandbox-only Safepay refund/retry validation, QStash retry checks, and a disposable-database backup/restore rehearsal.** Do not contact live provider accounts.
- [ ] **Step 5: Re-audit all capability specs, P0/P1 code risks, docs links, and claims changed by this work; publish remaining findings with evidence and owners.**
- [ ] **Step 6: Report external owner-only release gates**: GitHub production reviewers, Neon snapshot secrets/variables and required flag, Vercel Node setting, first green remote CI run, qualified Pakistan payout/custody review, and any production approval. Do not mark the product cleared for live transaction volume while any P0 gate remains.

**Acceptance:** All local gates pass or are explicitly documented as blocked; E2E/sandbox evidence is recorded; docs match verified behavior; external controls and unresolved P0s are not represented as complete.
