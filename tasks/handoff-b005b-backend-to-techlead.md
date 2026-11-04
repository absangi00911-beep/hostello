# Handoff: B-005b Vercel-preview variant of the Safepay sandbox runbook (Backend -> Tech Lead)

From: Backend/Integrations. To: Tech Lead (review required). Date: 2026-11-04.
Branch: `docs/b-005b-safepay-preview-runbook` (from `main`). Docs only. Nothing deployed. No payment or refund logic changed.

## What changed
- `docs/runbooks/safepay-sandbox-validation.md`: new section "Running on a preview deployment" (P1 to P6) placed before "0. Setup", a "Two variants" pointer in the header, and one-line "Preview variant" markers at 0.2, 0.3, 0.6, B and E1.
  - P1 prerequisites checklist: deployment is Preview not Production, commit includes B-001 (with the exact `git merge-base` check), separate database / Redis / QStash, test-only recipients, stable alias as `NEXT_PUBLIC_APP_URL` and webhook URL, Deployment Protection must not block the webhook.
  - P2 sandbox and data-isolation checks (replaces 0.3 for this variant).
  - P3 per-step status table. P4 cron routes (none needed; manual trigger for each). P5 tunnel-specific parts that do not apply. P6 clean-up.
- The six "Send back" lines are byte-identical to `main` (checked with a diff). No secrets, tokens, card details or personal data added (scanned).

## PR description (paste as is)
**Before:** the runbook assumed `npm run dev` behind a tunnel. On a Vercel Preview (`NODE_ENV=production`) two of its instructions fail: leaving `QSTASH_TOKEN` unset (the webhook throws, `route.ts:677`) and leaving Redis unset (the rate limiter throws, `rate-limit.ts:51`).
**After:** a preview variant with a prerequisites checklist, sandbox and data-isolation checks, and every step marked: run as written, changed, QSTASH-DEPENDENT, or SKIPPED-ON-PREVIEW (scripted webhook replay in E1 only).
**Verified:** every code claim was read from `main` with file and line. `node scripts/check-docs.mjs` reports one broken link in `docs/API-MASTERY-GUIDE.md` (into `node_modules`, not installed here); it fails identically on untouched `main`, so it is not from this change.

## Decisions I made that you may want to change
1. **Deployment Protection is turned off for the run.** The Upstash bypass secret is a request header; the app's QStash publish sends no custom header (`route.ts:664-669`) and nothing shows Safepay can add one. So the bypass route needs a code change. The runbook therefore tells the owner to switch protection off for Preview for the run and back on after (P6), with fake data only. If you prefer a code change to send a bypass header, say so.
2. **E1 scripted replay is SKIPPED-ON-PREVIEW** rather than worked around: the script refuses non-localhost targets by design. The dashboard resend (0.1 item 11) is offered as the preview alternative. "Pass" in the runbook still lists E1; on a preview it can only be met through the resend, so you decide whether a local E1 run is required before launch.
3. **The commit check is on the B-001 code commit `048db53`**, not the merge commit `0d4710e`, because the `preview` branch contains the first and not the second. A `main` build at or after the merge passes the same check.

## NOT verified
- All Vercel, Upstash and Safepay dashboard behaviour (Deployment Protection settings, branch alias address, "Preview" label, variable scoping) is marked UNVERIFIABLE FROM REPO in the text. A web search returned titles only; the one page I could read (Upstash on Vercel protection) supports the header point.
- The runbook was not run end to end on a real preview. Nothing was run against Safepay, Vercel, Upstash or a database.
- Descriptions of `mark-completed-stays`, `check-price-alerts`, `cleanup-tokens`, `cleanup-verification-uploads` and `process-account-deletions` are taken from the route's own calls and names, not from reading each library function.

## Needed from you
1. Review, and open the PR (no GitHub credentials in my sandbox if the push below failed; a patch file is provided).
2. Decide the two points above (Deployment Protection approach; whether E1 must be covered by a local run).

## Left undone (out of scope)
Late payments, the sweeper, the QStash retry exercise and cron-started refunds stay in the runbook's "Not covered". No `.env.example`, env validation or SYSTEM.md change (no new configuration was added).
