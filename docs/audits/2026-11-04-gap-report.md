# HostelLo Documentation-vs-Code Gap Report

**Audit date:** 2026-11-04
**Base commit:** `d2f1b06fcd4e2f6e258b37a2731d494ff1519640`
**Auditor:** Documentation-vs-Code Auditor
**Status:** Partial audit; do not treat as a full release sign-off.

## 1. Verdict

The documentation cannot be relied on as a current implementation inventory. Several top-level guides still describe an API-only product with removed pages and E2E infrastructure, while the repository now contains 36 pages, a substantial UI, and a configured Playwright suite. Some current code facts are accurate: the generated route/model/migration counts in `SYSTEM.md` match the checker, the schema validates, and several documented payment safeguards exist. The current docs checker nevertheless fails on missing linked documents, and the checked-in CI runs it as a blocking gate. The eight capability-map modules are at mixed implementation stages; date-aware room inventory and date-based availability alerts are not implemented. Current local typecheck and Vitest runs also fail. No live provider, production database, or GitHub/Vercel console state was verified.

## 2. Summary table

| Classification | Count |
|---|---:|
| STALE-DOC | 5 |
| MISSING-IN-CODE | 4 |
| CONTRADICTION | 2 |
| UNDOCUMENTED | 0 |
| FALSE-STATUS | 0 |
| UNVERIFIABLE findings | 0 |
| **Total evidence-backed findings** | **11** |

| Severity | Count |
|---|---:|
| P0 | 2 |
| P1 | 8 |
| P2 | 1 |

Unverifiable operational matters are listed separately in section 4, rather than presented as repository findings.

## 3. Findings

