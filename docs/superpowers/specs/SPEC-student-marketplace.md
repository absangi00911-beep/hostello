# Spec: `student-marketplace`

## Objective

Restore the student-facing marketplace and account journeys, with exact
date-aware room choice and booking availability.

## Scope

- Discovery home and hostel results with current search filters, sorting, and
  pagination.
- Public hostel detail, favorite action, date selector, room comparison, and
  exact available seats for the selected stay.
- Booking review and payment initiation through the existing Safepay-only
  integration; booking list/detail and cancellation follow existing rules.
- Existing student capabilities: profile, student verification, conversations,
  reviews, roommate finder, and notifications.
- No price-alert UI in the new student experience.

Availability-alert controls are owned by `availability-alerts`, which adds
entry points to the hostel detail and search surfaces after this module is
available.

## API and privacy contract

- Reuse public search, favorite, booking, payment, conversation, review,
  roommate, profile, verification, and notification APIs where their current
  authorization/output are appropriate.
- Add a public-safe hostel detail projection. The existing
  `GET /api/hostels/[param]` is admin-only and includes owner contact
  information; it must not serve the student detail page.
- Add exact-range room availability. The monthly occupancy summary cannot
  validate a booking.
- Require a room selection and re-check the same dates and guest count on the
  server during booking creation.
- Show payment state, booking state, cancellation terms, and stale-availability
  conflicts without promising a confirmed stay before the existing workflow
  confirms it.

## Success criteria

- A student can discover, compare, inspect, and request a room end to end.
- Public pages never expose owner phone/email or admin-only listing metadata.
- Exact availability is shown for all days of the selected stay.
- A race or stale result returns a clear retry/change-dates path.
- Existing auth, payment, cancellation, review, and verification rules remain
  authoritative.

## Testing

- Tests for search filters, detail projection, room selection, booking states,
  and form validation.
- API tests for public redaction and booking authorization.
- Browser smoke test covering search → detail → date selection → booking
  review, plus an unavailable-room conflict.
