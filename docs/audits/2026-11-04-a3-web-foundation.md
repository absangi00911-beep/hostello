# A-001c-1: module "web-foundation" vs SPEC-web-foundation.md

Date: 2026-11-04. Commit eb7b713. Static grep/read only; app not run, no tests/build, so nothing below is a pass/fail result. Sources: AGENTS.md, docs/superpowers/specs/SPEC-web-foundation.md, HOSTELLO-CAPABILITY-MAP.md:9, PRODUCT.md:19-37. The spec's six success criteria are folded into the rows they overlap (noted in brackets).

| # | Requirement (spec section) | Status | Evidence | Owner | Next step |
|---|---|---|---|---|---|
| 1 | Public home (Scope) | Implemented | src/app/page.tsx:4-17 renders ProductHome with session user; e2e/web-foundation.spec.ts:67 | Sr Frontend | none |
| 2 | Discovery entry (Scope) | Implemented | /search page exists (src/app/search/page.tsx); e2e/web-foundation.spec.ts:142 (destination/date filters to search) | Sr Frontend | none |
| 3 | Sign-in / sign-up (Scope) | Implemented | src/components/auth/LoginDialog.tsx; src/app/login/page.tsx:26-36 (dialog over ProductHome); src/app/signup/page.tsx; SignupForm.test.tsx | Sr Frontend | none |
| 4 | Account recovery (Scope) | Implemented | src/app/forgot-password/page.tsx; src/app/reset-password/page.tsx:15-17 (reads token); ResetPasswordForm.test.tsx | Sr Frontend | none |
| 5 | Shared header [SC1: consistent layout] | Partial | Root layout has no header (src/app/layout.tsx:27-37, only LoginDialogProvider). Four separate headers composed per page: DesktopAccountHeader (7 pages), BrowseHeader, OwnerPageHeader, AdminPageHeader (grep). Legal shell has its own header (LegalPlaceholderPage.tsx:6-14) | Sr Frontend | Decide: shared layout per route group, or document per-page headers as intended |
| 6 | Role-specific navigation [SC2] | Partial | src/lib/product-navigation.ts:22-42 (student 5 tabs; owner Explore+Messages; admin Explore; guest 3). Owner/admin links in account menu: BrowseAccountMenu.tsx:129-145. No unit test for the role matrix (no product-navigation test file). MobileTabNavigation shows only for guest/student (MobileTabNavigation.tsx:18) and is not used on owner/admin pages (grep) | Sr Frontend + QA | Add role-matrix test; confirm owner/admin mobile nav intent |
| 7 | Notification affordance (Scope) | Partial | Unread count in account button label (BrowseAccountMenu.tsx:32,65-68) and /notifications link (:151-154). No notifications tab in product-navigation.ts:11-17. Desktop header hidden under 720px (DesktopAccountHeader.tsx className); mobile reachability of the menu NOT checked | Sr Frontend | Verify mobile path to notifications; add tab or bell if missing |
| 8 | Footer (Scope) | Missing | No footer in layout.tsx; only a search-results footer (SearchPageClient.tsx:643). grep finds no UI link to /terms or /privacy (only emails: email-templates/layout.ts:60-61), so the legal pages are unreachable from the app | Sr Frontend | Build shared footer with Terms, Privacy, Contact |
| 9 | Loading / error / empty / success states [SC6] | Partial | No loading.tsx, error.tsx, not-found.tsx or global-error.tsx anywhere under src/app (find). 41 component files use status/alert/empty/skeleton patterns (grep); no shared state components (no src/components/ui). Non-admin visitors get default 404 via notFound() (admin/page.tsx:18) | Sr Frontend | Add route-level loading/error/not-found and a shared EmptyState |
| 10 | Accessible form primitives (Scope) | Partial | Labels/aria in LoginDialog (7 hits), ContactForm (4), ForgotPasswordForm (1); aria-describedby LoginDialog.tsx:304; autoFocus :382,419,473,522. No shared form primitive set (src/components/ui absent) | Sr Frontend | Extract Field/Input/Button primitives |
| 11 | Route protection, server-side [SC3] | Implemented | Per-page auth()+redirect to /login?callbackUrl (trips/page.tsx:8-11, profile, wishlists, messages:15-26, notifications:10-13). Admin: 404 for non-admin (admin/page.tsx:9-19). All 17 owner and admin pages contain a redirect or role check (grep count, 2 each; role logic not read in each). proxy.ts is CSRF/rate-limit only (:28-56), not page protection. No e2e test of role redirects | QA | Add role-redirect e2e |
| 12 | English-only interface (Scope) | Implemented | layout.tsx:27 lang="en"; no i18n dependency in package.json (grep 0) | - | none |
| 13 | Whole-integer PKR formatting (Scope) | Partial | No shared formatter: 15 files each build Intl.NumberFormat("en-PK") (grep), e.g. AdminRefundsPage.tsx:20-24 with maximumFractionDigits 0. Student-facing formatting not individually checked | Sr Frontend | Create src/lib/format-pkr.ts, replace copies |
| 14 | Responsive layouts, mobile/tablet/desktop [SC4] | Partial | Mobile tab bar (MobileTabNavigation.test.tsx:15 safe-area), desktop header hidden at max-width 720, e2e at several widths (hostel-detail-entry.spec.ts:547, web-foundation.spec.ts:316). Owner/admin have no mobile nav. Not run | Sr Frontend/QA | Run Playwright at 3 widths for owner/admin |
| 15 | Keyboard / focus support [SC4] | Partial | focus-visible in 31 files; Radix dialog and dropdown-menu (BrowseAccountMenu, LoginDialog) supply focus handling. No skip link (grep "Skip to" none). No focus tests found | Sr Frontend | Add skip link; focus tests |
| 16 | Reduced-motion behavior (Scope) | Partial | globals.css:111 @media (prefers-reduced-motion: reduce) block exists (contents not read); motion-reduce/prefers-reduced-motion in 25 files (grep). Not browser-verified | Sr Frontend/QA | Read block; verify in browser |
| 17 | Terms/Privacy unfinished shells, no invented legal text, no acceptance checkbox [SC5] | Implemented | terms/page.tsx:7, privacy/page.tsx:7 use LegalPlaceholderPage; text says placeholder and no legal guidance (LegalPlaceholderPage.tsx:20-21), role="note". No terms/checkbox/agree in auth components (grep empty). Reachability gap: row 8 | Sr Frontend | none for the shells |
| 18 | System typography (Boundaries) | Diverges | Inter loaded via next/font/google (layout.tsx:2-10); headings use it (globals.css:57); body uses system stack (:44-46). e2e asserts Inter (hostel-detail-entry.spec.ts:796). Code follows DESIGN.md "Airbnb-inspired"; spec and 2026-10-25 web-design spec say system typography | Founder decision | Choose spec vs DESIGN.md, update the loser |
| 19 | Restrained green accent, neutral surfaces (Boundaries) | Diverges | --brand #2563eb, --brand-dark #1d4ed8, --brand-soft #e0e7ff (globals.css:24-26): blue, not green. Specs 2026-10-25:35,210 say green | Founder decision | Same decision as row 18 |
| 20 | Validate against installed Next.js 16.4 docs (Boundaries) | Not checked | package.json:70 "next": "^16.4.0"; AGENTS.md requires reading node_modules/next/dist/docs, which is not present in this read-only clone | Sr Frontend | Do at implementation time |
| 21 | No design-system dependency (Boundaries) | Diverges | package.json:40-54 lists 15 @radix-ui packages, :63 class-variance-authority, :81 tailwind-merge; components.json is shadcn config. Only 2 Radix packages are imported in src (react-dialog, react-dropdown-menu; grep); src/components/ui does not exist | Tech Lead | Decide whether Radix counts; remove 13 unused packages |
| 22 | Auth/session strategy unchanged (Boundaries) | Not checked | Current: Auth.js beta.32, Credentials plus gated Google (config.ts:94-96); no baseline compared (needs git history) | Tech Lead | Compare against first commit |
| 23 | Tests: component tests for nav, roles, focus, responsive (Testing) | Partial | MobileTabNavigation.test.tsx:15,30,41,55; BrowseAccountMenu.test.tsx; ScrollAwareSurface.test.tsx. No role-matrix or focus test | QA | Add the two |
| 24 | Tests: Playwright smoke for public nav and role redirects (Testing) | Partial | e2e/web-foundation.spec.ts covers public discovery; no admin/owner redirect test (grep of e2e) | QA | Add role-redirect smoke |
| 25 | Tests: reduced-motion and keyboard in browser (Testing) | Not checked | Manual browser step; no e2e for it found by name scan | QA | Run manually, record result |
| 26 | PRODUCT: listings-first home, no marketing page | Implemented | page.tsx:17 renders ProductHome; login/page.tsx:27 also; e2e test name web-foundation.spec.ts:67. ProductHome internals not read | - | none |
| 27 | PRODUCT: only configured auth methods shown | Implemented | Google button only when keys set: layout.tsx:29-31, LoginDialog.tsx:544, config.ts:94-96 | - | none |
| 28 | PRODUCT: mobile-first | Partial | Mobile tab bar exists, but breakpoints are desktop-first max-width queries (DesktopAccountHeader.tsx, SearchPageClient.tsx:643) | Sr Frontend | Confirm intent; no change needed if responsive |
| 29 | PRODUCT: accessibility basics (labels, focus, tap targets) | Partial | Labels: LoginDialog 7, ContactForm 4; AuthPageShell and BrowseAccountActions 0 hits. focus-visible 31 files. Tap targets: admin buttons min-h-10 = 40px (AdminRefundsPage.tsx:33); min-h-11/12 in 13 files | Sr Frontend | Raise admin targets to 44px |

## UNDOCUMENTED (built, not in spec)
- Auth as a dialog over the home page (LoginDialog, LoginDialogProvider); /login and /signup render it.
- Five-tab student bottom navigation (MobileTabNavigation, product-navigation.ts) including Wishlists, Trips, Messages, Profile.
- shadcn/Radix/CVA/Tailwind 4 tooling (components.json, package.json); Tailwind specs exist separately.
- ScrollAwareSurface sticky header shadow; /contact page linked from legal shells.
- DESIGN.md Airbnb-inspired direction, which contradicts this spec (rows 18-19).

## Summary
- Counts (29 rows): Implemented 9, Partial 13, Missing 1, Diverges 3, Not checked 3.
- Build first: a shared footer with Terms/Privacy (legal pages are unreachable today).
- Then: route-level loading/error/not-found plus a shared EmptyState, and one PKR formatter.
- Founder decides rows 18-19 (green/system fonts vs blue/Inter) and Tech Lead row 21 (Radix).
- QA adds role-redirect e2e and a role-matrix test.

## Not checked
ProductHome and hostel-detail header internals; each owner/admin page's role logic; reduced-motion block contents; any runtime behavior; node_modules Next docs.
