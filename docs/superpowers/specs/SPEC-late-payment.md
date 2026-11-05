# Spec: `late-payment` (R-04, audit row 11)

Status: Historical design record; superseded by the approved completion plan.
Review: Tech Lead.
Task: B-002. Author: Backend/Integrations. Date: 2026-11-04.
Policy status: The owner approved the newer completion-plan policy on 2026-11-05; it supersedes Option A below.

## 0. Approved decision update (2026-11-05)

For implementation, a late successful payment reinstates the booking as paid and
pending only when the full stay can be acquired atomically through the Task 5
seat-hold path and the listing/room remain eligible. Otherwise the booking stays
cancelled with a full-refund obligation and uses the existing audited refund
flow. The student is told the payment is under review for a full refund, without
a completion promise or timeline. Existing admin refund/payment queues and
health reporting are the escalation path; no new recipient or alert channel is
invented.

The email outbox and price-alert duplicate-send fix are deferred until the owner
chooses a payload-retention policy. No provider sandbox calls or shared/
production database migration are authorized by this decision. The remainder
of this file records the earlier Option A investigation and is non-binding
where it conflicts with this update or the approved completion plan.

The historical investigation below was read from code on `main` at `be031e9`.
Where a statement depended on provider behavior not verified at the time, it is
marked **ASSUMPTION**.

## 1. Objective

A student who pays after their booking was cancelled must not be left with a charge and no record. At launch (option A) every such payment is recorded against the booking, shown in the admin refund queue, and the student is told it is under review. An admin resolves it with the existing refund path. Nothing is reinstated and nothing is refunded automatically.

## 2. Findings that change the design

These came from reading the code. F-1 and F-2 are new mismatches against the audit and SYSTEM.md; they are also in the handoff to the Auditor.

**F-1. There are two different late-payment paths, and the audit and SYSTEM.md §8.1 describe only a blend of them.**
- *L1, abandoned checkout.* `cancel-abandoned-payments` sets `CANCELLED` + `FAILED` (`cancel-abandoned-payments/route.ts:54`). The webhook then rejects the success with 409 `booking_not_eligible` because it requires `paymentStatus === "PENDING"`. The booking is never marked paid. Only a `RECONCILIATION_REQUIRED` event row and a log line exist. This is the common path.
- *L2, cancelled while unpaid.* A student or admin cancels an unpaid booking (`PATCH /api/bookings/[id]`, action `cancel`). The booking stays `paymentStatus: PENDING`. A later success is accepted by the webhook, which sets `PAID` on the cancelled booking, writes no notification, and returns `reconciliationRequired`. SYSTEM.md §8.1 ("produces a `CANCELLED` and `PAID` booking that needs manual refund review") is true only for this path.

**F-2. L2 produces a booking that nothing can refund and nobody can see.** The cancel route computes `refundAmount = 0` for an unpaid booking and writes it to `cancellationRefundAmount`. After a late payment flips the booking to `PAID`:
- `loadRefundableBooking` computes `min(total, 0 ?? total) = 0` and throws "No refund amount remains" (409). `??` does not replace 0.
- The admin queue's `remainingRefund` is 0, so `needsRefundAction` filters it out.
- `health/payments` counts `refundState NONE` only when `cancellationRefundAmount` is null or greater than 0, so it excludes it.

The comment in `payment/callback/route.ts` ("this leaves it visible to the admin refund queue") is therefore wrong for this path. The design must set the approved amount to `total` when a late payment is recorded.

**F-3. Out-of-order edge: the webhook can lose a race to the cron and drop the payment.** If the worker reads the booking as `PENDING`/`PENDING` and the cron cancels it before the worker's conditional update, the update matches 0 rows and the worker returns 409 "Booking changed during payment confirmation". That is a late payment and today it is only an event row. See §4.4.

## 3. Paths a late or unmatched payment can arrive through (2a)

### 3.1 Entry points

