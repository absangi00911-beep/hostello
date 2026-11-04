# HostelLo: Shared Team Instructions

Every role (Founder, Auditor, Tech Lead, Senior Frontend, Frontend, Backend/Integrations, Designer, QA/DevOps) reads this file first. Role-specific instructions live in each role's own Project; this file holds the rules that apply to all of them.

## Project

HostelLo is a student-first hostel marketplace for Pakistan (students book, owners list).
Stack: Next.js 16 (App Router, TypeScript), Prisma 7 + Neon Postgres, NextAuth v5, Typesense, Upstash (Redis, QStash), Cloudflare R2, Safepay, Resend, Twilio, Sentry.
Stage: pre-launch. NOT cleared for real transaction volume.

## Docs are not trusted by default

The docs in this repo are known to be stale and to contradict each other (page counts, route counts, test counts, "removed" features that still exist).

- Before relying on any statement in a doc, check `docs/audits/` for the latest gap report, then verify the claim in the code yourself.
- Code, schema, migrations, tests and CI config are the truth for what exists today. Specs, PRODUCT.md and the capability map are the truth for what is intended.
- If you find a new mismatch, report it to the Auditor in a handoff note. Do not silently work around it.

## Before any work

1. Read `AGENTS.md`. This Next.js version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
2. Read `PRODUCT.md`, `SYSTEM.md` (especially §16, the risk register R-01 to R-20), `HOSTELLO-CAPABILITY-MAP.md`, and the spec in `docs/superpowers/specs/` for the module you touch.
3. Check `tasks/todo.md` and `tasks/plan.md` for current work. Do not duplicate or contradict them.
4. Read the latest report in `docs/audits/`.

## Product rules (non-negotiable)

- Listings-first: the product opens on hostel listings. No marketing homepage.
- Show only auth methods that are actually configured (email/password always; Google only if credentials exist). Phone OTP verifies numbers; it is not a sign-in method.
- Student needs come first. Mobile-first: most users are on phones in Pakistan, often on slow networks.

## Build order

web-foundation, then room-inventory, then room-availability, then notification-center, then student-marketplace / owner-workspace / admin-console in parallel, then availability-alerts.

## Distributed role handoffs

The seven role briefs represent separate Claude.ai project sections running on separate computers. They cannot push directly to GitHub. The Founder coordinates assignments and reports but cannot operate those projects or computers directly; the human owner relays each assignment and returned handoff.

For every assignment:

1. The Founder prepares a bounded task packet with a unique task ID, role, objective, scope, acceptance criteria, dependencies, guardrails, and required checks. Do not send it until the human owner has approved the scope, unless the owner explicitly directs the assignment.
2. Before starting, the assigned role clones the repository fresh from GitHub, reads the current shared instructions and role brief, and checks the relevant project instructions, tasks, latest audit report, and feature docs. Record the checked-out base commit in the task report.
3. The role works only within the assigned scope, does not push, and returns a complete patch file plus a concise report. Include new and deleted files in the patch. The report states the task ID, base commit, files changed, checks run and results, blockers, and any decisions needed.
4. The Founder reviews the report and patch against the stated base and current repository, reports findings and verification results to the human owner, and does not apply the patch.
5. The human owner decides whether to approve, request revision, or reject the patch, and applies approved patches to the shared repository.
6. Record progress in `tasks/team-assignments.md`, including the patch/report reference, the human owner's decision, the applied commit when available, and verification results. Do not mark a task verified until its acceptance criteria have been checked.

Keep tasks small and avoid assigning overlapping files concurrently unless the human owner approves the coordination plan. If the shared repository changes after a role records its base commit, review for conflicts before applying the patch; request a fresh clone and updated patch if needed.

## Working rules

- Small, reviewable changes on a branch; conventional commit messages.
- Run `npm run typecheck`, `npm run lint` and `npm run test -- --run` before calling work done.
- Never commit secrets or edit `.env` files. Never apply migrations to a shared database without the Tech Lead's approval.
- When you close or change a risk, update `SYSTEM.md` §16 and `CHANGELOG.md`.
- Do not touch another role's area without a handoff note. Put handoffs in `tasks/`, one file per handoff: from, to, what changed, what you need.
- Do not guess. If a spec, API contract or product decision is missing, say so and ask the Founder. State assumptions explicitly.
- Be honest about status: say what you ran and what you did not. Never claim something works without verifying it.

## Always escalate to the Founder (who escalates to the human owner)

- Anything involving real money: live payments, refund or payout policy, fees, pricing.
- Production deploys, production data changes, turning on disabled providers (JazzCash, EasyPaisa).
- Legal, privacy or terms content; handling of student ID documents.
- Anything irreversible.
