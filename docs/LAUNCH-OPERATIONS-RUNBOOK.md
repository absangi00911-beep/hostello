# Launch Operations Runbook

This is a release-readiness checklist, not evidence that any provider console,
credential, alert, or recovery control is configured. The current system status
remains pre-launch; see [SYSTEM.md](../SYSTEM.md) and its risk register.

## Go/no-go ownership

The Founder/human owner makes the final launch decision and accepts residual
risks. The Tech Lead coordinates the release, QA/DevOps validates gates and
recovery readiness, Backend/Integrations checks provider flows, and
Marketplace Operations validates support and trust/safety readiness. Confirm
named people and escalation coverage; workspace role definitions do not create
on-call coverage.

**No-go** for real payment, payout, or transaction volume until the relevant
product, financial, and operational policies are decided, implemented, and
verified. The current open decisions include payout/custody and settlement
controls, Pro subscription lifecycle, booking duration and billing rules, and
email retention/outbox policy. Do not infer these policies from current code.
Student-document handling and retention must also be explicitly verified before
launching flows that collect those documents.

## Release checklist

### Product, support, and policy

- [ ] Founder has documented go/no-go approval and acceptance of remaining
  risks.
- [ ] Payment, refund, payout, subscription, and booking rules are approved for
  the exact launch scope; unsupported or undecided flows remain disabled.
- [ ] Marketplace Operations has tested owner and student onboarding,
  moderation/escalation, support response ownership, and incident communications.
- [ ] Privacy owner has approved data handling and retention for every
  collection flow enabled at launch, including student verification documents.

### CI, deployment, and schema

- [ ] Required pull request and `main` branch controls are confirmed in GitHub;
  CI has passed for the exact release commit.
- [ ] Production workflow gates passed, and any configured `production`
  environment approval was completed. Verify the required-reviewer setting
  directly; the workflow file alone does not enforce it.
- [ ] Vercel production project, domain, environment variables, and deploy
  permissions are verified by an owner.
- [ ] Production database target and credentials are verified through the
  approved secret-management process; do not expose connection strings.
- [ ] Migration SQL has been reviewed for expand/backfill/contract compatibility,
  data volume, lock impact, and failure handling.
- [ ] Owner verifies Neon snapshot credentials, project/branch identity, and
  `NEON_SNAPSHOT_REQUIRED=true`. Confirm the snapshot step succeeded before
  migration; snapshot creation is warning-only otherwise.
- [ ] Backup retention, RPO/RTO, and restore procedure are decided. A disposable
  restore rehearsal has succeeded; creating a pre-migration branch alone is
  insufficient.

### Payments, jobs, and observability

- [ ] Safepay sandbox payment, webhook verification, duplicate/replay behavior,
  refund, and QStash retry paths have been tested without real transactions.
- [ ] Production provider credentials, webhook registration, callback URL,
  permissions, and any IP/security settings are verified by the provider
  account owner. These settings are not source-verifiable.
- [ ] `GET /api/health/payments` and `GET /api/health/crons` are checked using
  authorized access and return healthy status for the intended environment.
- [ ] All configured QStash schedules correspond to
  `src/lib/cron-schedules.ts` and produce fresh `CronLog` entries.
- [ ] Payment, cron, provider, and deployment alerts are configured in the
  relevant consoles and a test alert reaches the named responders. No such
  alert delivery is verified by repository code.
- [ ] Error reporting is tested without leaking request bodies, credentials, or
  personal data; confirm responder access and escalation path.

### Customer operations and privacy

- [ ] Support team has access to the operations runbook and can escalate
  `RECONCILIATION_REQUIRED` payment events without bypassing the replay guard.
- [ ] Incident response, customer communications, account access removal, and
  data-request handling have named owners.
- [ ] Enabled collection flows have approved privacy notices, access controls,
  retention, and deletion procedures. Do not launch document collection while
  those controls are unresolved.
- [ ] Test accounts, listings, and fixtures are clearly separated from real
  users and inventory; no real user data is used for launch smoke tests.

## Launch execution

1. Freeze the release candidate and record the commit, workflow run, migration
   set, and named release/incident owners.
2. Verify all applicable checklist items and resolve or explicitly defer
   non-blocking issues with a written owner and deadline.
3. Use the checked-in production workflow; do not manually apply production
   migrations or bypass its quality gates.
4. After deployment, smoke-test the approved launch paths, health endpoints,
   notifications, and provider sandbox/live status as authorized. Do not
   initiate a real charge or payout as a smoke test.
5. Monitor the agreed dashboards and alerts for the owner-approved observation
   period. If health degrades or payment state is uncertain, stop new affected
   transactions and follow the [operations runbook](OPERATIONS-RUNBOOK.md).
6. Record the outcome and any residual risks in the release record. Do not
   represent a successful deploy as a successful backup restore, payment
   settlement reconciliation, or alert test.

## Rollback and recovery

Application rollback may be possible through the owner-verified Vercel release
process, but it does not revert database changes. Before approving it, verify
schema compatibility and user impact. Database restore is a separate,
owner-approved recovery action; use the [operations runbook](OPERATIONS-RUNBOOK.md)
and the rehearsed provider procedure. Do not invent console commands or restore
production from an unverified snapshot.

## Detailed validation plan

See the [final launch-readiness validation plan](FINAL-LAUNCH-READINESS-VALIDATION.md) for exact local, browser, provider-sandbox, and owner-console checks and their evidence requirements.

## Source of truth

- [Operations Runbook](OPERATIONS-RUNBOOK.md)
- [CI/CD Guide](CI-CD-GUIDE.md)
- [System status and risk register](../SYSTEM.md)
- [Migration discipline](../prisma/MIGRATIONS.md)
- `.github/workflows/ci.yml`
- `.github/workflows/production.yml`
- `.github/workflows/migrate-preview.yml`
- `src/lib/cron-schedules.ts`
