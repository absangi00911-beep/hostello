# HostelLo Documentation-vs-Code Audit

**Audit date:** 2026-11-05  
**Base/HEAD:** `61bf904`  
**Status:** Partial audit with direct source checks on the current repo; not a production sign-off. Live provider, production database, and console state were not verified.  
**Auditor:** Documentation-vs-Code Auditor

## 1. Verdict

The current repository is significantly more complete than the stale API-only claims in the top-level docs and the older 2026-11-04 partial report. The local codebase includes a working app shell, 36 route-backed pages, Playwright configuration and seven E2E specs, the Task 6 seat-hold and late-payment implementation, and the local verification commands pass (`npm run typecheck`, `npm run docs:check`, `npx prisma validate`, `npm run test -- --run`). The source-of-truth rules still require treating docs as secondary: `SYSTEM.md` and `README.md` are stale in several places, but the code + generated repo facts are the reliable current truth for the repo state. We do not treat live provider configuration, production DB state, or external console approvals as verified.

## 2. Summary table

| Classification | Count |
|---|---:|
| STALE-DOC | 2 |
| MISSING-IN-CODE | 1 |
| UNDOCUMENTED | 0 |
| CONTRADICTION | 0 |
| FALSE-STATUS | 0 |
| **Total evidence-backed findings** | **3** |

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 3 |
| P2 | 0 |

## 3. Findings

| ID | Severity | Classification | Claim (doc + line) | Reality (file/command evidence) | Who should fix | Suggested fix |
|---|---|---|---|---|---|---|
| **G-001** | P1 | STALE-DOC | `README.md:1-18, 29-43`, `SYSTEM.md:52-59`, `PROJECT_STRUCTURE.md:1-24` claim the app is API-only, with no pages or UI components, and that Playwright was removed. | Evidence shows the opposite: `src/app/page.tsx` renders `ProductHome`; `Get-ChildItem src/app -Recurse -Filter page.tsx` found `36` page files; `playwright.config.ts` exists; `Get-ChildItem e2e -Recurse -File` found `7` E2E specs. `npm run typecheck` and `npm run test -- --run` both passed. | Docs owner / Founder | Replace the API-only language with a current repo description and note whether the frontend is intentionally partial or active. |
| **G-002** | P1 | STALE-DOC | `README.md:53-71`, `PROJECT_STRUCTURE.md:37-59`, and related docs point to missing runbooks and guides: `docs/CI-CD-GUIDE.md`, `docs/API-MASTERY-GUIDE.md`, `docs/OPERATIONS-RUNBOOK.md`, `docs/LAUNCH_RUNBOOK.md`, `docs/LAUNCH-OPERATIONS-RUNBOOK.md`, `docs/PRIVATE-STUDENT-VERIFICATION.md`. | Direct existence checks returned `MISSING` for all six paths. `npm run docs:check` passed locally, but that script validates only relative links in `SYSTEM.md`/`CHANGELOG.md`/`docs/*.md` and does not catch the README-level references. | Docs owner / DevOps | Restore the missing docs or remove/update the links so the repo map stops pointing to nonexistent files. |
| **G-003** | P1 | MISSING-IN-CODE | `docs/superpowers/specs/SPEC-availability-alerts.md` requires hostel/search availability alerts with date-aware `matched/unmatched` transitions, notifications, pause/resume/edit/delete behavior, and a dedicated alert data model. | The current code has only `PriceAlert` in `prisma/schema.prisma:688-718` and `src/lib/price-alerts.ts`, which checks price drops only and has no hostel/search date-range criteria, `matched` state, or availability-matching logic. This is a direct divergence from the spec. | Founder / Product / Backend | Either defer the module or implement the availability alert data contract and matching engine before treating the module as complete. |

## 4. Capability-map and spec acceptance mapping

