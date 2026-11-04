# Handoff: B-002 mismatches found (Backend -> Auditor)

From: Backend/Integrations. To: Auditor. Date: 2026-11-04. Found while reading code for the late-payment spec. All from reading `main` at `be031e9`; nothing was run.

| # | Doc statement | What the code does | Evidence |
|---|---|---|---|
| M-1 | SYSTEM.md §8.1: a late payment "produces a `CANCELLED` and `PAID` booking that needs manual refund review". Audit row 11 describes only the abandon-cron path. | Two paths. After the abandon cron (`CANCELLED` + `FAILED`) the webhook returns 409 and the booking is never marked paid. The `CANCELLED` + `PAID` result happens only when an unpaid booking was cancelled by the student or an admin (`CANCELLED` + `PENDING`). | `payment/webhook/route.ts` eligibility check (`paymentStatus !== "PENDING"` rejects `FAILED`); `cancel-abandoned-payments/route.ts:54` |
| M-2 | Comment in `payment/callback/route.ts` ("this leaves it visible to the admin refund queue"); WEB_APP_PROGRESS Oct 5/Oct 7 claims about late payment | For the `CANCELLED` + `PENDING` path the booking carries `cancellationRefundAmount = 0` (cancel route writes 0 for an unpaid booking). `loadRefundableBooking` then refuses it, `remainingRefund` is 0 so the queue filters it out, and `health/payments` `refundIssues` excludes it. Stranded and invisible. | `bookings/[id]/route.ts` (`refundAmount = booking.paymentStatus !== "PAID" ? 0 : ...`); `refunds.ts` `loadRefundableBooking`; `adminRefunds.ts` `needsRefundAction`; `health/payments/route.ts` |
| M-3 | Audit row 2 marks idempotency CONFIRMED and notes success-after-cancel only | A success after `payment.failed` on a still-`PENDING` booking is also rejected 409 `booking_not_eligible`, with the seat still held. | `webhook/route.ts` eligibility check |
| M-4 | SYSTEM.md §14.1: `/api/health/payments` returns 207 when events need reconciliation | True, but no route resolves `RECONCILIATION_REQUIRED` and the retry route refuses it, so the 207 never clears without a database edit. | `payment-events/[id]/retry/route.ts`; `finishSafepayEvent` |
| M-5 | Audit row 7 / SYSTEM.md describe an "admin queue" | The refund queue fetches all `CANCELLED` bookings 50 per page and filters in the browser (`parseRefundBookingsPage`). | `adminRefunds.ts`; `bookings/route.ts` |
| M-6 | Account deletion "blocked while refunds need attention" (SYSTEM.md §5.7) | It blocks only on `refundState` `PROCESSING` or `UNCERTAIN`, not on `CANCELLED` + `PAID` + `NONE`. | `account-deletion.ts` lines ~104-118, ~649-660 |

Not checked: anything needing a database or provider; whether the sandbox runbook run has happened.
