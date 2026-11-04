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

**Two variants.** The steps below are written for a local `npm run dev` behind a tunnel. To run on a Vercel Preview deployment instead, read "Running on a preview deployment" first: it replaces 0.2, the tunnel and the restarts, and marks the steps that change or cannot run there.

---

## Running on a preview deployment

Use this variant instead of `npm run dev` behind a tunnel. Steps B to F still apply unless this section says otherwise. Code facts below were read from `main` (file and line given). Anything about the Vercel, Upstash or Safepay dashboards cannot be checked from the repo and is marked UNVERIFIABLE FROM REPO. No values, keys or URLs with secrets go in this document or in chat: names and placeholders only.

**Why a preview behaves differently from a local run.** A Vercel Preview build runs with `NODE_ENV=production` (`src/lib/deployment-env.ts`, `src/lib/env-validation.ts:216`). The code's development-only shortcuts therefore do not apply:

- **No inline webhook processing.** Without `QSTASH_TOKEN` the webhook throws instead of processing (`src/app/api/payment/webhook/route.ts:677`). QStash is required on a preview.
- **No in-memory rate limits.** Without Upstash Redis variables the rate limiter throws (`src/lib/rate-limit.ts:51`). Redis is required on a preview.
- Email checks `VERCEL_ENV`, but SMS, rate limits, CSRF and the app URL check `NODE_ENV`, so providers do not all behave the same way on a preview (see the email/SMS item below).

### P1. Prerequisites checklist

Tick every box before the first payment. If one cannot be ticked, stop and report which.

**Which deployment**

- [ ] The deployment's environment in Vercel is **Preview**, not Production. A deployment of the project's Production branch uses Production-scope variables (live keys, production database). Do not use it. To test `main`'s code, deploy it from a non-production branch. (UNVERIFIABLE FROM REPO: which branch is Production.)
- [ ] The commit includes B-001. The deployment page in Vercel shows the branch and full commit SHA. The app does not report its own commit (nothing in `src/` reads `VERCEL_GIT_COMMIT_SHA`), so that page is the only source. In a clone of the repo run:

  ```
  git merge-base --is-ancestor 048db532a9a6c51a30e8e8d674a1598254ebbd09 <deployed-sha> && echo "B-001 included"
  ```

  `048db53...` is the B-001 code commit. `0d4710e9fe54d626e500e11f786781923f808154` is the merge of PR #37 that put it on `main`, and it descends from the code commit, so a build from `main` at or after the merge passes the same check. The `preview` branch contains the code commit but not the merge commit (checked when this was written), so a preview of that branch is also acceptable. Second check: `git show <deployed-sha>:src/lib/refunds.ts | grep -n "refundedAmount: booking.refundedAmount"` must print one line inside the refund claim.
- [ ] Write the full deployed SHA in "Build/PR under test" in the final report.
- [ ] `NEXT_PUBLIC_*` values are compiled into the build. After changing `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SAFEPAY_ENV`, redeploy and re-check the SHA.

**Data isolation**

- [ ] Separate non-production database (a Neon branch or similar). The Preview-scope `DATABASE_URL` has a different host and database name from the Production one. Compare them in the Vercel variables page; do not copy the values anywhere.
- [ ] Each of these has its own Preview-scope entry and is not one entry shared by "All Environments" with production: `DATABASE_URL`, `SAFEPAY_SECRET`, `SAFEPAY_API_KEY`, `SAFEPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_SAFEPAY_ENV`, `NEXT_PUBLIC_APP_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. (UNVERIFIABLE FROM REPO.)
- [ ] The database schema is migrated before the first test. The Vercel build does not migrate (`scripts/vercel-build.mjs`). From your machine run `npm run db:migrate:preview`. It refuses unless `DATABASE_URL` matches the configured preview database and differs from production. Its settings (names only): `HOSTELLO_MIGRATION_TARGET=preview`, `HOSTELLO_PREVIEW_DATABASE_HOST`, `HOSTELLO_PREVIEW_DATABASE_NAME`, `HOSTELLO_PRODUCTION_DATABASE_HOST`, `HOSTELLO_PRODUCTION_DATABASE_NAME` (`scripts/migrate-preview.mjs`). Do not run `db:push` or `db:seed` against it unless you have checked which database `DATABASE_URL` points to.
- [ ] **Separate Redis database.** Create a separate Upstash Redis database for Preview and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` at Preview scope. A shared database with a different key prefix is not possible: the rate-limit prefix is fixed in code (`src/lib/rate-limit.ts:76`, `hostello:ratelimit`) and cannot be set by an environment variable. Sharing production's Redis would share the admin refund counters with production (the token-version cache also uses Redis; its key names were not checked).
- [ ] **QStash configured.** Set `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` at Preview scope, from a QStash project that production does not use if you can. The app publishes the queued event to `<NEXT_PUBLIC_APP_URL>/api/payment/webhook` with a failure callback to `<NEXT_PUBLIC_APP_URL>/api/payment/webhook/failure` (`route.ts:664-669`), so the messages go to the preview alias and never to production as long as that URL is correct. The queued call is accepted only with a valid QStash signature; the `CRON_SECRET` fallback is off for it (`route.ts:539-560`).
- [ ] **Test-only recipients.** No code in `src/` restricts who receives email or SMS, so protection is data hygiene: fake users only, addresses and numbers you control. Leave `RESEND_API_KEY` unset on Preview. On a non-production deployment `sendEmail` then reports success without sending (`src/lib/email.ts:36-41`). If you set it, every user address in the preview database must be one you control. SMS differs: `sendSms` checks `NODE_ENV`, so with Twilio unset on a preview it returns "SMS delivery is unavailable" instead of skipping (`src/lib/sms.ts:93-96`). This validation needs no SMS. A flow that needs an OTP will fail unless you set Twilio variables, and then only to numbers you own.
- [ ] Fake test users (0.4). Never real people's emails, names or numbers.

