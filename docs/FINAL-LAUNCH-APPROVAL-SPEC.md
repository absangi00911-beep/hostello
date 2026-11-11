# Final launch-approval specification

**Decision record:** November 9, 2026  
**Status:** Founder-supplied repository defaults recorded; implementation is not production or launch authorization. The product remains pre-launch and not approved for real transaction volume.  
**Authority:** The Founder/human owner owns go/no-go. Qualified finance, legal, privacy and regulatory advice is required where noted; this document is not such advice.

This specification turns the supplied defaults into server-enforced behavior, explicit data-retention boundaries and verifiable release gates. It does not configure providers, touch production, apply migrations, approve fund custody or declare external readiness.

## Approved repository defaults

### Payouts: platform-held, maker/checker, settlement blocked

- Treat platform-held funds as the product default; do not introduce provider-side split payouts or automatic transfers.
- An authenticated admin creates a batch and claims eligible bookings. A **different** authenticated admin must approve that batch. The database and conditional service write enforce the different-admin rule; the approval actor/time and state transitions are auditable.
- Approval is not settlement. Transfers remain off-platform/manual and must not be initiated from this pre-launch build. `PAYOUT_READINESS.ready` remains false and marking a batch paid fails closed until custody and independent settlement-reconciliation controls are approved and verified. Batch creation claims bookings; the current workflow has no safe void/release path after approval. Do not stage or approve operational batches until a recovery path is implemented and tested.
- No independent bank/provider settlement verification, double-entry ledger, fee model, reversal handling or admin MFA is claimed. Payout timing/cancellation details and applicable obligations remain external decisions. Do not move real funds until qualified review and owner go/no-go.

### Pro: one month, seven-day grace, explicit renewal

- A successful Safepay payment grants one UTC calendar month. Month-end anniversaries clamp to the final day of the target month (for example, January 31 plus one month is February 28 or 29).
- A paid entitlement remains active until, but not including, `endDate + 7 days`. The seven-day duration is the explicit initial assumption used to make the supplied "grace period" actionable.
- Entitlement checks are date-aware; the scheduled expiry worker downgrades after grace. Owners renew through an explicit Safepay checkout; automatic charging is not implemented.
- A renewal paid before the grace cutoff extends from the recorded term end; payment at/after the cutoff starts a new month from callback receipt time. Failed initial/renewal references can be retried. Late or stale successful tracker callbacks do not silently attach to a replacement checkout and require reconciliation.

### Bookings: exact whole months and hard owner bounds

- A stay is an integer number of calendar months: `checkOut === addCalendarMonths(checkIn, n)`. `addCalendarMonths` uses UTC date-only arithmetic and clamps month-end. Partial-month billing is not allowed.
- The server enforces the listing's `minStay` and `maxStay` as hard constraints; absent `maxStay` means no listing-specific maximum. The global stay range is 1 through 24 months.
- Persist and price from the validated month count. The student's date picker, exact-availability check and booking service must agree on dates and bounds. Check-in's current-day boundary remains `Asia/Karachi`.

### Payment-confirmation email retention: references only

- The transactional outbox is limited to booking payment-confirmation messages. It stores a recipient `userId`, booking ID, typed template, unique idempotency key and bounded delivery metadata; it never stores the recipient email, subject, rendered body, provider response or raw provider error.
- Render messages from current database state at delivery time. Persist only bounded safe error codes. Use provider idempotency on retries.
- Pending/retry rows expire no later than 30 days after enqueue. Successful rows expire 24 hours after delivery. Terminal failed rows expire 30 days after the final failed attempt. The scheduled worker deletes expired rows.
- This policy does not settle retention for signup, password-reset, price-alert or other emails; student documents, messages and logs have separate open retention questions.

## Schema and compatibility

The authored migration `20261109160000_launch_defaults_reliability` adds payout approval state/audit action, a renewal checkout reference, and the typed payment-confirmation outbox. It has not been applied to any database. It must be reviewed and applied only through the approved migration workflow; never apply it to a shared or production database outside explicit owner approval. Schema/data-model changes are summarized in SYSTEM.md section 4 and `prisma/MIGRATIONS.md`.

## Launch approval gates (all required; none implied by this record)

1. **Payout readiness:** qualified advice and written owner decisions for custody/timing/accounting/fees/refund handling; independent settlement reconciliation and admin-authentication controls; tests and operator evidence. Implement and test safe recovery/voiding for approved batches before creating operational batches. Until then retain the false readiness flags and do not stage, approve or transfer money.
2. **Safepay:** isolated sandbox checkout, failed-payment retry, renewal near/after grace, duplicate callbacks, amount/currency/tracker mismatch, and reconciliation cases. Do not use production credentials or real payments as tests.
3. **QStash:** verify the `expire-pro-subscriptions` and `drain-payment-email-outbox` schedules, signatures, retries, health freshness and alerting in an isolated environment. No console state is source-verified here.
4. **Database/CI:** validate migration against an isolated disposable PostgreSQL database and review a green remote CI run for the release commit. The CI PostgreSQL gate does not replace dedicated tests of every changed path.
5. **Browser and operations:** run critical browser flows against disposable local services, rehearse payment reconciliation/recovery, and complete current runbooks. Test discovery is not a browser pass.
6. **Privacy/security:** complete independent review of payout controls, admin authentication, data retention and access boundaries. Resolve remaining R-10/R-12/R-17/R-20 items as applicable.
7. **Deployment controls:** verify required production environment reviewers, database snapshot settings, first-run workflow evidence and Vercel runtime configuration. No production workflow or setting was changed for this task.

Record each release decision with commit, environment, UTC time, run/event ID, operator and expected/actual result. Do not include secrets, raw provider payloads, student records, bank account data or connection strings in evidence. Stop on uncertain payment state; use the approved reconciliation runbook rather than editing records or repeating a payment.

## Source evidence and remaining risk register

- Latest source-first report: [`docs/audits/2026-11-09-project-health-audit.md`](audits/2026-11-09-project-health-audit.md). Historical findings G-002/G-003/G-004/G-006 have decisions and current implementation dispositions recorded here; G-004 stay semantics are enforced by the shared validator, booking service and student picker. This record supersedes their decision status without rewriting the historical report.
- Current operational evidence checklist: [`docs/FINAL-LAUNCH-READINESS-VALIDATION.md`](FINAL-LAUNCH-READINESS-VALIDATION.md).
- Current risks remain in [`SYSTEM.md` section 16](../SYSTEM.md#16-risk-register). Payout custody/reconciliation/accounting and external approvals remain open; the email worker/provider schedule and remote CI/browser/recovery results remain unverified. Therefore this specification is **not** a go-live approval.
