# Handoff F-001a: Frontend -> Tech Lead (copy to Auditor)

## Migrated to the shared SiteHeader
- Home / listings and /login (BrowseHeader now composes SiteHeader with the category tabs in its `center` slot)
- /bookings/[id]
- /signup, /forgot-password, /reset-password, /contact (AuthPageShell)
- /terms, /privacy (LegalPlaceholderPage)
- /trips, /wishlists, /profile, /profile/verification, /notifications, /hostels/[param]/roommates (DesktopAccountHeader is now a thin wrapper over SiteHeader; markup unchanged)

## Not migrated
- /hostels/[param] (hostel detail): its header has a bespoke grid with an inline destination search form and page-specific CSS hooks (`hostel-detail-header-inner`). Folding it into SiteHeader without restyling needs an `innerClassName` or slot API on SiteHeader. Left for the next batch; the footer and state pages already apply there.
- /search: header not read in this task.
- Owner and admin pages keep OwnerPageHeader / AdminPageHeader (not trivial: they stay visible at every width).
- Deviation from step 2: the header is one shared component composed by pages, not a root or route-group layout header. The home page header owns client state (category tabs), so a layout-level header would need that state lifted out first. Footer IS in the root layout.

## State pages
- Root: loading, error, not-found. Segments: /search (loading, error), /hostels/[param] (loading, error, not-found), /bookings/[id] (loading, error, not-found).
- Not added: global-error.tsx (errors in the root layout itself still show the framework default).
- Next 16.4 passes `retry` to error.tsx, not `reset` (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md). Anyone adding error.tsx should use `retry`.

## Findings for the Auditor
- /help has no page, and three email templates still link to it (src/lib/email-templates/welcome.ts:45, listing-status.ts:45, booking.ts:166). Not touched here (outside this task); the footer does not link to /help.
- Audit row 5 said DesktopAccountHeader is used by 7 pages; in code it is 6 pages plus the booking page I switched to SiteHeader.

## Caveats
- Footer sits in the root layout, so owner/admin pages also show it. It adds bottom padding on phones to clear the fixed tab bar; owners/admins (no tab bar) get that extra space too.
- Strings for header-adjacent UI live in src/lib/site-copy.ts for later Urdu work; older components still hard-code theirs.
- 360px: NOT verified in a browser (none available in this environment). Checked only by reading the classes: footer wraps (flex-wrap), link targets are min-h-11. Please run the Playwright widths before merge.
- No API, payment or schema changes. node scripts/check-docs.mjs --write refreshed the facts table in SYSTEM.md (test-file count).
