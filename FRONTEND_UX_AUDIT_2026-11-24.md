# HostelLo Principal Frontend & UX Audit

Prepared November 24, 2026.

## Scope and evidence

This read-only audit combines repository source, specifications, unit/integration tests, linting, and a production build. It does not claim live-browser, real-device, or production verification.

Verified on November 24:
- `npm run typecheck`
- `npm run lint`
- `npm run test -- --run`: 300 test files passed, 2 skipped; 2033 tests passed, 10 skipped
- `npm run test:scripts`: 27 passed
- `npm run docs:check`
- `npm run build`
- `npm run e2e -- --list`: 138 Chromium tests discovered

Browser execution, screenshots, 360/390/768/1280 visual checks, throttled profiles, real-device checks, screen-reader passes, and axe execution remain unverified.

## A. Executive summary

Keep the listings-first information architecture and the current restrained blue system. Keep the server-driven payment state, whole-PKR monthly pricing, reusable date and booking logic, privacy-preserving funnel events, and the strong isolated-E2E guardrails. The first fixes should be evidence work: execute the existing 138 Playwright specs locally against disposable services, add axe to key routes, and establish mobile screenshot baselines. Next, finish keyboard and semantics on the custom date and search controls, especially tab patterns and blocked-date feedback. Replace ambiguous upload failures for phone photos with client-side resize/compress and preserve the current 4 MB server limit. Finish the mobile fixed-layer audit: bottom navigation, sticky headers, and any booking action must share safe-area and focus boundaries. Consolidate the design-source split by making `DESIGN.md` or `globals.css` explicitly authoritative, then remove stale historical statements. Leave live payment methods, API contracts, the 32-model data model, and the no-marketing-homepage direction unchanged.

## B. Capability -> surface matrix

| Capability | Current surface | Status | Decision |
|---|---|---|---|
| Hostel discovery and city landing | `/`, `/search`, `/hostels-in/[city]` | Implemented; city and search surfaces confirmed in source | Keep and deepen university/location discovery only after founder evidence |
| Exact date/room selection | Hostel detail and date calendar | Implemented | Keep; complete accessibility verification |
| Seat holds and owner confirmation | Booking API, booking detail, hostel booking card | Implemented; late-payment behavior specified and tested | Keep |
| Safepay checkout | Booking detail/payment routes and webhook handling | Implemented; fake-provider E2E exists | Keep; no UI change to enable other providers |
| Trips, wishlist, messages, notifications | `/trips`, `/wishlists`, `/messages`, `/notifications` | Implemented | Keep |
| Availability alerts | `/student/availability-alerts`, APIs | Implemented | Keep |
| Price alerts | API/notification infrastructure | Limited or no first-class discovery surface found | Restore one entry point or remove orphan if not founder-approved |
| Roommate finder | `/hostels/[param]/roommates`, APIs | Implemented for signed-in students | Keep if trust/safety policy is approved |
| Safety score | No first-class UI found | Orphaned capability; backend/UI evidence not confirmed | Defer until a data and moderation source of truth exists |
| Verified-student badge | `/profile/verification`, listing and profile surfaces | Implemented | Keep and clarify what the badge means |
| WhatsApp sharing / rich share card | Native share is implemented on listing detail; Open Graph implementation exists | Partial | Keep native share; verify WhatsApp preview and add Open Graph copy tests |
| Semester booking | Date/month stay selection exists, but explicit semester presets were not found | Partial | Defer presets until rent/semester semantics are approved |
| University landing pages | City landing exists; a dedicated university index was not confirmed | Orphan/partial | Defer; do not invent a university taxonomy |
| Price comparison | Search filters and monthly room prices exist; a separate comparison view was not found | Partial | Defer a comparison table until users demonstrate need |
| Owner listing, room and blocked-date management | `/owner/listings/*`, `/owner/listings/[id]/blocked-dates` | Implemented | Keep |
| Owner queue, reviews, analytics, earnings | `/owner/bookings`, `/owner/reviews`, `/owner/analytics`, `/owner/earnings` | Implemented | Keep; improve analytics text alternatives |
| Admin moderation, verifications, refunds, payouts | `/admin/*` | Implemented | Keep |

## C. Decision register

