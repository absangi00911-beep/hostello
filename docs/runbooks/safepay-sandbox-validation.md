# Safepay sandbox validation (R-04 item 9)

**Purpose.** Prove, against Safepay's **sandbox**, that the merchant setup, the payment webhook and the refund call behave the way the code assumes. This is a launch gate: live payments stay off until it passes.

**Who runs it.** The human owner, on their own machine, with their own sandbox credentials. The engineers cannot reach Safepay.

**How long.** About 2 to 3 hours the first time (dashboard setup, a public tunnel, 5 sandbox payments). About 1 hour once that is set up. Refund actions are rate-limited (see "Refund rate limit"), which adds a few minutes of restarts.

**Hard rules.**
- Sandbox credentials only. Never use or paste live keys. If you are unsure a key is a sandbox key, stop.
- Use a **development, preview or Neon branch database**. Never the production database. This test creates, cancels and refunds bookings.
- Use fake test users (fake emails, fake names). Never send personal data back.
- Never send back keys, secrets, tokens, cookies, `DATABASE_URL`, full tracker values, raw webhook bodies, or raw server logs. Each step lists exactly what to send.
- If anything looks wrong (a FAIL line, an unexpected amount, a refund you did not expect), **stop issuing refunds** and send the report so far.

**Status of what is verified.** The repo documents the refund endpoint as taken from Safepay's Node SDK and the request body from their refund guide, and says the merchant sandbox flow "still needs an end-to-end confirmation" (`src/lib/safepay.ts`). Nothing in this runbook has been run yet. Treat every "expected" below as the code's assumption, not a fact about Safepay.

**Prerequisite build.** Run this on a build that includes task B-001 (the refund claim fix). Without it, check E3 (two simultaneous refund requests) is expected to be able to refund twice in the sandbox.

---

## 0. Setup

### 0.1 Merchant dashboard checklist (UNVERIFIABLE FROM REPO)

Nothing here can be checked from the code. Tick each one in the Safepay **sandbox** dashboard and note the result.

| # | Setting | What the code expects | Done |
|---|---------|----------------------|------|
| 1 | Dashboard is in **sandbox** mode, and the merchant account is active | Keys come from this mode | [ ] |
| 2 | Merchant secret (for `SAFEPAY_SECRET`) and public API key beginning `sec_` (for `SAFEPAY_API_KEY`) | Sandbox values, which differ from live | [ ] |
| 3 | Webhook endpoint registered: `https://<your public URL>/api/payment/webhook` | Safepay POSTs signed events here | [ ] |
| 4 | Webhook shared secret equals `SAFEPAY_WEBHOOK_SECRET` | Signature is HMAC-SHA512 in header `x-sfpy-signature` | [ ] |
| 5 | Events delivered include payment success and payment failure | Code handles `payment.succeeded` (tracker state `TRACKER_ENDED`) and `payment.failed` | [ ] |
| 6 | Currency PKR is enabled for the sandbox merchant | Amounts are sent and verified in paisa, currency `PKR` | [ ] |
| 7 | **Refunds are enabled** for the merchant, and the merchant secret is permitted to call the refund API | `POST /order/payments/v3/{tracker}/refund` | [ ] |
| 8 | Sandbox supports **partial** refunds, and more than one partial refund on one tracker | Needed for step D | [ ] |
| 9 | Whether refunds are answered synchronously with tracker state `TRACKER_REFUNDED` or `TRACKER_PARTIAL_REFUND` | The app only accepts those two states as confirmed | [ ] |
| 10 | Any refund time window, minimum amount, or IP allow-list on the merchant account | Could reject refunds the app thinks are valid | [ ] |
| 11 | Whether the dashboard can **resend** a webhook delivery, and Safepay's retry policy | Used in step E1 (optional) | [ ] |
| 12 | The sandbox test card details from Safepay's sandbox documentation | Needed to pay; not in the repo | [ ] |

Do **not** register `/api/payment/webhook/failure` with Safepay. It is the internal QStash failure callback.

### 0.2 Local environment

Set these in your local env file (names only here, never put values in the repo, this document or chat):

`NEXT_PUBLIC_SAFEPAY_ENV` (must be exactly `sandbox`), `SAFEPAY_SECRET`, `SAFEPAY_API_KEY`, `SAFEPAY_WEBHOOK_SECRET`, `DATABASE_URL` (non-production), `NEXT_PUBLIC_APP_URL` (your public tunnel URL), plus the other variables in `.env.example` the app needs to start.

