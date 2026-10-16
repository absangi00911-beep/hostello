# Hostello CI/CD: A Practical Guide

This guide explains the continuous integration and delivery setup currently
defined in this repository. It is both a learning resource and an operational
reference. Workflow behavior can change, so the files under
[`../.github/workflows/`](../.github/workflows/) are the source of truth.

## 1. The big picture

**CI** (continuous integration) automatically checks proposed code changes.
**CD** (continuous delivery/deployment) packages and releases code after those
checks pass.

Hostello uses GitHub Actions to run checks and coordinate deployments, Vercel
to build and host the web app, and Prisma migrations to manage database schema
changes.

```text
Developer
   │
   ├── feature branch ── pull request targeting main
   │                             │
   │                             ▼
   │                    GitHub Actions: CI checks
   │                    web / shared
   │                             │ all pass
   │                             ▼
   │                    Vercel Preview deployment
   │                    URL posted on the pull request
   │                             │
   │                    human review and smoke tests
   │                             │
   │                             ▼
   └────────────────────── merge into main
                                 │
                                 ▼
                      Production workflow checks
                                 │ all pass
                                 ▼
                      production DB migrations
                                 │
                                 ▼
                      Vercel production build/deploy
                                 │
                                 ▼
                          hostello.pk
```

The diagram summarizes the intended release path. The exact triggers and
limitations are described below; in particular, the Git branch named `preview`
is not currently wired as an automatic deploy branch by the checked-in
workflows.

## 2. Where the pipeline lives

