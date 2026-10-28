# Spec: Tailwind Foundation

## Objective

Enable the project's installed Tailwind CSS v4 setup and establish its utility and design-token foundation for the full UI migration. This first module must prove that semantic Tailwind utilities render in the existing Next.js app without changing its appearance.

The approved module map is [TAILWIND-MIGRATION-MAP.md](../../../TAILWIND-MIGRATION-MAP.md).

## Tech Stack

- Next.js 16 App Router
- React and TypeScript
- Tailwind CSS v4 (already in `package.json`)
- `@tailwindcss/postcss` (already configured in `postcss.config.js`)

No dependency or framework change is in scope.

## Commands

- Development: `npm run dev`
- Build: `npm run build`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Tests: `npm test -- --run`

## Project Structure

- `src/app/globals.css` — Tailwind import, theme token mapping, and only global/base CSS.
- `src/app/layout.tsx` — Root document; use semantic utilities to prove the Tailwind foundation is active.
- `postcss.config.js` — Existing Tailwind v4 PostCSS plugin; change only if official v4 guidance requires it.
- `TAILWIND-MIGRATION-MAP.md` — Approved capability boundaries and build order.

## Code Style

Use semantic utilities that map to the existing visual tokens rather than raw values:

```tsx
<body className="min-h-screen bg-canvas text-ink">
```

Map the existing CSS design tokens to Tailwind v4 theme utilities. Preserve existing naming, formatting, and the project's current responsive and reduced-motion behavior. Keep global rules such as resets, font defaults, and genuinely global animations in `globals.css`; do not move page/component styles in this foundation module.

## Testing Strategy

- Verify the app builds and type-checks with Tailwind enabled.
- Verify the semantic body utilities generate and apply in a real browser.
- Compare the root page before and after at desktop and mobile widths; background, text colors, and minimum height must remain visually equivalent.
- Run the existing focused tests if affected, then the project's configured lint and build checks for the foundation.

No new test framework or visual-regression dependency is required.

## Boundaries

- **Always:** Preserve current appearance and behavior; use the existing Tailwind v4 dependency and PostCSS plugin; retain global reset, font, and token behavior needed by unmigrated pages.
- **Ask first:** Adding dependencies; changing framework versions; changing the palette, typography, responsive behavior, or any page design.
- **Never:** Remove component CSS belonging to an unmigrated module; replace existing design with a redesign; suppress or delete existing tests to make checks pass.

## Success Criteria

- Tailwind v4 is imported and active in the app.
- Existing semantic design tokens can be used as Tailwind utilities.
- The root layout demonstrates those utilities in production application code.
- The root page retains its pre-migration appearance and behavior at desktop and mobile sizes.
- Existing pages continue to work while their component styles remain in `globals.css`.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Open Questions

None. Visual preservation, use of the installed Tailwind v4 setup, and staged migration were approved.
