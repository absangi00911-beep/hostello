# HostelLo

HostelLo is a Pakistan-focused hostel marketplace backend. Its Next.js
application currently exposes API routes; the web pages, screens, and reusable
UI components have been removed for a future redesign. Requests to the former
page URLs return not found.

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
| Notifications | Resend (email) · Twilio (SMS/OTP) |
| Errors | Sentry — see [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) |
| Tests | Vitest (unit/integration) |

## Getting started

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, and the integrations you need — see SYSTEM.md §17.
npx prisma migrate dev
npm run dev
```

The Next.js server starts at `http://localhost:3000`. API handlers are under
`/api`; there is no first-party web interface at this time. Use an API client
to exercise routes.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Next.js API application (Turbopack) |
| `npm run build` | Generate the Prisma client and build with webpack; does not apply migrations |
| `npm run test -- --run` | Run Vitest unit/integration tests |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Run ESLint |
| `npm run migrate:new` | Create a Prisma migration |
| `npm run db:migrate:deploy` | Apply committed migrations to the configured database |
| `npm run db:studio` | Start Prisma Studio |
| `npm run db:seed` | Seed local data |

The `e2e` package script remains in `package.json`, but its Playwright
configuration and E2E suite have been removed; it is not a supported test
command until that infrastructure is restored.

## Where to look next

| Doc | For |
|---|---|
| [`SYSTEM.md`](./SYSTEM.md) | Architecture, data model, API surface, security, open issues |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Current repository map |
| [`WEB_APP_PROGRESS.md`](./WEB_APP_PROGRESS.md) | Current backend status and historical implementation notes |
| [`prisma/MIGRATIONS.md`](./prisma/MIGRATIONS.md) | Migration workflow and failure recovery |
| [`docs/CI-CD-GUIDE.md`](./docs/CI-CD-GUIDE.md) | CI/CD workflows and deployment behavior |
| [`docs/API-MASTERY-GUIDE.md`](./docs/API-MASTERY-GUIDE.md) | API fundamentals, Hostello route patterns, security, and testing |
| [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) | Error tracking setup |
| [`.github/VERCEL_SETUP.md`](./.github/VERCEL_SETUP.md) | Vercel deployment setup |

Money is stored as whole-integer PKR, never `Float`. Schema changes go through
Prisma migrations; the pre-commit hook blocks a staged `schema.prisma` change
without a staged migration.
