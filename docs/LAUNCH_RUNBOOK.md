# HostelLo launch operations runbook

Use this checklist before and after a production release. It records operational work that still needs an account owner; code cannot confirm that a dashboard alert, backup, or provider setting is active.

## Before each release

- [ ] Confirm the GitHub Actions production migration step completed before Vercel serves the new application schema.
- [ ] When Preview schema changes are included, run the guarded Preview migration workflow from the `preview` branch and confirm it targeted the isolated Preview database before deploying the Preview build.
- [ ] Confirm Vercel has the production Safepay merchant key, secret, webhook signing secret, and private R2 verification credentials in the correct environment.
- [ ] Confirm the QStash schedules match `src/lib/cron-schedules.ts`, including `expire-unanswered-bookings` every 15 minutes and `process-account-deletions` every minute.
- [ ] If account-deletion schema changes are included, confirm the environment migration completed and the deletion worker has a recent successful run.
- [ ] Open `/api/health/crons` as an admin and confirm every scheduled job is healthy.
- [ ] Open `/api/health/payments` as an admin and confirm there are no unanswered bookings past deadline, old unpaid checkouts, refund issues, retryable exhausted webhook deliveries, or webhook events awaiting manual reconciliation.
- [ ] Run one production-safe checkout and verify the booking remains pending until its owner accepts it. Do not use a real charge for this check unless Safepay has approved the merchant environment for live payments.

## Alerts to configure in Vercel and Sentry

- [ ] Alert on failed or stale cron runs from `/api/health/crons`.
- [ ] Alert when `/api/health/payments` returns `207` or `500`.
- [ ] Confirm payment health alerts include both retryable exhausted webhook deliveries and manual-reconciliation events.
- [ ] Alert on `payment.reconciliation_required`, `payment.webhook.processing_failed`, `cron.error`, and repeated `notification.dispatch_failed` events.
- [ ] Route payment and refund alerts to a person who can inspect the Safepay merchant dashboard and the admin refund queue.

The health endpoints contain aggregate counts only. Keep their internal check secret in the monitoring service, never in browser code or a public URL.

## Payment or refund incident

1. Find the booking in the admin booking/refund tools using its booking reference.
2. Compare the stored transaction reference, amount, and currency with the Safepay merchant record.
3. For an `UNCERTAIN` refund, inspect Safepay first. Confirm the refund manually only after the provider shows it completed; otherwise leave the case open and contact Safepay support.
4. Check that the student-facing booking page shows the same state. Never tell a student that a refund is complete until the provider outcome is confirmed.
5. Record the provider reference and resolution in the existing refund audit trail, then recheck `/api/health/payments`.

## Database recovery

- [ ] Confirm the production database has an active backup/PITR retention policy and identify who can restore it.
- [ ] At least once before launch, restore a backup to an isolated branch and verify application reads plus a migration from the current release.
- [ ] Keep the restored branch isolated. Do not point production Vercel at a recovery copy during a rehearsal.
- [ ] Record the last successful restore date and the person who performed it in the team's operational log.

## After release

- [ ] Confirm the new deployment's health endpoints are healthy after the new cron schedule has had time to run.
- [ ] Review recent Sentry/Vercel events for webhook, payment reconciliation, refund, and email delivery failures.
- [ ] Review owner-response expiry and refund queues daily until booking volume and alert routing are established.