**URL and Deployment Protection**

- [ ] **Stable branch alias.** In Vercel, find the branch alias for the branch you deploy (the address that stays the same across commits). Do not use the per-deployment address that changes with each commit. Set `NEXT_PUBLIC_APP_URL` at Preview scope to that origin (`https://`, no path, no trailing slash), then redeploy. The same value is used for the checkout return, the QStash target and the CSRF check. The CSRF check rejects state-changing requests whose `Origin` is not that origin (`src/lib/csrf.ts`), so browse the app **only** through the alias. On any other address the admin refund actions return 403 "Cross-origin request rejected." Leave `AUTH_URL` unset or equal to the alias (`NEXT_PUBLIC_APP_URL` is read first, `src/lib/app-url.ts`).
- [ ] The Safepay sandbox webhook (0.1 item 3) is `https://<alias>/api/payment/webhook`. Never register `/api/payment/webhook/failure`.
- [ ] **Deployment Protection must not block `/api/payment/webhook` or `/api/payment/webhook/failure`.** Two callers must reach them: Safepay's sandbox, and QStash (calling back with the queued event). Upstash's documentation describes a Vercel bypass secret sent in the header `x-vercel-protection-bypass`. The app's QStash publish sends no custom header (`route.ts:664-669`), and nothing in the repo shows that Safepay can add one, so the bypass-secret route does not work without a code change. For the duration of the run turn Deployment Protection off for Preview in the Vercel project settings, and turn it back on afterwards. (UNVERIFIABLE FROM REPO.) While it is off, anyone with the address can reach the preview: use fake data only, long random passwords for the test admin, do not share the address, and disable or delete the test accounts afterwards.
- [ ] Check it from a browser or machine not signed in to Vercel:

  ```
  curl -s -X POST https://<alias>/api/payment/webhook
  ```

  Expected: the JSON `{"error":"Invalid signature."}` (`route.ts:622-625`). An HTML page (a Vercel sign-in or protection page) means the route is still blocked: stop. The request carries no secret and is rejected before any database work.
- [ ] `CRON_SECRET` is set at Preview scope only if you will call a cron route (P4). Otherwise leave it unset.

### P2. Confirm sandbox mode and no production data (replaces 0.3 for this variant)

| # | Check | How | What it proves |
|---|-------|-----|----------------|
| 1 | Deployment is Preview | Vercel deployment page, environment label | You are not on Production-scope variables |
| 2 | `NEXT_PUBLIC_SAFEPAY_ENV` is `sandbox`, set explicitly | Preview-scope variable in Vercel. Environment validation only enforces it for production deployments (`env-validation.ts:239`), and the app treats any value other than `production`, including unset, as sandbox (`src/lib/safepay.ts:24,38`). Set it anyway so a missing value is visible. | Configuration only |
| 3 | Checkout host | Start a payment (step B). The checkout address must be on `sandbox.api.getsafepay.com/embedded/` and contain `environment=sandbox`. If it is not, **stop and do not pay**. | The only proof about the **deployed** build. The value is compiled in at build time, so nothing on your machine can show it |
| 4 | Tracker in the dashboard | The tracker appears in the Safepay **sandbox** dashboard | Keys are sandbox keys (this check is yours; the repo cannot tell sandbox keys from live ones) |
| 5 | Same database | After step B, run `report` with the `DATABASE_URL` from the Preview scope. It must show the booking you just created on the preview site. If it does not, you are looking at a different database from the one the preview writes to: stop | The database you query is the one the preview uses. Together with the host comparison in P1 it is the evidence that production was not touched |

