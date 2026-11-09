# HostelLo: Shared Team Instructions

Every role (Founder, Auditor, Tech Lead, Senior Frontend, Frontend,
Backend/Integrations, Designer, QA/DevOps, Marketplace Operations & Trust/Safety,
Growth & Partnerships, Security & Privacy Reviewer) reads this file first.
Workspace Copilot agents live in `.github/agents/`; the role briefs live in
[`roles/`](roles/README.md). This file holds the rules that apply to all roles.

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
3. Check the current work tracker when one exists. Do not assume a `tasks/`
   directory or create one solely to track a one-off assignment.
4. Read the latest report in `docs/audits/`.

## Product rules (non-negotiable)

- Listings-first: the product opens on hostel listings. No marketing homepage.
- Show only auth methods that are actually configured (email/password always; Google only if credentials exist). Phone OTP verifies numbers; it is not a sign-in method.
- Student needs come first. Mobile-first: most users are on phones in Pakistan, often on slow networks.

## Build order

web-foundation, then room-inventory, then room-availability, then notification-center, then student-marketplace / owner-workspace / admin-console in parallel, then availability-alerts.

## Local role assignments

Roles work in this VS Code workspace through workspace Copilot agents. The
Founder is the top project role and coordinates work through the specialist
agents; the human owner remains the final authority. The team is not split
across separate Claude projects or computers, and work is not relayed as patch
files.

For each assignment:

1. The assigning role gives one specialist a bounded objective, scope,
   acceptance criteria, dependencies, guardrails, and required checks. The
   human owner's explicit task is approval for that scope; ask before making
   additional product or policy decisions.
2. The specialist reads this file, its role brief, the relevant current code
   and tests, project instructions, and the latest audit report before relying
   on documentation. Work in the existing checkout; do not clone or create a
   second workspace for a normal assignment.
3. The specialist makes the scoped changes and returns a concise report to its
   assigner: task, files changed, checks run and results, blockers, risks, and
   decisions needed. It reports what it actually verified and does not claim
   success based on unrun checks.
4. The assigner reviews the diff and verifies the acceptance criteria before
   reporting completion. The Founder consolidates cross-role status and
   reports it to the human owner.
5. Keep concurrent assignments on non-overlapping files unless the owners
   explicitly coordinate shared changes. Do not assume `tasks/` tracking files
   exist; create persistent task records only when requested or needed by an
   approved workflow.

Agents do not commit, push, deploy, or make changes to shared/production data
unless the human owner explicitly authorizes that action.

## Working rules

- Small, reviewable changes on a branch; conventional commit messages.
- Run `npm run typecheck`, `npm run lint` and `npm run test -- --run` before calling work done.
- Never commit secrets or edit `.env` files. Never apply migrations to a shared database without the Tech Lead's approval.
- When you close or change a risk, update `SYSTEM.md` §16 and `CHANGELOG.md`.
- Do not touch another role's area without coordinating ownership. Include
  handoff details in the assignment report or the project's existing tracker;
  do not create `tasks/` solely for a one-off handoff.
- Do not guess. If a spec, API contract or product decision is missing, say so and ask the Founder. State assumptions explicitly.
- Be honest about status: say what you ran and what you did not. Never claim something works without verifying it.

## Always escalate to the Founder (who escalates to the human owner)

- Anything involving real money: live payments, refund or payout policy, fees, pricing.
- Production deploys, production data changes, turning on disabled providers (JazzCash, EasyPaisa).
- Legal, privacy or terms content; handling of student ID documents.
- Anything irreversible.

Finance, legal, tax, and regulatory questions require qualified human or
external advice. AI roles may organize questions and summarize verified
materials, but must not represent their output as professional advice or
approve policy, contracts, budgets, or compliance decisions.
