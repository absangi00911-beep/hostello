# Handoff: mismatches found during B-001 (Backend -> Auditor)

From: Backend/Integrations. To: Auditor. Date: 2026-11-04. Nothing was worked around; all are untouched in code.

1. **Audit path mismatch.** `docs/team/00-shared.md` and the role brief say the latest gap report is in `docs/audits/`. The directory is `docs/audit/` (singular). `docs/audits/` does not exist. Also, my first clone (before the owner updated the repo) had no `2026-11-04-a2c-payments.md`; it is present in the current `main`.
2. **Audit row 5 is confirmed**, with one refinement: the suggested fix (pin `refundedAmount`) leaves the amount stale if `total` or `cancellationRefundAmount` changes between read and claim. B-001 pins all three. Audit also said the test gap was "stale-read test"; it is now covered by `src/lib/refunds-claim.test.ts`.
3. **Full-refund confirmation is not enforced.** SYSTEM.md §5.3 (line ~390) says a full refund counts as confirmed only on `TRACKER_REFUNDED`. `refundPayment` (`src/lib/safepay.ts`) accepts `TRACKER_REFUNDED` or `TRACKER_PARTIAL_REFUND` for any amount, and `processRefund`/`recordAutomaticConfirmation` do not compare the state with the amount. A full remaining refund answered with a partial state would be recorded as confirmed. Not a double-move; unverified against sandbox. Needs a decision before changing.
4. **Environment note:** `.nvmrc`/`engines` say Node 24; the sandbox ran Node 22 (CHANGELOG 4.1 says both pass). Full suite passed on 22.
