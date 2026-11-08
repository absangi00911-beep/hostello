# GitHub Actions — Vercel setup

GitHub Actions builds and deploys the Hostello Next.js application to Vercel.
It serves both the first-party web interface and API routes under `/api`.

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

Add `HOSTELLO_PRODUCTION_DATABASE_URL` as a secret on the GitHub Actions
`production` environment. The production workflow uses it only for the
migration step, after the environment's required reviewers approve the job.
Keep the database URL sensitive; Vercel CLI cannot expose Sensitive
environment values to `vercel env run`.

## Deployment flow

```text
Pull request to main
  ├─ CI: Web (type-check · tests · lint)
  ├─ CI: Shared package (type-check)
  └─ After both pass: build and deploy a Vercel Preview

Push to main
  ├─ CI runs Web and Shared package checks
  └─ Production workflow runs its Web quality gate
       └─ Approve production environment → pull Vercel Production environment
            → build for production → snapshot database
            → apply database migrations from the GitHub environment secret
            → deploy to Vercel
```

- CI is defined in [workflows/ci.yml](./workflows/ci.yml). Preview deployments
  run for pull requests after the Web and Shared package jobs pass. The
  workflow posts a deployment URL as a pull-request comment.
- Production deployment is defined in
  [workflows/production.yml](./workflows/production.yml). It reruns the Web
  type-check, tests, and lint before migrating and deploying. After the
  production environment approval, the migration uses
  `HOSTELLO_PRODUCTION_DATABASE_URL` from that GitHub environment. It runs
  after the build succeeds and before the deployment, so a failed build never
  changes the database. Migrations must stay backward compatible with the
  code that is still serving traffic (expand first, contract in a later
  release).
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

The PR comment in `ci.yml` links to the hostel search API as a basic deployment
smoke check. This does not verify UI rendering or user journeys. Run the
Playwright suite against disposable services before claiming browser-runtime
validation; CI currently discovers/runs no browser E2E tests.

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
