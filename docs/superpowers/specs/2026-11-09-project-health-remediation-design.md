# Project Health Remediation Design

## Intent

Address the actionable findings in the November 9, 2026 project-health audit
without treating its documentation evidence as a substitute for checking the
current code. The goal is to reduce payment and data-handling risk, make
critical database behavior repeatable in CI, and close verified operational
and documentation gaps.

The audit's source baseline is commit
`1fdb3e305993fba9b0a5c23d64ec5be5b9e1e187` on `preview`. Its report is an
untracked audit artifact in the current workspace. Before implementing each
finding, re-check the relevant source and tests against the current worktree;
do not assume the baseline or audit's line numbers still match.

## Goals

- Prevent repeated Pro checkout requests from replacing a still-payable
  reference without safely handling payment completion for every issued
  checkout.
- Exercise the existing PostgreSQL-specific concurrency suite in a disposable
  PostgreSQL CI service.
- Remove embedded image metadata before listing images are published.
- Add operational procedures only for steps supported by repository evidence;
  identify external settings and unverified operations instead of inventing
  them.
- Correct the three documentation inconsistencies identified by the audit.
- Preserve testability, existing user-facing contracts where possible, and
  the current rule that live payments/payouts remain disabled until approved.

## Non-goals

- Do not enable live Safepay, JazzCash, EasyPaisa, or real payouts.
- Do not contact provider, staging, production, or shared database services.
- Do not make payout/custody, billing, subscription-renewal, retention,
  verification, legal, or privacy policy decisions for the owner.
- Do not present repository evidence as proof of provider-console or production
  state.
- Do not perform a full security audit or certify every route and feature.

## Constraints

- Follow `docs/team/00-shared.md`, `AGENTS.md`, and current project patterns.
- Use a failing regression test before behavior changes and verify each slice
  with the smallest relevant test, then full checks at completion.
- PostgreSQL CI must use an isolated ephemeral service and a dedicated test
  database. It must not read or write shared secrets or databases.
- The upload fix must preserve accepted image formats, request-size limits,
  private student-document handling, and current public URL behavior.
- No new dependency unless current packages cannot safely perform the required
  image processing; explain and test any dependency change.
- Do not run deployment, migrations against shared services, or external
  provider requests.

## Implementation scope

### Ready to plan for implementation

1. **G-001 — Pro checkout idempotency and late success.** Add tests that
   exercise repeated checkout initiation and callbacks for issued references.
   Keep the invariant that a valid successful payment for an issued checkout
   is either applied once or recorded for explicit reconciliation; a retry
   must not silently invalidate a payable reference. Choose the smallest
   database-safe implementation after reviewing the schema and callback
   lifecycle. Do not rely on provider cancellation or idempotency behavior
   without sandbox evidence.
2. **G-005 — PostgreSQL CI gate.** Add an ephemeral PostgreSQL CI service and
   run the existing explicitly guarded PostgreSQL integration test against its
   dedicated test database. Keep destructive operations inside that CI
   service. Identify additional booking/webhook database cases as follow-up if
   they are not currently represented; do not claim them covered unless tests
   are added and run.
3. **G-007 — Public-image metadata.** Re-encode or otherwise sanitize public
   listing images before R2 upload, using a supported existing dependency if
   available. Add a regression test proving metadata is removed while format,
   size, and upload behavior remain valid. Keep private verification-document
   storage separate.
4. **G-008 — Verifiable operational procedures.** Add recovery and CI/CD
   procedures only from source-backed scripts, workflows, and already
   verified local run records. Label owner/provider-console steps as
   unverified and require human confirmation before execution. Do not write
   identity-document retention or processing policy without an owner decision.
5. **G-009/010/011 — Documentation corrections.** Update the upload access
   and rate-limit statements, replace stale test-run totals with dated
   evidence or remove volatile counts, and resolve the contradictory
   `DESIGN.md` status. Re-run the documentation checker.

### Blocked pending owner decisions

- **G-002:** payout/custody policy, qualified financial/legal advice, and
  required independent approval and reconciliation controls.
- **G-003:** Pro entitlement duration, expiry, renewal, and late/duplicate
  payment policy.
- **G-004:** whole-month billing semantics, global maximum, and whether owner
  `minStay`/`maxStay` are hard booking constraints.
- **G-006:** email-outbox payload retention and privacy policy.

These remain visible in the plan as blocked decisions. Do not implement
behavior that would silently choose these policies.

## Verification

- G-001: regression tests cover repeated initiation, callback for a prior
  issued reference, callback replay, and activation occurring at most once.
- G-005: CI proves a PostgreSQL connection, applies only the test schema, and
  passes the guarded integration suite against the CI service.
- G-007: tests demonstrate metadata removal and preserve valid image upload
  behavior; no real R2 request is made.
- G-008: every operational command/control is sourced, destructive steps have
  explicit prerequisites and approval gates, and unverified controls are
  visibly labeled.
- G-009/010/011: docs check and link validation pass; verified facts match
  current code and command output.
- Final: run `npm run typecheck`, `npm run lint`, `npm run test -- --run`,
  `npm run test:scripts`, `npm run docs:check`, `npx prisma validate`, and
  `npm run build` as applicable. Report any check not run.

## Owner calls and implementation choices

- The owner approved planning all audit findings and implementing only work
  that does not require the listed policy decisions.
- The existing supported stack, test commands, and CI conventions are retained.
- The exact safe database strategy for G-001 and image-processing mechanism
  for G-007 are implementation choices; they must preserve the invariants
  above and be verified by tests.
- No provider, production, or shared-database validation is authorized by this
  design.

## Success

The unblocked findings are implemented as isolated, tested slices; blocked
policy findings remain explicit and are not represented as complete. CI and
documentation accurately describe what has actually been exercised. No live
money flow is enabled as part of this work.
