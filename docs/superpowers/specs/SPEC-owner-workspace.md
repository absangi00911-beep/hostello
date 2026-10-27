# Spec: `owner-workspace`

## Objective

Restore the owner workspace for listing operations, room inventory, booking
decisions, and existing business tools.

## Scope

- Owner dashboard and listing list/create/edit/review status.
- Room editor integrated into create/edit listing flows, based on
  `SPEC-room-inventory.md`.
- Paid booking queue and detail with confirm/decline actions and response
  deadlines.
- Blocked-date calendar, conversations, review replies, analytics, earnings,
  and subscription management.
- Availability and capacity displays use the same date-aware service as
  student booking; owner room counts are not manually edited as availability.

## Authorization and behavior

- Owner data and mutations are scoped by `ownerId` on the server.
- Preserve listing review transitions and existing plan/listing quota rules.
- Do not expose student PII beyond fields already authorized for owner booking
  workflows.
- Reject room deletions, capacity reductions, and blocked-date changes that
  invalidate active holds.
- Preserve existing payment, cancellation, and payout behavior.

## Success criteria

- An owner can edit listings/rooms and see pending review state.
- Booking actions are available only for authorized, paid pending requests.
- Blocked dates and room capacity changes reflect immediately in date-aware
  student availability.
- Earnings, messages, reviews, and subscription screens use the existing API
  capabilities without adding backend features outside scope.

## Testing

- Owner role/navigation and form tests.
- API/service tests for ownership, listing transitions, booking actions, and
  capacity/block conflicts.
- Browser smoke test for listing edit → room update and booking
  confirm/decline.
