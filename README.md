# HostelLo

HostelLo is a Pakistan-focused hostel marketplace with a Next.js web
application and API. Student marketplace, owner workspace, admin, messaging,
notification, and availability-alert screens are implemented alongside the
backend services. Browser test coverage is present; test discovery does not
replace running the browser flows against disposable local services.

## Stack

| Layer | Implementation |
|---|---|
| API runtime | Next.js 16 App Router Route Handlers, TypeScript |
| Database | Neon PostgreSQL via Prisma 7 |
| Auth | NextAuth v5 (JWT) |
| Search | Typesense, with automatic Prisma fallback |
| Cache / rate limits | Upstash Redis |
| Cron | Upstash QStash |
| Storage | Cloudflare R2 |
| Payments | Safepay · JazzCash / EasyPaisa infrastructure present but disabled |
| Notifications | In-app notifications; Resend (email) · Twilio (SMS/OTP) |
| Errors | Sentry — see [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) |
| Tests | Vitest (unit/integration) |

## Getting started

```bash
npm install
cp .env.example .env
npx prisma generate   # the Prisma client is generated, not committed
# Fill in DATABASE_URL, AUTH_SECRET, and the integrations you need — see SYSTEM.md §17.
npx prisma migrate dev
npm run dev
```

The Next.js server starts at `http://localhost:3000`. The first-party web
application and API handlers are served by the same app.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Next.js application (Turbopack) |
| `npm run build` | Generate the Prisma client and build with webpack; does not apply migrations |
| `npm run test -- --run` | Run Vitest unit/integration tests |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Run ESLint |
| `npm run test:scripts` | Run deployment and operational script tests |
| `npm run docs:check` | Validate documented routes, cron jobs, environment variables, and Markdown links |
| `npm run e2e -- --list` | Discover Playwright tests without running a browser flow |
| `npm run migrate:new` | Create a Prisma migration |
| `npm run db:migrate:deploy` | Apply committed migrations to the configured database |
| `npm run db:studio` | Start Prisma Studio |
| `npm run db:seed` | Seed local data |

PostgreSQL integration tests require an explicitly configured disposable
loopback test database. Browser E2E, provider sandbox, QStash retry, and
database restore validation are separate release checks; do not point local
test commands at shared or production services.

## Where to look next

| Doc | For |
|---|---|
| [`SYSTEM.md`](./SYSTEM.md) | Architecture, data model, API surface, security, open issues |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Current repository map |
| [`WEB_APP_PROGRESS.md`](./WEB_APP_PROGRESS.md) | Current backend status and historical implementation notes |
| [`prisma/MIGRATIONS.md`](./prisma/MIGRATIONS.md) | Migration workflow and failure recovery |
| [`.github/VERCEL_SETUP.md`](./.github/VERCEL_SETUP.md) | CI/CD and Vercel deployment setup |
| [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) | Error tracking setup |
| [`.github/VERCEL_SETUP.md`](./.github/VERCEL_SETUP.md) | Vercel deployment setup |

Money is stored as whole-integer PKR, never `Float`. Schema changes go through
Prisma migrations; the pre-commit hook blocks a staged `schema.prisma` change
without a staged migration.
