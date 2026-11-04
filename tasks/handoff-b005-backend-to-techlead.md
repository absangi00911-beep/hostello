# Handoff: B-005 Safepay sandbox validation kit (Backend -> Tech Lead)

From: Backend/Integrations. To: Tech Lead (review). Date: 2026-11-04.
Branch: `docs/b-005-safepay-sandbox-runbook` (based on `main`). PR: NOT OPENED (no GitHub credentials here); a patch file is provided.

## What this adds (no payment or refund logic changed)
- `docs/runbooks/safepay-sandbox-validation.md`: checklist for the human owner, steps B to F, per-step "send back" lists, merchant-dashboard checklist (12 items, all UNVERIFIABLE FROM REPO), final report template.
- `scripts/safepay-sandbox-validation.mjs`: `preflight`, read-only `report <bookingId>` (with money-consistency checks), and `replay-webhook <bookingId>` (signed replay to the LOCAL app only). It never contacts Safepay. It refuses unless `NEXT_PUBLIC_SAFEPAY_ENV` is exactly `sandbox` (stricter than the app, which treats unset as sandbox), refuses DB commands without `--confirm-non-production-db`, refuses non-localhost replay targets, and refuses to replay unless the booking is already PAID by a real payment (it cannot fabricate a payment).
- `scripts/safepay-sandbox-validation.test.mjs`: 17 tests (guard, masking, signing, each invariant, CLI refusals).
- No new env vars, so `.env.example` and env validation are unchanged. No SYSTEM.md/CHANGELOG edit (B-001 also edits CHANGELOG "Unreleased"; please add a B-005 line on merge to avoid a conflict).

## Verified here
`npm run typecheck` exit 0, `npm run lint` exit 0, `npm run docs:check` exit 0, `npm run test:scripts` 23/23 (17 new). The script runs under `tsx` and fails cleanly, with no host or password in its output, when the database is unreachable.

## NOT verified (be aware when reviewing)
- The `report` and `replay-webhook` database queries were never run against a real database (none available here). Field names were checked against `prisma/schema.prisma` only.
- Nothing was run against Safepay. Every "expected" in the runbook comes from reading the code.
- `scripts/` is excluded from `tsconfig.json`, so `npm run typecheck` does not check the script; it is plain `.mjs` covered by eslint and `test:scripts`.

## Findings (no code changed; for the Auditor/Tech Lead)
1. **Webhook payload shape is an unverified assumption.** The route requires `type` of `payment.succeeded`/`payment.failed`, `data.state === "TRACKER_ENDED"`, amount in paisa, `data.metadata.order_id`, and `merchant_api_key`. If the real sandbox payload differs, payments will land in `RECONCILIATION_REQUIRED`. Step B is designed to surface this first.
2. **No idempotency key on the Safepay refund request** (`refundPayment`). Double-refund protection is entirely local (the B-001 claim). The runbook therefore checks the Safepay dashboard refund count in steps C, D and E.
3. **No dedicated test for the 15 s abort/timeout** in `refundPayment`; it relies on the generic failure path to `UNCERTAIN` (`refunds.test.ts:202` covers a failure, not a timeout).
4. **Admin refund rate limit (5/hour/admin) counts rejected requests too**, so a full validation needs about 9 actions and several sittings. Not a bug; the runbook plans for it.
5. `/api/payment/callback` handles JazzCash/EasyPaisa only. Safepay has no callback route; only the webhook settles a Safepay booking.
6. A second partial refund cannot occur through normal app flow (`cancellationRefundAmount` is set once at cancellation), so runbook step D2 needs a labelled database edit on a throwaway sandbox booking.
7. `.nvmrc` says Node 24; this sandbox ran Node 22 (all checks passed).

## Dependency
Run the validation on a build that includes B-001. Check E3 (two simultaneous refunds) is the real-Postgres test B-001's handoff said was missing.

## Left undone
Opening the PR; running the validation (the owner does this); the QStash retry exercise and late-payment paths (R-04, separate tasks).
