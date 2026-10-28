# Tailwind Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the existing Tailwind v4 setup and establish semantic utilities while preserving the current app appearance.

**Architecture:** Import Tailwind's theme and utilities layers without Preflight so unmigrated pages keep their existing baseline styles. Map the existing CSS variables into Tailwind color utilities, then move the body's existing background, text color, and minimum height onto semantic classes as the first verified use.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS 4.3.3, PostCSS, Playwright.

**Spec:** `../specs/SPEC-tailwind-foundation.md`

## Global Constraints

- Preserve current appearance and behavior.
- Use the existing Tailwind v4 dependency and PostCSS plugin.
- Retain global reset, font, and token behavior needed by unmigrated pages.
- Do not remove component CSS belonging to an unmigrated module.
- Do not replace existing design with a redesign.

## Review Focus

- A missing or misordered Tailwind import leaves utility classes ungenerated; the focused browser test must observe the expected computed styles.
- A wrong semantic token mapping changes the page colors; assert the body matches the existing canvas and ink tokens at desktop and mobile widths.
- Tailwind Preflight could reset existing page elements; import only theme and utilities and confirm existing page tests still pass.
- Unlayered body declarations could override utility-layer declarations; remove the body's migrated declarations and verify the resulting computed values.
- Responsive viewport changes could alter the body's minimum height; assert it tracks the viewport at both test widths.

---

### Task 1: Enable Tailwind v4 foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Test: `e2e/web-foundation.spec.ts`

**Interfaces:**
- Consumes: Existing CSS custom properties `--canvas`, `--surface`, `--surface-muted`, `--ink`, `--muted`, `--line`, `--brand`, `--brand-dark`, `--brand-soft`, and `--warm`.
- Produces: Semantic Tailwind color utilities `bg-canvas`, `bg-surface`, `bg-surface-muted`, `text-ink`, `text-muted`, `border-line`, `bg-brand`, `text-brand`, `bg-brand-dark`, `bg-brand-soft`, and `text-warm`.

- [x] **Step 1: Read the relevant Next.js root-layout guidance**

Read the relevant guide under `node_modules/next/dist/docs/` before editing `src/app/layout.tsx`. Keep the existing App Router layout pattern and global stylesheet import.

- [x] **Step 2: Add a failing browser test**

In `e2e/web-foundation.spec.ts`, add `tailwind_foundation_preserves_global_body_styles`. At viewport sizes 1440×900 and 390×844, assert that the body has the `min-h-screen`, `bg-canvas`, and `text-ink` classes, that its computed background and text colors match the existing `--canvas` and `--ink` tokens, and that its minimum height matches the viewport.

```text
min-height: viewport height
```

- [x] **Step 3: Run the focused test and confirm it fails**

Run: `npm run e2e -- e2e/web-foundation.spec.ts -g tailwind_foundation_preserves_global_body_styles`

Expected: FAIL because the root body does not yet use the Tailwind utility classes.

- [x] **Step 4: Enable the Tailwind theme and utilities**

In `src/app/globals.css`, import Tailwind v4's theme and utilities CSS layers, omitting Preflight to avoid changing unmigrated pages. Map the existing custom properties to semantic `--color-*` tokens using Tailwind v4's CSS-first theme syntax. Retain the existing global resets, typography, and component CSS.

- [x] **Step 5: Move the body's three visual properties to Tailwind utilities**

Add `className="min-h-screen bg-canvas text-ink"` to the root `<body>` in `src/app/layout.tsx`. Remove only `min-height`, `background`, and `color` from the `body` rule in `src/app/globals.css`; retain its margin, font, and rendering declarations.

- [x] **Step 6: Run the focused browser test**

Run: `npm run e2e -- e2e/web-foundation.spec.ts -g tailwind_foundation_preserves_global_body_styles`

Expected: PASS at both viewport sizes with token-matched computed colors and viewport-matched minimum height.

- [x] **Step 7: Run project checks**

Run: `npm run e2e -- e2e/web-foundation.spec.ts`

Expected: all web foundation tests pass, confirming the omitted Preflight has not regressed existing home-page behavior.

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: production build completes successfully.

- [x] **Step 8: Commit the foundation slice**

```bash
git add src/app/globals.css src/app/layout.tsx e2e/web-foundation.spec.ts
git commit -m "feat: enable Tailwind CSS foundation"
```
