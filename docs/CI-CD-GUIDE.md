# CI/CD Guide

This guide describes the checked-in workflows. GitHub, Vercel, and Neon console
settings are external state; verify them in the owning project before relying on
them.

## Workflow map

| Workflow | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | Push to `main`; pull request targeting `main` | Web checks, shared-package type check, and isolated PostgreSQL integration test. For pull requests, deploys a Vercel Preview only after all three gates pass. |
| `.github/workflows/production.yml` | Push to `main` | Repeats the web and PostgreSQL gates, then builds, snapshots, migrates, and deploys to production in that order. |
| `.github/workflows/migrate-preview.yml` | Manual `workflow_dispatch` from `preview` | Applies pending migrations to the explicitly guarded Preview database. |

CI is not a deployment approval. The production workflow has a GitHub
`production` environment, but whether required reviewers are configured is an
external setting and is not established by the workflow file.

## Quality gates

The CI and production workflows independently run the web gate and a PostgreSQL
gate. The web gate runs `npm ci`, documentation and script checks, Prisma
generation, TypeScript checking, Vitest, and lint. CI also type-checks
`packages/shared`. The PostgreSQL gate starts a disposable PostgreSQL 16 service,
applies checked-in migrations to `hostello_test`, and runs the guarded
availability-alert integration test.

The Preview deploy waits for `web`, `shared`, and `postgres-integration`. The
production deploy waits for `gate-web` and `gate-postgres`. A successful local
test run is not evidence that these GitHub Actions gates have passed; inspect the
specific workflow run before release.

## Production deployment sequence

On a push to `main`, the production workflow:

1. Runs both quality gates.
2. Pulls the Vercel production build environment and builds the application.
3. Attempts to create a pre-migration Neon branch using
   `scripts/neon-snapshot.mjs`.
4. Applies pending migrations using `npm run db:migrate:deploy` with
   `HOSTELLO_PRODUCTION_DATABASE_URL` from GitHub Actions secrets.
5. Deploys the already-built artifact to Vercel production.

The workflow builds before touching the database so a failed build does not
leave the production schema ahead of the deployed application. Migrations must
remain backward compatible with the currently serving version; use
expand/backfill/contract releases.

### Snapshot gate is an external control

The snapshot script warns and continues when its configuration is absent or
snapshot creation fails unless `NEON_SNAPSHOT_REQUIRED` is exactly `true`. The
workflow reads this setting from the GitHub Actions variable of the same name.
Before a production release, an owner must verify the production branch ID,
project ID, API key, and that the required flag is set to `true`. The script's
default branch expiry is 14 days; expiry support depends on the Neon API
response. A created branch is a recovery point, not proof that restoration has
been rehearsed.

## Preview migrations

The Preview migration workflow can run only when manually dispatched from the
`preview` branch. It loads the Preview environment, then calls
`npm run db:migrate:preview`. The guard requires
`HOSTELLO_MIGRATION_TARGET=preview` and compares the injected database host and
name against configured Preview and Production identities. It refuses to run
when the identities match each other, the target matches Production, or the
target does not exactly match the configured Preview identity.

Before dispatching, an owner must verify the `preview-migrations` GitHub
environment, database identity variables, and database secret. Do not copy
production credentials into this workflow.

## Release and migration rules

- Create migrations with `npm run migrate:new` in the intended development
  database. Commit the generated migration with the Prisma schema change.
- Never use `prisma db push` against shared or production databases.
- Never edit or remove a migration already applied to a shared or production
  database; create a corrective migration instead.
- Production migrations are forward-only. An application redeploy does not
  reverse a database migration.
- Review migration compatibility, backfill impact, and recovery prerequisites
  before merging. See [Prisma migration discipline](../prisma/MIGRATIONS.md).
- If a workflow fails during snapshot, migration, or deployment, stop and follow
  the [operations runbook](OPERATIONS-RUNBOOK.md). Do not rerun or repair a
  production operation until the incident owner has confirmed the target state.

## External settings to verify before release

- GitHub `production` environment approval requirements and deployment history.
- Required repository branch protections and status checks for `main`.
- GitHub Actions secrets for Vercel and the production database, plus Neon
  snapshot secrets and variables.
- `NEON_SNAPSHOT_REQUIRED=true` and the correct Neon project and production
  branch IDs.
- Vercel project/environment linkage, production domain, and the deployed
  environment variables.
- Preview migration environment identity values and access restrictions.

These settings are intentionally not represented as verified merely because a
workflow references their names.

## Source of truth

- `.github/workflows/ci.yml`
- `.github/workflows/production.yml`
- `.github/workflows/migrate-preview.yml`
- `scripts/neon-snapshot.mjs`
- `scripts/migrate-preview.mjs`
- `package.json`
- `prisma/MIGRATIONS.md`