| Path | Can it carry a Safepay late payment? | Notes |
|---|---|---|
| `POST /api/payment/webhook` (Safepay, signed) | Yes. The only one. | Verifies HMAC and merchant key, stores the event keyed by `bodyHash`, publishes to QStash with `retries: 5`; the worker re-checks everything. |
| QStash worker delivery of the same event | Yes | Retries on 5xx. 4xx outcomes are acknowledged, so they are not retried. |
| QStash failure callback (`webhook/failure`) | Indirectly | Sets the event `RETRYABLE` after retries are exhausted. |
| Admin retry (`payment-events/[id]/retry`) | Indirectly | Replays `RETRYABLE` events only. `RECONCILIATION_REQUIRED` events cannot be replayed, and no route moves an event out of that state. |
| Safepay redelivery, identical bytes | Yes | Same `bodyHash`: returns `duplicate` without queuing. |
| Safepay redelivery, different bytes, same tracker | **ASSUMPTION:** possible | Different `bodyHash` creates a second event row and re-runs business logic. Business-level idempotency must therefore be keyed on the tracker, not only the body hash. To confirm in sandbox (§9, T16). |
| `POST /api/payment/callback` | No today | JazzCash only, and `PAYMENT_METHODS` has it disabled. EasyPaisa is rejected. GET is a read-only redirect. If JazzCash is ever enabled, `confirmBooking` has the same eligibility rules (and no event table), so it must be covered by this design before it is enabled (R-18). |
| Subscription orders (`sub_*`) | Separate | Own states and own 409s. Out of scope. |

### 3.2 Booking states a successful, signature-valid event can meet

Preconditions already enforced and unchanged: event type `payment.succeeded`, state `TRACKER_ENDED`, provider is Safepay, currency PKR, amount equals `booking.total` in paisas.

| # | Booking (status / paymentStatus) | Reached when | Today | Under option A |
|---|---|---|---|---|
| 1 | PENDING / PENDING | Normal payment | Marked PAID, owner asked | Unchanged |
| 2 | CANCELLED / FAILED | **L1** abandon cron | 409, event row only | **Record as late payment** |
| 3 | CANCELLED / PENDING | **L2** student or admin cancelled unpaid | Marked PAID, no notice, `RECONCILIATION_REQUIRED`, unrefundable (F-2) | **Record as late payment** |
| 4 | PENDING / FAILED | `payment.failed` earlier, then success (tracker reused) | 409, booking stays PENDING, seat still held | Not a late payment. See G-1. |
| 5 | CANCELLED / PAID, same tracker | Redelivery | 200, no-op | Unchanged |
| 6 | CANCELLED / PAID, different tracker | Second real charge | 409 `additional_successful_payment` | Unchanged. See G-2. |
| 7 | CANCELLED / PARTIALLY_REFUNDED or REFUNDED | Pay after refund | 409, event row only | Unchanged. See G-2. |
| 8 | CONFIRMED or COMPLETED, not PAID | Should not exist | 409 | Unchanged |
| 9 | Any, `transactionId` differs from event tracker | Old session paid after a new one was made | 409 tracker mismatch | Unchanged. See G-2. |
| 10 | No booking for `order_id` | Unknown | 404, `RECONCILIATION_REQUIRED` | Unchanged: no booking to attach to |
| 11 | Amount or currency mismatch, wrong provider | Tampered or misconfigured | 400 or 409 | Unchanged |

"Late payment" in this spec means rows 2 and 3. Rows 6, 7, 9 and 10 are still money taken with no home on a booking. They are listed so the Tech Lead can decide whether to widen scope (G-2); the Founder's wording ("every late payment") is satisfied for the two paths that can be attached to a booking and that the product itself creates.

### 3.3 Adjacent gaps found (not solved here)