Leave `QSTASH_TOKEN` unset for the simplest run: outside production the webhook is then processed inline. Leave `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` unset so rate limits live in process memory (restarting the dev server resets them).

Safepay's sandbox must reach your webhook, so expose the local app on a public HTTPS URL with any tunnel you trust, and use that URL in 0.1 item 3 and in `NEXT_PUBLIC_APP_URL`. Start the app with `npm run dev` (not `npm start`: production mode refuses to process webhooks without QStash).

### 0.3 Confirm the app is in sandbox mode

Do all three:

1. Run `npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs preflight`. Expected: "Preflight OK", API host `https://sandbox.api.getsafepay.com`. It refuses unless `NEXT_PUBLIC_SAFEPAY_ENV` is exactly `sandbox`. Note: the app itself treats anything other than `production`, including unset, as sandbox, so the script is stricter on purpose.
2. Start a payment (step B). The checkout page address must be on `sandbox.api.getsafepay.com/embedded/` and contain `environment=sandbox`.
3. The tracker for that payment must appear in the dashboard while it is in sandbox mode.

The script cannot tell sandbox keys from live keys or a preview database from production. Those two confirmations are yours.

**Send back for 0:** the dashboard checklist as a table (item number, ticked yes or no, one-line note), the preflight output, and the host shown on the checkout page (hostname only).

### 0.4 Test accounts and the report tool

You need three fake accounts: a student, a hostel owner whose hostel uses the **STANDARD** cancellation policy, and an admin. `prisma/seed.ts` may create some; check it. Admin refund actions are at `/admin/refunds`.

After every step, run the read-only report for each booking involved:

```
npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs report <bookingId> --confirm-non-production-db
```

It prints booking state, masked tracker, webhook events, refund audit events and consistency checks. It never prints secrets or personal data. If it prints `Failed (...)`, check `DATABASE_URL`; send only that line.

### 0.5 Bookings you will create

Each refund moves sandbox money, so each scenario uses its own paid booking. Make 5 student bookings (any small price, whole PKR) and pay each in the sandbox as in step B.

| Name | Used in | Prepare after paying |
|------|---------|----------------------|
| BK-1 | C, E2 | Student cancels while still awaiting the owner (full refund) |
| BK-2 | D | Check-in 4 to 6 days ahead; owner accepts; student cancels (50% refund under STANDARD) |
| BK-3 | E1 | Leave paid and untouched |
| BK-4 | E3 | Student cancels while still awaiting the owner (full refund) |
| BK-5 | F | Same as BK-1, then see F |

Why these preparations: a student who cancels before the owner accepts is refunded the full total. A student who cancels a confirmed booking gets the policy amount. For STANDARD that is 100% at 7 days or more, 50% from 72 hours up to 7 days, none below 72 hours.

### 0.6 Refund rate limit

The admin refund route allows **5 actions per hour per admin**, and every request counts, including rejected ones. This runbook uses about 9. Plan three sittings: C and D (4 actions), then E2 and E3 (3), then F (2). Between sittings restart `npm run dev` (resets the in-memory limit) or wait an hour. A `429` "Too many refund actions" is not a failure.

### 0.7 Sending a refund request without the button

Where a step says "request the refund again", the page may not offer a button. Open `/admin/refunds` while logged in as admin, open the browser DevTools console and run (replace the ID):

```js
fetch('/api/admin/bookings/BOOKING_ID/refund', { method: 'PATCH' })
  .then(async r => console.log(r.status, (await r.json()).error ?? 'ok'))
```

This uses your existing session. Do not copy cookies anywhere.

---

## Step B. Pay a booking and confirm the webhook

1. As the student, create a booking and press Pay. Complete payment with the sandbox test card.
2. Wait up to a minute. Run the report for the booking.

| Look at | Expected |
|---------|----------|
| Checkout host | `sandbox.api.getsafepay.com`, `environment=sandbox` |
| Browser return page | Does **not** mark the booking paid by itself. Only the webhook does (the browser return only redirects) |
| Booking | `paymentStatus=PAID`, `status=PENDING` (awaiting owner), tracker masked and present |
| Webhook events | One row: `type=payment.succeeded`, `providerState=TRACKER_ENDED`, `amountMinor` = total x 100, `PKR`, `status=PROCESSED`, `attempts=1`, no error |
| Dev server log | Event `booking.payment_confirmed` for the booking |
| Dashboard | The tracker shows as paid for the same amount |

