# HostelLo Payout & Refund Phase 1 Implementation Plan

**Goal:** Close both P0 money-integrity gaps from the July 1, 2026 audit — a manual-ledger owner payout system, and an admin-triggered refund flow with a best-effort automatic Safepay call and a manual fallback that always works.

**Architecture:** One migration adds `Payout`, `PayoutStatus`, and the new fields on `Booking`/`User` described in the spec. Two new pure-logic service files (`src/lib/payouts.ts`, `src/lib/refunds.ts`) carry the eligibility/state-transition rules and are tested in isolation before anything touches a route. New admin surfaces are additive (`/admin/payouts` is new; `/admin/bookings` gets one new action). Owner gets one new page (`/owner/earnings`).

**Tech Stack:** Next.js Route Handlers, Prisma, Vitest (TDD — write the failing test before the implementation, per existing project convention), existing `src/lib/notifications.ts` for the student-facing refund notice.

**Full design:** `docs/superpowers/specs/2026-07-01-payout-refund-system.md` — read that first, especially the Safepay-endpoint caveat before Task 5.

---

## Scope Check

This plan covers payout + refund only. It does not touch JazzCash/EasyPaisa, partial refunds, commission logic, or self-service refund requests — all explicitly deferred in the spec. Every task stages only the files it names.

## File Structure

- Modify `prisma/schema.prisma`: add `Payout`, `PayoutStatus`, `Booking.payoutId`/`refundedAt`/`refundedBy`, `User.bankAccountTitle`/`bankAccountNumber`/`bankName`.
- Create migration via `npm run migrate:new`.
- Create `src/lib/payouts.ts`: eligibility query, batch creation, mark-paid logic.
- Create `src/lib/payouts.test.ts`.
- Create `src/lib/refunds.ts`: refund state-transition logic (policy only, no I/O).
- Create `src/lib/refunds.test.ts`.
- Modify `src/lib/safepay.ts`: add `refundPayment()`, clearly commented as unverified endpoint.
- Create `src/app/api/admin/payouts/route.ts`: `GET` (list owners with pending balances), `POST` (generate a batch).
- Create `src/app/api/admin/payouts/[id]/route.ts`: `PATCH` (mark paid).
- Create `src/app/api/admin/payouts/route.test.ts`.
- Create `src/app/admin/payouts/page.tsx`: admin payout queue UI.
- Create `src/app/owner/earnings/page.tsx`: owner-facing pending balance + payout history.
- Modify `src/app/api/admin/bookings/[id]/refund/route.ts` (new file): `PATCH` to process a refund — separate from the student-facing booking route since this is a privileged, audited action.
- Modify `src/app/admin/bookings/page.tsx`: add the "Process refund" action for `PAID` + `CANCELLED` rows.
- Modify `src/lib/notifications.ts` or add a helper: refund-processed notification to the student.
- Modify `e2e/owner-flow.spec.ts` or add a focused spec if a booking → cancel → refund → payout-exclusion path is worth covering end-to-end.

---

### Task 1: Data model ✅

**Files:** `prisma/schema.prisma`, one new migration folder.

- [x] Add `Payout` model and `PayoutStatus` enum as specced.
- [x] Add `payoutId` (optional, relation) + `refundedAt` + `refundedBy` to `Booking`.
- [x] Add `bankAccountTitle`, `bankAccountNumber`, `bankName` (optional strings) to `User`.
- [x] Migration generated and verified — see note below.

**Note on how this migration was generated:** `npx prisma migrate dev` couldn't run in the sandbox this was built in — it needs to fetch a schema-engine binary from `binaries.prisma.sh`, which that sandbox's network doesn't reach. The migration SQL was hand-written to match this project's exact existing conventions (constraint naming, column padding, `RESTRICT` vs `SET NULL` chosen per the required/optional-relation pattern already used on `Booking.hostelId`/`Booking.roomId`), then verified for real: a local Postgres 16 instance had all 15 existing migrations applied via `psql`, then this one applied on top with zero errors, and the resulting `payouts`/`bookings`/`users` table structures were inspected directly and matched the schema exactly. Still worth running `npm run migrate:new` (or just `prisma migrate dev`, which will recognize this migration as already matching the schema and apply cleanly) in your own environment as a final check before merging.

### Task 2: Payout service ✅

**Files:** `src/lib/payouts.ts`, `src/lib/payouts.test.ts`