| ID | Verdict | Surface | Evidence | Why | Effort | Risk | Priority | Confidence | How we’ll know it worked |
|---|---|---|---|---|---|---|---:|---|---|
| D-01 | KEEP | Booking/payment | [BookingDetailPage.tsx](/C:/Projects/Personal/hostello/src/components/student/BookingDetailPage.tsx:100) separates redirect notices and polls server state; [route.ts](/C:/Projects/Personal/hostello/src/app/api/payment/initiate/route.ts:120) uses persisted trackers and compare-and-set; payment tests cover failed, retry, outage and abandoned states | It avoids trusting redirect parameters and duplicate payments | S | Low | P0 | High | No false PAID/FAILED inference in Playwright or unit cases; retry remains a server-confirmed action |
| D-02 | CHANGE | Student date calendar | [HostelDateCalendar.tsx](/C:/Projects/Personal/hostello/src/components/hostel-detail/HostelDateCalendar.tsx:45) uses a manually disabled 7-column grid | Monthly range behavior is explicit, but keyboard semantics and blocked/unavailable server data need browser verification | M | Medium | P1 | Medium | Keyboard-only move-in/move-out; clear labels; no inaccessible disabled date; 360 px reflow |
| D-03 | CHANGE | Search date tabs | [SearchDatePicker.tsx](/C:/Projects/Personal/hostello/src/components/home/SearchDatePicker.tsx:42) implements `tablist`/`tab` manually | Manual ARIA patterns need arrow-key navigation and panel association before they should be trusted | S | Medium | P1 | Medium | Tab arrow keys, linked tabpanels, selected state and Escape pass browser checks |
| D-04 | CHANGE | Listing photos | [ListingPhotosField.tsx](/C:/Projects/Personal/hostello/src/components/owner/ListingPhotosField.tsx:12) rejects files over 4 MB; [route.ts](/C:/Projects/Personal/hostello/src/app/api/upload/route.ts:32) caps the multipart request at 4.4 million bytes; Sharp sanitizes server-side | Raw phone photos often exceed the limit and are not resized client-side, creating avoidable owner friction | M | Medium | P1 | High | A 12 MP JPEG is resized/compressed before upload; progress/retry is visible; an oversized result receives an actionable error |
| D-05 | KEEP | Upload security | [route.ts](/C:/Projects/Personal/hostello/src/app/api/upload/route.ts:100) authenticates and role-gates owners/admins; [bounded-json.ts](/C:/Projects/Personal/hostello/src/lib/bounded-json.ts:66) bounds multipart reads; [public-listing-image.ts](/C:/Projects/Personal/hostello/src/lib/public-listing-image.ts:28) strips metadata and re-encodes | Preserves trust and limits request abuse without new dependencies | S | Low | P0 | High | Existing upload tests plus a real 4 MB boundary test pass |
| D-06 | CHANGE | Owner analytics | [AnalyticsPage.tsx](/C:/Projects/Personal/hostello/src/components/owner/AnalyticsPage.tsx:100) renders a CSS width bar but no table or explicit text chart structure | Metrics and labels are present, but a chart is not sufficiently meaningful without a data alternative | S | Medium | P1 | Medium | Screen reader and narrow-width users receive the same monthly bookings/revenue values |
| D-07 | CHANGE | Auth dialogs | [LoginDialog.tsx](/C:/Projects/Personal/hostello/src/components/auth/LoginDialog.tsx:3) uses Radix; search and gallery use native `<dialog>` | Primitive coverage is inconsistent, and browser behavior remains unverified at direct URLs, refresh and back navigation | M | Medium | P1 | Medium | Direct, refresh, back, Escape, focus return and callback URL tests pass with a browser |
| D-08 | KEEP | Native dialogs for search/gallery | [HostelSearchBar.tsx](/C:/Projects/Personal/hostello/src/components/home/HostelSearchBar.tsx:170) and [HostelDetailGallery.tsx](/C:/Projects/Personal/hostello/src/components/hostel-detail/HostelDetailGallery.tsx:346) use native modal behavior | Native dialog supplies focus containment and Escape more reliably than a hand-written trap | S | Low | P2 | Medium | No need to replace unless browser evidence shows a real defect |
| D-09 | CHANGE | Mobile fixed layers | [MobileTabNavigation.tsx](/C:/Projects/Personal/hostello/src/components/layout/MobileTabNavigation.tsx:26) includes a safe-area inset; detail has bottom padding; sticky booking is desktop-only | Evidence exists for several surfaces, but cross-page collisions and focus obscuring are not yet browser-verified | S | Medium | P1 | Medium | 360/390 and 200% zoom show no hidden focused control or overlapping action |
| D-10 | KEEP | Token and CSS foundation | [globals.css](/C:/Projects/Personal/hostello/src/app/globals.css:4) exposes semantic Tailwind tokens and adds a stronger field edge | The current source addresses the known font-size/type drift and field contrast | M | Medium | P1 | High | Guard prevents default-palette utilities and inline bypasses; field edge is used consistently |
| D-11 | CHANGE | Design documentation | [layout.tsx](/C:/Projects/Personal/hostello/src/app/layout.tsx:12) loads Inter; [globals.css](/C:/Projects/Personal/hostello/src/app/globals.css:22) is the runtime palette; [DESIGN.md](/C:/Projects/Personal/hostello/DESIGN.md:1) conflicts with historical notes | The runtime and two documents do not give the team one clear source of truth | S | Medium | P1 | High | One authored design document links to or is generated from the runtime tokens |
| D-12 | KEEP | Privacy funnel analytics | [events.ts](/C:/Projects/Personal/hostello/src/lib/analytics/events.ts:14), [client.ts](/C:/Projects/Personal/hostello/src/lib/analytics/client.ts:1), and [route.ts](/C:/Projects/Personal/hostello/src/app/api/events/route.ts:1) use anonymous tab/session IDs and DNT/GPC | It gives J1-J2 measurement without the cost or tracking weight of a package | S | Low | P1 | High | A funnel report shows J1->J2 drop-off and ignores opted-out visitors |
| D-13 | CHANGE | Preview smoke test | [.github/workflows/ci.yml](/C:/Projects/Personal/hostello/.github/workflows/ci.yml:220) only calls the hostel search API | API-only smoke tests can pass while the core UI is broken or inaccessible | S | Medium | P1 | High | Preview smoke covers search-to-detail and sign-in redirect at phone width |
| D-14 | KEEP | Route error coverage | [global-error.tsx](/C:/Projects/Personal/hostello/src/app/global-error.tsx:1), [error.tsx](/C:/Projects/Personal/hostello/src/app/error.tsx:1), [not-found.tsx](/C:/Projects/Personal/hostello/src/app/not-found.tsx:1), and route-specific examples exist | It covers global, route, loading and not-found states with no proven gap found | S | Low | P2 | High | Browser checks include route-specific retry and loading |
| D-15 | REMOVE | Stale design and migration documents | Historical statements in `WEB_APP_PROGRESS.md`, `PROJECT_STRUCTURE.md`, and old Tailwind plans | Stale claims blur shipped vs planned capability and create duplicate decisions | S | Medium | P1 | High | Docs check reports no contradiction between current status and design source |