- **G-1.** Row 4 is a live booking that cannot accept its own successful payment. It needs a small normal-path fix (accept `FAILED` when status is `PENDING` and the tracker matches), not the late-payment flow. Whether Safepay can send failed-then-succeeded on one tracker is **ASSUMPTION** to confirm in sandbox.
- **G-2.** Rows 6, 7, 9 and 10 stay in `RECONCILIATION_REQUIRED`. No route resolves that state, so `health/payments` stays 207 until someone edits the database. Row 6 is also not refundable through the app: `refundPayment` targets `booking.transactionId`, which is the first tracker.
- **G-3.** The admin refund queue loads all `CANCELLED` bookings 50 at a time and filters in the browser. A late payment on page 7 is easy to miss. It needs a server-side filter (§6).

## 4. Proposed handling, option A (2b)

### 4.1 State change

For a success event meeting row 2 or 3, inside one database transaction:

1. Conditional update on the booking:
   - **where:** `id`, `status = CANCELLED`, `paymentStatus IN (PENDING, FAILED)`, `paymentMethod` null or `safepay`, `refundState = NONE`, `payoutId` null, and `transactionId` null or equal to the event tracker.
   - **set:** `paymentStatus = PAID`, `transactionId = tracker`, `cancellationRefundAmount = total`, `latePaymentRecordedAt = now`.
2. If it matched 1 row: insert one audit event `LATE_PAYMENT_RECORDED` and one in-app notification to the student (§4.3).
3. Do not touch `Room.available`. The cancellation already returned the seat and a cancelled-and-paid booking does not hold one.
4. Do not notify the owner. The owner never saw this booking (unpaid bookings are hidden from owners) and must not start now.

Why `cancellationRefundAmount = total`: cancellation terms apply to a stay the student agreed and paid for. A late payment has no such agreement, so the approved refund is the whole amount. This is the fix for F-2 and also the **policy point for the human owner** (§10, Q1).

The booking then reads `CANCELLED` + `PAID` + `refundState NONE`, which is exactly the state `processRefund` and its compare-and-set claim already accept. No change to `refunds.ts` is needed.

Event outcome: return a normal 200 so the webhook event ends `PROCESSED`. The work item has moved to the booking queue. Today's `reconciliationRequired: true` for L2 would leave the event in `RECONCILIATION_REQUIRED` forever (G-2) and double-list it. Keep an error-level operational log `payment.late_payment_recorded` so a log-based alert (R-17) can fire.

### 4.2 How it appears to admins

- It is a booking in the existing refund queue, plus the late-payment marker. The card shows a "Late payment" label, the tracker, the time the payment arrived, how long it has been waiting, and why the booking was cancelled (abandoned checkout vs cancelled by the student).
- Approved amount equals the total, so "Left to refund" is the full amount.
- Late payments sort first. The queue needs a server-side filter so they cannot be buried (G-3).
- `health/payments` `refundIssues` already counts `CANCELLED` + `PAID` + `NONE` with a null or positive approved amount. Late payments will appear in that count with no code change once F-2 is fixed. That endpoint still needs an admin session and has no alert (R-17), so the queue will not be noticed unless someone is told. **Needs a decision: who is alerted and how** (§10, Q3).

### 4.3 What the student is told

In-app notification, written in the same transaction as the state change (the R-07/R-08 pattern), type `BOOKING_CANCELLED` (no new enum value needed at launch). Proposed copy, not yet approved by the owner:

> Title: "Payment received after your booking expired"
> Body: "We received your payment of PKR {amount} for {hostel}, but this booking had already been cancelled, so no room was reserved. Your payment is under review. We'll update this booking when it is resolved."

It deliberately promises no outcome and no timeline. Whether the copy may say "you will be refunded" is a refund-policy statement and goes to the owner (§10, Q2).

Email: one best-effort email to the student after commit, sent only by the invocation whose conditional update matched. A crash after commit can lose it (R-07, no outbox yet) but cannot duplicate it. The in-app notice is the durable one.

The booking page currently shows "Cancelled" and "Paid" with no explanation. It needs a line for late-payment bookings. That is a frontend change; this spec only specifies the flag it reads.

