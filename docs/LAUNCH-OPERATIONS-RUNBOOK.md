# HostelLo Launch Operations Runbook

**Status:** Draft — external-account validation and named owners remain required  
**Last reviewed:** October 7, 2026  
**Scope:** Web MVP, Safepay checkout, private student verification documents, and mobile beta release gates.

This is the operator procedure for a controlled launch and for the first response to a production incident. It does not authorize database restoration, payment settlement, refund, bucket reconfiguration, or deployment rollback by itself. Record the actor, UTC timestamp, affected deployment, and supporting evidence for every production action.

## 1. Roles And Evidence

Assign these roles before opening the launch cohort:

| Responsibility | Required evidence |
| --- | --- |
| Release lead | Approved deployment URL, Git SHA, release time, cohort/area |
| Payments owner | Safepay dashboard result, signed webhook event, booking ID, amount/currency comparison |
| Database owner | Neon project/branch, retention setting, recovery-point timestamp, restore rehearsal record |
| Incident lead | Incident timeline, customer impact, decision log, rollback/recovery owner |
| Support owner | Customer-facing status text, affected-booking list, escalation path |

Do not put payment trackers, raw card data, full private-document URLs, passwords, or access secrets into tickets, chat, or Sentry.

## 2. Release Gates

The release lead records a pass/fail result for each gate:

| Gate | Pass condition |
| --- | --- |
| Web artifact | Production build, route checks, and browser smoke checks complete against a safe database target |
| Database | Neon retention/PITR setting, RPO/RTO, connection budget, and an isolated restore rehearsal are recorded |
| Payments | Safepay sandbox checkout/refund and a controlled production transaction have signed webhook evidence and booking-state reconciliation |
| Documents | The verification R2 bucket is private, its token is bucket-scoped, admin document access works, and public/legacy exposure has been checked |
| Observability | Sentry scrubbing/IP controls and Vercel/Sentry alerts for payments, search, notifications, crons, and cron health are enabled and exercised |
| Mobile beta | EAS production values, signing, app links, native artifacts, device payment returns, and push behavior are verified |
| Operations | On-call contacts, a launch cohort/area, support macros, and this runbook are approved |

Any failed gate blocks broader distribution. A controlled transaction or restore rehearsal must use an explicitly approved disposable or production target and should be recorded in the release evidence.

## 3. Controlled Launch Sequence

1. Record the release Git SHA, Vercel production deployment URL, release lead, planned cohort, and rollback deployment URL.
2. Confirm the production environment has the intended canonical HTTPS origin, Safepay settings, R2 bucket credentials, QStash schedules, and monitoring DSNs. Do not paste values into the release record.
3. Deploy and check the public pages, signed-in student flow, owner flow, and administrator flow. Keep checks read-only except for an approved controlled test transaction.
4. Execute the approved Safepay transaction. Reconcile provider amount, currency, booking ID, and expected tracker with the stored booking state and signed webhook outcome. Redirect query parameters are never payment evidence.
5. Watch errors, payment reconciliation events, search degradation, notification failures, and cron-health data for at least the first cohort window. Escalate any payment mismatch, private-document exposure, or sustained error spike immediately.
6. Expand only after the release lead records the observed results and payments/support owners agree there are no unresolved reconciliation items.

## 4. Deployment Incident And Rollback

Use a deployment rollback for application regressions. It does not revert database data, external payment state, object storage, or third-party configuration.

1. Confirm the incident from customer reports, Sentry, or Vercel logs. Record the current deployment URL and the last known good deployment.
2. Pause cohort expansion and assign an incident lead. Keep payment and refund evidence intact.
3. Roll back to the known-good production deployment through the Vercel dashboard or CLI only after the incident lead approves it.
4. Verify the production route assignment, affected flows, error rate, QStash/cron state, and environment assumptions after rollback.
5. Vercel instant rollback reassigns traffic to an earlier build without rebuilding it. Its earlier environment and cron configuration may therefore be stale; verify these explicitly before declaring recovery.
6. Investigate with a preview deployment. Compare the affected route and errors against the good deployment, then record the fix and post-incident action items.

## 5. Database Data-Loss Or Bad-Migration Response

