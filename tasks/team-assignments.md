# Distributed Team Assignments

This ledger tracks work assigned to the seven separate Claude.ai role projects. The human owner relays assignments and patch/report handoffs between those projects and the shared repository.

## Workflow

1. Add one row per task with a unique ID, proposed role, scope, and acceptance criteria. Keep the task proposed until the human owner approves its scope, unless the owner explicitly directs the assignment.
2. After approval, send the task packet to the role project. The role must clone the repository fresh for that assignment, record the checked-out base commit, and not push to GitHub.
3. Record the returned patch file and report. The report must include the task ID, base commit, changed files, checks and results, blockers, and decisions needed.
4. Review the patch against its base commit and the current repository. Record findings for the human owner; do not apply the patch.
5. The human owner decides whether to approve, request revision, or reject the patch, and applies approved patches. Record the resulting commit.
6. Mark the task verified only after checking its acceptance criteria and recording the validation results.

Do not assign overlapping file scopes concurrently unless the human owner approves the coordination plan. If the shared repository changes after the role records its base commit, check for conflicts and request an updated patch from a fresh clone when needed.

## Statuses

- `proposed` - Draft task; not approved for assignment.
- `ready` - Human owner approved the scope; ready to relay.
- `sent` - Human owner relayed the task packet to the role project.
- `in_progress` - Role is working from a fresh clone.
- `handoff_received` - Patch and report received from the human owner.
- `reviewing` - Founder is reviewing the patch and report.
- `awaiting_owner_decision` - Review findings and options are with the human owner.
- `approved_to_apply` - Human owner approved the patch; waiting for the owner to apply it.
- `applied` - Human owner applied the patch; applied commit is recorded.
- `verified` - Acceptance criteria and required checks are verified.
- `blocked` - Work cannot proceed; record the blocker and needed decision.
- `rejected` - Human owner declined the patch.
- `cancelled` - Human owner cancelled the assignment.

## Assignment ledger

Add one row per assignment. Keep patch and report files with the human owner; record their filenames or handoff references here.

| ID | Task and acceptance criteria | Role | Dependencies | Status | Base commit | Patch / report reference | Owner decision / applied commit | Verification / blockers |
|---|---|---|---|---|---|---|---|---|
| A-002 | Re-run the web-foundation audit against the current base commit. Done when every row of `docs/audits/2026-11-04-a3-web-foundation.md` is re-checked with file:line evidence at the new commit, stale rows (header, footer, error/not-found/loading) are corrected, and new mismatches are listed. Read-only; no code changes. Output: `docs/audits/2026-11-04-a4-web-foundation-recheck.md` | Auditor | None | ready | 86cf03b | | Approved by owner 2026-11-04 | |
| B-006 | Two P2 fixes from the payments audit. (1) Compare `merchant_api_key` in `src/app/api/payment/webhook/route.ts` (~:639) and `x-cron-health-secret` in `src/app/api/health/payments/route.ts` (:9-10) with `timingSafeEqual` (length-safe). (2) Fix the stale "Admin-triggered only" comment in `src/lib/refunds.ts:22-30`: the `expire-unanswered-bookings` cron also calls `processRefund` as `system:owner-response-timeout`. Done when: tests cover match, mismatch and different-length inputs for both compares; no behavior change otherwise; `npm run typecheck`, `lint`, `test -- --run` pass; SYSTEM.md R-04 note and CHANGELOG updated. Do NOT touch refund amounts, the CAS claim, the cron schedule or any migration | Backend/Integrations | None | ready | 86cf03b | | Approved by owner 2026-11-04 | |
| Q-001 | Add (a) a unit test for the role navigation matrix in `src/lib/product-navigation.ts` (guest, student, owner, admin) and (b) a Playwright e2e for role redirects: guest to protected student/owner/admin pages redirects to `/login?callbackUrl=...`; student on owner/admin pages is redirected or gets 404 per current behavior (assert what the code does today and report any surprise). Done when both run green on a fresh clone and the e2e is listed in the report with the command used. Tests only; no product code changes | QA/DevOps | None | ready | 86cf03b | | Approved by owner 2026-11-04 | |
| OWNER-1 | Human owner runs Safepay sandbox E1 (duplicate-webhook replay via dashboard resend on the preview) and F (rejected refund leaves the booking UNCERTAIN, no auto-retry), then sends results to the Founder | Human owner | B-005b runbook | ready | n/a | | | Closes R-04 item 9 only when E1 and F both pass |
