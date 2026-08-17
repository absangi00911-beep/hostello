# HostelLo Owner Payout & Refund System

Date: 2026-07-01

Current status: Design spec for Phase 1 of the post-audit roadmap (see `WEB_APP_PROGRESS.md`). Not yet implemented. This closes the two P0 money-integrity gaps found in the July 1, 2026 repo audit.

## Purpose

Safepay currently collects the full booking amount into the platform's own account at booking time. Two things are missing as a result: owners have no way to actually receive that money, and a cancelled `PAID` booking has no reconciliation path. Both are business processes as much as engineering ones — this spec picks the simplest version of each that's honest about money, and defers anything fancier.

## Existing Context

`Booking.paymentStatus` already has a `REFUNDED` value in the `PaymentStatus` enum — it's just never set by anything. `PATCH /api/bookings/[id]` only ever writes `booking.status`. `src/lib/safepay.ts` has `createCheckoutSession` and `verifyWebhookSignature`; there is no refund function. `src/app/admin/bookings/page.tsx` already exists as an admin queue and is the natural place to add a refund action rather than building a new surface. Owners currently have no bank/payout details captured anywhere on `User`.

## Scope

In scope:
- A `Payout` model: a per-owner batch of eligible bookings, generated on demand by an admin, marked paid manually once the transfer actually happens outside the system.
- Owner bank/payout details capture (name, account number, account title — plain fields, not a payment integration).
- A simple owner-facing earnings view: pending balance, payout history.
- A refund action on the existing admin bookings queue for bookings that are `PAID` and `CANCELLED`.
- A best-effort automatic Safepay refund call, with a manual-confirmation path that always works regardless of whether the automatic call succeeds (see the Safepay note below — this matters).
- Student notification when a refund is processed.

Out of scope for this phase (revisit later, don't build now):
- JazzCash/EasyPaisa payouts or refunds — both are disabled platform-wide already.
- Automated bank transfer for payouts. Manual ledger + admin action only, per the audit's own recommendation that this is enough for current scale.
- Partial refunds. Full-refund only; partial is a real feature with its own edge cases and shouldn't be smuggled in here.
- Any commission/take-rate logic. The current model is subscription-only; payout amount is the full booking total, unchanged. If that ever evolves, it's a separate, deliberate pricing decision (already flagged as deferred in `WEB_APP_PROGRESS.md`).
- Owner- or student-initiated refund requests. Admin-triggered only for now — money code gets the narrowest, most auditable surface first; self-service can come later once the basic flow is proven.

## Design Decisions

**Payout timing — a booking becomes payout-eligible once `checkOut` has passed and the booking is `CONFIRMED` or `COMPLETED` with `paymentStatus: PAID`.** Not at booking time, not at check-in. Paying out before a stay is over means any late cancellation has to be clawed back from the owner instead of just reversed inside the platform's own Safepay balance — waiting for `checkOut` avoids that entirely for a first version.

**Payout amount is the full booking total, no deduction.** Matches the current subscription-funded business model; there's no commission logic to apply.

**Payout mechanism is a manual ledger.** An admin generates a payout batch for an owner (sums whatever's eligible and not yet in a payout), transfers the money by bank transfer or JazzCash outside the system using the owner's captured details, then marks the batch paid with a reference note. No bank API integration in this phase.

**Refunds are admin-triggered only**, from the existing admin bookings queue, not automatic and not self-service — for the same reason payouts are manual-ledger-first: this is the highest-stakes code in the repo, and the narrowest, most auditable path is the right place to start.

**The Safepay refund endpoint is unverified, and the implementation is built around that fact rather than hiding it.** `apidocs.getsafepay.com` renders client-side and doesn't expose its content to fetch, and the public guides mention refunds without ever showing the actual endpoint/payload — this is genuinely not confirmable from outside a merchant's own dashboard. `refundPayment()` will follow the same request shape as the existing `createCheckoutSession` (same base URL and `X-SFPY-MERCHANT-SECRET` header pattern) targeting a best-guess `/order/v1/refund`-style endpoint, clearly commented as unverified. The admin "process refund" action always succeeds at the level that matters — updating `paymentStatus` to `REFUNDED`, recording who/when, and notifying the student — regardless of whether the automatic gateway call succeeds; if it fails, the admin gets a clear message to complete the refund from the Safepay dashboard directly (which supports this natively) and confirm. **Before trusting the automatic path in production, check the real endpoint against the Safepay dashboard/Postman collection your account has access to — that's not something I can verify from here.**

## Data Model Changes

```prisma
model Payout {
  id          String       @id @default(cuid())
  owner       User         @relation(fields: [ownerId], references: [id])
  ownerId     String
  amount      Int          // whole PKR, sum of included bookings
  status      PayoutStatus @default(PENDING)
  reference   String?      // bank/JazzCash transfer reference, filled in when marked paid
  bookings    Booking[]
  createdAt   DateTime     @default(now())
  createdBy   String       // admin userId who generated the batch
  paidAt      DateTime?
  paidBy      String?      // admin userId who marked it paid

  @@index([ownerId])
  @@index([status])
  @@map("payouts")
}

enum PayoutStatus {
  PENDING
  PAID
  CANCELLED
}
```

`Booking` gains an optional `payoutId` + relation, and `refundedAt` / `refundedBy` fields (the latter for the admin audit trail — `paymentStatus: REFUNDED` alone doesn't say who processed it or when).

`User` gains optional `bankAccountTitle`, `bankAccountNumber`, `bankName` fields — plain strings, owner-editable, admin-visible. Not validated against any bank API; this is a ledger, not a payments integration.

## Flows

**Payout:** Admin opens `/admin/payouts` → picks an owner with a pending balance → generates a batch (server sums eligible bookings, creates a `Payout` row, tags those bookings with its id) → transfers funds manually → marks the batch paid with a reference note. Owner sees pending balance and payout history at `/owner/earnings`.

**Refund:** Admin opens `/admin/bookings`, filters to `PAID` + `CANCELLED` → clicks "Process refund" → server attempts `refundPayment()` against Safepay → on success or on manual confirmation, sets `paymentStatus: REFUNDED`, `refundedAt`, `refundedBy`, notifies the student → on gateway failure, shows the admin a clear "complete this in the Safepay dashboard, then confirm" path that still lets them close out the refund on our side.
