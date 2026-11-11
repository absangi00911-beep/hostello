# Final launch-readiness validation plan

**Status:** execution plan; this document is not evidence that sandbox, staging,
provider-console, recovery, or production checks have passed. The project remains
pre-launch. No live payment or production deployment is authorized by this plan.
The Founder/human owner owns go/no-go and provider-console access; QA/DevOps
records evidence and escalates blockers to the Tech Lead.

## Evidence rules

For each check, record the release commit, environment (local disposable,
provider sandbox, staging, GitHub/Vercel/Neon console), UTC time, run or event
ID, expected and actual result, and named operator. Do not copy secret values,
provider payloads, student data, or connection strings into the record. A source
reference or local pass is not proof of external configuration. Stop on any
uncertain payment state; do not retry or reconcile by editing records.

The November 9 audit's G-005 statement that routine CI has no PostgreSQL job is
stale relative to the current checked-in workflow changes: both CI and the
production workflow now define a disposable PostgreSQL service, migrate a
`*_test` database, and gate deploy on the integration job. The current checked-in
suite is still narrow (availability alerts/seat-hold concurrency), and a green
remote workflow run for the release commit remains required. G-008 is partly stale in this checkout: the CI/CD, launch, and operations
guides are present at `docs/CI-CD-GUIDE.md`, `docs/LAUNCH-OPERATIONS-RUNBOOK.md`, and
`docs/OPERATIONS-RUNBOOK.md`, but the private student-verification guide is
still absent. Their presence does not mean their operational steps were
performed. Report these audit mismatches to the Auditor; do not silently
update historical findings.

## 1. Local code-level checks (no live services)

Run from a clean release candidate checkout with dependencies already installed;
these commands do not call Safepay, GitHub, Vercel, Neon, or production services:

```powershell
npm run docs:check
npm run test:scripts
npx prisma validate
npm run typecheck
npm run test -- --run
npm run lint
npx playwright test --list
```

The PostgreSQL integration test is opt-in. Run it only against a disposable
loopback PostgreSQL instance and a database named `*_test`, never a shared
instance. CI already provisions a fresh PostgreSQL 16 service and runs Prisma
migrations against `hostello_test`; inspect the successful `postgres-integration`
job for the exact release commit. The current database gate does not establish
coverage for booking races, payment webhook replay, payout claims, or production
provider behavior. If those paths change, add isolated regression cases before
using the existing gate as evidence for them.

For browser execution, install/use the repository's Chromium browser and use
disposable local services only. `npm run e2e -- --list` is discovery, not a
browser pass. Local default target is `http://127.0.0.1:3100`. A remote target
now fails closed unless all of the following are explicit: HTTPS
`PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_ALLOW_REMOTE_SANDBOX=1`, and
`PLAYWRIGHT_SANDBOX_HOST` exactly matching the approved sandbox hostname. Never
set that opt-in for production. Specs which create database fixtures retain
their independent loopback `*_test` database guard; remote app targeting does
not make remote database mutation safe.

## 2. Disposable provider-sandbox validation (Backend/Integrations + QA)

Use a dedicated Safepay **sandbox** merchant, test identities, a disposable app
environment/database, and a publicly reachable, isolated sandbox callback path.
Do not use a production merchant, production credentials, real customer, or
real transaction. Coordinate the run with the Tech Lead and obtain Founder
approval for any sandbox charge/refund that the provider account treats as a
financial operation. Never expose a Vercel protection bypass token to the
provider.

### Before starting

- Verify in the Safepay sandbox console that the account is test mode and the
  intended merchant/API key is sandbox-scoped; check the registered callback
  URL, event subscriptions, key permissions, and callback delivery history.
- Verify callback reachability without authentication redirects and confirm
  signature verification is enabled. Keep the staging endpoint and data isolated.
- Prepare one disposable booking/room fixture with an explicitly approved test
  amount and a second unrelated fixture for tracker-mismatch checks. Confirm
  cancellation/refund expectations with the Founder; do not assume refund policy
  from application code.
- Use the script's no-network preflight only after local env variables are
  supplied through the approved secret store (never print or paste values):

```powershell
npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs preflight
```

This preflight validates explicit `NEXT_PUBLIC_SAFEPAY_ENV=sandbox`, required
variable presence and key format, and prints configuration names/endpoint only;
it does not contact Safepay. Run data-report/replay commands only against a
local disposable test database (`--confirm-non-production-db` is mandatory).
The replay helper refuses non-loopback HTTP targets:

```powershell
npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs report <sandboxBookingId> --confirm-non-production-db
npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs replay-webhook <sandboxBookingId> --confirm-non-production-db --base-url http://127.0.0.1:3100 --dry-run
```

The `--dry-run` proves the intended duplicate body only; it is not delivery
proof. Do not use the script to replay a staging callback: it intentionally
requires a loopback app. Exercise the real sandbox callback through the
provider's test-event/payment mechanism instead.

### Required test cases and evidence

1. Complete one approved sandbox checkout; verify the provider's tracker,
   amount/currency/order metadata and terminal state match the app's single
   booking transition. Verify owner/student confirmation and health status.