**Local validation file.** `preflight` and `report` run on your machine. Create a dedicated file such as `.env.preview-validation.local` (the repo's `.gitignore` covers `.env*.local`) holding only: `NEXT_PUBLIC_SAFEPAY_ENV=sandbox`, `SAFEPAY_SECRET`, `SAFEPAY_API_KEY`, `SAFEPAY_WEBHOOK_SECRET` and `DATABASE_URL` (the preview database). The script requires all five even for `report`. Type them in from the dashboards rather than pulling every Preview variable to disk. Do not set `NODE_ENV=production` in it. Use `--env-file=.env.preview-validation.local` wherever the steps say `--env-file=.env.local`. Delete the file after the run. Preflight reads only this local file, so it checks your file, not the deployment. Its two lines about QStash and Redis (for example "processed inline") describe your local file and are wrong for a preview: ignore them. `npm run db:studio`, used in D2 and F, reads the app's normal env file: confirm it points at the preview database before you edit a row.

Nothing new to send for P2. Use the existing "Send back for 0" list (the checklist table, the preflight output, and the checkout hostname only) and put the full deployed commit SHA in "Build/PR under test" in the final report.

### P3. Step by step: what changes on a preview

| Step | Preview status | What to do |
|------|----------------|------------|
| 0.1 dashboard checklist | Run as written | Item 3 is the alias URL. Item 11 (can the dashboard resend a real delivery?) now matters for E1 |
| 0.2 local environment | **Replaced** | Use P1. Do not leave `QSTASH_TOKEN` or the Redis variables unset |
| 0.3 confirm sandbox | **Replaced** | Use P2 |
| 0.4 accounts and report tool | Run as written | Create the accounts on the alias. `report` uses the local validation file |
| 0.5 bookings | Run as written | |
| 0.6 refund rate limit | **Changed** | The limit is held in the preview Redis, so restarting or redeploying does not reset it. The key is per admin (`admin-refund:<admin id>`, `src/app/api/admin/bookings/[id]/refund/route.ts:23`). Between sittings wait an hour, or use a second test admin, or clear the preview Redis database (never production's). A `429` is still not a failure |
| 0.7 refund from the console | Run as written | Run it in the console of a page opened on the **alias** (the `Origin` must match) |
| B pay and confirm webhook | **QSTASH-DEPENDENT** | There is no inline path. Expected webhook row `status` moves `RECEIVED` to `QUEUED` to `PROCESSED`; the report may catch `QUEUED` for a moment. If the booking is still `PENDING` after a couple of minutes with a row at `RECEIVED`, `QUEUED` or `RETRYABLE`, check in this order: the QStash variables, that Deployment Protection is off (P1 check), and that `NEXT_PUBLIC_APP_URL` is the alias. The admin retry route also needs the QStash variables (`payment-events/[id]/retry/route.ts:78-80`). Replace "Dev server log" with the Vercel runtime logs: search for `booking.payment_confirmed` and note yes or no; do not send raw logs |
| C full refund | Run as written | |
| D1, D2, D3 partial refunds | Run as written | D2 edits a row: check the database target first (P2) |
| E1 scripted replay | **SKIPPED-ON-PREVIEW** | `replay-webhook` refuses any `--base-url` that is not localhost (`scripts/safepay-sandbox-validation.mjs`), so it cannot reach a preview. Do not work around it |
| E1 optional dashboard resend | Applies, and is a stronger test here | If 0.1 item 11 says the dashboard can resend a real delivery, resend one for BK-3 and send both reports. The resend goes through the real Safepay and QStash path. If it cannot be done, record `E1: SKIPPED-ON-PREVIEW` in the final report. The Tech Lead decides whether a local run for E1 alone is needed before launch |
| E2 repeated refund | Run as written | |
| E3 simultaneous refunds | Run as written | |
| F rejected refund | Run as written | The step edits a row: check the database target first |
| Final report | Unchanged | Write "preview" and the full SHA in "Build/PR under test" |

### P4. Cron routes: none are needed, and none run by themselves on a preview

No step in B to F calls a cron route, so nothing in this runbook is skipped because of cron. Nothing schedules the cron routes on a preview: `vercel.json` has no `crons` entry, and QStash schedules are set up in Upstash (UNVERIFIABLE FROM REPO). All seven routes are `POST`, accept `Authorization: Bearer <CRON_SECRET>` and are exempt from the CSRF check (`src/proxy.ts`). Run one by hand only if a step of your own needs it, from your shell, with the secret in an environment variable and not typed into the command:

```
curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://<alias>/api/cron/<route>
```

| Route | What it does to the preview database | Needed for B to F? |
|-------|--------------------------------------|--------------------|
| `cancel-abandoned-payments` | Cancels old `PENDING` bookings that are still unpaid (sets status `CANCELLED`, `paymentStatus` `FAILED`) and gives their room places back | No. It is the path behind the late-payment gap, which this runbook does not cover. Do not run it on a booking you are about to pay |
| `expire-unanswered-bookings` | Sends owner reminders and expires unanswered paid bookings, which **starts sandbox refunds** with actor `system:owner-response-timeout` (audit E-1) | No. Do not run it during this validation; it can move sandbox money outside the steps |
| `mark-completed-stays` | Applies the stay-finished status transition and creates an in-app notification | No |
| `check-price-alerts` | Runs the price-alert check (`checkPriceAlerts`) | No |
| `cleanup-tokens` | Deletes expired password-reset and verification tokens | No |
| `cleanup-verification-uploads` | Deletes expired verification uploads (`deleteExpiredVerificationUploads`) | No |
| `process-account-deletions` | Runs the account-deletion queue (`processAccountDeletionQueue`) | No |

`GET /api/health/payments` is a read-only detector for cancelled-but-paid and stuck refunds. It accepts an admin session, or the header `x-cron-health-secret` equal to `CRON_SECRET` (`src/app/api/health/payments/route.ts:9-10`). It is optional here.

### P5. Parts of the local variant that do not apply on a preview

- The public tunnel and tunnel URL (0.2). The alias replaces it.
- `npm run dev`, `npm start` and restarting the dev server (0.2, 0.6).
- Leaving `QSTASH_TOKEN` unset for inline processing and leaving the Redis variables unset for in-memory limits (0.2). Both must be set on a preview.
- The `.env.local` file as the app's environment (0.2). The app reads Preview-scope variables in Vercel; only the validation commands read your local file.
- `replay-webhook` and its `--base-url` option (E1).
- The "Dev server log" row in B (use runtime logs).

### P6. After the run

Turn Deployment Protection back on for Preview. Delete `.env.preview-validation.local`. Disable or delete the test accounts. Remove the sandbox webhook URL from the Safepay sandbox dashboard if you will not reuse it. Do not enable live payments: that goes to the Founder after the report is reviewed.

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

> **Preview variant: REPLACED.** Skip this section and use "P1. Prerequisites checklist". On a preview, `QSTASH_TOKEN` and the Redis variables must be set, not left unset.

Set these in your local env file (names only here, never put values in the repo, this document or chat):

`NEXT_PUBLIC_SAFEPAY_ENV` (must be exactly `sandbox`), `SAFEPAY_SECRET`, `SAFEPAY_API_KEY`, `SAFEPAY_WEBHOOK_SECRET`, `DATABASE_URL` (non-production), `NEXT_PUBLIC_APP_URL` (your public tunnel URL), plus the other variables in `.env.example` the app needs to start.

Leave `QSTASH_TOKEN` unset for the simplest run: outside production the webhook is then processed inline. Leave `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` unset so rate limits live in process memory (restarting the dev server resets them).

Safepay's sandbox must reach your webhook, so expose the local app on a public HTTPS URL with any tunnel you trust, and use that URL in 0.1 item 3 and in `NEXT_PUBLIC_APP_URL`. Start the app with `npm run dev` (not `npm start`: production mode refuses to process webhooks without QStash).

### 0.3 Confirm the app is in sandbox mode

> **Preview variant: REPLACED.** Use "P2. Confirm sandbox mode and no production data".

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

> **Preview variant: CHANGED.** The limit lives in the preview Redis and a restart does not reset it. See the 0.6 row in "P3".

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

> **Preview variant: QSTASH-DEPENDENT.** The webhook is processed only through QStash on a preview. Complete "P1" first and see the B row in "P3".

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

**E1. Repeated webhook delivery.**

> **Preview variant: the scripted replay below is SKIPPED-ON-PREVIEW** (the script only posts to localhost). Use the optional dashboard resend further down if the dashboard offers it, otherwise record `E1: SKIPPED-ON-PREVIEW`. See the E1 rows in "P3".

Use BK-3 (paid, untouched). Take the report first. Then:

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
