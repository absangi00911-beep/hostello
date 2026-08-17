# HostelLo

A Pakistan-focused marketplace connecting students with verified hostel/PG accommodation. Students discover, compare, message, and book; owners list and manage properties; admins moderate the marketplace.

## Stack

| Layer | Implementation |
|---|---|
| Web | Next.js 16 (App Router), React 19, TypeScript |
| Mobile | Expo 54 / React Native 0.81 (`apps/mobile/`) |
| Database | Neon PostgreSQL via Prisma 7 |
| Auth | NextAuth v5 (JWT) + mobile Bearer-token bridge (`src/proxy.ts`) |
| Search | Typesense, with automatic Prisma fallback |
| Cache / rate limits | Upstash Redis |
| Cron | Upstash QStash |
| Storage | Cloudflare R2 |
| Payments | Safepay (live) · JazzCash / EasyPaisa (built, intentionally disabled) |
| Notifications | Resend (email) · Twilio (SMS/OTP) · Firebase Admin (push) |
| Errors | Sentry — see [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) |
| Tests | Vitest (unit/integration) · Playwright (E2E) |

## Getting started

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, and whichever integrations you need — see SYSTEM.md §17
npx prisma migrate dev
npm run dev
```

The app runs at `http://localhost:3000`.

For the mobile app:

```bash
cd apps/mobile
npm install
cp .env.example .env.development   # set EXPO_PUBLIC_API_URL
npm start
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the web app (Turbopack) |
| `npm run build` | Run pending migrations, generate the Prisma client, build |
| `npm run test` | Vitest unit/integration tests |
| `npm run e2e` | Playwright E2E — refuses to run against anything that looks like a production/shared database |
| `npm run migrate:new` | Create a new Prisma migration (required before any schema change) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed local data |
| `npm run lint` | ESLint |

## Where to look next

| Doc | For |
|---|---|
| [`SYSTEM.md`](./SYSTEM.md) | Architecture, data model, API surface, security, open issues |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | File-by-file map of the repo |
| [`WEB_APP_PROGRESS.md`](./WEB_APP_PROGRESS.md) | What's shipped, what's open, current priorities |
| [`prisma/MIGRATIONS.md`](./prisma/MIGRATIONS.md) | Migration workflow and failure recovery |
| [`SENTRY_SETUP.md`](./SENTRY_SETUP.md) | Error tracking setup |
| [`docs/superpowers/`](./docs/superpowers/) | Spec + plan format used for non-trivial feature work |

Two rules that are enforced, not just suggested: money is always whole-integer PKR, never `Float`; schema changes always go through `npm run migrate:new` — a pre-commit hook blocks a staged `schema.prisma` edit without a matching migration file.
