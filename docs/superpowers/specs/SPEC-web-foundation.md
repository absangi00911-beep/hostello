# Spec: `web-foundation`

## Objective

Restore the first-party responsive web shell and shared interaction foundation
for students, owners, and admins, using the existing same-origin Next.js
application and Auth.js session.

## Scope

- Public home, discovery entry, sign-in/sign-up and account recovery surfaces.
- Shared header, role-specific navigation, notification affordance, footer,
  loading/error/empty states, and accessible form primitives.
- Route protection and role-aware navigation; authorization remains enforced
  by server handlers, not by client visibility alone.
- English-only interface, whole-integer PKR formatting, responsive layouts,
  keyboard/focus support, and reduced-motion behavior.
- Terms and Privacy shells with no invented legal content or acceptance
  checkbox tied to unapproved copy.

## Boundaries

- Use the system typography, restrained green accent, and neutral surfaces from
  the approved provisional visual direction.
- Validate the route and layout conventions against the installed Next.js
  16.4 documentation before implementation.
- Do not add a design-system dependency or change auth/session strategy.

## Success criteria

- Public and authenticated routes share consistent layout and navigation.
- Student, owner, and admin navigation exposes only relevant destinations.
- Direct unauthorized navigation is denied server-side.
- Layouts work at mobile, tablet, and desktop widths and support keyboard use.
- Terms and Privacy pages show a clearly unfinished shell, not fabricated
  legal guidance.
- Loading, empty, error, and success states are present for shared patterns.

## Testing

- Component tests for navigation, role states, focus, and responsive controls.
- Playwright smoke test for public navigation and role redirects.
- Verify reduced-motion and keyboard paths in a browser.
