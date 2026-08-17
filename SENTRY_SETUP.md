# Sentry Setup

**Last updated:** July 1, 2026 (recreated from the actual config; see `WEB_APP_PROGRESS.md` session log)

HostelLo uses [`@sentry/nextjs`](https://www.npmjs.com/package/@sentry/nextjs) (`^10.52.0`) for error tracking across all three Next.js runtimes.

## How it's wired

| File | Runtime | Notes |
|---|---|---|
| `instrumentation.ts` | — | Next.js App Router entry point. Loads the right config based on `NEXT_RUNTIME` (`nodejs` or `edge`). Required at the project root; the SDK reads it automatically. |
| `sentry.client.config.ts` | Browser | `tracesSampleRate: 1.0`. Session replay enabled via `Sentry.replayIntegration()` — `maskAllText: true`, `blockAllMedia: true` (PII-safe by default), `replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0.1`. |
| `sentry.server.config.ts` | Node.js (API routes, Server Components) | `tracesSampleRate: 1.0`. No replay (server-side, not applicable). |
| `sentry.edge.config.ts` | Edge (middleware, edge routes) | `tracesSampleRate: 1.0`. |
| `next.config.ts` | build | Wraps the config in `withSentryConfig(nextConfig, { org, project, authToken })` for source map upload and release tracking. |

**Worth knowing:** all three runtime configs currently read `process.env.NEXT_PUBLIC_SENTRY_DSN` — including the server and edge configs, not just the client. `.env.sentry.example` defines a separate private `SENTRY_DSN` for server-side use, but nothing in the codebase currently reads it. This isn't broken (a single public DSN works fine for all three Sentry SDKs), just worth knowing if you're deciding whether to wire up `SENTRY_DSN` separately later.

## Required environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes, for error tracking to do anything | Used by client, server, and edge configs. Get it from `https://sentry.io/settings/[org]/projects/[project]/keys/dsn/`. |
| `SENTRY_ORG` | Optional | Enables source map upload / release tracking at build time. |
| `SENTRY_PROJECT` | Optional | Same. |
| `SENTRY_AUTH_TOKEN` | Optional | Same — needed for the build step to authenticate with Sentry. |

Template: `.env.sentry.example` at the repo root. Copy the values you need into `.env`.

Sentry is optional in local development — without `NEXT_PUBLIC_SENTRY_DSN` set, `Sentry.init()` runs with `dsn: undefined` and silently no-ops.

## Setup steps

1. Create a project in Sentry (one project is enough; client/server/edge all report into it).
2. Copy the DSN into `NEXT_PUBLIC_SENTRY_DSN`.
3. If you want source maps and release tracking on build, generate an auth token (`Settings → Auth Tokens`) with the `project:releases` scope and set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
4. Deploy or run `npm run build` — `withSentryConfig` picks the rest up automatically.

## Session replay

Replay is enabled client-side only, with `maskAllText: true` and `blockAllMedia: true` — text content and media are masked/blocked in recordings by default, which matters given the platform handles real booking and payment data. Don't loosen these without a specific reason; if you do, re-check what's visible in a recorded session on the payment and profile pages first.
