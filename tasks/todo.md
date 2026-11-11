# Project Health Remediation Tasks

Source plan: [2026-11-09-project-health-remediation.md](../docs/superpowers/plans/2026-11-09-project-health-remediation.md)

## Implementation

- [x] **Task 1 — G-001:** Make Pro checkout retries safe; add initiation and callback regression tests.
- [x] **Task 2 — G-005:** Add a guarded PostgreSQL concurrency gate in an isolated CI service; correct current CI coverage statement. Workflow is configured and its local checks pass; a GitHub Actions run has not been verified.
- [x] **Task 3 — G-007:** Strip public listing-image metadata while preserving supported formats and upload constraints.
- [x] **Task 4 — G-008:** Add source-backed operations, launch, and CI/CD runbooks; link them from `SYSTEM.md`.
- [x] **Task 5 — G-009:** Correct upload authorization and rate-limit documentation from current source.
- [x] **Task 6 — G-010/G-011:** Refresh current test evidence and resolve the `DESIGN.md` contradiction. Final current test totals are recorded in `SYSTEM.md` §14.4.

## Defaults recorded; external release gates remain

- [x] **Task 7 - G-002:** Founder repository default recorded: platform-held funds and distinct-admin maker/checker approval. Qualified advice, custody/accounting/reconciliation and operational readiness remain external gates; settlement stays disabled.
- [x] **Task 8 - G-003:** Recorded one-calendar-month Pro term, seven-day grace assumption, explicit renewal, expiry and failed-payment retry behavior. Sandbox and operational validation remain open.
- [x] **Task 9 - G-004:** Recorded exact whole-calendar-month billing, month-end clamp, hard owner bounds and 1 to 24-month global range; aligned server and student picker.
- [x] **Task 10 - G-006:** Recorded minimal reference-only payment-confirmation email retention and bounded expiry; other email flows remain out of scope.

## Checkpoint

- [x] Tasks 1-6 are implemented/documented and the requested local verification gates pass.
- [x] Tasks 7-10 repository defaults and their implementation are recorded; external launch gates remain open as listed in the approval specification.
- [x] Final local checks passed after scoped documentation review; migration and live-provider use were avoided.
