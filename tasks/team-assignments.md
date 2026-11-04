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
