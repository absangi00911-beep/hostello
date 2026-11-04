# A-002: web-foundation re-check at commit 86cf03b

Supersedes `2026-11-04-a3-web-foundation.md` (audited at `eb7b713`). Date: 2026-11-04. Base: `86cf03b` (22 commits after `eb7b713`). Spec: `docs/superpowers/specs/SPEC-web-foundation.md`.

Verification: source read and grep/find at `86cf03b`, plus `npm ci` (Next 16.4.2, installed docs present). Results this session: `npm run typecheck` clean, `npm run lint` clean, `npm run test -- --run` 200 files / 1281 tests passed. Run on Node v22.23.4, but `package.json` requires 24.x (npm EBADENGINE warning), so treat the test result as indicative. `npm run build` and Playwright were NOT run. Source is unchanged; this file is the only addition.

## Verdict

The A-001c-1 report can no longer be trusted as written. Four of its headline findings are stale or were wrong: no shared footer (a shared `SiteFooter` now exists), no loading/error/not-found routes (11 files exist), no role-matrix test (it existed at `eb7b713` too), and "no reduced-motion/keyboard e2e" (they exist). Its design note "code follows DESIGN.md" was also wrong for the accent colour. Header consolidation is partly done. One new P1 exists: students on phones have no UI path to `/notifications`. Nothing in this module touches money paths.

## Summary

Spec rows (29): Implemented 13, Partial 13, Diverges 3, Missing 0, Not checked 0. Old report: Implemented 9, Partial 13, Missing 1, Diverges 3, Not checked 3.

New findings: P1 x2 (N-01, N-02), P2 x7 (N-03 to N-09). Old-report corrections: C-1 to C-8 (table below).

## Rows