- [x] Tests written and run for real (`npx vitest run` — 13/13 passing): eligibility filter, batch total math, the race where a concurrent batch claims a booking first, mark-paid transition rules, mark-paid idempotency.
- [x] Implemented `getEligibleBookings`, `createPayoutBatch`, `markPayoutPaid`, plus `getPendingBalance` (needed by Task 4's owner view, small enough to fold in here rather than duplicate the query later).
- Note: `createPayoutBatch`'s claim step and `markPayoutPaid` both use conditional `updateMany` rather than read-then-write, matching the idempotent-update pattern already used by the Safepay webhook — a double click or a race between two admins can't double-process the same payout or booking.

### Task 3: Admin payout API + UI ✅

**Files:** `src/app/api/admin/payouts/route.ts`, `src/app/api/admin/payouts/[id]/route.ts`, `src/app/api/admin/payouts/route.test.ts`, `src/app/api/admin/payouts/[id]/route.test.ts`, `src/app/admin/payouts/page.tsx`, `src/components/layout/AdminLayout.tsx`

- [x] Route tests written and run for real (26 tests total across both route files + the service): admin-only 403 guard, request validation, correct wiring to the service, and the service's error messages surfacing as 400s rather than generic 500s.
- [x] Routes implemented on top of Task 2's service functions.
- [x] Admin page: pending-balance table with a "Generate batch" action (disabled with a tooltip if bank details are missing), payout-history table with an inline reference field + "Mark paid" action for PENDING rows.
- [x] Added a "Payouts" entry to the admin sidebar nav.
- Full existing suite re-run after this task: 245 tests passing, zero regressions. (One pre-existing, unrelated suite — `apps/mobile/src/services/api.test.ts` — fails to even transform when run from the repo root because it needs the mobile app's own tsconfig context; not something this task touched, and presumably your normal test command already scopes around it.)

### Task 4: Owner earnings view ✅

**Files:** `src/app/owner/earnings/page.tsx`, `src/app/api/owner/earnings/route.ts`, `src/app/api/owner/earnings/route.test.ts`, `src/components/layout/OwnerLayout.tsx`

- [x] Pending balance, bank-details form (own record only — `PATCH` scopes to `session.user.id`), and payout history, matching the flat-response owner-route convention (`GET /api/owner/analytics` was the reference) rather than the admin `{ data }` wrapper.
- [x] Added an "Earnings" entry to the owner sidebar nav.
- [x] 7 new route tests, run for real. Full suite re-run: 252 passing, same one pre-existing unrelated mobile-tsconfig failure as before, nothing new broken.

### Task 5: Refund service ✅

**Files:** `src/lib/refunds.ts`, `src/lib/refunds.test.ts`, `src/lib/safepay.ts`

- [x] 8 tests, run for real: all four precondition-rejection cases (missing booking, wrong paymentStatus, wrong status, PENDING+CANCELLED), the automatic-success path, the gateway-throws fallback, the no-transactionId fallback, and idempotency.
- [x] `refundPayment()` added to `safepay.ts` — same request shape as `createCheckoutSession`, targeting a best-guess `/order/v1/refund`. Marked unverified in a comment block, same as the spec. The transaction identifier it refunds against is `booking.transactionId`, which is what the webhook already populates from `event.data.transaction_id`.
- [x] `processRefund()` in `refunds.ts` always closes out our own state (conditional `updateMany`, same idempotency pattern as everywhere else) regardless of whether the gateway call itself succeeds — the `automatic` flag on the result tells the caller which happened.
- Full suite re-run: 260 passing, same one pre-existing unrelated mobile-tsconfig failure, nothing new broken.

### Task 6: Wire refund into the admin bookings queue ✅

**Files:** `src/app/api/admin/bookings/[id]/refund/route.ts`, `src/app/api/admin/bookings/[id]/refund/route.test.ts`, `src/app/admin/bookings/page.tsx`

- [x] 4 route tests, run for real: admin guard, automatic:true path, automatic:false path, service error surfaced as 400.
- [x] Added a payment-status badge next to the existing booking-status badge (the admin table previously showed booking status only — payment status wasn't visible at all, which would have made a PAID+CANCELLED booking invisible as needing attention).
- [x] "Process refund" button replaces the plain italic status label specifically for PAID+CANCELLED rows; everything else (PENDING/CONFIRMED actions, other terminal states) is unchanged.
- [x] Distinct toasts for the two outcomes: a normal success toast when the Safepay call itself worked, a longer warning toast ("complete this manually in the Safepay dashboard") when it didn't — so the admin always knows which situation they're in.
- Full suite re-run: 264 passing, same one pre-existing unrelated mobile-tsconfig failure, nothing new broken.

### Task 7: Notify the student ✅

**Files:** `src/lib/refunds.ts`, `src/lib/refunds.test.ts`, `src/lib/notifications.ts` (used as-is), `src/lib/email-templates/booking-status.ts`, `prisma/schema.prisma` + one migration

- [x] Correction to this plan's own earlier assumption: checked, and price alerts are actually email-only — `createNotification` isn't called anywhere in that flow. "Matching how price alerts do both" wasn't accurate. Built in-app + email anyway on its own merits: a processed refund is significant enough to warrant both, same tier as booking confirmation (which does get an email) rather than price alerts (informational only).
- [x] Added `BOOKING_REFUNDED` to the `NotificationType` enum — needed its own migration (`ALTER TYPE ... ADD VALUE`), verified against the same local Postgres as Task 1's migration, following the exact precedent of the `PRICE_ALERT` addition.
- [x] `bookingRefundedEmail()` added to `email-templates/booking-status.ts`, matching `bookingStatusEmail`'s exact style.
- [x] Both dispatches are fire-and-forget with `.catch()`, fired only after the `paymentStatus: REFUNDED` update has already succeeded — a notification failure can never undo a refund that's already landed.
- [x] 3 new tests (10 total in the file now), run for real. Full suite: 266 passing, same one pre-existing unrelated mobile failure, nothing new broken.

---

## Plan complete

All seven tasks shipped, tested, and verified against real tooling where the sandbox allowed it (Postgres for both migrations, Vitest for every test file, a full lint + typecheck pass). Both P0 money-integrity gaps from the July 1 audit — no payout mechanism, no refund path — are closed at the "simplest thing that's honest about money" bar the spec set out.

Still genuinely open, not closed by this plan (see the spec's "out of scope" list): bank-detail validation against a real bank API, automated payouts, partial refunds, self-service refund requests, and — the one actual to-do — confirming the real Safepay refund endpoint against your merchant dashboard before trusting the automatic path in production.