If the booking stays `PENDING`: no webhook row means Safepay did not reach you (check tunnel, dashboard URL, secret). A row with `status=RECONCILIATION_REQUIRED` and an `error` means the payload differed from what the code expects. That is an important finding.

Optional B4: pay with Safepay's sandbox failure card. Expect `payment.failed` and `paymentStatus=FAILED`.

**Send back for B (per booking):** the report output; whether the checkout host and `environment=sandbox` matched (yes/no); time from payment to `PAID` (rough seconds); dashboard amount and state for the tracker's last 6 characters. If `RECONCILIATION_REQUIRED`: the `type`, `providerState`, `amountMinor`, `currency` and `error` fields only.

---

## Step C. Full refund via the admin route

Prepare BK-1 as in 0.5. As admin open `/admin/refunds`, find BK-1 and press **Send refund**.

| Look at | Expected |
|---------|----------|
| HTTP result | 200, `automatic: true` |
| Booking | `refundState=REFUNDED`, `paymentStatus=REFUNDED`, `refundedAmount` = total |
| Refund events | `AUTOMATIC_REQUESTED` then `AUTOMATIC_CONFIRMED`, same attempt, amount = total, `providerState=TRACKER_REFUNDED` |
| Consistency checks | All `OK` |
| Dashboard | Exactly **one** refund for this tracker, for the total, in PKR |

If the provider answers `TRACKER_PARTIAL_REFUND` to a full-amount refund, note it. The app records it as confirmed, which is a known gap, so tell us.

**Send back for C:** report output for BK-1; dashboard refund count, amount and state (tracker last 6 characters); timestamp of the click and of the dashboard entry; any error text from the page.

---

## Step D. Partial refund, second partial refund, over-limit request

