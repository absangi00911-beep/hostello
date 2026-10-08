# HostelLo Operations Runbook

**Last updated:** October 8, 2026
**Status:** Repository procedures are documented; provider and production access still need validation.

## Structured operational events and alerts

Application events are emitted as one JSON record with `timestamp`, `severity`, `event`, `service_name`, `request_id`, and bounded `attributes`. A valid W3C `traceparent` adds `trace_id`; otherwise the request ID uses Vercel's request ID when present or a generated UUID. These identifiers are for correlation only. Event attributes intentionally exclude raw request/provider payloads, payment trackers, credentials, contact details, and search text.

Key event names:

| Event family | Event names | Operator action |
|---|---|---|
| Authentication | `auth.login.throttled`, `auth.login.rejected`, `auth.login.succeeded`, `auth.login.processing_failed` | Review changes in throttled/rejected volume and correlate only with the HMAC pseudonyms. Login events intentionally omit raw email, IP, and password values; hosted alert rules still need console configuration. |
| Booking payments | `booking.payment_confirmed`, `booking.payment_failed`, `payment.reconciliation_required`, `payment.webhook.*` | Reconcile every `payment.reconciliation_required` event with the provider transaction before changing booking state. Investigate webhook processing failures and concurrent-state conflicts. |
| Search | `search.degraded` | Check Typesense health and indexing, then watch database fallback load. Alert on sustained degradation or a rate above the production baseline. |
| Notifications | `notification.dispatch_failed`, `notification.push.partial_failure`, `notification.email.dispatch_failed`, `notification.email.scan_failed` | Check the email/FCM provider and retry behavior; email price alerts remain active after delivery failure. |
| Scheduled jobs | `cron.success`, `cron.error`, `cron.health_log_failure` | Alert on any `cron.error` or `cron.health_log_failure`; also alert when `GET /api/health/crons` is not 200. |

Create these alert rules in the Sentry/Vercel project console and exercise them in preview before release. Alert on any payment reconciliation event and cron failure immediately. Set search and notification rate thresholds after representative traffic establishes a baseline; these workspace changes do not configure hosted alert rules.

## Cron health and recovery

The five QStash schedules are defined in `src/lib/cron-schedules.ts`. The same registry drives the scheduler and `GET /api/health/crons`, so a missing scheduler entry cannot silently disappear from health monitoring.

### Check cron health

Use an admin session or call the health endpoint with the internal secret from a trusted shell. Keep the secret in the shell environment; do not paste it into tickets or logs.

```powershell
Invoke-RestMethod -Method Get `
  -Uri "$env:APP_URL/api/health/crons" `
  -Headers @{ "x-cron-health-secret" = $env:CRON_SECRET }
```

- **200:** every configured job has a recent successful run.
- **207:** inspect each job's `status`, `ranAt`, and `ageMs`; `never_run`, `stale`, or `error` requires follow-up.
- **500:** cron history could not be read from the database. Check the Vercel runtime and Neon availability before changing schedules.

The endpoint deliberately returns generic failure text. For details, use the Sentry event tagged with the cron name, the safe Vercel log entry, and that job's QStash request history.

### Register or repair schedules

From a trusted environment with production environment variables loaded, set `APP_URL` to the production HTTPS origin, `QSTASH_TOKEN` to the correct QStash account token, and `CRON_SECRET` to the value configured in the app environment. Configure both `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` in the app to validate QStash JWTs during normal delivery and key rotation.

Run:

```powershell
npm run schedule-cron
```

Stable schedule IDs update the existing schedule instead of creating a duplicate. The command exits non-zero if any registration fails. Confirm all five `hostello-*` IDs and their next deliveries in the QStash console. A newly created schedule can take up to a minute to trigger for the first time. QStash signs deliveries; the configured Bearer secret is also forwarded for compatibility with the app's manual/legacy auth path.

Do not replay a failed job until checking its retry history and whether its side effects already completed. The recurring jobs are:

| Job | Schedule (UTC) | Retry guidance |
|---|---|---|
| `mark-completed-stays` | Daily at 00:00 | Conditional booking transitions prevent a second completion transition. Check the persisted notification if a push send was interrupted. |
| `cancel-abandoned-payments` | Every 5 minutes | Conditional cancellation updates prevent duplicate inventory restoration. Confirm the booking is still eligible before a manual replay. |
| `check-price-alerts` | Every 6 hours | A provider-accepted email can be duplicated if the process stops before the alert is deactivated. Check provider delivery and alert state before replaying. |
| `cleanup-tokens` | Daily at 01:00 | Repeating expiry/used-token deletion is safe. |
| `cleanup-verification-uploads` | Hourly | Repeating deletion of expired temporary verification objects is safe; submitted review objects use immutable keys. |

For an approved manual replay, use a trusted shell and the configured Bearer secret. Replays change application state and must be selected deliberately.

