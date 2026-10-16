# Hostello Project Structure

**Last updated:** October 16, 2026
**Verification source:** file-system audit of the current workspace
**Status:** Synchronized with the web app, shared package, Prisma schema, migrations, scripts, and docs.

---

## Repository Overview

Hostello is a web-only hostel booking platform:

- `src/` contains the Next.js 16 web app, API route handlers, services, UI components, and tests.
- `packages/shared/` contains constants, schemas, types, and utilities used by the web app.
- `prisma/` contains the Prisma 7 schema, client, seed, migration workflow docs, and 29 committed migrations.
- `e2e/` contains Playwright tests for auth, homepage, search, owner, and booking flows.
- `docs/superpowers/` contains the design references, earlier implementation specs, and the active project completion plan.

Current counts from the audit:

| Area | Count |
|---|---:|
| Web page files | 58 |
| API route files | 71 |
| Prisma models | 28 |
| Prisma migrations | 29 |
| Vitest unit/integration test files | 122 |
| Playwright E2E specs | 5 |

---

## Root Files

| Path | Purpose |
|---|---|
| `package.json` / `package-lock.json` | Root dependency graph and scripts for web, tests, migrations, build, and hooks. |
| `next.config.ts` | Next.js build/security configuration. |
| `tsconfig.json` | TypeScript config for the web app. |
| `vitest.config.ts` | Vitest config for unit/integration tests. |
| `playwright.config.ts` | Playwright E2E config. |
| `eslint.config.mjs` | ESLint rules. |
| `tailwind.config.js`, `postcss.config.js`, `components.json` | Tailwind/shadcn-style UI configuration. |
| `prisma.config.ts` | Prisma config. |
| `vercel.json` | Vercel deployment config. |
| `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | Sentry initialization through the current Next.js server, browser, and edge hooks. |
| `.env.example`, `.env.sentry.example` | Environment variable templates. |
| `skills-lock.json` | Agent/skill lock metadata. |

---

## Documentation

| Path | Purpose |
|---|---|
| `README.md` | Root orientation — what this is, how to run it, where to look next. Added July 1, 2026. |
| `WEB_APP_PROGRESS.md` | Current implementation progress and open risks. Recreated July 1, 2026 (see below). |
| `SYSTEM.md` | System architecture, data model, APIs, operations, and current technical audit. |
| `DESIGN.md` | Web design system and product UX rules. Recreated September 2026 — see the file. |
| `SENTRY_SETUP.md` | Sentry setup guide. Recreated July 1, 2026 from the actual config files. |
| `prisma/MIGRATIONS.md` | Migration discipline and migration ledger. |
| `.github/VERCEL_SETUP.md` | GitHub Actions/Vercel deployment setup. |
| `docs/superpowers/specs/` | UI/UX optimization design spec. |
| `docs/superpowers/plans/2026-10-05-project-completion-plan.md` | Active production-readiness and project-completion checklist. |

---

## Web App (`src/`)

### App Router

`src/app/` contains public pages, authenticated dashboards, owner/admin surfaces, and route handlers.

Key page groups:

- Public: `/`, `/hostels`, `/hostels/in/[city]`, `/hostels/[slug]`, `/compare`, `/university/[slug]`, `/contact`, `/privacy`, `/terms`, `/report`.
- Auth: `/login`, `/register`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email-sent`.
- Student dashboard: `/dashboard`, `/dashboard/bookings`, `/dashboard/messages`, `/dashboard/notifications`, `/dashboard/price-alerts`, `/dashboard/saved`.
- Owner: `/owner`, `/owner/dashboard`, `/owner/listings`, `/owner/listings/new`, `/owner/listings/[id]/edit`, `/owner/bookings`, `/owner/messages`, `/owner/reviews`, `/owner/analytics`, `/owner/subscription`, `/owner/settings`.
- Admin: `/admin`, `/admin/listings`, `/admin/bookings`, `/admin/reviews`, `/admin/search`, `/admin/verifications`.
- Booking: `/booking/[id]/payment`, `/booking/[id]/confirmation`, `/booking/[id]/review`.

### API Routes

`src/app/api/` currently has 71 route files covering:

- Auth: NextAuth, signup, email verification, password reset, phone OTP, account deletion.
- Hostels: search/list/create, owner listing edits/status, admin detail, availability, favorites, view tracking, and roommate posts/reports.
- Bookings: create/list/detail/status changes.
- Payments: initiate, webhook, gateway callback.
- Conversations/messages.
- Reviews and owner replies.
- In-app notifications.
- Price alerts and unsubscribe.
- Profile and password changes.
- Uploads.
- Owner analytics, subscription, and blocked dates.
- Admin listings/hostels/search/verifications, roommate moderation, payouts, and refunds.
- Cron endpoints and cron health, including abandoned private verification upload cleanup.
- Contact and reports.