## D. Design-system proposal

### Runtime

- Keep the runtime blue palette: canvas `#f6f8fb`, surface `#ffffff`, surface-muted `#f1f5f9`, ink `#0f172a`, muted `#586579`, line `#e2e8f0`, strong line `#cbd5e1`, brand `#2563eb`, brand-dark `#1d4ed8`, brand-soft `#e0e7ff`, danger `#c13515`, warning ink `#583c13`, warning surface `#fbf4e6`.
- Change selected text from brand blue to brand-dark. The existing `#2563eb` on `#e0e7ff` is below the 4.5:1 body-text threshold.
- Do not use warm `#f59e0b` for text or as the only status carrier.
- Keep the field border `#7d8ba1` as a semantic `--control-line` token instead of an inline global override. Decorative card borders may remain `--line`.
- Keep a light-only theme until a dark-theme implementation is actually specified. No runtime dark-mode surface is confirmed.
- Keep 4 px spacing: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`. Keep 8 px control, 12 px card and 14 px dialog radii.
- Keep Inter for headings and emphasized values and the system stack for body copy, matching the runtime.

### Primitives

Keep Radix for Dialog and Dropdown Menu. Keep native `<dialog>` where it already works as a mobile/search/lightbox primitive. Use native form controls and custom calendar buttons instead of adding a component dependency. The small missing primitive set is: tabs, toast/status announcement, tooltip, accordion and switch. Add only when a real repeated use case exists; do not create wrappers with no behavior.

Tab requirements: roving focus, arrow/Home/End keys, `aria-controls`, one tabpanel with matching `id`, and no `role=tab` on a control with no keyboard behavior.

### Single source of truth

- Make `src/app/globals.css` the implementation source.
- Make `DESIGN.md` a concise authored reference that imports or mirrors the exact tokens and component decisions, but not competing numbers.
- Add a documentation guard that compares `DESIGN.md` semantic tokens with `globals.css`, and remove the historical Tailwind migration map after migration is complete.

## E. Roadmap

### Slice 1: Prove the critical journeys (max 2 weeks)

Acceptance criteria:
- Run all 138 discovered Playwright tests against the isolated local target; report any skipped or unrun spec.
- Add axe checks to `/`, `/search`, `/hostels/[param]`, `/login`, `/signup`, `/owner/listings/new`, `/owner/analytics`, `/trips`, and `/admin/verifications`.
- Complete mobile screenshots at 360 x 800 and 390 x 844 plus 768 and 1280.
- Run J2 with keyboard only and a 200% zoom/reflow pass.
- Record Core Web Vitals on a Slow 4G + 4x CPU profile for search and hostel detail.

### Slice 2: Close mobile and upload friction (max 2 weeks)

Acceptance criteria:
- Phone photos are resized/compressed before multipart upload; 12 MP JPEG and PNG fixtures complete without server-body errors.
- Upload progress, per-file success/failure and retry remain visible.
- Search and date tabs expose ARIA relationships and complete keyboard behavior.
- Fixed header, bottom tab, and booking actions pass overlap/focus checks at 360 and 390 px.
- No horizontal overflow at 360 px or at 200% zoom.

### Slice 3: Finish analytics and system consistency (max 2 weeks)

Acceptance criteria:
- J1 to J2 funnel can distinguish search, hostel view, booking start, booking request, payment start and payment confirmed.
- Owner analytics expose monthly values to assistive technology and narrow viewports.
- Preview smoke test executes search to detail and protected-route redirect in addition to `/api/hostels`.
- `DESIGN.md`, migration map and historical progress docs have an explicit status.
- Stale duplicate components or CSS are removed only after source search and tests prove they are unused.

## F. Measurement plan

- Accessibility: add axe-core only if the dependency is approved; run it on the nine key routes listed above and fail CI on serious/critical violations.
- Screenshots: Playwright baselines at 360 x 800, 390 x 844 and 1280 x 800; include a tablet 768 x 1024 baseline if the existing suite does not cover it.
- Performance: throttle Fast? Use the Playwright Slow 4G profile with 4x CPU for `/`, `/search`, and `/hostels/[param]`; budgets are decided from baseline medians, but suggested initial targets are LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 on throttled mid-range-class hardware.
- Analytics: keep anonymous session events and DNT/GPC; add no cookies or persistent cross-session IDs. Funnel conversion uses `FUNNEL_STEPS`, validated in [events.ts](/C:/Projects/Personal/hostello/src/lib/analytics/events.ts:36).
- Funnel views: search -> listing view -> booking start -> booking request -> payment start -> payment confirmed, reported as counts and step conversion.
- Web Vitals: send only aggregate route and metric labels to Sentry or the first-party event sink; do not add free-form page text or user identifiers.

## G. Open questions for the founder

1. Is `DESIGN.md` the authored source of truth, or should `globals.css` remain the source and `DESIGN.md` become a generated summary?
2. Is dark mode intentionally out of scope, or is a light/dark implementation still required?
3. Should exact monthly stay, deposit and utility fees remain separate pricing fields rather than a semester preset?
4. Is a university landing page worth the content and moderation cost without first validating search demand?
5. What data and moderation process makes a safety score trustworthy enough to show publicly?
6. What evidence is required before changing phone OTP from verification to sign-in?
7. What is the approved refund, abandoned-payment and late-payment policy for owner confirmation and retries?
8. Which browsers and Android WebViews must be supported once real analytics are available?
9. Should owner analytics retain a CSS-bar implementation or use a text/data table as the first release?
10. Which orphaned capabilities, such as the explicit price-comparison or university surfaces, should be restored, and which should be removed?

## Verification gaps

The source shows strong unit, API, and isolated payment-test guardrails, and the build/lint/type suite passes. The following were not checked:
- A live-browser run of 138 E2E specs
- 360/390/768/1280 and 200% zoom visual checks
- Slow 4G and 4x CPU Core Web Vitals
- Screen-reader passes
- Real-device and real-Safepay behavior
- Next.js bundled routing/caching docs: the current installed package did not expose the expected `node_modules/next/dist/docs` files in this workspace
- Live Vercel Preview, analytics and browser support

Skipped: live provider calls, shared databases, migrations, screenshots, and production configuration.

Risk: browser/runtime claims need browser evidence; repository checks should not be presented as proof of visual or assistive-technology correctness.
