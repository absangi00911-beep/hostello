# GitHub Actions — Vercel secrets setup

Three secrets are required for preview and production deployments.
Add them at: **Settings → Secrets and variables → Actions → New repository secret**

---

## Required secrets

### `VERCEL_TOKEN`
A personal access token from your Vercel account.
1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name it `github-actions-hostello`, set scope to your team
4. Copy the token — it's only shown once

### `VERCEL_ORG_ID`
Your Vercel team or personal account ID.
```bash
# Run this in the project root after installing Vercel CLI:
vercel whoami --scope
# Or find it at: https://vercel.com/account → Settings → General → Team ID
```

### `VERCEL_PROJECT_ID`
The ID of the HostelLo project in Vercel.
```bash
# Run in project root:
vercel project ls
# Or open the Vercel dashboard → HostelLo project → Settings → General → Project ID
```

---

## How deployments work after setup

```
PR opened / pushed
       │
       ▼
   ci.yml runs:
   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐
   │  web checks │  │ mobile check │  │ shared check  │
   │  tsc+test   │  │ tsc --noEmit │  │ tsc --noEmit  │
   └──────┬──────┘  └──────┬───────┘  └───────┬───────┘
          └─────────────────┼──────────────────┘
                            │ all pass
                            ▼
                    preview deploy job
                    vercel deploy --prebuilt
                            │
                            ▼
                    PR comment posted:
                    🚀 Preview deployment ready
                    URL: https://hostello-xxx.vercel.app
                    Smoke test checklist ✓


PR merged to main
       │
       ▼
  production.yml:
  gate-web + gate-mobile (full checks re-run)
       │ both pass
       ▼
  vercel deploy --prod
       │
       ▼
  GitHub Deployment status: ✅ success
  https://hostello.pk
```

---

## Branch protection rule

After adding secrets, go to **Settings → Branches → Add rule** for `main`:

- ✅ Require status checks to pass before merging
  - Add: `Web (type-check · tests · lint)`
  - Add: `Mobile (type-check)`
  - Add: `Shared package (type-check)`
  - Add: `Preview deploy` ← this ensures the preview built successfully
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

---

## Disabling auto-deploy in Vercel dashboard

Once this workflow manages deployments, turn off Vercel's own Git integration
to avoid double-deploying on every push:

Vercel dashboard → HostelLo project → Settings → Git
→ **Ignored Build Step**: set to `exit 1`  (blocks Vercel's own builder)

The GitHub Actions workflow will be the only deploy path.