2. Deliver the same valid callback twice and confirm one state transition and
   no duplicate entitlement/notification/refund. Deliver a bad signature and
   mismatched amount/currency/order/tracker and confirm rejection without state
   mutation. Verify old/stale checkout trackers do not activate a different
   or superseded booking/subscription. Record provider delivery IDs and safe
   app event IDs, not payloads/secrets.
3. Test the supported refund route using only the approved sandbox fixture.
   Compare provider refund state/amount with app refund state and audit events;
   verify repeat requests, concurrent claims, timeout/uncertain outcome and
   reconciliation handling. Do not treat HTTP success as settlement evidence.
   A human operator must resolve any `UNCERTAIN` or `RECONCILIATION_REQUIRED`
   state using the payment operations runbook.
4. Exercise a QStash sandbox/local retry failure then successful delivery; verify
   attempt count, final webhook/event state, booking result, and fresh
   `CronLog`/health status as applicable. Never manually replay production work.
5. Save a sanitized evidence record and teardown disposable accounts/fixtures
   through supported cleanup. If provider settlement and app state disagree,
   stop; do not issue a second payment or refund as a diagnostic.

The November 6 staging webhook result (Safepay reported undelivered; the
staging webhook GET redirected to Vercel SSO and the app booking stayed pending)
is historical evidence only. Revalidate callback delivery in an approved
sandbox/staging environment; do not retry the old transaction or treat that
record as a successful integration.

## 3. Browser E2E validation

Run Chromium E2E against the local app and disposable loopback services first.
The launch-candidate browser set must demonstrate the full critical journey,
not just UI discovery or mocked API responses:

- Sign up/sign in with disposable accounts and verify role boundaries.
- Search/filter listings and open a listing with available inventory.
- Create a booking; verify seat hold/inventory and duplicate submission behavior.
- Pay using Safepay sandbox only; verify redirect/return and asynchronous
  webhook-driven paid state (not merely a mocked button or client return URL).
- Owner accepts/declines the booking; verify student/owner notification state.
- Cancel and execute the approved refund path; verify persisted refund/audit
  state and repeated-click behavior.
- Verify cross-owner/admin denial and mobile viewport/slow-network critical
  screens. Preserve traces only after reviewing them for sensitive data.

Existing Playwright specs cover several UI, search, availability-alert,
owner/admin and role paths, but list/discovery and mocked endpoint assertions do
not prove the entire sign-up-to-payment-to-refund flow. In particular, a mocked
manual-refund confirmation proves UI/request formation only, and fixture-writing
owner tests are local-loopback-only. Capture the selected spec names, browser
version, test summary, and sanitized failures. Do not count skips as passes;
explain any unavailable provider-dependent case and leave its gate open.

## 4. Human-owner provider and platform console checks (not source-verifiable)

The Founder/human owner (or delegated account owner) must inspect settings
without sharing values with the team:

### GitHub

- `production` environment has required reviewers; confirm the reviewer list
  and that a protected deployment pauses pending approval.
- `main` branch protection requires the intended CI checks, disallows bypass as
  approved, and the exact release commit has green CI and PostgreSQL jobs.
- Confirm Actions secrets exist (do not reveal values): Vercel credentials,
  `HOSTELLO_PRODUCTION_DATABASE_URL`, and Neon snapshot API key. Confirm Actions
  variables `NEON_PROJECT_ID`, `NEON_PRODUCTION_BRANCH_ID`, and
  `NEON_SNAPSHOT_REQUIRED=true` are set for the production workflow.
- Verify the production workflow run is recorded but do not approve or trigger a
  deployment as part of this validation assignment.

### Neon and Vercel

- Verify the Neon project/production branch identity against the approved
  inventory, snapshot secret access, and required-snapshot flag; confirm an
  approved disposable snapshot/restore rehearsal exists. A workflow reference
  or successful branch creation is not a restore rehearsal.
- Confirm Vercel project/domain linkage, production Node.js runtime matches
  `.nvmrc` (Node 24), environment scoping, deployment permissions/protection,
  and rollback procedure. Do not pull production env or trigger a deployment.

### Safepay, QStash, and monitoring

- Safepay owner confirms sandbox and production merchant separation, key scopes,
  webhook endpoint/event registration, callback delivery/security settings and
  refund permissions; production webhook settings must be verified without
  issuing a production payment.
- QStash owner compares configured schedules and retry/delivery policy with
  `src/lib/cron-schedules.ts`; verify intended schedule identity and a sandbox
  delivery record. Do not schedule production jobs as part of this check.
- Owner confirms payment/webhook/cron/deployment alerts and named responders in
  their consoles, then runs a harmless approved test alert and records receipt.
  Check authorized staging `GET /api/health/payments` and
  `GET /api/health/crons`; do not include auth headers/secrets in evidence.
- Confirm Sentry access, scrubbed event settings, and alert routing without
  sending personal or payment payloads.

## Release blockers and approval

No-go for real payments or public launch until the Founder has resolved the
financial/product policy questions in the launch runbook, all applicable
provider-console checks above have named evidence, the full sandbox browser
journey is green, backup/restore and rollback are rehearsed, and the exact
release commit's remote CI and deployment protections are confirmed. Keep the
known audit P0/P1 risks open until the responsible owner verifies their fixes;
this validation plan does not close them. No production deployment, migration,
provider-setting change, payment, refund, or payout was performed by QA/DevOps.