1. Stop destructive jobs and further schema/data changes. Preserve the current deployment and record the approximate first-bad timestamp in UTC.
2. Check the configured Neon retention window before proposing a recovery point.
3. Create or inspect an isolated point-in-time branch first. Use Neon time-travel inspection to confirm the chosen timestamp and identify the minimum data to recover.
4. Prefer selective recovery from the isolated branch when current production contains valid post-incident data. Do not replace a production branch until the database owner verifies the intended consequences and the incident lead approves the action.
5. Reconcile bookings, payouts, refunds, and verification-document references before reopening write traffic. A code rollback does not reconcile these records.
6. Record actual RPO (data lost, if any), RTO (service interruption), recovery-point evidence, validation queries, and remaining manual work.

## 6. Payment Reconciliation Incident

Treat any mismatch among the signed Safepay event, stored booking state, provider tracker/reference, amount, or currency as a reconciliation incident.

1. Do not confirm, cancel, refund, or retry a payment solely from a browser redirect or customer claim.
2. Locate the booking by its internal ID, inspect the recorded provider/tracker/amount/currency, and compare it with the signed provider event and Safepay dashboard.
3. Keep uncertain refunds as `PAID` until the provider outcome is independently verified. Use the existing manual-confirmation path only after that evidence exists.
4. Isolate the affected booking from automatic retry/duplicate settlement while the payments owner investigates.
5. Record the event identifiers in the restricted incident record, contact affected customers through approved support channels, and close the incident only after booking, refund, payout eligibility, and customer communication agree.

## 7. Private Document Exposure

1. If a private student-document URL is reachable without authorized admin access, disable the exposure path immediately and preserve access evidence.
2. Confirm the verification bucket has no public development URL or public custom domain. Review any legacy public listing-bucket objects separately.
3. Rotate the affected bucket-scoped credentials when compromise is plausible. Use least-privilege Object Read & Write access scoped to the verification bucket.
4. Verify the authenticated admin proxy still returns the intended document only to authorized administrators. Retest the former public URL and record the outcome.
5. Notify the incident lead and follow the applicable privacy and user-notification procedure.

## 8. Monitoring And Alert Response

Configure and exercise alerts before launch for:

- payment reconciliation required or signed-webhook failures;
- sustained search degradation;
- failed notification delivery;
- cron failure or missing cron-health completion;
- 5xx or client-error spikes on critical booking/authentication routes.

For each alert, define the owning role, contact channel, threshold, response-time target, dashboard/query link, and a test event. Confirm Sentry server-side scrubbing and IP handling at project level; local SDK filtering does not replace hosted settings.

## 9. Release Evidence Record

Copy this table into the launch ticket and fill it with links or restricted references. A blank, inaccessible, or unverified item is a failed gate.

| Gate | Result | Evidence/reference | Owner | UTC time |
| --- | --- | --- | --- | --- |
| Deployment | Pass / fail | Production deployment URL and Git SHA |  |  |
| Web checks | Pass / fail | Build, route, and browser smoke output |  |  |
| Database recovery | Pass / fail | Retention, RPO/RTO, isolated restore rehearsal |  |  |
| Safepay | Pass / fail | Sandbox and controlled live transaction reconciliation |  |  |
| Private documents | Pass / fail | Bucket access review and legacy URL test |  |  |
| Monitoring | Pass / fail | Alert test IDs and scrubbing/IP setting review |  |  |
| Mobile beta | Pass / fail | EAS artifact, app-link, device test results |  |  |
| Rollback readiness | Pass / fail | Known-good deployment and assigned release owner |  |  |
| Cohort decision | Approved / held | Cohort, support coverage, decision log |  |  |

## 10. References Checked

- [Vercel production rollback guide](https://vercel.com/docs/deployments/rollback-production-deployment) and [instant rollback behavior](https://vercel.com/docs/instant-rollback)
- [Neon point-in-time restore overview](https://neon.com/blog/announcing-point-in-time-restore) and [recovery branch guidance](https://neon.com/blog/recover-production-database)
- [Cloudflare R2 public-bucket controls](https://developers.cloudflare.com/r2/buckets/public-buckets/) and [bucket-scoped S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/)
- [Sentry project privacy controls](https://docs.sentry.io/api/projects/update-a-project/) and [organization privacy controls](https://docs.sentry.io/api/organizations/update-an-organization/)

These sources describe provider capabilities and operational constraints. The launch team must verify the settings in HostelLo's actual accounts; this document does not claim that those settings are already enabled.
