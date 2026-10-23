# Hostello Project Structure

**Last updated:** October 19, 2026
**Verification source:** current workspace
**Status:** API-only Next.js application; former pages and UI components have
been removed for a future redesign.

---

## Repository Overview

- `src/app/api/` contains the Next.js Route Handlers.
- `src/lib/` contains backend services, auth, validation, integrations, and
  shared server utilities.
- `src/proxy.ts` applies environment validation and API CSRF checks.
- `packages/shared/` contains shared constants, schemas, types, and utilities.
- `prisma/` contains the Prisma schema, client setup, seed code, migration
  documentation, and 30 migration directories.
- `scripts/` contains deployment, migration, cron, and maintenance scripts.
- `docs/` and `.github/` contain operational guides and workflow
  documentation.

There are currently 71 API route files, 0 page files, 0 UI component files,
and 96 Vitest test files. The most recent source test run passed 657 tests.
Playwright configuration and E2E files have been removed.

---

## Root Files

| Path | Purpose |
|---|---|
| `package.json` / `package-lock.json` | Root dependencies and scripts. The `e2e` script remains, but the Playwright config and test files are gone. |
| `next.config.ts` | Next.js build, image, and security-header configuration. |
| `tsconfig.json` | TypeScript configuration. |
| `vitest.config.ts` | Vitest configuration and aliases. |
| `eslint.config.mjs` | ESLint configuration. |
| `tailwind.config.js`, `postcss.config.js`, `components.json` | Legacy UI tooling configuration; no app UI currently consumes it. |
| `prisma.config.ts` | Prisma configuration. |
| `vercel.json`, `scripts/vercel-build.mjs` | Vercel custom build command. |
| `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | Sentry initialization for Next.js runtimes. |
| `.env.example`, `.env.sentry.example` | Environment variable templates. |
| `skills-lock.json` | Agent/skill lock metadata. |

---

## Documentation

| Path | Purpose |
|---|---|
| `README.md` | Project overview, setup, commands, and documentation index. |
| `SYSTEM.md` | Architecture, data model, API surface, security, and current audit. |
| `PROJECT_STRUCTURE.md` | This repository map. |
| `WEB_APP_PROGRESS.md` | Current API-only status and historical UI implementation notes. |
| `DESIGN.md` | Historical third-party marketplace design analysis; not the current design system. |
| `SENTRY_SETUP.md` | Sentry configuration and operational caveats. |
| `prisma/MIGRATIONS.md` | Migration discipline and migration ledger. |
| `.github/VERCEL_SETUP.md` | GitHub Actions/Vercel setup and deployment behavior. |
| `docs/API-MASTERY-GUIDE.md` | API learning guide and Hostello route examples. |
| `docs/CI-CD-GUIDE.md` | Current CI/CD workflow behavior and deployment concepts. |
| `docs/OPERATIONS-RUNBOOK.md`, `docs/LAUNCH_RUNBOOK.md`, `docs/LAUNCH-OPERATIONS-RUNBOOK.md` | Backend operations, launch, and recovery procedures. |
| `docs/PRIVATE-STUDENT-VERIFICATION.md` | Private document storage setup and legacy-data notes. |
| `docs/superpowers/` | Dated design specifications and implementation plans; consult their status before treating them as current. |

---

## Next.js Application (`src/app/`)

The root app directory contains the required `layout.tsx` and API routes.
There are no `page.tsx` files, visual components, or app stylesheets. Former
product pages are no longer served; unsupported page URLs return not found.

### API Routes

The 71 route files under `src/app/api/` cover:

- Authentication, signup, verification, password reset, phone OTP, and account
  deletion.
- Hostels, search, availability, favorites, roommate posts, and reports.
- Bookings, payment initiation, callbacks, webhooks, refunds, and payouts.
- Conversations, reviews, notifications, price alerts, and profile updates.
- Owner analytics, subscriptions, and blocked dates.
- Admin listings, search synchronization, verifications, payment events,
  roommate moderation, payouts, and refunds.
- Cron jobs, health checks, uploads, contact, and reports.

API contracts and authorization are implemented in the route handlers and
their backend service modules; no first-party screen currently consumes them.

---

## Backend Services (`src/lib/`)

`src/lib/` contains database access, authentication, CSRF, rate limiting,
search, hostel and booking services, payment integrations, notifications,
email/SMS, environment validation, and support utilities.

Notable modules:

- `src/lib/auth/` — NextAuth configuration, session helpers, credential
  authorization, and token revocation support.
- `src/lib/booking-service.ts`, `src/lib/hostel-service.ts` — booking and
  listing business logic.
- `src/lib/safepay.ts`, `src/lib/jazzcash.ts`, `src/lib/easypaisa.ts` —
  payment provider integrations.
- `src/lib/cron-schedules.ts` and `scripts/schedule-cron-jobs.ts` — shared
  scheduled-job registry and QStash setup.
- `src/lib/verification-storage.ts` — private verification document storage.

---

## Shared Package (`packages/shared/`)

| Path | Purpose |
|---|---|
| `packages/shared/src/constants/` | Shared amenities, university list, and configuration values. |
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
| `prisma/migrations/` | Versioned SQL migrations. |

Schema areas include users and auth, hostels, rooms, bookings, reviews,
favorites, conversations, price alerts, notifications, cron logs, blocked
dates, subscriptions, student verification, roommate posts/reports, and
payment/refund audit records.

---

## Scripts

| Path | Purpose |
|---|---|
| `scripts/vercel-build.mjs` | Runs the production build without applying migrations. |
| `scripts/migrate-preview.mjs` | Verifies Preview and Production database identities before Preview migration. |
| `scripts/schedule-cron-jobs.ts` | Registers QStash schedules. |
| `scripts/check-price-alerts.ts` | Scheduled/manual price-alert processing. |
| `scripts/setup-typesense.ts`, `scripts/verify-typesense-fallback.ts` | Search index setup and fallback verification. |
| `scripts/reset-review-stats.ts`, `scripts/fix-phantom-reviews.ts` | Review aggregate maintenance and repair. |
| `scripts/patch-routes-manifest.mjs` | Post-build Next.js route manifest patch. |
| Other `scripts/` files | Migration inspection/repair and data maintenance. |

---

## Tests

| Area | Current state |
|---|---|
| Unit/integration | 96 Vitest test files under `src/`; 657 tests passed in the most recent run. |
| Browser E2E | Playwright config and E2E files were removed. The `e2e` npm script is stale and unsupported. |

Primary supported commands:

```bash
npm run test -- --run
npm run typecheck
npm run lint
npm run build
```

---

## Deployment And Operations

| Path | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Application/shared-package checks and pull-request Preview deployment. |
| `.github/workflows/production.yml` | Production checks, migration, build, and deployment. |
| `.github/workflows/migrate-preview.yml` | Manually dispatched guarded Preview migration. |
| `.github/workflows/audit.yml` | Scheduled and dependency-change audit. |
| `.github/VERCEL_SETUP.md` | Vercel secrets and deployment setup. |

The preview PR comment still links to removed UI pages. Use API routes and
their required integrations for Preview verification.

---

## Generated Or Local-Only Areas

- `.next/`
- `node_modules/`
- `test-results/`
- `tsconfig.tsbuildinfo`
