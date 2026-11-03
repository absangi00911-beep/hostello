# Handoff: B-001 partial-refund claim (Backend -> Tech Lead)

From: Backend/Integrations. To: Tech Lead (review required). Date: 2026-11-04.
Branch: `fix/b-001-partial-refund-claim`. PR: NOT OPENED (no GitHub credentials in my sandbox; see "Needed from you").

## What changed
- `src/lib/refunds.ts`: the claim in `createAutomaticRequest` now also requires `total`, `cancellationRefundAmount` and `refundedAmount` to equal the values the refund amount was computed from. No schema change, no migration.
- `src/lib/refunds-claim.test.ts` (new, 7 tests): stateful fake that evaluates the claim's `where`.
- `SYSTEM.md` (R-04 row, threat-table row) and `CHANGELOG.md` ("Unreleased", PR number pending).

## PR description (paste as is)
**Before:** `processRefund` derived the refund amount from a read, then claimed the booking. The claim allowed state `PARTIALLY_REFUNDED` and did not check the amount. A request that read before another partial refund finished could still claim and send the same amount to Safepay again. Reproduced: approved 20,000 of 45,000, two overlapping requests ended at `refundedAmount` 40,000 with status still `PARTIALLY_REFUNDED`.
**After:** the claim is a compare-and-set on the three inputs of the amount. A stale request matches 0 rows, gets the existing 409 `RefundServiceError`, writes no audit event and never calls the provider.
**Verified:** failing test written first; 2 of 7 fail on the old code (provider called twice; stale claim succeeds), all 7 pass after. `npm run typecheck` exit 0, `npm run lint` exit 0, full suite 198 files / 1263 tests passing (Node 22 sandbox; `.nvmrc` says 24). Provider is mocked; no Safepay call was made.

## Why pin three fields, not just `refundedAmount` as the audit suggested
The amount is `min(total, cancellationRefundAmount ?? total) - refundedAmount`. Pinning only `refundedAmount` leaves the amount stale if the approved amount changes between read and claim. Pinning all three costs nothing.

## Not verified (be aware when reviewing)
- Tests use a fake, not Postgres. The safety argument relies on single-row `UPDATE ... WHERE` being atomic and, under READ COMMITTED, re-checking the predicate against the latest row version. That is standard Postgres behaviour but I did not run it against a real database. A one-off integration test on a Neon branch would close this.
- No sandbox Safepay round trip (part of R-04, still open).

## Money-moves-twice review (escalation criterion)
All callers of `refundPayment` go through `processRefund`: admin route, `cron/expire-unanswered-bookings`, `bookings/[id]` (student cancel, owner decline). `refunds.ts` is the only writer of `refundedAmount`/`refundState` outside account-deletion reads. So the fixed claim gates every provider call. I found no other path that sends a second provider refund. This is from reading the code, not from exercising it.

## Needed from you
1. Push the branch and open the PR (or give me a token scoped to this repo), then fill the PR number into `CHANGELOG.md` and `SYSTEM.md` R-04 ("PR pending").
2. Decide whether you want the real-Postgres concurrency test.

## Left undone (out of scope per task rules)
Cron, late-payment and audit-event code untouched. R-04 stays open: sandbox validation, sweeper, late payments, QStash retry exercise.
