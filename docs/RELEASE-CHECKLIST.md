# HostelLo Release Checklist

This release checklist is the founder-owned launch gate. Do not mark a release as ready until every item below has passed with evidence.

## 1. Founder policy approvals
Owner: Founder

- [ ] Payout / custody model approved and recorded.
- [ ] Pro lifecycle and grace-period policy approved and recorded.
- [ ] Booking billing / stay rules approved and recorded.
- [ ] Email retention / outbox policy approved and recorded.

Pass criteria:
- All four decisions are explicitly approved in writing.
- No launch approval is recorded until all four are closed.

## 2. Tech Lead implementation review
Owner: Tech Lead

- [ ] Confirm the implementation matches the approved policy decisions.
- [ ] Confirm payouts remain fail-closed until custody approval is implemented.
- [ ] Confirm Pro lifecycle matches the approved grace policy.
- [ ] Confirm booking rules use whole-month pricing and owner min/max stay enforcement.
- [ ] Confirm email retention policy is enforced by the outbox design.

Pass criteria:
- The implementation spec is signed off.
- No conflicting product rules remain.

## 3. Local code-quality verification
Owner: Backend / Integrations Engineer

Run these commands on the exact release candidate:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run docs:check`
- [ ] `npx prisma validate`
- [ ] `git diff --check`
- [ ] `npm run test:scripts`

Pass criteria:
- All commands succeed.
- No failing tests, lint warnings that block release, type errors, or diff hygiene issues remain.
- Docs match the implemented code.

## 4. QA / DevOps validation of launch flow
Owner: QA / DevOps Engineer

- [ ] Playwright list command succeeds: `npx playwright test --list`
- [ ] Browser E2E flow passes in a disposable environment for the approved sandbox journey.
- [ ] Local script checks pass: `npm run test:scripts`

Critical browser journey to validate:
- [ ] Student signs up.
- [ ] Student searches and selects a listing.
- [ ] Student completes a sandbox booking.
- [ ] Payment callback succeeds.
- [ ] Owner accepts or rejects the booking.
- [ ] Refund path works.
- [ ] Pro checkout retry path works.

Pass criteria:
- Browser tests pass using disposable/local services.
- No production or live-money actions are used.

## 5. Security and privacy sign-off
Owner: Security & Privacy Reviewer

- [ ] Email payloads are minimized.
- [ ] Only metadata is retained for the approved 72-hour window.
- [ ] No sensitive document data is stored in email flows.
- [ ] Admin approval and dual-control requirements are enforced for payouts and refunds.
- [ ] Data deletion and retention expectations match the approved policy.

Pass criteria:
- Approved founder policy is reflected in code and docs.
- No policy gap remains in the launch plan.

## 6. Safepay sandbox validation
Owner: Backend / Integrations Engineer + QA / DevOps Engineer

- [ ] Successful sandbox checkout completes.
- [ ] Callback signature validation passes.
- [ ] Stale or mismatched callbacks are rejected and reconciled.
- [ ] Duplicate checkout retries do not overwrite an ACTIVE Pro plan.
- [ ] Refund flow works in sandbox.
- [ ] Payout reconciliation remains fail-closed until approved.

Pass criteria:
- The sandbox flow behaves as intended.
- No live payment or production data is used.

## 7. Provider-console verification
Owner: QA / DevOps Engineer + Founder

Verify the following externally with the correct project credentials and permissions:

- [ ] GitHub branch protection and required checks are active.
- [ ] Neon snapshot/restore configuration is correct and required env vars are set.
- [ ] Vercel production settings match release requirements.
- [ ] QStash schedules and retries are safe and documented.
- [ ] Resend/Sentry alerting and retention settings are configured.

Pass criteria:
- Every external dependency is verified in the proper environment.
- No production or live-money configuration is left unverified.

## 8. Recovery and rollback rehearsal
Owner: QA / DevOps Engineer + Tech Lead

- [ ] Rehearse webhook recovery.
- [ ] Rehearse failed job retries.
- [ ] Rehearse rollback usage without guessing.
- [ ] Confirm admin payout batches are blocked until the approved custody path is active.

Pass criteria:
- The team can recover and rollback without improvisation.
- Recovery steps are documented and rehearsed.

## 9. Final founder sign-off
Owner: Founder

Before approving launch, confirm all evidence is in place:

- [ ] All four founder policy decisions are approved.
- [ ] Local validation commands all pass.
- [ ] Sandbox validation passes.
- [ ] Browser E2E validation passes.
- [ ] Provider-console verification passes.
- [ ] Recovery rehearsal is complete.
- [ ] No open launch gate remains.

Final launch decision:
- [ ] GO: launch approved for the release candidate.
- [ ] NO-GO: launch blocked until evidence is complete.

## 10. Launch gate rule
- Do not approve launch if any step remains unchecked.
- Do not treat code review or local tests as sufficient proof for live-money behavior.
- No live payment, payout, or production deployment occurs until the founder signs off.
