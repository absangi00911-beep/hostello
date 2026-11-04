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
| A-002 | Re-run the web-foundation audit against the current base commit. Done when every row of `docs/audits/2026-11-04-a3-web-foundation.md` is re-checked with file:line evidence at the new commit, stale rows (header, footer, error/not-found/loading) are corrected, and new mismatches are listed. Read-only; no code changes. Output: `docs/audits/2026-11-04-a4-web-foundation-recheck.md` | Auditor | None | applied | 86cf03b | `docs/audits/2026-11-04-a4-web-foundation-recheck.md` (commit `e164527`) | Applied by owner: `e164527` | Review note: several rows cite a file without a line number; needs evidence-format follow-up before verified |
| B-006 | Two P2 fixes from the payments audit. (1) Compare `merchant_api_key` in `src/app/api/payment/webhook/route.ts` (~:639) and `x-cron-health-secret` in `src/app/api/health/payments/route.ts` (:9-10) with `timingSafeEqual` (length-safe). (2) Fix the stale "Admin-triggered only" comment in `src/lib/refunds.ts:22-30`: the `expire-unanswered-bookings` cron also calls `processRefund` as `system:owner-response-timeout`. Done when: tests cover match, mismatch and different-length inputs for both compares; no behavior change otherwise; `npm run typecheck`, `lint`, `test -- --run` pass; SYSTEM.md R-04 note and CHANGELOG updated. Do NOT touch refund amounts, the CAS claim, the cron schedule or any migration | Backend/Integrations | None | applied | 86cf03b | Commit `e164527` | Applied by owner: `e164527` | Focused tests: 56 passed; lint passed. Typecheck failed in untouched `ListingForm` imports/casing; full suite: 2 tests failed plus 1 failed suite in untouched `ListingForm` tests; not verified |
| Q-001 | Add (a) a unit test for the role navigation matrix in `src/lib/product-navigation.ts` (guest, student, owner, admin) and (b) a Playwright e2e for role redirects: guest to protected student/owner/admin pages redirects to `/login?callbackUrl=...`; student on owner/admin pages is redirected or gets 404 per current behavior (assert what the code does today and report any surprise). Done when both run green on a fresh clone and the e2e is listed in the report with the command used. Tests only; no product code changes | QA/DevOps | None | applied | 86cf03b | Commit `e164527` | Applied by owner: `e164527` | New navigation matrix duplicates existing `MobileTabNavigation.test.tsx:69-79`; one guest-to-admin e2e passed. Full role suite interrupted after Typesense DNS failures; signed-in cases require auth/database env and remain unverified |
| OWNER-1 | Human owner runs Safepay sandbox E1 (duplicate-webhook replay via dashboard resend on the preview) and F (rejected refund leaves the booking UNCERTAIN, no auto-retry), then sends results to the Founder | Human owner | B-005b runbook | ready | n/a | | | Closes R-04 item 9 only when E1 and F both pass |
| A-003 | Complete A-002 evidence formatting in `docs/audits/2026-11-04-a4-web-foundation-recheck.md`: add a precise file-and-line citation to every evidence cell, rechecking against the cited base commit. Read-only on source; return an updated report and list any claim that cannot be supported with a line citation. | Auditor | A-002 | blocked | e164527 (must be available from GitHub first) | Packet below | Approved to prepare; waiting for owner to publish the base commit | `e164527` is one commit ahead of `origin/preview`; fresh role clones cannot fetch it yet |
| Q-002 | Remove the redundant new navigation-matrix test (the existing `MobileTabNavigation.test.tsx` already covers guest/student/owner/admin) and complete role-guard e2e coverage for guest, student, owner, and admin using representative allowed/denied pages. Tests only; no product authorization changes. Provide explicit setup instructions for a disposable local database and test auth secret; role tests must not silently skip in the documented verification run. | QA/DevOps | Q-001 | blocked | e164527 (must be available from GitHub first) | Packet below | Approved to prepare; waiting for owner to publish the base commit | `e164527` is one commit ahead of `origin/preview`; signed-in tests also need the documented local test environment |

## Follow-up packets (approved to prepare; not yet relayed)

The current branch is one commit ahead of `origin/preview`. Do not relay these packets until the human owner has published `e164527` to GitHub. Each role must clone fresh and stop if that commit is not present.

### A-003 - Auditor

Re-clone the repository after `e164527` is available on GitHub. Update `docs/audits/2026-11-04-a4-web-foundation-recheck.md` so every evidence cell in the 29-row requirement table has a precise file-and-line citation for the audited commit (`86cf03b`). Recheck the cited source at that commit; do not change source code. Where a claim is inherently about file presence or a command result, cite the most relevant line or command evidence and explain any limitation. Return a complete patch and report the task ID, full base SHA, changed files, and checks performed.

**Acceptance:** No evidence cell relies on an uncited file-only claim; the report continues to distinguish the audited commit from the current patch base; unsupported claims are marked as such rather than guessed.

### Q-002 - QA/DevOps

Re-clone the repository after `e164527` is available on GitHub. Remove `src/lib/product-navigation.test.ts` because `src/components/layout/MobileTabNavigation.test.tsx` already contains the four-role navigation matrix. Keep or extend the existing test only if needed to avoid duplicated assertions.

Extend `e2e/role-redirects.spec.ts` with representative signed-in access checks for student, owner, and admin roles, including allowed access to the matching role's page and denied access to at least one mismatched role page where current code defines that behavior. Preserve guest-to-login coverage. Do not change application authorization or product code; report unexpected current behavior instead.

Add concise instructions for running the signed-in tests against a disposable local database with a test-only Auth.js secret. Fail closed for non-local database targets, do not use production/shared data, and ensure the documented run executes the signed-in cases rather than silently skipping them. Run the new e2e coverage and the existing relevant unit test on a fresh clone; report exact commands, pass/skip counts, and any environment prerequisites.

**Acceptance:** The redundant test file is removed; role e2e covers student, owner, and admin authenticated behavior plus guest redirects; the documented local run has no skipped role cases; tests pass; no product code or authorization changes.
