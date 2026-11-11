# HostelLo UI Consistency Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inspect the existing student, owner, admin, and shared web UI, then make narrowly scoped fixes for confirmed consistency, accessibility, and responsive issues.

**Architecture:** First establish an evidence-backed route and pattern inventory, then classify intentional versus accidental differences against current code and approved module specs. Product Designer identifies shared pattern discrepancies; frontend owners implement non-overlapping fixes in their existing components; QA verifies affected surfaces in browser and with focused tests. Shared tokens and primitives are not changed without explicit coordination and Founder approval if the change affects brand direction.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS v4, existing Vitest and Playwright setup.

**Spec:** [2026-11-09-ui-consistency-audit-design.md](../specs/2026-11-09-ui-consistency-audit-design.md)

## Global Constraints

- Preserve functionality, API contracts, authorization, copy meaning, and current product rules.
- Do not add product features, redesign a journey, change pricing or payment semantics, rewrite legal content, or introduce a design/icon dependency.
- Do not change the brand palette, typography, or overall visual direction in this pass.
- Support 360 CSS px with no page-level horizontal overflow; preserve narrower supported regression widths.
- Maintain keyboard usability, visible focus, `prefers-reduced-motion`, and existing accessibility semantics.
- Do not commit, push, deploy, touch production settings/data, or call live providers.
- Inspect and integrate the shared dirty worktree; never revert unrelated edits or regenerate unrelated files.

## Review Focus

- Narrow viewport overflow or obscured content at 320/360 px — pin each affected route with browser viewport checks and relevant component regression tests.
- Missing or inconsistent keyboard focus and accessible names on interactive controls — inspect the accessibility tree and add/adjust focused component assertions.
- Inconsistent loading, empty, error, disabled, or permission states — verify all observed states remain truthful and recoverable; test affected state components.
- Shared token/component drift across roles — compare computed styles and component sources; avoid palette changes absent Founder approval.
- Role-specific navigation/actions appearing on the wrong role surface — verify existing server guards remain authoritative and test affected navigation states.
- Protected student/owner/admin surfaces without an available disposable role session — record source review separately from browser evidence; do not use real accounts or an unverified database.

---

### Task 1: Build route and visual-pattern inventory

**Files:**
- Read: app route tree under `src/app/`
- Read: shared UI components under `src/components/`
- Read: approved UI specs under `docs/superpowers/specs/`
- Report: findings to the Founder/Tech Lead (no source edits in this task)

**Interfaces:**
- Consumes: approved UI audit design and existing module specifications.
- Produces: route/surface inventory grouped as shared, student, owner, and admin; representative browser routes and confirmed discrepancy candidates.

- [x] **Step 1: Inventory routes and their shared layouts**

Use the existing app route tree; classify every in-scope route and identify its layout/shell, role, and shared components.

- [x] **Step 2: Compare code against current specs**

Record only source-verifiable differences. Explicitly flag the restrained-green wording in `SPEC-web-foundation.md` against the blue runtime token and approved current screen-design direction; do not change tokens.

- [x] **Step 3: Run representative local browser inspection**

Inspect at least one public route for each distinct shared/student layout at 360 px and desktop width. Inspect authenticated student, owner, and admin layouts at both widths only when an existing isolated disposable role session is available. Capture visible state, horizontal overflow, console errors, and accessible names. Use only local/non-production app data. If a protected role has no safe test session available, record the source review and explicitly mark its browser coverage unverified; do not use real credentials or connect to an unverified database.

- [x] **Step 4: Return prioritized evidence**

For each candidate, include route/component, observed behavior or computed style, expected current pattern/source, severity, and a proposed bounded fix. Distinguish intentional role-specific differences and unverified routes.

**Verification:** Inventory covers every route in the named app areas and gives evidence for each finding; no UI code changes are made.

### Task 2: Agree shared consistency findings and ownership

**Files:**
- Read: Task 1 inventory
- Modify only affected files subsequently assigned to one owner at a time

**Interfaces:**
- Consumes: route inventory and prioritized evidence from Task 1.
- Produces: accepted finding list with a single implementation owner, affected files, acceptance checks, and explicit non-goals for each fix.

- [x] **Step 1: Product Designer classifies each finding**