| Module | Status | Evidence | Notes |
|---|---|---|---|
| `web-foundation` | Implemented | `src/app/layout.tsx`, `src/components/home/ProductHome.tsx`, page files under `src/app/`, `src/proxy.ts` | Matches the app shell and role-aware public pages that are present in code. |
| `room-inventory` | Partial | `src/lib/room-inventory-service.ts`; `prisma/schema.prisma` has `Room`, `BlockedDate`, `SeatHold` | Inventory and room edits exist, but `SYSTEM.md` still leaves open `D-2` (`minStay`/`maxStay`, date rules) and the repo is not fully closed on that contract. |
| `room-availability` | Partial / Implemented for Task 6 | `src/lib/room-availability-service.ts`, `src/lib/booking-service.ts`, `src/app/api/hostels/[param]/availability/exact/route.ts`, `prisma/schema.prisma` `SeatHold` model | Directly re-checked: booking writes require `roomId`, check exact room availability, and enforce seat holds. However, the broader spec remains partially open because `R-02` still states that stay rules and month/domain logic are not fully enforced. |
| `notification-center` | Partial | `src/app/api/notifications/route.ts`, `prisma/schema.prisma` `Notification` model | Notification infrastructure exists, but this audit did not validate full in-app read state, read actions, and cross-role coverage against the spec. |
| `student-marketplace` | Partial | `src/app/page.tsx`, `src/app/search/page.tsx`, listings/booking routes, `ProductHome` | The user-facing surface is present, but some deeper marketplace requirements remain spec-driven and not fully audited end-to-end in this repo-only pass. |
| `owner-workspace` | Partial | `src/app/owner/...` pages; `src/lib/room-inventory-service.ts` | Present, but no full acceptance matrix was built for every owner workflow in this pass; more work remains before launch sign-off. |
| `admin-console` | Partial | `src/app/admin/...` pages and routes | Present; not all admin actions were re-verified against the full acceptance criteria in this audit. |
| `availability-alerts` | Missing | `docs/superpowers/specs/SPEC-availability-alerts.md` vs `prisma/schema.prisma` `PriceAlert` and `src/lib/price-alerts.ts` | This is a direct spec gap and is the clearest current missing module. |

## 5. Risk-register verification (directly checked)

| Risk | Status | Evidence | Conclusion |
|---|---|---|---|
| **R-01** | Implemented in code; not fully production-verified | `src/lib/booking-service.ts`, `src/lib/room-availability-service.ts`, `prisma/schema.prisma` `SeatHold`, `prisma/migrations/20261105000000_add_seat_holds/migration.sql` | The seat-hold authority is present and the direct code path is aligned with the spec. The remaining caveat is operational validation against a disposable local PostgreSQL target, not a repo mismatch. |
| **R-02** | Open | `SYSTEM.md` explicitly says `minStay`/`maxStay` and max-duration rules remain unenforced; code review of `src/lib/booking-service.ts` confirms the validation is still limited to `roomId`, dates, guests, and enabled payment method. | Not a documentation mismatch; still an open code/business-risk gap. |
| **R-04** | Partially implemented; not live-validated | `src/lib/late-payment-resolution.ts`, `prisma/schema.prisma` `LatePaymentResolution`, `SafepayWebhookEvent`, direct payment webhook flow, and the late-payment tests | The repo contains the evidence and unit/integration coverage for the refund and retry logic, but the live Safepay sandbox/merchant settings remain UNVERIFIABLE and must be confirmed by the owner. |
| **R-06** | Fixed in code; console steps remain external | `.github/workflows/ci.yml`, `.github/workflows/production.yml`, `package.json` show Node 24 pin, permissions, and snapshot/migration steps. | Local repo state is aligned with the code fix; the remaining work is GitHub/Vercel/Neon console configuration, not repo-code drift. |
| **R-07** | Partially fixed | `src/lib/price-alerts.ts` documents the duplicate-send risk and preserves `lastKnownPrice`; there is still no durable outbox. | This matches the risk doc and is not a code/doc contradiction. |
| **R-09** | Stale in docs, but code has real pages | `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/terms/page.tsx`, etc., show the frontend is active; stale doc claims still say the app is API-only. | This is largely a documentation stale-state issue, not a code-product issue. |

## 6. Route/schema/env/CI/money/security/test checks

### App surface and API route checks
- `Get-ChildItem src/app -Recurse -Filter page.tsx` returned `36` page files.
- `node scripts/check-docs.mjs` reported: `docs check passed: 76 routes, 8 cron jobs, 65 env vars read, 40 Markdown files linked.`
- `src/proxy.ts` applies CSRF origin checks to non-exempt API routes and exempts OAuth and webhook routes; `src/lib/csrf.ts` rejects mismatched `Origin` in production and development-fail-safe logic.
- Current `README.md`/`PROJECT_STRUCTURE.md` still claim the opposite of the code, which is the core stale-doc issue.

### Schema / migration checks
- `npx prisma validate` passed: `The schema at prisma\schema.prisma is valid 🚀`.
- `prisma/MIGRATIONS.md` lists the Task 6 additions and the migration directories exist in `prisma/migrations/`.
- The direct Task 6 area is implemented in code: `SeatHold` and `LatePaymentResolution` are present in `prisma/schema.prisma`; `20261105000000_add_seat_holds` and `20261105100000_add_late_payment_resolution` exist.

### Config / env checks
- `.env.example` includes the required payment, auth, storage, search, cron and encryption variables.
- `scripts/check-docs.mjs` also validates the env-var list; it passed locally and reported `65 env vars read`.
- The code does not log or print secrets in the audit path; no secret values were recorded or stored in the report.