| ID | Severity | Classification | Claim and reality (evidence) | Who should fix | Suggested fix |
|---|---|---|---|---|---|
| **G-001** | P1 | STALE-DOC | `README.md:4-6,35,52-54`, `SYSTEM.md:58`, `PROJECT_STRUCTURE.md:3-24`, `WEB_APP_PROGRESS.md:3-10`, `.github/VERCEL_SETUP.md:3-6`, `ROOM-BOOKING-CAPABILITY-MAP.md:3-7`, root `SPEC-room-inventory.md` status, and `SENTRY_SETUP.md:44-46` say the first-party UI and/or E2E infrastructure were removed. Code has 36 `page.tsx` files, 121 `.tsx` component files, and `src/app/page.tsx` renders `ProductHome`. `playwright.config.ts` exists with seven test files under `e2e/`; `npm run e2e -- --list` exited 0 and enumerated the suite. `SYSTEM.md` generated facts and code agree on 36 pages and 74 API route files. | Docs owner / Founder | Replace “API-only/UI removed/E2E removed” with: “The Next.js app has first-party pages and API routes. Playwright is configured in `playwright.config.ts` with tests in `e2e/`; runtime E2E verification remains separate.” Refresh the dated room-inventory/UI status and Sentry note. |
| **G-002** | P1 | CONTRADICTION | `SYSTEM.md:6,37-42,651` has a generated count of 202 Vitest files but says “100 Vitest files with 686 tests, all passing.” `PROJECT_STRUCTURE.md:3-24,160` and `WEB_APP_PROGRESS.md:3-10` still state 96 files / 657 passing tests. Current inventory has 202 Vitest files under `src`; `npm run test -- --run` discovered 203 test files and 1,319 tests, with 3 failed suites and 2 failed assertions. It is not a passing suite. Git history shows `SYSTEM.md` verified date October 24, while the schema was changed October 26, the home page October 27, and migrations November 3 (`git log -1` per path). | Docs owner / QA | Refresh the “verified against code” date and replace stale prose counts/status with the current run result; keep historical counts clearly dated. |
| **G-003** | P1 | STALE-DOC | `SYSTEM.md:22-23` links to `docs/SECURITY-CONTROLS.md` and `docs/ENGINEERING-PRINCIPLES.md`, neither of which exists. `README.md:64-65` references missing `docs/CI-CD-GUIDE.md` and `docs/API-MASTERY-GUIDE.md`; `PROJECT_STRUCTURE.md` lists several root-level runbooks that are also absent (the `docs/runbooks/` directory has zero files). `npm run docs:check` failed with four broken-link errors for the two missing `SYSTEM.md` links. `.github/workflows/ci.yml:51,69` and `production.yml:43` run this check in blocking jobs, so this repository state makes those workflow gates fail before any remote console setting is considered. The checker validates `SYSTEM.md`, `CHANGELOG.md`, and docs links, but not the README links. | Docs owner / DevOps | Restore the intended documents at the linked paths, or remove/update each link and the project-structure index; rerun `npm run docs:check` before relying on CI. |
| **G-004** | P1 | STALE-DOC | `prisma/MIGRATIONS.md:86` says there are 30 migrations and its ledger ends at `20261017151800`. The repository has 32 migration directories. The missing ledger entries are `20261026000000_add_host_response_summaries` and `20261102000000_backfill_hostel_cancellation_policy`; the latter is present in the filesystem and was the latest migration at audit time. `SYSTEM.md`’s generated count of 32 agrees with the filesystem. | Docs owner / Backend | Add both migration rows and update the audited date and count in `prisma/MIGRATIONS.md`. |
| **G-005** | **P0** | MISSING-IN-CODE | `SPEC-room-availability.md:11-21,47-53` requires date-range seat allocation, a mandatory `roomId`, blocked-date enforcement during booking, and one authoritative inventory model. `src/lib/booking-service.ts:35,53-70,84-114` accepts an omitted `roomId`, checks and decrements the global `Room.available` counter, and stores a nullable `roomId`. `prisma/schema.prisma:372-382` retains `available` and `version`; there is no seat-hold model. `src/app/api/hostels/[param]/availability/route.ts` returns a 12-month hostel-level occupancy summary, not exact room seats for the selected stay. The code therefore matches the open risk R-01, not the new in-scope capability spec. This inventory model can misrepresent availability across dates and can permanently consume seats after stays complete. | Founder decision, then Tech Lead / Backend | Resolve D-4 and the legacy-booking migration approach first; then implement a single date-aware inventory authority and real-PostgreSQL concurrency tests before enabling booking volume. |
| **G-006** | P1 | MISSING-IN-CODE | `HOSTELLO-CAPABILITY-MAP.md` puts `availability-alerts` in scope and `SPEC-availability-alerts.md:5-30,44-64` requires HOSTEL/SEARCH date-and-guest alerts, immediate match evaluation, transition-based notification, and pause/resume/edit/delete. Code exposes only target-price alerts: `src/app/api/price-alerts/route.ts:11-13` requires `hostelId` and `targetPrice`; `PriceAlert` in `prisma/schema.prisma:656-683` has no date, guest, search criteria, or match state; `src/lib/price-alerts.ts` checks price drops. No availability-alert model or matching API/service was found. | Founder / Product, then Backend and Frontend | Either explicitly defer the module in the capability map/spec and work plan, or implement the two alert types and their date-aware matching contract. |
| **G-007** | P1 | MISSING-IN-CODE | Owner create/edit pages are present and the room-inventory spec requires them, but `src/app/owner/listings/new/page.tsx:3,39` imports and renders a named `ListingForm` from `@/components/owner/ListingForm`. That module exports form data/validation helpers, not the React component; a second `listingForm.ts` differs only by casing. `npm run typecheck` reports missing `ListingForm`/`ListingSubmitted` exports and TS1149 case-collision errors in both pages and the test. The full Vitest run reports the ListingForm suite with 0 tests and failures in both new/edit page rendering tests. | Frontend | Fix the component import/export and case-colliding module layout; rerun typecheck and focused owner-form tests before considering owner-workspace screens usable. |
| **G-008** | P1 | STALE-DOC | `SYSTEM.md:729` (R-09) says the full listed set of destinations is removed, including `/login`, `/reset-password`, `/bookings/{id}`, `/owner/bookings`, `/privacy`, and `/terms`. Current route files include all of those paths, so the risk row overstates the dead-link set. Some listed paths remain missing, so R-09 should not simply be closed: `/help`, `/dashboard/hostels/...`, and `/booking/{id}/confirmation` have no matching page. The current home page exists for `/?payment=error`, but its handling of the query string was not browser-tested. | Docs owner / Founder | Replace R-09’s blanket list with an exact route-by-route list verified against current page files and emitted URLs; retain only links that are still dead. |
| **G-009** | P1 | MISSING-IN-CODE | Current email templates emit destinations with no corresponding page: `src/lib/email-templates/booking.ts:166` links `/help`; `listing-status.ts:41,45,87` links `/dashboard/hostels/...` and `/help`; `welcome.ts:37,45` links `/dashboard/hostels/new` and `/help`. The repository has `/contact`, `/owner/listings/new`, and owner listing edit routes, but no `/help` or `/dashboard/hostels` page. The fact that several other R-09 paths have returned does not repair these emitted links. | Backend/Integrations with Frontend | Retarget templates to existing supported pages (for example `/contact`, `/owner/listings/new`, and the verified owner listing edit route) or implement the advertised routes. |
| **G-010** | **P0** | STALE-DOC | `SYSTEM.md:329` and §8.1 describe a successful payment after cancellation as a `CANCELLED` + `PAID` booking for manual refund review. The code has two materially different paths. The abandoned-payment cron sets `CANCELLED` + `FAILED` (`src/app/api/cron/cancel-abandoned-payments/route.ts:54`); a later success is rejected because the webhook requires `paymentStatus === "PENDING"` (`src/app/api/payment/webhook/route.ts:412-418`) and is recorded as reconciliation-required. For a booking cancelled while unpaid, the cancel route writes `cancellationRefundAmount: 0` (`src/app/api/bookings/[id]/route.ts:202`); the webhook accepts `CANCELLED` + `PENDING`, sets payment to `PAID`, and does not replace that zero (`payment/webhook/route.ts:420-487`). `src/lib/refunds.ts:42-46` then computes zero refundable funds and rejects the refund; `health/payments` excludes `refundState: NONE` with amount zero from `refundIssues` (`src/app/api/health/payments/route.ts:51-54`). These paths are also described in `SPEC-late-payment.md` (design-only; Founder recommendation is still pending human-owner confirmation). | Founder decision; Tech Lead / Backend and Docs owner | Correct §8.1 to distinguish both cancelled-payment paths and the webhook/cron race; obtain an explicit late-payment policy decision before implementing a refund/reinstatement change. Treat the unrefundable path as a P0 operational risk until resolved. |
| **G-011** | P2 | CONTRADICTION | `SYSTEM.md:435` documents `/api/auth/email-otp` as a sign-in-code route, and the provider is configured in `src/lib/auth/config.ts:82-85,134-135`. The login UI exposes “Use one-time code” (`src/components/auth/LoginDialog.tsx:464`). But `SYSTEM.md:469` summarizes sign-in as only email/password plus optional Google, omitting the configured and user-visible email-code method. Google visibility is correctly conditional in `src/app/login/page.tsx:31-34`; phone OTP remains a separate verification flow. | Product / Docs owner | Add email one-time-code sign-in to the §7 method summary; preserve the distinction between email sign-in codes and phone-number verification. |

