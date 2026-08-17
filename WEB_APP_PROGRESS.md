# HostelLo — Web App Progress

**Last updated:** July 5, 2026
**Status:** Pre-launch polish and hardening. The core product is feature-complete, well-tested, and built with real engineering discipline (enforced migration workflow, idempotent webhook handling, environment validation). Both money-integrity gaps from the July 1 audit — owner payout and refunds — are closed as of Phase 1 (below). Next up is mobile beta readiness (Phase 2).

This file was recreated on July 1, 2026 after being found missing from a repo export; see the session log at the bottom. Update it at the end of a session, not mid-session — that's what caused the previous copy to drift out of sync in the first place.

---

## Shipped

**Discovery & trust** — search (Typesense, with automatic Prisma fallback), city/university landing pages, three-way comparison with sticky tray, favorites, safety score surfacing, verified student badge with admin review flow.

**Booking & payments** — full booking flow, semester booking mode, Safepay payment (live), booking status management, owner-managed blocked dates with calendar merging.

**Trust & communication** — reviews with owner replies, messaging/conversations, roommate finder (posts, expiry, reporting, conversation threading), WhatsApp share with Open Graph tags.

**Owner tools** — analytics dashboard (SVG bar chart), subscription tiers with Safepay integration and listing-quota enforcement, listing management, payout ledger with bank-details capture and an owner earnings view (`/owner/earnings`).

**Money integrity** — manual-ledger owner payouts (admin generates a batch of checkOut-passed bookings, marks paid with a reference note) and admin-triggered refunds (best-effort automatic Safepay call with a manual-confirmation fallback that always closes out the booking state). Full design in `docs/superpowers/specs/2026-07-01-payout-refund-system.md`.

**Notifications** — email unsubscribe links, push device-token registration (Firebase Admin), price alerts (email only — not in-app, correcting an earlier assumption in this file), refund-processed notifications (in-app + email), in-app notification center.

**Mobile app (Expo)** — auth, home/search, hostel detail, booking + payment, conversations, favorites, profile.

**Admin** — listing/hostel moderation, review moderation, search sync, student-verification review, payout queue (`/admin/payouts`), refund processing on the bookings queue.

---

## Open

### P0 — before real transaction volume
*(closed as of July 5, 2026 — see Shipped above and the spec/plan under docs/superpowers/)*
- [x] ~~Owner payout/settlement system~~ — shipped as a manual ledger, per the audit's own recommendation for MVP scale.
- [x] ~~Refund flow~~ — shipped as admin-triggered, with one caveat below.

### P1 — launch blockers
- [ ] Physical-device QA: Safepay return flow (paid/cancelled/failed/abandoned) and push notifications (registration, foreground/background/killed delivery, tap routing, stale-token cleanup) — simulator-tested only so far.
- [ ] Confirm Neon production PITR/backup retention window.
- [ ] Force the business mobile-gate decision explicitly (booking volume, support capacity, budget) before external beta.
- [ ] JazzCash/EasyPaisa mobile callback-flow design spike — their redirect model doesn't map cleanly onto the mobile deep-link pattern Safepay uses. **Investigation done** — see `docs/superpowers/specs/2026-07-05-jazzcash-easypaisa-mobile-spike.md`: two small, independent gaps (getting to the gateway needs a form-POST the mobile browser session can't do directly; getting back needs the callback route to know the payment was mobile-initiated), both with a concrete fix, neither implemented yet. Still your call on timing.

### P2 — coverage and docs
- [x] ~~Roommate finder — zero automated test coverage~~ — 22 tests added across all 3 route files, all passing. Two real findings surfaced while writing them, not yet fixed (deliberately — both are product-behavior calls, not code-quality fixes I should make silently):
  - **The report-based auto-hide threshold doesn't work as the code implies.** `AUTO_HIDE_REPORTS = 3` suggests a post tolerates up to 2 reports before disappearing from the public feed, but the DB query (`reports: { none: {} }`) already filters to zero-report posts before that count is ever checked — so a post vanishes from `GET /api/hostels/[param]/roommates` after its very first report, and the `_count.reports < 3` check never actually rejects anything. Locked in as a test (`hostels/[param]/roommates/route.test.ts`) so it's documented either way, but worth a decision: tolerate more reports before hiding, or is "hide on first report" actually fine?
  - **`src/app/api/roommates/[id]/route.ts` and `.../[id]/report/route.ts` are byte-identical** — both implement report-a-post. A bare POST to a resource's own `/[id]` isn't a natural home for "report"; more likely `[id]/route.ts` was meant to be something else — most plausibly a DELETE for the post's own author, since there's currently no way for anyone (author or admin) to remove a roommate post once created. There's also no admin moderation surface for this feature at all — reports only ever auto-hide, nothing surfaces them for review.
- [x] ~~Admin routes — zero test coverage~~ — 32 tests added across all four (`admin/listings`, `admin/hostels`, `admin/verifications`, `admin/search/sync`). One smaller finding: `admin/verifications`' PUT handler sends student-verification notifications using the `HOSTEL_APPROVED`/`HOSTEL_REJECTED` types (the code already comments "reuse closest type") — self-documented, not a surprise, but worth knowing if a notification-bell UI ever assumes those types always carry a `hostelId`, since these don't.
- [ ] Mobile notifications/price-alerts parity — 5 tabs (home, bookings, favorites, messages, profile), no dedicated screen for either, while web has both. Needs a deliberate call: fold into an existing tab vs. add screens.
- [ ] `DESIGN.md`, `DESIGN_MOBILE.md`, `MOBILE_APP_STRATEGY.md`, `MOBILE_ALIGNMENT.md`, `Mobile_Dev_Plan.md` — confirmed gone (not on another branch/machine), not yet recreated.

