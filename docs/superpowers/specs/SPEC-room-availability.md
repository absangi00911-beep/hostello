# Spec: `room-availability`

## Objective

Replace global room availability as the booking authority with date-aware,
capacity-safe inventory used consistently by booking writes, exact
availability reads, owner blocks, room edits, and availability alerts.

## Contract

- Stays occupy `[checkIn, checkOut)` calendar dates.
- Pending requests and confirmed stays hold their requested guest seats until
  cancellation, decline, expiry, abandonment, or checkout.
- Preserve the existing unpaid 30-minute hold and paid pending 24-hour owner
  response window.
- An owner block applies to each full calendar date in the stored inclusive
  range. A block may not invalidate active holds.
- A room is bookable only if at least the requested number of seats remains
  available on every date of the stay.
- New bookings require a specific `roomId`; listings without room records
  cannot accept new booking requests.
- Date-only input is normalized using a single Pakistan-local calendar boundary
  on the server, independent of browser timezone.
- The current monthly aggregate availability endpoint is informational only.
  Add an exact-range read for the selected stay; expose counts, never booking
  identities.
- All booking writes and availability decisions use the same authoritative
  inventory model.

## Recommended implementation

Use the PostgreSQL seat-hold/exclusion-constraint proposal in
[SYSTEM.md, Appendix A](../../../SYSTEM.md) as the baseline. Allocate one hold
per requested seat inside the booking transaction; rely on a database
constraint to prevent overlapping claims. Release holds in the same
transaction as cancellation, decline, expiry, or abandoned-payment cleanup.
Completion needs no release if holds are bounded by checkout.

Migrate using expand-and-contract. Preflight future active bookings with no
`roomId`; require explicit mapping or support resolution before switching
authority. Keep old columns until all readers have moved, then retire them in a
separate approved migration.

## API behavior

- Exact availability is queried for a required hostel, date range, and guest
  count; results include each room's capacity, available seats, and whether it
  can fit the request.
- `POST /api/bookings` validates `roomId`, dates, guests, listing/room state,
  blocks, and capacity inside the transaction.
- Stale availability or capacity conflicts return HTTP 409 with a clear,
  user-actionable message. Do not return success-shaped fallbacks.
- Owner capacity edits and blocks return conflicts when they overlap active
  holds.

## Success criteria

- No overlapping allocation can exceed room capacity, including under parallel
  booking attempts.
- Search/detail availability and booking enforcement agree.
- Cancellation and expiry release inventory; checkout ends occupancy without a
  cron dependency.
- Blocked dates are honored at read and write time.
- Legacy active roomless bookings cannot be silently lost.

## Testing

- Date interval, occupancy, and block overlap unit tests.
- Real PostgreSQL integration tests for parallel last-seat booking, cancel and
  rebook, pending expiration, checkout, block conflicts, and capacity edits.
- Property test that free seats equal capacity minus active overlapping holds
  after every valid booking-state transition.
