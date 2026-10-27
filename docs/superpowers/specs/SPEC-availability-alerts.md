# Spec: `availability-alerts`

## Objective

Let students receive one in-app notification when a hostel or saved search
becomes available for a chosen date range and guest count.

## Alert input

Use a discriminated request:

- `HOSTEL`: `hostelId`, `checkIn`, `checkOut`, `guests`.
- `SEARCH`: canonical supported search filters, `checkIn`, `checkOut`,
  `guests`.

Dates are calendar dates and must be valid, future-facing, and ordered.
`guests` follows the existing booking limit. Search filters are limited to
fields supported by the public search API.

## Behavior

- Evaluate availability synchronously at alert creation. If it already matches,
  create the notification immediately and leave the alert active.
- A hostel alert matches when its listing is active and at least one room fits
  the guest count for every day in the date range.
- A search alert matches when at least one active result with a fitting room
  exists. One alert-level notification links to the matching search rather than
  sending one message per matching hostel.
- Re-evaluate after inventory changes that could alter a match: booking
  creation/cancellation/expiry, owner decisions, room/capacity edits, blocked
  dates, and listing activation changes.
- Persist `matched/unmatched` transition and the notification atomically. Emit
  only on `unmatched → matched`; do not repeat while matched. Reset after
  `matched → unmatched` so a later availability cycle can notify.
- Alerts remain active after notification. Students can pause, resume, edit, or
  delete them. Editing date/filter/guest criteria resets match state and
  evaluates the new criteria immediately.
- Expire a date-bound alert when its check-in date begins.
- Deliver in-app English notifications only. No email, SMS, or push.

## API and data contract

- Authenticated student-only list/create/update/delete APIs.
- Paginated list, explicit alert type, criteria, dates, guest count, active or
  expired state, and last-match state in the response.
- Public listing data is not copied wholesale into alert records; store only the
  minimum criteria needed to match and link users back to safe public results.
- Use rate limiting, bounded JSON, boundary validation, user scoping, and
  conflict responses consistent with existing alert APIs.
- Database uniqueness/idempotency must prevent duplicate notifications when
  inventory events retry.

## Success criteria

- Both alert types can be created and managed.
- Immediate matching availability creates exactly one notification.
- Continued availability produces no duplicates.
- A later unavailable-to-available transition creates one new notification.
- Search alerts do not generate one notification per hostel.
- Notifications are in-app, English-only, and linked to safe screens.

## Testing

- Unit tests for criteria normalization and date-aware matching.
- Service tests for create-time evaluation, false/true transitions, retries,
  expiry, pause/resume, and duplicate prevention.
- Real PostgreSQL tests for atomic alert-state/notification writes.
- Browser test for creating and managing each alert type.
