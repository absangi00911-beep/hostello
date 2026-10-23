# GitHub Actions — Vercel setup

GitHub Actions builds and deploys the Hostello API application to Vercel. The
web pages and UI have been removed; Next.js keeps only its required root
layout, and requests to former page URLs return not found. API routes remain
under `/api`.

## GitHub Actions secrets

Add these repository secrets at **Settings → Secrets and variables → Actions**:

### `VERCEL_TOKEN`

A Vercel access token. Create one at https://vercel.com/account/tokens and
grant it access to the team or personal account that owns the Hostello
project.

### `VERCEL_ORG_ID`

The Vercel team or personal account ID. Find it in **Vercel → Settings →
General → Team ID**, or run `vercel whoami --scope` from the project.

### `VERCEL_PROJECT_ID`

The Hostello Vercel project ID. Find it in **Project → Settings → General →
Project ID**, or run `vercel project ls`.

The production workflow reads `DATABASE_URL` from the Vercel Production
environment. Do not add the production database URL as a GitHub Actions
secret.

## Deployment flow

```text
Pull request to main
  ├─ CI: Web (type-check · tests · lint)
  ├─ CI: Shared package (type-check)
  └─ After both pass: build and deploy a Vercel Preview

Push to main
  ├─ CI runs Web and Shared package checks
  └─ Production workflow runs its Web quality gate
       └─ Pull Production environment → apply database migrations
            → build for production → deploy to Vercel
```

- CI is defined in [workflows/ci.yml](./workflows/ci.yml). Preview deployments
  run for pull requests after the Web and Shared package jobs pass. The
  workflow posts a deployment URL as a pull-request comment.
- Production deployment is defined in
  [workflows/production.yml](./workflows/production.yml). It reruns the Web
  type-check, tests, and lint before migrating and deploying. The production
  migration happens before the build and deployment.
- Vercel uses `node scripts/vercel-build.mjs` as its build command. It runs
  `npm run build` (Prisma client generation and `next build`) and does not
  apply database migrations.
- The CI workflows do not run browser E2E tests.

### Preview database migrations

Preview builds do not migrate a database automatically. To migrate the
Preview database, manually dispatch
[workflows/migrate-preview.yml](./workflows/migrate-preview.yml) from the
`preview` branch. It uses the `preview-migrations` GitHub environment and
requires these environment variables:

- `HOSTELLO_PREVIEW_DATABASE_HOST`
- `HOSTELLO_PREVIEW_DATABASE_NAME`
- `HOSTELLO_PRODUCTION_DATABASE_HOST`
- `HOSTELLO_PRODUCTION_DATABASE_NAME`

The migration script compares the Vercel Preview `DATABASE_URL` against both
configured database identities and refuses to migrate if Preview and
Production match, or if the URL does not match the configured Preview
database.

### Preview smoke checks

The PR comment in `ci.yml` still links to the former homepage, hostel search,
city, and login pages. Those UI routes no longer exist, so those links are
stale and will return not found. Validate Preview deployments through API
routes and their required integrations until the PR smoke-check list is
updated.

## Branch protection

For pull requests targeting `main`, require the checks that run in CI:

- `Web (type-check · tests · lint)`
- `Shared package (type-check)`
- `Preview deploy`

The Preview deploy check runs only for pull requests and only after both
quality-gate jobs pass.

## Vercel Git integration

If GitHub Actions is the sole deployment path, disable Vercel's automatic Git
deployments to avoid duplicate builds:

**Vercel → Hostello project → Settings → Git → Ignored Build Step**: set the
command to `exit 1` to skip Vercel's Git-triggered build. GitHub Actions
continues to deploy with the Vercel CLI.