| File | Responsibility |
|---|---|
| [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Pull-request CI for the web app and shared package; deploys a Vercel Preview for qualifying PRs. |
| [`../.github/workflows/production.yml`](../.github/workflows/production.yml) | Re-runs production quality gates, applies production database migrations, builds and deploys production after a push to `main`. |
| [`../.github/workflows/audit.yml`](../.github/workflows/audit.yml) | Runs `npm audit` on a weekly schedule or when dependency manifests/lockfiles are pushed. |
| [`../.github/workflows/migrate-preview.yml`](../.github/workflows/migrate-preview.yml) | Manually triggered workflow for applying committed migrations to the guarded Preview database. |
| [`../vercel.json`](../vercel.json) | Tells Vercel to use the repository's custom build command. |
| [`../scripts/vercel-build.mjs`](../scripts/vercel-build.mjs) | Runs the application build and makes clear that migrations are handled separately. |
| [`../scripts/migrate-preview.mjs`](../scripts/migrate-preview.mjs) | Verifies Preview/Production database identities before a Preview migration can run. |
| [`../prisma/MIGRATIONS.md`](../prisma/MIGRATIONS.md) | Project rules for creating, applying, and recovering database migrations. |
| [`../.github/VERCEL_SETUP.md`](../.github/VERCEL_SETUP.md) | Vercel/GitHub secret setup and recommended branch protection. |

## 3. What happens in each workflow

### CI: checks and PR Preview

The CI workflow listens to:

- Pushes to `main`.
- Pull requests whose **base/target branch is `main`**.

Its checks run on GitHub-hosted Ubuntu machines:

1. **Web:** installs the exact dependency versions from `package-lock.json`
   with `npm ci`, generates the Prisma client, runs TypeScript type checking,
   Vitest, and ESLint.
2. **Shared package:** installs its locked dependencies and type-checks
   `packages/shared`.
3. **Preview deploy:** for a pull request only, and only after both
   checks pass, builds and deploys a Vercel Preview, then posts or updates a
   comment with the deployment URL.

`needs: [web, shared]` is the dependency gate: the Preview deploy job
does not proceed unless each required check succeeds.

### Production: checks, migration, deployment

The production workflow listens to pushes to `main`. It does not deploy until
the web quality gate passes:

- **Gate — Web checks:** install, Prisma client generation, type-check, tests,
  and lint.
Then the deployment job:

1. Pulls the Vercel **Production** environment.
2. Runs `npm run db:migrate:deploy` using the Production Vercel environment.
3. Builds a production artifact with `vercel build --prod`.
4. Deploys the prebuilt artifact using `vercel deploy --prebuilt --prod`.
5. Records a successful GitHub Deployment status and deployment URL.

The production workflow intentionally repeats checks rather than relying on
the separate CI workflow. This protects the production deployment from
accidentally proceeding if the other workflow is changed or skipped.

The deploy steps are sequential. In particular, the database migration runs
**before** the build and deployment. A later build or deployment failure does
not automatically roll back a migration; schema changes must therefore be
designed to be safe with both the old and new application versions.

### Security audit

The audit workflow runs:

- On its configured weekly schedule.
- On a push that changes one of the listed dependency manifests or lockfiles.

It runs `npm audit --audit-level=high` for the web dependency tree. It is a
separate workflow: it is **not listed as a prerequisite** of the Preview or
production deploy jobs, and it is not triggered by `pull_request` in its
current configuration. If passing the audit must block a merge or release,
configure the appropriate GitHub branch protection/ruleset and workflow
triggers to make that requirement effective.

### Preview database migration

Preview migrations are deliberately manual:

1. Dispatch `migrate-preview.yml` from the `preview` branch in GitHub Actions.
2. The workflow uses the protected `preview-migrations` GitHub Environment.
3. It reads the Vercel Preview `DATABASE_URL` and the configured database
   identity variables.
4. `migrate-preview.mjs` checks that the URL matches the expected Preview
   host/database, that Preview and Production identities differ, and that the
   URL does not identify Production.
5. Only after those checks does it run Prisma's deploy migration command.

If the workflow is dispatched from another branch, its job is skipped. Do not
remove or bypass the database identity checks to make a migration succeed.

## 4. Important branch and deployment distinction

There are two different things that people often mean by “preview”:

1. **The Git branch named `preview`.**
2. **A Vercel Preview deployment**, which is a temporary deployment generated
   from a qualifying pull request.

The checked-in CI workflow targets pull requests into `main`, and its Preview
deployment job runs for those PRs. Its push trigger is restricted to `main`.
Therefore, based on the workflow files:

- Pushing directly to the Git branch `preview` does **not** trigger the CI
  workflow.
- Opening a pull request into `preview` does **not** trigger this CI workflow.
- Opening a pull request into `main` triggers CI and, after the checks pass,
  the Vercel Preview deployment.
- Pushing/merging to `main` triggers the production workflow.
- The Preview database migration workflow is manually dispatched from
  `preview`; it is not a deployment workflow.

```text
Git event                         Checked-in workflow behavior
───────────────────────────────   ───────────────────────────────────────────
PR: feature → main                CI checks → Vercel Preview after checks pass
Push to main                      CI checks + production workflow
PR: feature → preview             No CI trigger from ci.yml
Push to preview                   No CI/deploy trigger from ci.yml or production.yml
Manual dispatch from preview      Guarded Preview database migration only
```

Vercel also supports its own Git integration. The setup document recommends
disabling Vercel's automatic Git builds when GitHub Actions owns deployments,
to avoid duplicate deployments. Confirm the actual Vercel project setting in
the dashboard; repository files cannot prove the live dashboard setting.

If the intended release path is “merge to Git `preview`, deploy that branch,
then promote it to `main`,” the workflow triggers/deploy jobs need to be
configured for that explicitly. The current pipeline does not implement that
branch-promotion model.

## 5. How to use the current workflow safely

### Before opening a pull request

1. Start a feature branch from the intended base.
2. Keep the change focused and commit the necessary tests and migrations.
3. Run relevant checks locally:

   ```powershell
   npm ci
   npx prisma generate
   npx tsc --noEmit
   npm test -- --run
   npm run lint

   ```

4. Inspect the diff and confirm no secrets, local `.env` files, or unintended
   lockfile changes are included.
5. Push the branch and open a PR with the base branch set to `main` if you
   want the current CI and Vercel Preview behavior.

CI is not a substitute for local testing or review. It checks only what its
jobs are configured to check.

### After opening the PR

1. Wait for the web and shared checks.
2. If a check fails, open the failed job and read the first meaningful error
   near the end of the failed step. Fix the cause, push another commit, and
   let the workflow rerun.
3. When the Preview URL appears, smoke-test the changed feature and important
   related routes. Check browser/server logs and verify the behavior, not
   just that the homepage renders.
4. Review the PR diff, migration SQL, and audit status. Get the appropriate
   human approval and merge only when project policy is satisfied.

### Releasing to production

1. Confirm the intended code is on `main` and the required checks pass.
2. Confirm any database migration is committed, reviewed, and safe to run
   before the new code is deployed.
3. Merge/push to `main`; the production workflow starts automatically.
4. Watch the workflow through the migration, build, and deploy steps. A
   successful migration alone is not a successful release.
5. Open the resulting deployment and run production smoke tests. Check
   application error monitoring (Sentry) and operational signals.
6. If something is wrong, follow the incident/rollback process; do not assume
   reverting application code will undo a database migration.

## 6. Concepts and terminology

| Concept | Meaning | How Hostello uses it |
|---|---|---|
| Continuous Integration (CI) | Automatically verify changes when code is pushed or proposed. | GitHub Actions type-checks, tests, and lints. |
| Continuous Delivery | Keep changes in a releasable state, with a release decision or gate. | Checks and Preview build precede human review; production follows a push to `main`. |
| Continuous Deployment | Automatically release every qualifying change without a separate manual production approval. | Production deployment is automatic after a push to `main` and its workflow gates. |
| Workflow | A YAML-defined GitHub Actions automation. | Files under `.github/workflows/`. |
| Event/trigger | The event that starts a workflow, such as `push`, `pull_request`, schedule, or manual dispatch. | Each workflow defines its own triggers. |
| Job | A unit of work running on a runner. | `web`, `shared`, and `preview` are jobs. |
| Step | A command or action inside a job. | `npm ci`, type-checking, migrations, and Vercel commands are steps. |
| Runner | The machine that executes a job. | Workflows use GitHub-hosted `ubuntu-latest` runners. |
| Gate | A condition that must succeed before a later job proceeds. | Production deploy depends on the gate jobs; Preview deploy depends on the CI checks. |
| Artifact | A built, versioned output that can be deployed. | Vercel's `vercel build` output is deployed with `--prebuilt`. |
| Environment | A deployment context with distinct settings/secrets and optional protections. | Vercel Production/Preview environments; GitHub `preview-migrations` environment. |
| Secret | Sensitive configuration provided to a workflow at runtime. | Vercel token and IDs are GitHub secrets; database URL is read from Vercel. |
| Migration | A versioned database schema change. | Prisma migration files under `prisma/migrations/`. |
| Smoke test | A short, high-value check that a deployed service works. | The PR comment suggests key routes; a human should verify changed behavior too. |
| Concurrency | Control whether overlapping runs may execute together. | Production deploys are serialized; same-ref CI runs cancel older in-flight runs. |

## 7. Common CI/CD concepts not currently configured here

These are common options, not automatic requirements. Add them when a concrete
need justifies the extra maintenance.

| Concept | What it would do | Current repository status |
|---|---|---|
| Automatic deploy on push to Git `preview` | Build and deploy every qualifying update to the `preview` branch. | Not configured in the checked-in Actions workflows. |
| CI for PRs targeting `preview` | Run quality checks before merging into the preview branch. | Not configured by `ci.yml`, whose PR base is `main`. |
| Dedicated staging promotion | Promote the exact Preview artifact to production after acceptance. | The current Production workflow builds again on `main`; explicit artifact promotion is not shown. |
| Production approval gate | Require a reviewer to approve before a production job can run. | No explicit GitHub Environment approval is declared for the production deploy job. |
| End-to-end browser tests in CI | Exercise complete user journeys in a browser on each change. | Playwright exists in the project, but `ci.yml` does not run it. |
| Coverage threshold gate | Fail CI if line/branch coverage drops below a defined threshold. | No coverage threshold is configured in the workflow. |
| SAST/code scanning | Scan source code for vulnerability patterns. | The shown workflows do not configure a SAST scanner. `npm audit` checks known dependency advisories, not application source code. |
| Container build and registry | Package the application as a Docker image and store it in a container registry. | Not part of the shown deployment path; Vercel builds and hosts the app. |
| Infrastructure as Code (IaC) | Version infrastructure definitions and apply them reproducibly. | No Terraform/Pulumi deployment is present in the reviewed pipeline files. |
| Kubernetes/orchestrator rollout | Schedule and manage containerized workloads across a cluster. | Not used in the shown Vercel deployment path. |
| Canary or blue/green release | Gradually direct traffic to a new version or switch between two production environments. | Not configured by these workflows. |
| Automated rollback | Detect release failure and automatically restore the prior application version. | No automated rollback job is defined. |
| Release tags/changelog automation | Generate versioned releases and notes from commits or tags. | Not part of the reviewed workflows. |
| Dependency caching everywhere | Reuse package downloads to speed up repeated installs. | `setup-node` enables npm caching for selected jobs; this is a limited cache, not a full build cache. |
| Separate CI workflow for dependency audit on PR | Check proposed dependency changes before merge. | The audit workflow currently listens to schedule and push path filters, not PRs. |

“Not configured here” means it is absent from the reviewed repository workflow
files; a provider dashboard or organization-level GitHub rule may add behavior
that is not visible in this repository.

## 8. Database deployment safety

Database changes are especially important because application code and schema
can be deployed at different moments.

- Create migrations with `npm run migrate:new`; commit the schema and generated
  migration together.
- Do not use `prisma db push` against shared or production databases.
- Production applies committed migrations with `prisma migrate deploy`.
- Preview migrations require manually dispatching the guarded migration
  workflow from `preview`.
- Normal Preview builds do not migrate the database.
- Do not edit or delete a migration that has already been applied to a shared
  database. Add a corrective migration instead.
- Prefer **expand and contract**: add a backward-compatible schema first,
  deploy code that can work with old and new schema, backfill if needed, and
  remove obsolete schema in a later release.
- Test migration SQL against a disposable or personal database before a shared
  environment. Confirm the target database identity before any manual command.

```text
Migration change
      │
      ▼
Create and commit Prisma migration
      │
      ├── Production: push/merge to main
      │                   │
      │                   ▼
      │         production gates pass?
      │                   │ yes
      │                   ▼
      │         migrate deploy via Vercel Production env
      │                   │
      │                   ▼
      │         build and deploy production
      │
      └── Preview: manually dispatch from preview branch
                          │
                          ▼
              verify Preview DB identity guards
                          │ pass
                          ▼
                 migrate deploy to Preview
```

See [`../prisma/MIGRATIONS.md`](../prisma/MIGRATIONS.md) for the project's
full migration rules and recovery instructions.

## 9. Reading a failed Actions run

1. Open the run from the repository's **Actions** tab.
2. Identify the failed **job**, then the failed **step**.
3. Read the command and the first actionable error; later messages may only be
   fallout from the original failure.
4. Decide whether it is a code failure, missing configuration, external
   service issue, or workflow configuration issue.
5. Reproduce locally when practical, fix the root cause, and push a new
   commit. Do not weaken or skip a gate just to get a green check.
6. For a deployment failure, separately verify whether migrations or other
   side effects already happened before retrying.

Avoid printing secrets in diagnostic commands or logs. If a secret is exposed,
rotate it in the provider and update the configured secret.

## 10. A learning checklist

For every run, practice answering:

1. What event triggered it, and which commit is being tested?
2. Which jobs ran, which were skipped, and why?
3. What exact condition allows deployment to proceed?
4. Which environment and database can the job modify?
5. What artifact or external side effect did it create?
6. How can the deployed behavior be verified?
7. If the release is unhealthy, what can be rolled back safely—and what
   database changes cannot simply be undone?

Those answers are the foundation of operating a reliable delivery pipeline.
