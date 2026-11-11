# HostelLo full-app UI consistency pass

**Status:** Approved by Founder for audit and bounded fixes to confirmed
in-scope issues. No redesign or product-behavior changes are approved.
**Scope:** Inspect the existing student, owner, admin, and shared web
experiences, then make narrowly scoped fixes for confirmed UI consistency
problems.

## Intent

Make the existing product feel like one coherent, usable web application
across student, owner, and admin roles, especially on mobile. This is a
consistency and quality pass, not a visual redesign. Preserve the existing
product behavior, approved feature boundaries, content, and brand direction.
Fix only differences that are demonstrably accidental or harmful to usability,
accessibility, responsiveness, or trust.

## Scope

- Shared app shell, public/auth surfaces, and role-aware navigation.
- Student marketplace and account surfaces.
- Owner workspace.
- Admin console.
- Shared notification, messaging, form, feedback, and state patterns that are
part of those experiences.
- Mobile and desktop presentation, including narrow-width behavior.

The module boundaries and existing behavior contracts remain those in
[`HOSTELLO-CAPABILITY-MAP.md`](../../../HOSTELLO-CAPABILITY-MAP.md) and its
linked specifications. This pass does not add new capability IDs.

## Audit dimensions

Inspect representative screens and shared patterns for:

- typography, color/token usage, spacing, borders, radii, elevation, and icon
  treatment;
- page headings, content widths, navigation placement, and responsive layout;
- button hierarchy, interactive target size, form structure, validation, and
  confirmation patterns;
- loading, empty, error, success, disabled, permission, and uncertain states;
- semantic structure, keyboard/focus behavior, accessible names, contrast,
  reduced motion, and overflow at narrow widths.

The team should use browser evidence and source/tests, not documentation alone.
Review all existing app routes within the stated surfaces; use representative
browser checks for each distinct layout and high-risk flow rather than
pretending every route has been manually exercised.
Use authenticated browser sessions only when an existing local/disposable test
setup is explicitly isolated and available. Otherwise, record protected
student, owner, or admin surfaces as source-reviewed but browser-unverified;
do not use real accounts or connect to an unverified database to obtain
screenshots.

## Constraints and non-goals

- Preserve functionality, API contracts, authorization, copy meaning, and
  current product rules.
- Do not add product features, redesign a journey, change pricing or payment
  semantics, rewrite legal content, or introduce a design/icon dependency.
- Prefer existing tokens and shared components. Extract or unify components
  only when repeated evidence justifies the change and cross-role owners
  coordinate it.
- Do not change the brand palette, typography, or overall visual direction in
  this pass. If source and design documents conflict, report the discrepancy
  and preserve runtime behavior until the owner resolves it.
- Maintain keyboard usability, visible focus, `prefers-reduced-motion`, and
  responsive support from 360 CSS px with no page-level horizontal overflow.
  Keep narrower supported regression widths intact.
- Respect the current dirty worktree. Inspect and integrate existing changes;
  never revert unrelated edits or regenerate unrelated files.
- Do not commit, push, deploy, touch production settings/data, or call live
  providers.

## Known source discrepancy to resolve during audit

`SPEC-web-foundation.md` describes a restrained green accent, while
`src/app/globals.css` defines a blue brand token and
`2026-11-04-hostello-screen-design.md` describes the existing restrained blue
direction. `DESIGN.md` is identified by the repo guidance as historical. The
team must establish whether the discrepancy is only stale documentation or a
real surface inconsistency. Do not select or roll out a different palette
without Founder approval.

## Role ownership

- **Product Designer:** audit the shared visual language and representative
  role screens; report concrete inconsistencies with evidence and recommend
  reuse of current patterns. No speculative redesign.
- **Senior Frontend Engineer:** own shared shell, shared primitives, and
  student-facing surfaces. Coordinate before touching shared tokens or
  primitives.
- **Frontend Engineer:** own owner/admin, notifications, messaging, and
  availability-alert surfaces; reuse the shared foundation and coordinate
  any shared-component changes.
- **QA / DevOps Engineer:** define and run focused browser/responsive checks
  against local or disposable services; report console, accessibility, and
  viewport issues. No production activity.
- **Founder:** resolve any brand or product decision that cannot be settled
  from source evidence, review the combined findings, and approve any scope
  expansion.

Changes must stay on non-overlapping files where practical. The Tech Lead
coordinates dependencies and reviews the integrated diff.

## Success criteria

- A route/surface inventory and evidence-backed findings report cover all
  stated role areas.
- Confirmed accidental inconsistencies are fixed using existing conventions
  or shared patterns; intentional role-specific differences are retained.
- No change alters product behavior, data handling, or authorization.
- Representative student, owner, and admin screens render coherently at
  mobile and desktop sizes, including loading/empty/error states where
  available.
- Focus, accessible names, text contrast, touch targets, reduced motion, and
  horizontal overflow are checked for affected surfaces.
- Focused component tests and browser checks pass; repo-level checks are run
  when the change scope warrants them.
- Any unresolved product/brand decision or external verification need is
  reported clearly rather than guessed.

## Deliverables

1. Evidence-backed consistency findings and route coverage summary.
2. Surgical implementation changes for confirmed in-scope issues.
3. Focused test/browser results and an explicit list of unverified surfaces.
4. Founder handoff with remaining decisions and launch-relevant risks.