**D1. First partial refund.** Prepare BK-2. Note its total and the approved amount (the booking's `cancellationRefundAmount`, 50% of total under STANDARD). Press **Send refund**.

Expected: refund amount = approved amount; `refundState=PARTIALLY_REFUNDED`, `paymentStatus=PARTIALLY_REFUNDED`, `refundedAmount` = approved; events `AUTOMATIC_REQUESTED` and `AUTOMATIC_CONFIRMED` with `providerState=TRACKER_PARTIAL_REFUND`; dashboard shows one partial refund for that amount.

**D2. Second partial refund (artificial setup).** The normal app flow cannot produce a second partial refund, so this step edits a throwaway sandbox booking in your non-production database. Its purpose is to learn whether Safepay accepts two refunds on one tracker. In `npm run db:studio` (or SQL) set BK-2's `cancellationRefundAmount` to 75% of its total, then press **Send refund** again (or use 0.7).

Expected: the refund amount is the difference (75% minus 50% of total); `refundedAmount` = 75% of total; two `AUTOMATIC_CONFIRMED` events; dashboard shows two refunds that sum to 75% of total. If Safepay rejects the second refund, that is a valid and important result: send the failure fields (see F).

**D3. Over-limit request.** Request the refund once more (0.7).

Expected: HTTP **409** with "No refund amount remains for this booking."; **no** new refund event; `refundedAmount` unchanged; dashboard unchanged (the provider was not called).

**Send back for D:** report output for BK-2 after each of D1, D2 and D3; the approved amount and total; dashboard refund rows (amount, state, timestamp) after each; the HTTP status and error text for D3.

---

## Step E. No double effect on repeats

**E1. Repeated webhook delivery.** Use BK-3 (paid, untouched). Take the report first. Then:

```
npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs replay-webhook BK-3_ID --confirm-non-production-db
```

This sends a correctly signed event to your **local** app twice. It never contacts Safepay and refuses unless the booking is already paid by a real sandbox payment. It tests the app's idempotency, not Safepay's redelivery.

Expected: delivery 1 returns HTTP 200 `{"received":true}` (booking already paid with the same tracker, so nothing changes); delivery 2 returns HTTP 200 `{"received":true,"duplicate":true}`. Report again: booking fields and `updatedAt` unchanged; no extra owner notification or email; the new webhook rows are `PROCESSED`. Run `--dry-run` first if you want to see what it will do.

Optional: if the dashboard can resend a real delivery (0.1 item 11), resend one for BK-3 and send both reports.

**E2. Repeated refund request.** Request the refund again on BK-1 (already fully refunded) using 0.7. Expected: HTTP 409 with an error message (exact text may vary); no new refund event; dashboard still shows one refund.

**E3. Two simultaneous refund requests.** Prepare BK-4. In the console on `/admin/refunds`:

```js
const go = () => fetch('/api/admin/bookings/BK-4_ID/refund', { method: 'PATCH' })
  .then(async r => [r.status, (await r.json()).error ?? 'ok']);
Promise.all([go(), go()]).then(console.log)
```

Expected: exactly one `200` and one `409`; exactly one `AUTOMATIC_REQUESTED`; `refundedAmount` = total; dashboard shows exactly **one** refund. Any other outcome (two 200s, two refunds on the dashboard) is a P0: stop and send the report.

**Send back for E:** for E1 both HTTP results and the before/after reports; for E2 the HTTP status and report; for E3 the two results printed by the console and the report; dashboard refund count and amounts for BK-1 and BK-4.

---

## Step F. A refund the provider rejects (UNCERTAIN, not retried)

Use BK-5, prepared like BK-1 (paid, cancelled before the owner accepted, `refundState=NONE`).

1. In your non-production database, change BK-5's `transactionId` to a made-up unique value that is not a real tracker (for example `sandbox-invalid-tracker-1`). Note the real value first (last 6 characters is enough) in case you want F3.
2. Press **Send refund**.

| Look at | Expected |
|---------|----------|
| HTTP result | 200 with `automatic: false` |
| Booking | `refundState=UNCERTAIN`, `paymentStatus` still `PAID`, `refundedAmount=0` |
| Refund events | `AUTOMATIC_REQUESTED` then `AUTOMATIC_UNCERTAIN`, with `failure=...` fields filled (name, code, HTTP status from Safepay) |
| Student | No "refunded" notification |
| Dashboard | No refund created |

3. **Not retried.** Request the refund again (0.7). Expected: HTTP 409 "A previous refund request has no confirmed outcome..."; **no** new `AUTOMATIC_REQUESTED` event; the provider is not called.

**F3 (optional): manual confirmation.** Restore the real `transactionId`, refund that tracker in the sandbox dashboard yourself, then use **Confirm refund manually** on `/admin/refunds`. Expected: a `MANUAL_CONFIRMED` event and `refundedAmount` = the amount.

**A timeout cannot be forced against the sandbox.** The refund call aborts after 15 seconds and any thrown error follows the same path as the rejection above (`processRefund` in `src/lib/refunds.ts`). That path is covered by mocked tests only; there is no dedicated timeout test yet. Do not try to simulate a timeout live.

**Send back for F:** report output after step 2 and after step 3; Safepay's HTTP status and error name/code from the event (these are in the report, no message text); dashboard refund count for the real tracker; for F3 the final report.

---

## Final report template (copy, fill in, send)

```
Environment: sandbox confirmed (preflight OK: yes/no; checkout host: ...)
Build/PR under test: ...
Dashboard checklist: items 1-12 yes/no with notes
B  BK-1..BK-5 paid: webhook seconds ..., providerState ..., amountMinor ..., status ...
C  BK-1: refund HTTP ..., refundState ..., providerState ..., dashboard refunds: n x amount
D1 BK-2: ...   D2: ...   D3: HTTP ...
E1 delivery1 ..., delivery2 ...   E2: HTTP ...   E3: results [..,..], dashboard refunds: n
F  HTTP ..., refundState ..., failure fields ..., repeat HTTP ..., new request events: n
Consistency checks: any FAIL? (paste the FAIL lines)
Anything unexpected: ...
```

Always include the raw `report` output blocks; they are safe to paste.

## What passing means, and what it does not

**Pass** requires: B webhook arrives and marks the booking paid exactly as above; C one correct full refund; D1 and D2 correct amounts (or a clear Safepay rejection recorded); D3, E2 and E3 never create a second provider refund; E1 no double effect; F ends `UNCERTAIN` and is not retried; every consistency check `OK`; and the dashboard agrees with the app on every refund.

**Not covered:** live merchant approval, fees, settlement and payouts; JazzCash and EasyPaisa (disabled); the refund paths started by cron or owner decline (they use the same `processRefund` but are not exercised here); QStash retry behaviour (needs `QSTASH_TOKEN` and a public URL, a separate exercise); late payments after cancellation.

Enabling live payments is **not** part of this task. Anything about turning on live Safepay goes to the Founder after this report is reviewed.
