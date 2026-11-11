# Project Health Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the project-health audit's unblocked risks with tested payment retry behavior, PostgreSQL CI coverage, safe public-image processing, source-backed operational guidance, and accurate current documentation.

**Architecture:** Keep HostelLo's Next.js/Prisma application and CI conventions. Make each finding a separate testable slice; run PostgreSQL-only integration tests against an ephemeral CI service and image processing in the existing upload path. Record policy-dependent audit findings as blocked instead of guessing.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, PostgreSQL, Vitest, GitHub Actions, Sharp 0.35.5 (already present transitively through Next.js; declare the resolved version as a direct runtime dependency before importing it).

**Spec:** [2026-11-09-project-health-remediation-design.md](../specs/2026-11-09-project-health-remediation-design.md); source findings: [2026-11-09-project-health-audit.md](../../audits/2026-11-09-project-health-audit.md)

## Global Constraints

- Never enable live Safepay, JazzCash, EasyPaisa, or real payouts.
- Never contact provider, staging, production, or shared database services.
- Do not decide payout/custody, billing, subscription-renewal, retention, verification, legal, or privacy policy for the owner.
- PostgreSQL CI uses an isolated ephemeral service and a dedicated test database.
- Preserve accepted image formats, request-size limits, private student-document handling, and current public URL behavior.
- Do not add a new package; declare the already installed Sharp 0.35.5 directly only because the public-image helper imports it.
- Follow `AGENTS.md` and `docs/team/00-shared.md`; use failing tests before behavior changes.

## Review Focus

- Concurrent or repeated Pro checkout requests must not replace the tracker for a checkout already shown to an owner; pin with route tests for existing pending and competing attempts in Task 1.
- Duplicate, stale, and late subscription callbacks must not activate twice or disappear without an explicit reconciliation state; pin with webhook tests in Task 1.
- An ACTIVE subscription observed after a stale FREE-plan read must never be reset; pin with a route regression test. A callback for a tracker issued before a cancelled-checkout restart must remain explicitly reconcilable.
- Valid JPEG, PNG, and WebP uploads must retain their format while metadata is removed; pin with generated-image tests in Task 3.
- An invalid, truncated, or oversized image must not be sent to public storage; retain/add upload-boundary tests in Task 3.
- The PostgreSQL CI job must fail closed unless both `DATABASE_URL` (migration target) and `HOSTELLO_TEST_DATABASE_URL` (integration-test target) resolve to the same loopback `_test` database; pin with the workflow test in Task 2.

---

### Task 1: Make Pro checkout retries safe (G-001)

**Files:**
- Modify: `src/app/api/owner/subscription/route.ts`
- Create: `src/app/api/owner/subscription/route.test.ts`
- Modify: `src/app/api/payment/payment.test.ts`
- Modify: `src/app/api/payment/webhook/route.ts` only if tests show callbacks for an issued tracker are not safely idempotent/reconciled.

**Interfaces:**
- Consumes: `createCheckoutSession` and `createCheckoutLink` from `src/lib/safepay.ts`; existing `Subscription` fields `status` and `paymentRef`.
- Produces: repeated POST for an already-pending checkout reuses that stored tracker instead of clearing it or creating another provider session; new checkout persists its tracker only if the subscription remains pending and unclaimed.

- [x] **Step 1: Write route tests** for a pending subscription with a stored tracker, two competing checkout initiations, and a stale FREE-plan read followed by an ACTIVE subscription state. Assert retries preserve and reuse the stored tracker, competing attempts converge, and ACTIVE or non-retryable states are never reset.
- [x] **Step 2: Run the focused route test** with `npm test -- --run src/app/api/owner/subscription/route.test.ts`; confirm the new cases fail against current behavior.
- [x] **Step 3: Write webhook tests** for duplicate success of the accepted tracker, a mismatched tracker, and success for a tracker issued before a cancelled-checkout restart. Assert activation occurs once and stale/mismatched success is explicitly returned for reconciliation, not treated as success.
- [x] **Step 4: Run the focused webhook tests** with `npm test -- --run src/app/api/payment/payment.test.ts`; confirm the current handler safely handles replay/mismatch, so no webhook implementation change is needed.
- [x] **Step 5: Implement retry-safe initiation** without replacing a pending `paymentRef`; use the existing checkout-link helper to present the stored tracker again. Use a conditional database write for the first tracker so racing requests cannot overwrite the winner. If a valid issued reference cannot be safely matched, preserve the existing explicit reconciliation response and log path.
- [x] **Step 6: Run both focused test files** and confirm the retry, race, callback replay, and mismatch cases pass.
- [x] **Step 7: Review the diff** for provider calls, transaction boundaries, and compatibility with failed/cancelled subscriptions; run `git diff --check`.