### 4.4 Re-evaluate after a lost race (F-3)

If the normal-path conditional update matches 0 rows, the worker already re-reads the booking. Add: if the re-read shows row 2 or 3, run the late-payment handler once instead of returning 409. Without this, a payment that lands in the same second as the abandon cron is dropped. Today's test "writes no notifications when the booking changed concurrently" expects a non-200; it will need updating.

### 4.5 How an admin resolves it

1. Admin opens the queue, sees the late-payment card.
2. "Send refund" calls the existing `PATCH /api/admin/bookings/[id]/refund`, which calls `processRefund`.
3. The existing claim runs unchanged: `status CANCELLED`, `paymentStatus PAID`, `refundState NONE`, pinned `total`, `cancellationRefundAmount` and `refundedAmount`. Audit events `AUTOMATIC_REQUESTED` and then `AUTOMATIC_CONFIRMED` or `AUTOMATIC_UNCERTAIN` are written as today. `UNCERTAIN` and manual confirmation behave as today.
4. The student receives the existing "Refund processed" notification and email.

Constraints to note: the refund route allows 5 actions per admin per hour, so a burst of late payments is throttled. A student who still wants the room makes a new booking; nothing here reinstates.

### 4.6 Other surfaces a PAID-but-cancelled late booking touches

Verified by reading; each needs an explicit decision in the build task:
- **Owner reads.** `GET /api/bookings` for owners filters `paymentStatus = PAID` and includes the student's name, email and phone. Without an exclusion, a late-paid cancelled booking would show the owner a student they never agreed to host. Owner lists must exclude `latePaymentRecordedAt IS NOT NULL`. This is a privacy point.
- **Payouts.** Eligibility requires `CONFIRMED` or `COMPLETED` and `PAID`, so a cancelled booking is excluded. No change.
- **Account deletion.** It blocks only on `refundState PROCESSING` or `UNCERTAIN`. A student with an unrefunded late payment (`NONE`) can request deletion and be anonymized while still owed money. The predicate must also block on late-payment bookings not yet `REFUNDED`.
- **Completion cron** only touches `CONFIRMED` and `PAID`. No change.

## 5. Idempotency (2c)

The same late webhook delivered twice must not create two queue entries or two notifications. The "queue entry" is a state on one booking row, not a row of its own, so it cannot be duplicated. Notifications and the audit event are protected as follows.

| Layer | Mechanism | Covers |
|---|---|---|
| Event | `bodyHash` unique, status machine, 5-minute stale-claim window (existing) | Identical redelivery, QStash retry, concurrent workers |
| Booking | One conditional update (§4.1). Exactly one invocation can match | Same tracker with different bytes, crash-and-reclaim |
| Audit | `attemptId = "late-payment:" + tracker`, unique on `(attemptId, type)` | Backstop if the conditional update were ever bypassed |
| Notification | Inserted in the same transaction, and only when the update matched 1 row | No second notice. Notification has no unique key of its own, so this relies on the single winner |
| Email | Sent after commit, only by the winner | At most once; may be lost, never duplicated |

Loser behavior: when the update matches 0 rows, re-read. If the booking is `PAID`, `transactionId` equals this tracker and `latePaymentRecordedAt` is set, return 200 and do nothing else. This mirrors the existing same-tracker no-op for normal payments.

Crash windows:
- Before commit: nothing was written (one transaction). Retry does the whole thing once.
- After commit, before the event is marked finished: the event is `PROCESSING`, becomes reclaimable after 5 minutes, and the retry sees the loser case above. No second notice.
- A second event with a *different* tracker for the same booking is a genuine second charge and falls into row 6 (G-2), not into this flow.

## 6. Option B: reinstate if the seat is free (2d). Not built.

