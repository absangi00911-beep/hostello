# Operations Runbook

This runbook is based on checked-in routes and scripts. It does not assert that
provider dashboards, alert delivery, credentials, or database recovery have
been configured. Follow the [CI/CD guide](CI-CD-GUIDE.md) for deployment
mechanics and [Prisma migration discipline](../prisma/MIGRATIONS.md) for schema
changes.

## Roles and incident safety

- The incident owner coordinates response and approves production actions.
- The backend/integrations owner investigates application and provider events.
- The QA/DevOps owner checks workflow, monitoring, and recovery evidence.
- The Founder/human owner approves decisions affecting payments, customer
  commitments, or restoration of production data.

These are workspace role definitions, not proof of on-call coverage. Confirm
who is available before launch. Do not put credentials, webhook payloads,
student documents, or raw personal data in chat, tickets, or logs. Preserve
event IDs and timestamps in an access-controlled incident record.

## Payment health and webhook events

### Check health

`GET /api/health/payments` requires an Admin session or the internal
`x-cron-health-secret` header. It returns:

- `200` with `healthy: true` when no tracked payment issues are present.
- `207` with counts when bookings or Safepay webhook events need attention.
- `500` when the health query cannot complete.

Counts cover unanswered paid bookings, overdue unpaid bookings, refund issues,
retryable webhook events, and reconciliation-required webhook events. This is a
signal, not a financial settlement report.

### Inspect payment events

`GET /api/admin/payment-events` is Admin-only and lists open
`RETRYABLE` and `RECONCILIATION_REQUIRED` Safepay events. It paginates results
and includes event status, provider tracker, safe error code, attempt count, and
recent operator retry records. Restrict access to this data.

For each event, capture its database event ID, status, received time, and
relevant safe error code in the incident record. Compare the exact tracker and
transaction status in the Safepay account using an authorized operator. A
provider callback alone does not establish that the corresponding booking or
subscription transition is safe to apply.

### Retry only eligible events

Only a `RETRYABLE` event can be queued for replay. The Admin-only endpoint is
`POST /api/admin/payment-events/{id}/retry`; the request must assert
`providerChecked: true`, supply the exact stored provider tracker, and include a
20-500 character reason. The route also requires QStash configuration and
limits an Admin to five retry requests per hour. A `202` means the retry was
queued, not that payment state was reconciled. Check the event and payment
health again after the asynchronous delivery.

Do not retry until the provider transaction has been checked and the result
matches the stored event evidence. Do not repeatedly submit after an uncertain
response; inspect the event status first. Record who checked the provider,
when, and the decision rationale.

### Reconciliation-required events

`RECONCILIATION_REQUIRED` events cannot be replayed through the retry endpoint.
Do not bypass this guard, edit payment rows, grant an entitlement, issue a
refund, or mark an event complete manually. Preserve the evidence and escalate
to the incident owner and backend/integrations owner for a decision under the
approved payment policy. Several financial and lifecycle policies remain
unresolved; if the correct outcome depends on one of them, pause that action
until the Founder/human owner resolves it.

## Cron and service health

`GET /api/health/crons` requires an Admin session or the internal
`x-cron-health-secret` header. It returns `200` when every registered job is
fresh and successful, `207` when one or more jobs are stale, failed, or have
never run, and `500` when the database query fails. Schedule intervals and
freshness thresholds are defined in `src/lib/cron-schedules.ts`; the
`CronLog` row contains the latest run record.

The code documents use with Sentry Crons, uptime monitors, and the admin
dashboard, but no external alert configuration is verified. Payment health,
cron health, and provider delivery alerts must be configured and tested by an
owner in the provider consoles before launch.

For an unhealthy job:

1. Record the job name, reported status, last run time, and incident start.
2. Check the relevant application and QStash delivery logs using approved
   operator access. Avoid copying request bodies or secrets into the incident
   record.
3. Check the specific job handler and its intended state transition before
   considering a rerun; do not assume every job is idempotent or safe to
   repeat. Obtain explicit authorization before manually rerunning production
   work.
4. Escalate failed or ambiguous payment, refund, account-deletion, and
   verification-upload cleanup runs to the incident owner. Do not replay a job
   or alter data without explicit authorization.

## Application rollback and database recovery

### Application rollback

The production workflow deploys a Vercel artifact after migrations. An earlier
application build may be redeployed through the owner-verified Vercel release
process, but that console procedure and access have not been verified here.
Obtain incident-owner approval and confirm the prior application version is
compatible with the current schema. An application rollback does not roll back
a migration.

### Migration failure

1. Stop further deploy or migration attempts. Record the GitHub workflow run
   and failed step.
2. Determine from the workflow and database operator evidence whether the
   migration changed any production data or schema. A failed command does not
   prove that no changes were applied.
3. Do not use `prisma db push`, edit an already-applied migration, or manually
   modify Prisma's migration ledger. Escalate an unknown or partially applied
   migration to the incident owner and qualified database operator.
4. Resume only after the migration state, corrective plan, and compatible
   application version have been approved.

### Database restore

Neon point-in-time recovery settings, retention, RPO/RTO, snapshot credentials,
and restore procedure are not verified. The production workflow can create an
expiring Neon branch before migrations, but a branch is not a restore rehearsal.
Do not restore or switch production data based solely on a successful branch
creation. The Founder/human owner and qualified database operator must approve
the target, timing, data-loss window, and customer impact. Rehearse the chosen
restore path on a disposable target and validate it before any production
recovery action.

## Logging and incident notes

Application operational events are structured JSON written through
`src/lib/operational-logger.ts`. Correlation IDs are available, and some
identifiers are HMAC-pseudonymized. Logs intentionally avoid implicit request
payloads. Do not add raw payment payloads, emails, credentials, or student
documents to logs while troubleshooting.

## Source of truth

- `src/app/api/health/payments/route.ts`
- `src/app/api/health/crons/route.ts`
- `src/app/api/admin/payment-events/route.ts`
- `src/app/api/admin/payment-events/[id]/retry/route.ts`
- `src/app/api/payment/webhook/failure/route.ts`
- `src/lib/cron-schedules.ts`
- `src/lib/operational-logger.ts`
- `.github/workflows/production.yml`
- `scripts/neon-snapshot.mjs`
- `prisma/MIGRATIONS.md`