```powershell
Invoke-RestMethod -Method Post `
  -Uri "$env:APP_URL/api/cron/<job-route>" `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

Do not manually change `CronLog` rows to clear an alert; health should reflect actual job execution. After recovery, verify both the endpoint's response and the next `/api/health/crons` result.

## Payment support

- Treat Safepay's authenticated transaction record and signed webhook processing as the payment source of truth. A browser return URL is not proof of payment.
- Verified Safepay events are stored with a bounded, sanitized payload before QStash dispatch. The signed worker processes the stored event; QStash retries transient failures up to five times. If delivery is exhausted, `payment.webhook.queue_exhausted` is logged and the inbox row becomes `RETRYABLE`. Compare that row with the Safepay transaction and booking state before replaying the message from the QStash dead-letter queue.
- Refund requests and operator decisions are recorded in append-only `RefundAuditEvent` rows; `Booking.refundState` tracks `NONE`, `PROCESSING`, `UNCERTAIN`, or `REFUNDED`. For a timeout or stale `PROCESSING` attempt, verify the transaction in Safepay before recording a manual confirmation or recovering the attempt. The audit ledger is evidence of Hostello's actions, not proof that Safepay completed a refund.
- For a pending or failed booking, compare the Hostello booking state and transaction reference with the Safepay transaction before taking action.
- If a refund outcome is uncertain, leave the booking in its existing paid state until Safepay confirms the result. Do not issue the refund again or mark it refunded based only on a timeout. Record a manual refund in Hostello only after the completed refund is confirmed in Safepay.
- Keep JazzCash and EasyPaisa disabled for the mobile beta until their complete transaction inquiry, callback, and refund paths have been verified in their sandboxes.

## Manual owner payouts

- Review the admin queue and confirm the owner's account title, account number, bank name, and pending balance before generating a batch. The API blocks a batch if any of the three bank fields is empty, but it does not snapshot the destination on the payout record.
- Generating a batch atomically claims its eligible bookings. Recheck the current bank destination against the owner's confirmed instructions immediately before transfer; if it changed since batch generation, stop and verify the intended destination. Transfer the displayed amount outside Hostello, then mark the batch paid and record the bank/provider reference only after confirming the transfer completed.
- A booking already in a payout batch cannot be cancelled online. Students can cancel online only while a booking is PENDING and before check-out. After owner confirmation, they must follow the hostel cancellation terms; do not promise an automatic refund. If a cancellation or refund request arrives after a batch claims the booking, stop and reconcile the transfer state with the owner and bank/provider before changing any financial state.
- The `CANCELLED` payout status exists in the schema, but there is no supported action to void a pending batch or release its bookings, and no durable cancellation actor/time/reason fields. Do not edit the database or generate a replacement batch as a workaround; escalate and record the reconciliation decision. Add an audited void/release procedure and immutable bank-destination snapshot before real transaction volume.

## Deployment and data recovery gates

- Review the deployment quality gate and preview smoke results before promoting a Vercel deployment. During an incident, check production 5xx logs, run `vercel rollback`, check `vercel rollback status`, then confirm the error rate has dropped. Vercel rollback redirects production traffic to a previous deployment; it does not reverse Neon migrations or restore old environment-variable values. Keep schema changes backward-compatible with the code version used for rollback.
- Build and migration are separate operations. `npm run build` runs `prisma generate && next build`; it does not change the database. The production workflow first passes its quality gate, then runs `npm run db:migrate:deploy` through `vercel env run -e production`, and only then builds and deploys. Vercel remains the source of the production database URL; do not copy it into GitHub secrets.
- Pull-request preview builds do not run migrations. Keep preview databases schema-compatible through a separately managed non-production migration process. Next prerenders database-backed metadata, so local or preview builds still need a reachable database with a compatible schema.
- Run migrations only through the intended deployment pipeline or against a confirmed disposable PostgreSQL target. Do not run migration, build, or E2E checks against an unverified/shared database. Keep changes backward-compatible with the currently deployed app and rollback artifact; use expand-and-contract for destructive changes.
- Production Neon PITR/retention, recovery point objective, recovery time objective, and restore rehearsal have not been verified. Do not claim recovery readiness until an isolated restore has succeeded and been recorded.
- Preserve payment and booking evidence during an incident. Escalate ambiguous settlement/refund outcomes to the payment operator and reconcile them against the provider before changing booking state.
- For an emergency role change or account revocation, update the role and increment `User.tokenVersion` atomically, then delete the shared Upstash key `tv:<userId>`. Changing the role alone leaves the JWT's old role claim trusted until token expiry. Confirm the old session is denied before closing the incident; password change/reset already increments the version and invalidates this cache through the app.

## References

- [QStash schedule API](https://upstash.com/docs/qstash/api-reference/schedules/create-a-schedule)
- [QStash schedules guide](https://upstash.com/docs/qstash/features/schedules)
- [QStash signature verification](https://upstash.com/docs/qstash/howto/signature)
- [QStash failure callbacks and dead-letter recovery](https://upstash.com/docs/qstash/features/callbacks)
- [Vercel guidance for async work in functions](https://vercel.com/kb/guide/troubleshooting-inconsistent-logs-in-vercel-functions)