What it would add: a decision step inside the same transaction as the flip. If the seat is free, move `CANCELLED` back to `PENDING` with `PAID`, decrement `Room.available`, restart the 24-hour owner window, notify owner and student, and write a new audit event. If not free, fall back to option A. It adds a new state edge (`CANCELLED` to `PENDING`; today `CANCELLED` is terminal) and a reinstatement audit type.

Specific double-booking risks:

1. **"Free" is not defined.** `Room.available` is a single counter, not date-aware (R-01). A booking for next semester and one for this month look the same. A check of "is there a seat" cannot tell whether the booking's dates are actually free, and it ignores `BlockedDate`.
2. **The counter is already wrong.** Completion never restores seats and mid-stay cancellation skips the restore (R-01), so `available` can be too low (turns away valid reinstatements) or, after other drift, too high (permits overbooking).
3. **Check-then-act race.** Reading availability and then decrementing is a classic double booking when another student books in between. Reinstatement must use the same optimistic lock and post-update check as `createBooking` (`available` decrement with the `< 0` check), inside the same transaction as the flip.
4. **Double decrement on redelivery.** The abandon cron already restored the seat once. A duplicate event that reinstates twice decrements twice. Needs the same single-winner conditional update, in the same transaction as the decrement.
5. **Restore inflation.** Restores are unbounded increments (no cap at capacity). Reinstating and later declining or expiring is correct only if every decrement is paired with exactly one restore. A half-applied reinstatement breaks the pairing.
6. **The student rebooked.** After an abandoned checkout, a student commonly makes a new booking for the same room and pays. The old payment then lands late. Reinstating gives the same student two paid bookings for the same dates. Needs a duplicate check on user, room and overlapping dates.
7. **Stale terms.** Price, cancellation policy snapshot, room and listing may have changed or been suspended, and the check-in date may have passed. The owner may already have been told it was cancelled.
8. **No-room bookings.** `roomId` can be null. "Seat free" has no meaning there.
9. **Refund and reinstate racing.** An admin refund claim in flight (`PROCESSING` or `UNCERTAIN`) while reinstatement flips the booking back. Reinstatement must require `refundState NONE` and `refundedAmount 0`.

Recommendation: do not build B until R-01 is fixed and date-aware availability exists. I did not read `SPEC-room-inventory.md` or `SPEC-room-availability.md`; the Tech Lead should confirm whether they cover this.

## 7. Schema changes needed (2e). Listed only; no migration written.

| # | Change | Required? | Notes |
|---|---|---|---|
| S-1 | `Booking.latePaymentRecordedAt DateTime?` | Yes | The flag the queue, owner exclusion and deletion block read. Plus an index supporting the queue filter; exact shape for the Tech Lead. Nullable, so backward compatible (expand step). |
| S-2 | `RefundAuditEventType` add `LATE_PAYMENT_RECORDED` | Yes, if reusing `RefundAuditEvent` | Reuses `adminUserId` with a system actor (existing `system:` convention), `amount`, `currency`, `transactionId`, `providerState`. Deterministic `attemptId` gives idempotency from the existing unique key. `ALTER TYPE ... ADD VALUE` must ship as its own migration before app code uses it. Alternative: a new `late_payment_events` table (cleaner semantics, one more table to protect). **Tech Lead to choose.** |
| S-3 | Append-only trigger on `refund_audit_events` | Dependency | Audit row 4 found no database-level protection on this table (the payout audit table has one). This spec adds a new event type to it, so the trigger should land first or alongside. Pattern: `20261009133000_payout_audit_ledger`. |
| S-4 | `NotificationType` new value | No | Reuse `BOOKING_CANCELLED` at launch. A dedicated type is nicer later. |

Non-schema: if admins are alerted by email (§10, Q3) that needs an `ADMIN_ALERT_EMAIL` (or similar) setting with `.env.example` and env-validation updates.

Data to check before launch (design only, not run; I have no database access): historical late payments already stranded.
- `safepay_webhook_events` rows with `status = RECONCILIATION_REQUIRED`, `eventType = payment.succeeded`, whose `merchantOrderId` is a `CANCELLED` booking.
- `bookings` with `status CANCELLED`, `paymentStatus PAID`, `refundState NONE`, `cancellationRefundAmount = 0` (the F-2 population).