### Capability-map module status

Status reflects repository evidence, not a claim that every acceptance criterion or runtime path was tested.

| Module | Status | Evidence and criteria disposition |
|---|---|---|
| `web-foundation` | Partial | Root home, login/signup/recovery, profile/legal pages, shared headers/footers, and role-oriented shells exist. The product home loads hostel listings; no browser accessibility, reduced-motion, or responsive acceptance pass was run. See G-001 and G-007. |
| `room-inventory` | Partial | Owner listing create/edit paths and room-related components exist, but the form import/export collision breaks typecheck and form tests. Stable-ID preservation, atomic conflict handling, and real-Postgres mutation behavior were not verified. See G-007. |
| `room-availability` | Missing against spec | Current booking authority is the global room counter; room selection is optional and availability reads are hostel/month aggregates. Required per-date holds, mandatory room selection, and a shared authoritative date-range model are absent. See G-005. |
| `notification-center` | Partial | `/notifications`, paginated notification API, unread count, read-all, individual read, and delete endpoints exist. The full role-navigation, safe-destination, error-state, and browser behavior criteria were not exercised. |
| `student-marketplace` | Partial | Listings-first home, search/detail/account pages, booking/payment routes, and related services exist. Exact room/date availability and booking conflict behavior required by the spec are absent; dead email destinations remain. See G-005 and G-009. |
| `owner-workspace` | Partial | Owner dashboard, booking, earnings, review, subscription, listing, and blocked-date surfaces exist. Listing create/edit form does not currently typecheck or render in its targeted tests, and date-aware capacity/block enforcement is absent. See G-005 and G-007. |
| `admin-console` | Partial | Admin overview, listing, verification, roommate moderation, refunds, payouts, payment events, and search-sync pages/routes exist. No complete workflow, sensitive-data browser review, or end-to-end authorization pass was run. |
| `availability-alerts` | Missing | Current alert implementation is price-drop based, not date-and-guest availability matching. No HOSTEL/SEARCH criteria or availability transition state was found. See G-006. |

## 4. Unverifiable items and who must confirm

- **GitHub environment and branch protection (Founder/DevOps):** whether `production` has required reviewers, whether the stated Neon secrets/variables exist, and whether CI or production has ever completed successfully. Workflow YAML cannot establish console state. `production.yml` itself says the environment has no approval until reviewers are configured.
- **External provider readiness (Founder/Integrations):** Safepay sandbox merchant configuration, real webhook/refund behavior, QStash signing/retry setup, Resend/Twilio/R2/Typesense credentials and account settings. No secret values were read, printed, or recorded; no provider was contacted.
- **Production data and recovery (Founder/Tech Lead):** migration application state, Neon snapshot/PITR retention, restore readiness, production URLs, and live data consistency.
- **Real database concurrency (Tech Lead/Backend/QA):** the local suite was not run against PostgreSQL. No production or shared database was touched.
- **Financial, legal, and privacy decisions (Founder/human owner and qualified adviser):** payout custody/timing and fees (D-3), late-payment policy (G-010), verification/document retention and bank-data encryption (D-6), and whether the current topology is the final same-origin client choice (D-1).
- **GitHub PR state (Founder):** `CHANGELOG.md` says B-001 is PR-pending; local files alone do not prove the current remote PR state.