| # | Requirement | Status | Evidence at 86cf03b | Change vs old |
|---|---|---|---|---|
| 1 | Public home | Implemented | `src/app/page.tsx:15` renders `ProductHome`; e2e `web-foundation.spec.ts:67` | confirmed |
| 2 | Discovery entry | Implemented | `src/app/search/page.tsx` exists (renders `SearchPageClient`); e2e `web-foundation.spec.ts:142` | confirmed |
| 3 | Sign-in / sign-up | Implemented | `login/page.tsx:25-37` (`ProductHome` + `LoginDialog`); `signup/page.tsx` uses `AuthPageShell`; `SignupForm.test.tsx` | confirmed |
| 4 | Account recovery | Implemented | `forgot-password/page.tsx`; `reset-password/page.tsx:15-22` reads `token`; `ResetPasswordForm.test.tsx` | confirmed |
| 5 | Shared header [SC1] | Partial | `SiteHeader.tsx:20-63` is the shared header (used by `AuthPageShell:48`, `LegalPlaceholderPage:14`, `BrowseHeader:24`, `bookings/[id]/page.tsx:32`, and via wrapper `DesktopAccountHeader.tsx:5-6` by 6 pages). Still separate: `OwnerPageHeader.tsx:13-26` (9 owner pages) and `AdminPageHeader.tsx:12-24` (8 admin pages), both near-copies; own `<header>` in `hostels/[param]/page.tsx:66-68`, `SearchPageClient.tsx:415-418`, `MessagesInbox.tsx:35-37`; `owner/analytics/page.tsx:16` renders no site header. Root `layout.tsx:27-40` has no header | STALE: was "four separate headers" |
| 6 | Role-specific navigation [SC2] | Implemented | `product-navigation.ts:22-42`; role matrix tested at `MobileTabNavigation.test.tsx:69-79` and `BrowseAccountMenu.test.tsx:120-196`. Owner/admin pages keep the header on phones (`OwnerPageHeader`, `AdminPageHeader`; `BrowseHeader.tsx:21` sets `hideOnMobile` only for guest/student) | WRONG in old: "no role-matrix test" (test existed at `eb7b713:...test.tsx:69-72`) |
| 7 | Notification affordance | Partial | Account menu link and badge: `BrowseAccountMenu.tsx:62-103,149-161`. Student/guest header hidden at max-width 720 (`SiteHeader.tsx:31`); student tab bar has no Notifications (`product-navigation.ts:11-17`); only other link is `OwnerDashboard.tsx:51`. See N-01 | was "not checked"; now confirmed gap (code read, no browser) |
| 8 | Footer | Implemented | `layout.tsx:3,36` renders `SiteFooter`; `SiteFooter.tsx:18-26` links `/terms`, `/privacy`, `/contact`; all three pages exist; tests `SiteChrome.test.tsx:27-49`. Side issues N-04, N-08 | STALE: was "Missing" |
| 9 | Loading / error / empty / success states [SC6] | Partial | Present: `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`; same trio in `bookings/[id]/` and `hostels/[param]/` (not-found specialised); `search/loading.tsx`, `search/error.tsx`. Shared: `components/states/{PageLoading,StatePanel,RouteError}.tsx` + `states.test.tsx`. Absent: `global-error.tsx` (N-02); no segment loading/error for owner/admin/messages/notifications/trips/wishlists/profile (they fall back to root). No shared EmptyState component | STALE: was "none exist" |
| 10 | Accessible form primitives | Partial | label/aria hits: `LoginDialog` 8, `SignupForm` 6, `ResetPasswordForm` 2, `ForgotPasswordForm` 1; `aria-describedby` `LoginDialog.tsx:304`; no `src/components/ui` | counts refreshed |
| 11 | Route protection, server-side [SC3] | Implemented | 27 pages call `auth()`. Every account page: login redirect then role guard, e.g. `admin/page.tsx:10-19`, `wishlists/page.tsx:8-18`, `owner/listings/[id]/edit/page.tsx:19-30`. Roles: admin pages ADMIN; owner pages OWNER; `owner/analytics/page.tsx:12` OWNER or ADMIN (N-06); student pages STUDENT; messages STUDENT/OWNER (`messages/page.tsx`). `proxy.ts:27-53` is CSRF only | CORRECTED: no rate limiting in `proxy.ts` |
| 12 | English-only | Implemented | `layout.tsx:28` `lang="en"`; no i18n dependency in `package.json`; `site-copy.ts:1-2` comment anticipates Urdu later | confirmed |
| 13 | Whole-integer PKR | Partial | Shared formatter exists: `packages/shared/src/utils/currency.ts:1-7` (`maximumFractionDigits: 0`), used only by `RoommatesPage.tsx:5`, `BookingDetailPage.tsx:6`. 5 local `formatPrice` copies (`HostelBookingCard.tsx:55`, `HostelRoomSection.tsx:13`, 3 email templates); 3 bare `toLocaleString("en-PK")` on student pages (`HostelRow.tsx:279`, `WishlistsPage.tsx:233`, `SearchPageClient.tsx:241`). `pricePerMonth Int` (`schema.prisma:320`), so output is always whole; duplication only | CORRECTED: "no shared formatter" |
| 14 | Responsive layouts [SC4] | Partial | e2e at 320/375/1024/1440 (`mobile-student-experience.spec.ts:182-186`), 390 (`web-foundation.spec.ts:532`). No e2e for owner/admin pages. Not run | unchanged |
| 15 | Keyboard / focus [SC4] | Partial | global `:focus-visible` `globals.css:72-75`; 32 files use `focus-visible`; Radix dialog/dropdown. No skip link (grep empty). Keyboard e2e: `web-foundation.spec.ts:532-559`, `login-dialog.spec.ts:376`. Not run | e2e existence corrected |
| 16 | Reduced motion | Partial | `globals.css:111-123` and `:183-193` only remove button transitions and press transform; 28 files use `motion-safe`/`motion-reduce`. Ungated: `WishlistsPage.tsx:97` `animate-pulse`, `ProductHome.tsx:333` `animate-spin` (N-07). e2e `web-foundation.spec.ts:561`, `mobile-student-experience.spec.ts:261`. Not run | block now read |
| 17 | Terms/Privacy shells, no checkbox [SC5] | Implemented | `terms/page.tsx`, `privacy/page.tsx` use `LegalPlaceholderPage.tsx:13-41` (`role="note"` placeholder text); no checkbox/agree/accept strings in `components/auth`, `app/signup`, `app/login`; tests `terms/page.test.tsx`. Copy bug N-05 | reachability gap closed |
| 18 | System typography | Diverges | Inter for headings `layout.tsx:7-11`, `globals.css:57`; body system stack `globals.css:44-46`. `DESIGN.md:391` documents exactly this; spec `:23` and `2026-10-25-hostello-web-design.md:35,209` say "system typography". Direction: spec STALE-DOC; needs Founder decision to ratify | CORRECTED: code matches DESIGN.md here |
| 19 | Restrained green accent | Diverges | Code: `--brand #2563eb` (`globals.css:24-26`, blue). `DESIGN.md:7,344` Rausch `#ff385c`. Specs say green (`2026-10-25...:35,210`). Three-way CONTRADICTION; Founder decision | CORRECTED: old note "code follows DESIGN.md" was false |
| 20 | Validate against installed Next 16.4 docs | Implemented | Installed 16.4.2; `error.md:117-121,331` documents `retry` (stable since v16.3.0); `RouteError.tsx:11-19` and `app/error.tsx:5` use `retry` | was "not checked" |
| 21 | No design-system dependency | Diverges | `package.json:40-54` 15 `@radix-ui/*`, `:63` cva, `:81` tailwind-merge; only `react-dialog` and `react-dropdown-menu` imported in `src`; `src/components/ui` absent; `package.json` unchanged since `eb7b713`. Tech Lead decision | confirmed |
| 22 | Auth/session strategy unchanged | Implemented | `config.ts:123` `session: { strategy: "jwt" }`, Credentials + gated Google (`:94-97`) identical to first commit `49b24ac` (same grep lines) | was "not checked" |
| 23 | Component tests: nav, roles, focus, responsive | Partial | Nav/roles: `MobileTabNavigation.test.tsx`, `BrowseAccountMenu.test.tsx`, `SiteChrome.test.tsx:51-77`, `states.test.tsx`. No focus test | CORRECTED: role test exists |
| 24 | Playwright: public nav and role redirects | Partial | Guest redirects `/wishlists /trips /profile`: `mobile-student-experience.spec.ts:170-180`; `/messages`: `messages.spec.ts:222`; admin denied on messages `:363` (skips without seeded creds). Nothing for `/owner/*`, `/admin/*`, `/notifications`, footer, 404 | CORRECTED |
| 25 | Reduced-motion/keyboard in browser | Partial | Tests exist (rows 15, 16); not run; no manual browser result recorded | CORRECTED |
| 26 | PRODUCT: listings-first | Implemented | `page.tsx:15`, `login/page.tsx:27` render `ProductHome`; e2e `web-foundation.spec.ts:67`. `ProductHome` internals not read | confirmed |
| 27 | PRODUCT: only configured auth shown | Implemented | `layout.tsx:30-34`, `login/page.tsx:31-33`, `LoginDialog.tsx:544`, `config.ts:94-97` | confirmed |
| 28 | PRODUCT: mobile-first | Partial | Mobile tab bar exists, but CSS is desktop-first: 236 `max-width` vs 5 `min-` breakpoint utilities in `src` (grep) | count refreshed |
| 29 | PRODUCT: accessibility basics | Partial | Admin button `min-h-10` = 40px (`AdminRefundsPage.tsx:33`); `min-h-11`/`min-h-12` in 12 files; footer links 44px (`SiteFooter.tsx:5`) | counts refreshed |

