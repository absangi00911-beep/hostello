# Handoff: B-002 late-payment design (Backend -> Tech Lead)

From: Backend/Integrations. To: Tech Lead (review required before any build). Date: 2026-11-04.
Branch: `docs/b-002-late-payment-spec` (local commit). PR: NOT OPENED. This session has read-only access to the repo, so I could not push.

## What changed
- `docs/superpowers/specs/SPEC-late-payment.md` (new). Covers 2a to 2f.
- This note. No production code, no migration, no `SYSTEM.md` or `CHANGELOG.md` edit (R-04 is not changed by a design).

## Proposed handling in one paragraph
On a signature-valid success for a `CANCELLED` booking in `FAILED` (abandoned) or `PENDING` (cancelled unpaid) payment state, one transaction sets `PAID`, stores the tracker, sets the approved refund to the full total, stamps `latePaymentRecordedAt`, writes one audit event and one in-app notice to the student. The booking is then a `CANCELLED` + `PAID` + `NONE` row, so the existing admin queue and the existing `processRefund` claim work unchanged. No reinstatement, no automatic refund.

## Decisions I need from you
1. **Schema.** S-1 `Booking.latePaymentRecordedAt` (required). S-2 either a new value on `RefundAuditEventType` (my recommendation) or a new table. S-3 the append-only trigger on `refund_audit_events` should land with or before this (audit row 4). I have written no migration.
2. **Scope.** Whether to fold in G-1 (success after `payment.failed` on a live booking is rejected) and G-3 (queue filters client-side over all cancelled bookings). Both are small and both bite at launch.
3. **Event status.** I propose late payments end `PROCESSED`, not `RECONCILIATION_REQUIRED`, because nothing can resolve that state today.

## Worth your attention in review
- **F-2 is a real defect today, independent of this design.** A student or admin cancelling an unpaid booking writes `cancellationRefundAmount = 0`. If that student then pays late, the webhook marks the booking PAID, but `processRefund` throws "No refund amount remains", the queue hides it and `health/payments` does not count it. Read from code, not reproduced.
- **Privacy.** Flipping a cancelled booking to PAID would put it in the owner's booking list with the student's email and phone. The spec requires an owner-list exclusion.
- **Account deletion** does not block on an unrefunded late payment (`refundState NONE`).

## Not verified
- Nothing was run: no tests, no database, no Safepay or QStash call. Findings are from reading `main` at `be031e9`.
- Two provider behaviors are **ASSUMPTIONS** (spec §3.1 and T16): whether Safepay redelivers with different bytes for the same tracker, and whether it can send failed-then-succeeded on one tracker. Sandbox run by the owner would settle both.
- I did not read `SPEC-room-inventory.md` or `SPEC-room-availability.md` for option B.

## Needed from you
1. Review the spec; push the branch and open the PR (or give me a repo-scoped token). Suggested PR title: `docs: late-payment design spec (B-002)`.
2. Answer the three decisions above.

## Questions escalated to the Founder for the human owner
Full refund and fee absorption; whether the student copy may promise a refund and what review time we commit to; who watches the queue and how they are alerted.