## 5. Safe to rely on

- At this checkout, the generated `SYSTEM.md` fact block matches `scripts/check-docs.mjs`: 36 pages, 74 API route files, 29 Prisma models, 32 migrations, 202 test files under `src`, and 7 cron jobs/routes. The checker verifies route-path presence, not the documented HTTP methods, authorization levels, or behavior. This does not make the other prose current.
- `npx prisma validate` succeeds on the current schema.
- The home route renders `ProductHome`, which loads hostel listings; this supports the listings-first product rule. No marketing-only root page was found.
- Credentials and email-code sign-in are configured; Google is enabled only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. Phone OTP is exposed through phone-verification routes rather than the sign-in provider.
- Current code contains the B-001 refund compare-and-set (pins total, approved refund amount, and refunded amount), append-only refund audit writes, and the B-006 constant-time secret comparison in the payment webhook and payment-health route. These code facts do not establish sandbox correctness.
- Current workflow YAML uses `.nvmrc`, includes a production snapshot step before migration, and runs docs checks, typecheck, unit tests, and lint. It does not establish that the GitHub environment approval or snapshot settings are configured.
- Playwright configuration and seven E2E spec files exist. Only test discovery was run; browser behavior remains unverified.

## 6. Recommended order of fixes and Founder decisions

1. **Founder decisions first:** approve a late-payment policy (G-010 / D-5-adjacent money handling), settle the room-inventory model and legacy-booking transition (D-4), and confirm payout timing/custody and accounting (D-3). Do not clear the application for real transaction volume while the P0 payment and inventory states remain.
2. **Restore a usable quality gate:** fix missing documentation links (G-003), then repair the owner form module/import collision (G-007). Re-run `npm run docs:check`, `npm run typecheck`, targeted owner tests, and the full suite.
3. **Implement and verify money/inventory decisions:** handle cancelled/late payment states so they remain visible and resolvable; implement date-aware capacity with real PostgreSQL parallel-booking, cancellation, expiry, blocked-date, and checkout tests (G-005, G-010).
4. **Repair user journeys and scope:** retarget dead template links (G-009); decide whether availability alerts ship now or are explicitly deferred (G-006).
5. **Refresh documentation:** update UI/E2E status, test counts and verification date (G-001/G-002), correct R-09’s route list (G-008), synchronize the migration ledger (G-004), and document email-code sign-in (G-011).
6. **Before release:** confirm GitHub environment reviewers and Neon snapshot settings, run the actual CI workflow, exercise Playwright in a browser, complete a Safepay sandbox payment/refund/retry round trip, and perform a restore rehearsal.

**Substantive Founder decision needed: Yes.** Payout custody/timing and late-payment resolution affect real money; room inventory affects whether bookings can safely be accepted. Availability-alert scope also needs an explicit ship/defer decision. This audit does not make those decisions.

## Checks run and scope not checked

**Commands/checks run**

- `git rev-parse HEAD` → `d2f1b06fcd4e2f6e258b37a2731d494ff1519640`.
- `npm run typecheck` → failed with missing `ListingForm` / `ListingSubmitted` exports and TS1149 case-collision errors in owner listing pages/tests.
- `npm run lint` → passed (exit 0).
- `npm run test -- --run` → failed: 3 failed files, 200 passed; 2 failed tests, 1,317 passed (1,319 total).
- `npx prisma validate` → passed: schema valid.
- `npm run docs:check` → failed with four broken links in `SYSTEM.md` (two references each to the missing security-controls and engineering-principles docs); the fact, route, cron, and env-variable checks reported no other problems.
- `npm run test:scripts` → passed, 23 tests.
- `npm run e2e -- --list` → passed discovery only; browser tests were not run.
- Direct file inventory, targeted searches, `git log` per relevant paths, and code reads were used for the evidence above.

**Not checked / limits**

- This was not a line-by-line audit of every Markdown file, dated visual design spec, or every implementation plan. The eight capability-map module specs and core current architecture/product/deployment/migration docs were reviewed; the six dated visual specs, Tailwind specs, most plans, and the remainder of the 35-file `docs/` corpus were not fully reconciled.
- No production build was run because it writes generated build output; no `npm ci`/dependency install was run; no live provider, external CI, database, or deployment call was made.
- E2E discovery was checked, but no browser session or visual/responsive/accessibility test was performed.
- Authentication, CORS/CSRF, rate limits, upload controls, webhook and refund code, payout encryption references, and selected risk-register status claims were inspected. This was not a full security audit or exhaustive authorization review of every route.
- No source file, schema, migration, workflow, dependency manifest, or existing documentation was changed. This report is the only created file.