### Components

`src/components/` contains:

- `ui/`: reusable primitives such as button, card, dialog, form, input, tabs, slider, sheet, and shared state/empty/recovery primitives.
- `layout/`: public/admin/owner layouts, account menu, notification bell, city selector.
- `hostel/`: hostel cards, filters, booking panel, maps, comparison, gallery, reviews, roommate board, trust summary.
- `booking/`: booking step layout and summary card.
- `dashboard/`: student verification card and review dialog.
- `owner/`: listing wizard and blocked dates manager.
- `admin/`: review drawer, verification client, rejection modal.
- `landing/`: hero search.
- `auth/`: auth card layout.

### Services And Utilities

`src/lib/` contains database, auth, CSRF, rate limiting, search, bookings, hostels, payments, notifications, email/SMS, environment validation, and support utilities.

Notable files:

- `src/proxy.ts` is the active Next.js proxy entry. It handles environment validation and CSRF origin checks.
- `src/lib/auth/config.ts`, `session.ts`, `token-version-cache.ts` contain NextAuth and revocation logic.
- `src/lib/notifications.ts` writes in-app notifications.
- `src/lib/price-alerts.ts` powers scheduled price-drop alerts.
- `src/lib/payment-methods.ts`, `safepay.ts`, `jazzcash.ts`, `easypaisa.ts` power gateway integrations.

---

## Shared Package (`packages/shared/`)

| Path | Purpose |
|---|---|
| `packages/shared/src/constants/` | Shared amenities, university list, and config values. |
| `packages/shared/src/types/` | Shared TypeScript types. |
| `packages/shared/src/validations/` | Shared Zod validation schemas. |
| `packages/shared/src/utils/` | Currency, date, and string helpers. |
| `packages/shared/src/index.ts` | Package exports. |

---

## Database (`prisma/`)

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | Data model with 28 models. |
| `prisma/client.ts` | Prisma client setup. |
| `prisma/seed.ts` | Local seed script. |
| `prisma/MIGRATIONS.md` | Migration discipline and migration ledger. |
| `prisma/migrations/` | 29 committed migration folders plus migration lock. |

Current schema areas include users/auth, hostels, rooms, bookings, reviews, favorites, conversations, price alerts, notifications, cron logs, blocked dates, subscriptions, student verification fields, and roommate finder posts/reports.

---

## Scripts

| Path | Purpose |
|---|---|
| `scripts/check-price-alerts.ts` | Scheduled/manual price-alert checks. |
| `scripts/schedule-cron-jobs.ts` | QStash cron registration. |
| `scripts/setup-typesense.ts` | Typesense collection/index setup. |
| `scripts/verify-typesense-fallback.ts` | Search fallback verification. |
| `scripts/reset-review-stats.ts` | Review aggregate maintenance. |
| `scripts/fix-phantom-reviews.ts` | Review data repair. |
| `scripts/migrate-rename-fix.ts`, `scripts/show-migration-sql.ts`, `scripts/fix-migration-names.sql`, `scripts/One-Time-Migration.ps1` | Migration repair/inspection helpers. |
| `scripts/patch-routes-manifest.mjs` | Post-build Next.js route manifest patch. |

---

## Tests

| Area | Files |
|---|---|
| Unit/integration | `src/**/*.test.ts` and `src/**/*.test.tsx`. |
| E2E | `e2e/auth.spec.ts`, `e2e/homepage.spec.ts`, `e2e/search.spec.ts`, `e2e/owner-flow.spec.ts`, `e2e/booking-flow.spec.ts`. |
| Setup | `e2e/global.setup.ts`, `e2e/global.teardown.ts`, `e2e/fixtures/auth.ts`. |

Primary commands:

```bash
npm run test
npm run e2e
```

---

## Deployment And Operations

| Path | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Pull request checks. |
| `.github/workflows/production.yml` | Production deployment workflow. |
| `.github/workflows/audit.yml` | Audit workflow. |
| `.github/VERCEL_SETUP.md` | Required Vercel secrets and branch protection setup. |
| `graphify-out/` | Generated code graph/report artifacts. |

---

## Git-Ignored Or Generated Areas

These exist locally but are not source-of-truth implementation docs:

- `.next/`
- `node_modules/`
- `test-results/`
- `.code-review-graph/`
- `graphify-out/cache/`
- `tsconfig.tsbuildinfo`