## 8. Out of scope

Reinstatement (option B); automatic refund; the stuck-refund sweeper for `CANCELLED` + `PAID` + `NONE` (separate R-04 item; note that a sweeper must not auto-refund late payments under option A); G-1, G-2 and G-3 fixes unless the Tech Lead folds them in; JazzCash and EasyPaisa; subscription late payments.

## 9. Test plan (2f)

Style: vitest, mocked Prisma as in `payment.test.ts`, plus stateful fakes that evaluate `where` clauses as in `refunds-claim.test.ts`. As with B-001, mocks cannot prove row-level atomicity; T17 closes that.

| ID | Case | Expected |
|---|---|---|
| T1 | L1 first delivery (CANCELLED/FAILED) | Booking PAID, `cancellationRefundAmount = total`, flag set. One audit event, one student notification. No owner notification, no room update, no owner email. Event `PROCESSED`. |
| T2 | L2 first delivery (CANCELLED/PENDING, approved amount 0) | Approved amount reset to `total`. Then `processRefund` on it succeeds for the full amount (regression for F-2). |
| T3 | Identical event delivered twice | Second returns duplicate. Counts unchanged. |
| T4 | Same tracker, different bytes (new event row) | 200, counts unchanged. |
| T5 | Two workers on the same event concurrently (stateful fake) | Exactly one flip, one notification, one audit event, one email. |
| T6 | Crash after commit, before the event is finished; reclaim after 5 minutes | No duplicate notification or audit event. |
| T7 | Notification insert fails inside the transaction | Whole transaction rolled back, booking unchanged, 500 so QStash retries. Retry produces exactly one of each. |
| T8 | Out of order: `payment.failed` arrives after the late flip. Separately: a success on a second, different tracker arrives after it | Failed event is a stale no-op. Second tracker gets the unchanged 409 (row 6). |
| T9 | Lost race: read PENDING/PENDING, cron cancels, conditional update misses (F-3) | Routed to the late handler; one record. Update the existing concurrent-change test. |
| T10 | Rows 7, 8, 9, 10, 11 | No booking change, no notification, event `RECONCILIATION_REQUIRED` as today. |
| T11 | Late payment on a booking in a payout batch | Not flipped; handled as unmatched. |
| T12 | JazzCash callback | Cannot create a late record; disabled path asserted. |
| T13 | Surfaces: owner list excludes flagged bookings; payout predicate excludes; account deletion blocks on an unrefunded late payment; queue shows full amount and the late label | As described in §4.6. |
| T14 | Admin resolves | Refund claim passes; second click gets the existing 409; `UNCERTAIN` path unchanged; student gets "Refund processed" once. |
| T15 | QStash retry exercise (staging, sandbox) | Force the worker to fail once; delivery retries; exactly one record. Failure callback after 5 retries sets `RETRYABLE`. |
| T16 | Sandbox walk-through, run by the owner, never live | Abandon a booking, then pay it in sandbox. Confirms row 2 behavior, and answers the two **ASSUMPTIONS**: does Safepay redeliver with different bytes, and can it send failed-then-succeeded on one tracker. |
| T17 | One real-Postgres test on a Neon branch for the conditional update and unique key | Closes the mock gap (R-15). |
| T18 | Migration | Enum value added; if S-3 lands, update and delete on `refund_audit_events` are rejected. |

## 10. Questions for the human owner

- **Q1.** Is the refund for a late payment always the full amount? Safepay's processing fee is not recorded today (SYSTEM.md §8.5), so HostelLo would absorb it.
- **Q2.** May the student message say they will be refunded, or only that the payment is under review? And what review time do we commit to?
- **Q3.** Who watches the queue, and how are they alerted? Without a person and a channel, a student can wait indefinitely.