## New findings

| ID | Sev | Class | Finding and evidence | Owner | Suggested fix |
|---|---|---|---|---|---|
| N-01 | P1 | MISSING-IN-CODE | Students on phones cannot reach `/notifications` or see the unread badge: header hidden at <=720px (`SiteHeader.tsx:31`, `BrowseHeader.tsx:21`), tab bar lacks it (`product-navigation.ts:11-17`), `ProfilePage.tsx` links only `/profile/verification` and `/signup?role=OWNER` (lines 219, 236). Code read only | Sr Frontend | Add a bell/link reachable on phones; add a test; verify in browser |
| N-02 | P1 | MISSING-IN-CODE | No `global-error.tsx`; installed docs say `error.js` does not wrap the root layout (`error.md:96`) | Sr Frontend | Add `app/global-error.tsx` (own `<html>`/`<body>`, uses `retry`) |
| N-03 | P2 | UNVERIFIABLE | No `captureException` in any `error.tsx`; server errors go through `onRequestError` (`instrumentation.ts:19`). Whether client boundary errors reach Sentry is not verified | Tech Lead | Confirm in Sentry or capture in `RouteError` |
| N-04 | P2 | CONTRADICTION | `/search` renders two footers (`SearchPageClient.tsx:643` and `SiteFooter`); its "Contact HostelLo" links to `/messages` (`:649`) though `/contact` exists | Sr Frontend | Remove the page footer or merge its links; point Contact to `/contact` |
| N-05 | P2 | DIVERGES (copy) | `LegalPlaceholderPage.tsx:21` yields "The privacy policy have not been published yet" | Sr Frontend | Pass a plural/verb-agreeing label or rephrase |
| N-06 | P2 | needs Founder decision | `owner/analytics/page.tsx:12` admits ADMIN; all other owner pages are OWNER-only (e.g. `owner/page.tsx:18`); no admin nav link to it. API side not checked | Tech Lead | Decide intent; align page and API |
| N-07 | P2 | DIVERGES | Reduced-motion gaps: `WishlistsPage.tsx:97` `animate-pulse`, `ProductHome.tsx:333` `animate-spin` lack `motion-safe` | Sr Frontend | Gate with `motion-safe:` (spinner may stay as essential) |
| N-08 | P2 | DIVERGES | Footer adds 80px bottom padding at <=720px for all roles (`SiteFooter.tsx:15`); only guest/student have the tab bar | Sr Frontend | Make padding role-aware or accept |
| N-09 | P2 | UNDOCUMENTED | `proxy.ts:30-32` comment describes Bearer-token injection with no code behind it | Backend | Delete the stale comment |