### CI/CD checks
- `.github/workflows/ci.yml` and `.github/workflows/production.yml` both show Node 24 via `.nvmrc`, `permissions:`, concurrency gating, `npm ci`, and the repo-quality gate steps.
- `production.yml` includes `NEON_SNAPSHOT_REQUIRED` and a production snapshot step before migration and deploy.
- This is consistent with the repo-level automation; live console configuration was not checked and remains external.

### Money/security checks
- `prisma/schema.prisma` stores `Payout.destinationSnapshot` as encrypted text and `SafepayWebhookEvent` as immutable evidence with deduplicated hashes.
- `src/lib/late-payment-resolution.ts` enforces a single resolution path and records `LatePaymentResolution` data with provider tracker uniqueness.
- `src/proxy.ts` + `src/lib/csrf.ts` enforce Origin checks for state-mutating API routes.
- `src/lib/price-alerts.ts` warns about duplicate sends and the missing durable outbox; this is a documented open risk, not a repo contradiction.
- We did not verify live Safepay merchant secrets or live production refunds; those remain UNVERIFIABLE.

### Test-claim checks
- `npm run test -- --run` passed: `217` test files passed, `1` skipped; `1406` tests passed, `7` skipped in the regular repository run.
- The separate guarded PostgreSQL verification was not part of the normal run: `.superpowers/sdd/2026-11-04-hostello-completion/task-6-report.md` records that the approved isolated loopback database passed all 7 guarded PostgreSQL cases: five Task 5 production-path inventory cases, one seat-hold migration constraint case, and one concurrent Task 6 late-payment case.
- `npm run typecheck` passed.
- `npx prisma validate` passed.
- `npm run docs:check` passed.
- Task 6-specific code paths are covered by direct repository tests (`src/lib/late-payment-resolution.test.ts`, `src/lib/room-availability-service.test.ts`, `prisma/seat-holds-migration.test.ts`), and the guarded Postgres verification is provided by the separate isolated-loopback evidence above; the regular Vitest run still shows those cases as skipped by design because they require a disposable DB target.

## 7. Unverifiable items and who must confirm them

- Live Safepay sandbox/production merchant setup and webhook refund behavior: Founder + Finance owner + Safepay integration owner.
- Production Neon/Vercel/GitHub environment approvals, required reviewers, and actual runtime secret configuration: Tech Lead + DevOps owner.
- Any live production booking or payment data: Founder + system owner.
- Production deployment and rollback confirmation: DevOps owner and Founder.
- Any real-time admin or operational claim from the live product: the owning team must confirm, not the repo.

## 8. Safe to rely on

- `npx prisma validate` passed.
- `npm run typecheck` passed.
- `npm run docs:check` passed.
- `npm run test -- --run` passed (`217` test files, `1406` tests passed).
- The current source tree contains a working first-party app shell and UI pages; the “API-only / no pages” claim is not safe to rely on.
- The Task 6 seat-hold implementation and late-payment resolution are present in code and migration history: `SeatHold`, `LatePaymentResolution`, and `20261105000000_add_seat_holds` / `20261105100000_add_late_payment_resolution` are on disk.
- The repository-level docs check is locally passing and consistent with the current route/env counts.

## 9. Recommended order of fixes and decisions needed

1. Correct the stale top-level documentation in `README.md`, `SYSTEM.md`, and `PROJECT_STRUCTURE.md` to reflect current repo reality.
2. Restore or remove the broken documentation links that point to missing runbooks and guides.
3. Decide whether `availability-alerts` remains in scope; if so, implement the date-aware `HOSTEL`/`SEARCH` alert contract before treating the module as shipped.
4. Confirm live provider and console settings before production release. This is a decision requirement from the Founder and DevOps/Finance owners.
5. Keep the current local code and test results as the source of truth for repository state, but keep live deployment claims out of the repo until the console owners verify them.

## 10. Remaining omissions / partiality

This audit is intentionally partial and explicitly does not claim a production release sign-off. Remaining omissions are:

- No direct live verification of Safepay webhooks, merchant config, refund reconciliation, or production database data.
- No direct GitHub/Vercel/Neon console review for required reviewers, environment secrets, or deployment approval settings.
- No browser-level end-to-end validation beyond the repository-local Playwright config and test set; the app was not exercised in a live browser from this session.
- No full historical design-doc review of every archived document under `docs/` and `docs/superpowers/`; this is intentional because those docs are secondary to the current source of truth, and the role requires verifying current code claims directly.
- This audit did not inspect all possible production-only code paths or provider-side edge cases beyond the code and local tests currently in the repo.

