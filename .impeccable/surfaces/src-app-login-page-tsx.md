---
version: 1
slug: "src-app-login-page-tsx"
primary_target: "src/app/login/page.tsx"
related_targets: ["src/app/layout.tsx","src/app/globals.css","src/components/home/BrowseHeader.tsx"]
---

## Scope
Create the `/login` experience as an accessible modal over hostel discovery, with a direct URL that keeps listings behind the dialog.

## Visitor mode
Operate.

## Audience, job, action, proof, and constraints
Returning students sign in to continue using HostelLo. The screen must authenticate with the existing email/password flow and may offer Google only when configured. Phone OTP is not an authentication option. No signup UI is in scope.

## Direction contract
THESIS: Keep hostel discovery present while a returning student signs in; this is an account task, not a separate promotional page.
OWN-WORLD: Inherit HostelLo's white listing canvas, forest-green brand controls, quiet borders, and rounded forms. Use the HostelLo mark, never Airbnb branding.
STORY: A focused dialog communicates account entry, accepts email and password, offers configured Google sign-in, and gives clear recovery feedback without exposing authentication details.
FIRST VIEWPORT: Center a white dialog over the dimmed listings. Place a close control at the top, the Hostello mark and login heading above labeled email and password fields, then a full-width primary action and a divider with Google only when available. Keep the dialog within the viewport on mobile.
FORM: User-pinned centered sign-in dialog adapted from the supplied reference; a ranked concept list and concept-seed roll are not applicable to this precisely specified request. seed: none (user-pinned direction).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment
The dialog preserves the user's hostel browsing context while providing a compact, keyboard-accessible sign-in task.

## Unresolved decisions
None for this login-only slice.