Classify as accidental inconsistency, intentional role-specific variation, or unresolved brand/product decision; recommend reuse of the current established pattern without proposing new direction.

- [x] **Step 2: Tech Lead assigns disjoint scopes**

Assign shared/student fixes to Senior Frontend Engineer and owner/admin/notification/message fixes to Frontend Engineer. Coordinate explicitly before any shared token or primitive edit.

- [x] **Step 3: Founder resolves only decisions that affect brand or behavior**

Escalate any conflict that cannot be resolved from runtime source and approved current specs; otherwise keep existing runtime behavior and proceed with the bounded fix.

**Verification:** Every accepted fix has evidence, a single owner, an acceptance check, and no unresolved overlapping edits.

### Task 3: Fix shared shell and student UI findings

**Files:**
- Modify: only shared/student files confirmed in Task 2
- Test: colocated Vitest files for each modified component

**Interfaces:**
- Consumes: accepted findings assigned to Senior Frontend Engineer.
- Produces: minimal shared/student UI fixes using current tokens, shell, components, and APIs.

- [x] **Step 1: Add or update a focused failing test per behavior-affecting finding**

Cover the specific route/component and expected responsive, accessible, or visual state without altering product behavior.

- [x] **Step 2: Verify the test fails for the reported issue**

Run the relevant Vitest file/test selector; retain the failure evidence before implementation.

- [x] **Step 3: Implement only the accepted fixes**

Do not change brand tokens, route semantics, APIs, auth, business rules, or product copy.

- [x] **Step 4: Verify focused tests and local browser rendering**

Run the affected Vitest tests and inspect desktop plus 360 px rendering, including keyboard focus and reduced-motion behavior where relevant.

### Task 4: Fix owner, admin, and shared operational UI findings

**Files:**
- Modify: only owner/admin/notification/message files confirmed in Task 2
- Test: colocated Vitest files for each modified component

**Interfaces:**
- Consumes: accepted findings assigned to Frontend Engineer and the existing shared foundation.
- Produces: minimal owner/admin UI fixes that preserve authorization, money-operation confirmation, and sensitive-data constraints.

- [x] **Step 1: Add or update a focused failing test per behavior-affecting finding**

Pin the affected state, role, or responsive behavior. Include permission-denied and uncertain-operation states if those are part of the finding.

- [x] **Step 2: Verify the test fails for the reported issue**

Run the relevant Vitest file/test selector before making the fix.

- [x] **Step 3: Implement only the accepted fixes**

Reuse shared foundation components; do not change server authorization, payment/payout behavior, API contracts, or sensitive-data exposure.

- [x] **Step 4: Verify focused tests and browser rendering**

Run affected Vitest tests and inspect desktop plus 360 px rendering. Confirm destructive or financial actions remain explicit and auditable. For informational analytics cards, verify hover/press scale, shadow, and nonessential transitions are removed; retain monthly-bar animation only if `prefers-reduced-motion` disables it.

### Task 5: Validate integrated UI and close findings

**Files:**
- Modify: `docs/CHANGELOG.md` only if this repository's release-note convention requires recording the shipped user-visible fixes
- Update: audit handoff/findings report as part of the assigned task record; do not create a second design system or unrelated documentation

**Interfaces:**
- Consumes: shared/student and owner/admin implementation changes plus the accepted findings list.
- Produces: final evidence matrix, remaining issues, and verified route coverage.

- [x] **Step 1: Run targeted test and browser coverage**

Run affected Vitest tests and Playwright smoke coverage for the touched routes against local or disposable services only.

- [x] **Step 2: Check responsive and accessibility acceptance**

At 360 px and desktop width, verify no page-level horizontal overflow, visible keyboard focus, accessible names, contrast for affected states, and no obscured focused controls. Preserve narrower regression checks already present.

- [x] **Step 3: Run repository gates appropriate to the final diff**

Run `npm run lint`, `npm run typecheck`, `npm run test -- --run`, `npm run docs:check`, and `git diff --check` if shared primitives or broad cross-app patterns changed; otherwise run the targeted equivalents and report why full gates were not rerun.

- [x] **Step 4: Report completion accurately**

List routes inspected, files changed, checks and results, unverified routes/states, unresolved decisions, and any remaining launch-relevant UI risks. Do not claim every route was browser-tested unless it was.