**Dependencies:** None. No provider behavior is assumed or tested.

### Task 2: Run guarded PostgreSQL concurrency tests in CI (G-005)

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/production.yml`
- Modify: `SYSTEM.md` §14.4 and risk R-15, because current source has one guarded PostgreSQL integration file while the old risk text claims seven current guarded cases.
- Create: `scripts/postgres-ci-workflow.test.mjs`

**Interfaces:**
- Consumes: `RUN_AVAILABILITY_ALERTS_POSTGRES_TESTS=1` and `HOSTELLO_TEST_DATABASE_URL` from `src/lib/availability-alerts.postgres.integration.test.ts`; Prisma migrations in `prisma/migrations/`.
- Produces: CI and production quality-gate jobs that provision PostgreSQL, apply migrations only to their ephemeral databases, then run the guarded test file. Preview and production deployment wait for this job.

- [x] **Step 1: Write `scripts/postgres-ci-workflow.test.mjs`** with a Node `node:test` case that reads both workflows and asserts the PostgreSQL jobs have health-checked services, loopback `_test` `DATABASE_URL` and `HOSTELLO_TEST_DATABASE_URL` values targeting the same database, opt-in flags, migration/test commands, and required dependencies of preview and production deploy.
- [x] **Step 2: Run `node --test scripts/postgres-ci-workflow.test.mjs`** and confirm it fails before changing the workflow.
- [x] **Step 3: Add isolated PostgreSQL service jobs** to `.github/workflows/ci.yml` and `.github/workflows/production.yml`; use fixed CI-only database/user/password values, wait for health checks, install dependencies, generate Prisma Client, apply `prisma migrate deploy` only to each service, and run `src/lib/availability-alerts.postgres.integration.test.ts` with its existing loopback `_test` guard enabled.
- [x] **Step 4: Make the preview and production deploy jobs depend on their PostgreSQL integration jobs** so neither deployment can proceed if the database gate fails.
- [x] **Step 5: Update `SYSTEM.md`** to state that the current guarded suite covers availability-alert PostgreSQL concurrency only; retain booking, payment, and migration-constraint coverage as unverified/follow-up unless present in source and actually run.
- [x] **Step 6: Run `node --test scripts/postgres-ci-workflow.test.mjs` and `npm run docs:check`; run the guarded test locally only if an already-configured disposable loopback `_test` database is available.** Do not create, migrate, or connect to a shared database.
- [x] **Step 7: Review the workflow diff** to confirm no secrets, external database URLs, or production endpoints are used.

**Dependencies:** None. A local PostgreSQL run is optional; CI service configuration is the deliverable.

### Task 3: Strip metadata from public listing images (G-007)

**Files:**
- Create: `src/lib/public-listing-image.ts`
- Create: `src/lib/public-listing-image.test.ts`
- Modify: `src/app/api/upload/route.ts`
- Modify: `src/app/api/upload/route.test.ts`
- Modify: `package.json` and `package-lock.json` to declare the already resolved Sharp 0.35.5 as a direct runtime dependency before importing it.
- Modify: `SYSTEM.md` risk R-11 to reflect verified behavior.

**Interfaces:**
- Produces: `sanitizePublicListingImage(buffer: Buffer, contentType: "image/jpeg" | "image/png" | "image/webp"): Promise<Buffer>`; the helper returns a re-encoded image in the same format without source metadata.

- [x] **Step 1: Add generated-image unit tests** for an EXIF-oriented JPEG with metadata and valid PNG/WebP inputs. Assert orientation is preserved, output format is unchanged, and metadata is absent; add an invalid/truncated-image rejection case.
- [x] **Step 2: Run `npm test -- --run src/lib/public-listing-image.test.ts`** and confirm the test fails because the helper does not exist.
- [x] **Step 3: Implement the helper with Sharp 0.35.5** using bounded decoding, EXIF auto-orientation, and format-preserving re-encoding without copying metadata. Reject sanitized output that exceeds the existing upload-size limit. Update the lockfile to declare the already installed version directly without upgrading other packages.
- [x] **Step 4: Update the upload route** to sanitize only after existing content-type, size, and signature checks and before R2 upload. Do not alter the private verification-document upload path.
- [x] **Step 5: Extend route tests** to assert the sanitized bytes, not original bytes, are passed to storage while URL and response behavior remain unchanged.
- [x] **Step 6: Run focused helper and upload tests** with `npm test -- --run src/lib/public-listing-image.test.ts src/app/api/upload/route.test.ts`; the final upload tests also cover rejection above the 4 MB input limit before storage.
- [x] **Step 7: Update R-11 documentation** only after tests prove the metadata fix; run `npm run docs:check` and `git diff --check`.

**Dependencies:** None. Preserve all existing accepted types and size checks.

### Task 4: Add source-backed operations and CI/CD runbooks (G-008)

**Files:**
- Create: `docs/OPERATIONS-RUNBOOK.md`
- Create: `docs/LAUNCH-OPERATIONS-RUNBOOK.md`
- Create: `docs/CI-CD-GUIDE.md`
- Modify: `prisma/MIGRATIONS.md` to align the production migration description with `.github/workflows/production.yml`.
- Modify: `SYSTEM.md` to link these guides and accurately distinguish code controls from external console settings.

**Ruling:** Correct `prisma/MIGRATIONS.md` because it said production migrations use `vercel env run -e production`, while `.github/workflows/production.yml` injects `HOSTELLO_PRODUCTION_DATABASE_URL` from GitHub Actions secrets. Leaving the mismatch could direct an operator to the wrong credential source; correcting it does not verify that the external secret is configured.

- [x] **Step 1: Inventory the current workflows, migration/recovery scripts, and verified local recovery records**; record the exact source for each command and owner-only action in the proposed runbooks.
- [x] **Step 2: Draft the CI/CD guide** from `.github/workflows/`, package scripts, and migration docs. Label GitHub/Vercel/Neon console state as owner-verified, not source-verified.
- [x] **Step 3: Draft operations and launch runbooks** for payment-event triage, safe rollback/recovery prerequisites, alert response, and launch go/no-go checks. Do not include unverified console commands or instruct operators to touch production without approval.
- [x] **Step 4: Link the runbooks from `SYSTEM.md`** and label outstanding provider, recovery, and owner-console checks as open.
- [x] **Step 5: Run `npm run docs:check`** and verify all referenced scripts/workflows/paths exist.

**Dependencies:** Task 2 for the final CI workflow description. Keep student-document retention and processing policy out of scope pending the owner decision in Task 10.

### Task 5: Correct upload documentation (G-009)

**Files:**
- Modify: `SYSTEM.md` API access table and upload/risk descriptions.

- [x] **Step 1: Verify role authorization and rate-limit calculation** in `src/app/api/upload/route.ts` and `packages/shared/src/constants/config.ts`.
- [x] **Step 2: Update the documentation** to describe Owner/Admin access with or without `hostelId` and the calculated 20 uploads per 10 minutes; do not claim G-007 metadata removal until Task 3 is complete.
- [x] **Step 3: Run `npm run docs:check`** and inspect the changed paragraphs against source.

**Dependencies:** Task 3, so upload documentation describes the resulting metadata behavior accurately.

### Task 6: Refresh current test verification and resolve the DESIGN.md contradiction (G-010/G-011)

**Files:**
- Modify: `SYSTEM.md` §14.4 and R-20.

- [x] **Step 1: After implementation slices finish, run the exact current commands** recorded in §14.4 and capture their actual outcomes and date. The production-only audit returned five moderate Sentry-chain advisories; it was recorded as open rather than silently treated as a passing check.
- [x] **Step 2: Replace volatile current test totals** in `SYSTEM.md` with the fresh dated evidence; leave dated audit reports as historical records.
- [x] **Step 3: Remove `DESIGN.md` from the R-20 missing-file list** while preserving the note that the existing root file is historical.
- [x] **Step 4: Run `npm run docs:check`** and confirm §14.4 clearly distinguishes executed tests from discovered-but-not-run browser tests.

**Dependencies:** Tasks 1–5.

### Task 7: Owner decision — payout/custody and independent controls (G-002)

**Status:** Blocked pending Founder/human-owner decision and qualified advice.

- [ ] Decide custody/transfer model, payout timing, fees, second approval thresholds, authentication step-up, and settlement reconciliation.
- [ ] Obtain qualified financial/legal advice for applicable Pakistan obligations.
- [ ] Only after approval, create a separate implementation plan; keep real payouts disabled until controls are implemented and verified.

**Dependencies:** Human-owner decisions; no implementation in this plan.

### Task 8: Owner decision — Pro subscription lifecycle (G-003)

**Status:** Blocked pending product/business policy decision.

- [ ] Decide Pro term, expiry behavior, renewal flow, grace period, and handling of late/duplicate payments.
- [ ] After approval, specify and implement expiry/renewal behavior with tests; do not infer policy from the current `endDate`.

**Dependencies:** Human-owner decision; no implementation in this plan.

### Task 9: Owner decision — booking duration and billing rules (G-004)

**Status:** Blocked pending product/business policy decision.

- [ ] Decide whole-month versus started-month billing, global maximum duration, and whether owner `minStay`/`maxStay` are hard constraints.
- [ ] After approval, specify server-side validation and date-boundary tests.

**Dependencies:** Human-owner decision; no implementation in this plan.

### Task 10: Owner decision — email retention and outbox (G-006)

**Status:** Blocked pending privacy/retention policy decision.

- [ ] Decide which email payload fields may be persisted and for how long, with qualified privacy advice as needed.
- [ ] After approval, plan the transactional outbox, idempotent delivery/retry, data minimization, and cleanup tests.

**Dependencies:** Human-owner decision; no implementation in this plan.

## Checkpoint: Unblocked safety work

- [x] Tasks 1–3 pass their targeted tests and update any directly coupled risk notes.
- [x] No provider, production, or shared database was contacted.
- [x] Task 2 CI is fail-closed and preview waits for its PostgreSQL gate.
- [x] Review the final diff for Tasks 1–6 before completion.

## Checkpoint: Plan completion

- [x] Tasks 1–6 meet their acceptance criteria.
- [x] Tasks 7–10 remain explicitly blocked until owner decisions are recorded.
- [x] Run `npm run typecheck`, `npm run lint`, `npm run test -- --run`, `npm run test:scripts`, `npm run docs:check`, `npx prisma validate`, and `npm run build`.
- [x] Confirm generated Prisma client bytes are unchanged from `HEAD` and no unrelated tracked changes were introduced.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Old Safepay tracker callback arrives after a newer checkout | Payment is not reflected in entitlement | Preserve current accepted tracker, make the mismatch explicitly reconcilable, and test callback replay/mismatch. |
| CI migration runs against the wrong database | Data loss | Use only a fixed loopback service URL and the existing `_test` guard; never inject shared database secrets. |
| Re-encoding changes image behavior | Broken/altered listing photos | Test all currently accepted formats and reject invalid input before storage. |
| Runbook records external settings as facts | Unsafe or misleading operation | Mark them owner-verified and keep them open until evidence is supplied. |
| Policy decisions are guessed during implementation | Money, privacy, or booking harm | Keep G-002, G-003, G-004, and G-006 blocked. |

## Open Questions

- None block Tasks 1–6; implementation details are constrained by their tests and interfaces.
- Tasks 7–10 require explicit human-owner decisions listed in each task.