## Corrections to the old report (A-001c-1)

C-1 Row 8 "Missing / legal pages unreachable": stale, footer added in `fc808af`. C-2 Row 9 "no loading/error/not-found": stale, same commit family. C-3 Row 6 "no role-matrix test": wrong at `eb7b713` and now. C-4 Row 11 "proxy.ts CSRF/rate-limit": no rate limit exists. C-5 Rows 18-19 "code follows DESIGN.md": false for colour; true for fonts only. C-6 Row 13 "no shared formatter": one exists, under-used. C-7 Rows 24-25 "no e2e": redirect, keyboard and reduced-motion tests exist. C-8 Row 5 "four separate headers / DesktopAccountHeader on 7 pages": now one shared component plus Owner/Admin copies; `DesktopAccountHeader` is on 6 pages.

## Not checked

`npm run build`; Playwright (no e2e run); any runtime or browser behaviour, including N-01 and the footer layout; `ProductHome` and `LoginDialog` internals beyond cited lines; admin sub-page role logic beyond the guard lines; API-side authorization for `/api/owner/analytics`; whether `SYSTEM.md`, `README.md` or `tasks/` quote page, test or component counts affected by this module (out of scope for this task).

## Decisions needed

Founder: accent colour and typography (rows 18-19; spec, DESIGN.md and code disagree, three-way); admin access to Owner Analytics (N-06). Tech Lead: Radix dependencies (row 21).

## Recommended order

1) N-01 and N-02 (P1). 2) Founder decisions above, then update the spec or DESIGN.md. 3) Owner/Admin header consolidation (row 5), `/search` footer (N-04), shared PKR formatter (row 13). 4) Add owner/admin/notifications/404 e2e (row 24). 5) P2 hygiene (N-03, N-05, N-07 to N-09).
