# Hostello Project Structure

**Last updated:** November 6, 2026
**Verification source:** current workspace
**Status:** First-party Next.js web application and API. Browser E2E tests are
present; browser-runtime validation against disposable local services remains
open.

---

## Repository Overview

- `src/app/api/` contains the Next.js Route Handlers.
- `src/lib/` contains backend services, auth, validation, integrations, and
  shared server utilities.
- `src/proxy.ts` applies environment validation and API CSRF checks.
- `packages/shared/` contains shared constants, schemas, types, and utilities.
- `prisma/` contains the Prisma schema, client setup, seed code, migration
  documentation, and 35 migration directories.
- `scripts/` contains deployment, migration, cron, and maintenance scripts.
- `docs/` and `.github/` contain operational guides and workflow
  documentation.

The current workspace contains 80 API route files, 39 page files, 177
component source files, 9 Playwright spec files, and 32 Prisma models. The
latest recorded full Vitest run passed 1,512 tests with 10 skipped. E2E
discovery passed; browser execution is not yet verified.

---

## Root Files

| Path | Purpose |
|---|---|
| `package.json` / `package-lock.json` | Root dependencies and scripts, including Vitest and Playwright commands. |
| `next.config.ts` | Next.js build, image, and security-header configuration. |
| `tsconfig.json` | TypeScript configuration. |
| `vitest.config.ts` | Vitest configuration and aliases. |
| `eslint.config.mjs` | ESLint configuration. |
| `postcss.config.js`, `src/app/globals.css` | Tailwind v4 setup: the PostCSS plugin, the `@theme` tokens and the global CSS. There is no `tailwind.config.js`; v4 reads tokens from CSS. |
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
| `WEB_APP_PROGRESS.md` | Current implementation and verification summary, followed by historical progress snapshots. |
| `DESIGN.md` | Historical third-party marketplace design analysis; not the current design system. |
| `SENTRY_SETUP.md` | Sentry configuration and operational caveats. |
| `prisma/MIGRATIONS.md` | Migration discipline and migration ledger. |
| `.github/VERCEL_SETUP.md` | CI/CD and Vercel deployment setup. |
| `docs/superpowers/` | Dated design specifications and implementation plans; consult their status before treating them as current. |

The operational and API guides named in older documentation are not present
at their former paths; see R-20 in `SYSTEM.md` rather than relying on stale
links.

---

## Next.js Application (`src/app/`)

The root app directory contains the shared layout, product pages, and API
routes.

### API Routes

The 80 route files under `src/app/api/` cover:

- Authentication, signup, verification, password reset, phone OTP, and account
  deletion.
- Hostels, search, availability, favorites, roommate posts, and reports.
- Bookings, payment initiation, callbacks, webhooks, refunds, and payouts.
- Conversations, reviews, notifications, price alerts, and profile updates.
- Date-aware availability-alert management and matching.
- Owner analytics, subscriptions, and blocked dates.
- Admin listings, search synchronization, verifications, payment events,
  roommate moderation, payouts, and refunds.
- Cron jobs, health checks, uploads, contact, and reports.

API contracts and authorization are implemented in the route handlers and
their backend service modules. First-party screens consume these APIs.

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
| `prisma/schema.prisma` | Data model with 32 models. |
| `prisma/client.ts` | Prisma client setup. |
| `prisma/seed.ts` | Local seed script. |
| `prisma/MIGRATIONS.md` | Migration discipline and migration ledger. |
| `prisma/migrations/` | Versioned SQL migrations. |

Schema areas include users and auth, hostels, rooms, bookings, reviews,
favorites, conversations, price and availability alerts, notifications, cron
logs, blocked dates, subscriptions, student verification, roommate
posts/reports, and payment/refund audit records.

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
| Unit/integration | The latest recorded full Vitest run passed 1,512 tests and skipped 10. |
| Browser E2E | 9 Playwright spec files are present. `npm run e2e -- --list` discovers tests; browser execution against disposable local services remains unverified. |

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

The preview PR comment includes an API smoke-test link. It does not exercise
the first-party UI; browser flows require separate disposable E2E validation.

---

## Generated Or Local-Only Areas

- `.next/`
- `node_modules/`
- `test-results/`
- `tsconfig.tsbuildinfo`