### Hygiene (low urgency)
- [ ] Confirm `.gitignore` covers `packages/shared/node_modules/` (~23MB) and local `e2e-server.*.log` files if this export becomes a working copy.
- [ ] **Confirm the real Safepay refund endpoint** against your merchant dashboard/Postman collection. `refundPayment()` in `src/lib/safepay.ts` **was** targeting a best-guess `/order/v1/refund` with the tracker in the body — as of 2026-08-06 it targets `/order/payments/v3/{tracker}/refund` with the tracker in the URL path instead, sourced directly from the `@sfpy/node-core` SDK source (`github.com/getsafepay/node-core`, `src/resources/Order/Cancel.ts`) after the docs site again proved unreachable outside a browser session. Much stronger footing than before, but the body schema beyond `amount`/`currency` still isn't SDK- or dashboard-confirmed. Still not a launch blocker (the admin refund action always closes out the booking on our side regardless of whether the gateway call itself works), but run one real sandbox refund before trusting the automatic path in production.

---

## Deferred to v2

Multi-currency/international expansion, native owner/admin mobile dashboards, offline search, video reviews, Apple Pay/Google Pay, and — once payout infrastructure exists — possible evolution toward a commission-based revenue model alongside or instead of the flat owner subscription. Don't pull any of these forward without a deliberate decision; they're deferred on purpose, not by oversight.

---

## Numbers (updated July 5, 2026 — recounted, not carried forward)

46 web pages · 61 API routes · 23 Prisma models · 17 migrations (Jan 1 – Jul 5, 2026) · 42 test/spec files (37 Vitest + 5 Playwright) · 320 passing Vitest tests · 15 mobile screen/layout files · PKR 3,000/month Pro plan.

Dropped the tracked-file-count and LOC figures from this update — recounting them without `git ls-files` (not available in the sandbox this session ran in) risks comparing a different file set than however "505 files" / "~33,800 lines" was originally produced, which would be worse than no number at all. Re-run `git ls-files | wc -l` and a real LOC tool in your own environment to refresh those two specifically.

Full project lint re-run for real this session: **0 errors, 31 warnings** — not 54. Either the original count was already stale, or a dependency patch version shifted something; either way, 31 is what an actual `eslint .` reports right now, in the touched-plus-untouched codebase alike.

Full `tsc --noEmit` was also attempted, with one important caveat: this sandbox can't reach `binaries.prisma.sh`, so `@prisma/client`'s generated types don't exist at all here, and that cascades into real-looking errors across files this session never touched (auth config, a couple of test files, `compare/page.tsx`) — the same root cause already confirmed on `booking-service.ts` earlier in this session, just showing up more broadly on a full run than it did on single-file checks. **This isn't a substitute for running `tsc --noEmit` in an environment where `prisma generate` actually completes** — do that before trusting any typecheck claim in this file going forward, including this one.

---

## Session log

One line per session, most recent first. Keep it short — this is a log, not a changelog.

- **July 5, 2026 (cont'd)** — Phase 2's non-code items (physical-device QA, Neon PITR, business mobile-gate) confirmed as founder-only and left for you. Did complete the JazzCash/EasyPaisa mobile design spike (`docs/superpowers/specs/2026-07-05-jazzcash-easypaisa-mobile-spike.md`) — two small, independent, already-scoped gaps, not implemented, timing still your call. Completed Phase 3 in full: roommate finder (22 tests, surfaced two real findings — see P2 above) and all four admin routes (32 tests, one smaller self-documented finding). Structured logging correctly left alone — still P3, not urgent, per the original doc. Also re-verified project-wide lint (31 warnings, correcting the stale "54") and attempted a full typecheck (mostly the known Prisma-client sandbox artifact, see below). 320 tests passing, same one pre-existing unrelated mobile failure throughout the entire session.
- **July 5, 2026** — Phase 1 (money integrity) shipped end to end: `Payout` model + migration, payout service, admin payout API + `/admin/payouts` page, owner `/owner/earnings` page, refund service with a best-effort Safepay call + manual fallback, wired into the admin bookings queue, `BOOKING_REFUNDED` notification type + migration, in-app + email refund notifications. Every task had tests actually run (not written blind) via a full `npm install` + local Postgres set up in-session, since neither was available by default. 266 Vitest tests passing, zero regressions, one pre-existing unrelated mobile-tsconfig test failure untouched. One thing still needs founder action: confirm the real Safepay refund endpoint (see Hygiene above).
- **July 1, 2026** — Full repo audit, verified claim-by-claim against actual code rather than trusted at face value (route count, missing docs, P0 payout/refund gaps, webhook idempotency all confirmed by direct file inspection). Closed out Phase 0: added root `README.md`, recreated this file and `SENTRY_SETUP.md`, fixed the API route count in `SYSTEM.md`/`PROJECT_STRUCTURE.md` (53 → 57), tightened the `Booking.total` schema comment.