# HostelLo Web Experience and Date-Aware Availability

**Status:** Approved as the planning baseline; implementation remains gated on
approval of the implementation plan and execution method.

## Objective

Build a responsive first-party web application for HostelLo, a Pakistan-focused
hostel marketplace. Students must be able to discover hostels, inspect
date-specific room availability, book and manage stays, and receive
availability alerts. Owners must be able to manage listings and room inventory,
respond to bookings, and use their existing business tools. Admins must be able
to operate the moderation and payment workflows already supported by the
backend.

The repository currently has a Next.js API application and no first-party
pages or UI components. The work includes the frontend and the backend changes
needed for date-aware room availability and in-app availability alerts.

## Approved decisions and assumptions

1. Students, owners, and admins are all in scope.
2. Booking availability and alerts both use date-specific room capacity.
3. Availability alerts support both a specific saved hostel and a saved search.
   They are in-app only and English-only.
4. When an alert is created, evaluate it immediately. If availability already
   matches, create one notification and keep the alert active. Notify again
   only after the alert has first become unavailable and then available again.
5. The web application uses the existing same-origin Next.js deployment,
   Auth.js session, PostgreSQL/Prisma data layer, and established API services.
6. Include Terms and Privacy page shells, but do not write or invent legal
   content. Approved legal text is required before those pages are presented as
   final agreements.
7. The previously approved visual references are a provisional direction, not
   final visual approval: system typography, restrained green accent, calm
   neutral surfaces, role-specific navigation, responsive layouts, and
   reduced-motion support.
8. The capability map at [HOSTELLO-CAPABILITY-MAP.md](../../../HOSTELLO-CAPABILITY-MAP.md)
   is approved. It retains the six approved web module IDs and incorporates the
   deferred `room-inventory` and `room-availability` capabilities.

## Capability specifications

- [web-foundation](SPEC-web-foundation.md)
- [room-inventory](SPEC-room-inventory.md)
- [room-availability](SPEC-room-availability.md)
- [notification-center](SPEC-notification-center.md)
- [student-marketplace](SPEC-student-marketplace.md)
- [owner-workspace](SPEC-owner-workspace.md)
- [admin-console](SPEC-admin-console.md)
- [availability-alerts](SPEC-availability-alerts.md)

## Goals

- Provide complete, responsive journeys for the three existing roles.
- Make the displayed availability for a selected stay match the same
  date-aware inventory rules enforced when the booking is created.
- Preserve the existing payment, cancellation, listing-review, moderation,
  verification, refund, and payout rules.
- Provide accessible loading, empty, error, success, and conflict states.
- Keep public hostel data separate from owner contact details and admin-only
  fields.
- Replace the redesigned student-facing price-alert experience with
  availability alerts; do not remove or migrate the existing price-alert
  backend as part of this design.

## Non-goals

- Native mobile applications, push notifications, offline use, or a second
  backend service.
- Email or SMS delivery for availability alerts.
- Additional languages, currencies, payment providers, or a new payment policy.
- Admin user-account management; no such APIs currently exist.
- Writing legal terms or privacy-policy content.
- Changing the existing price-alert database or API unless a later approved
  migration explicitly includes it.
- Redesigning unrelated backend behavior or changing payment/cancellation
  rules.

## User-facing screen inventory

### Public and shared

- Home/discovery with clear student and owner entry points.
- Hostel search/results with the existing query, city, gender, price, amenity,
  sorting, and pagination capabilities.
- Public hostel detail with a date selector, room choices, and exact availability
  for the selected stay.
- Sign-in, sign-up, email verification, password reset, and contact surfaces
  backed by the existing auth and support flows.
- Terms and Privacy shells with no fabricated legal copy.
- Shared notification center for signed-in users.

### Student

- Booking creation, payment initiation, booking list, and booking detail/actions.
- Favorites, conversations/messages, reviews, roommate finder, profile, and
  student verification using existing capabilities.
- Availability-alert creation and management for a hostel or a saved search.
- No student-facing price-alert screen in the new interface.

### Owner

- Dashboard and listing list/create/edit/review-status surfaces.
- Room editor for name, description, monthly price, photos, facilities, and
  capacity; room availability is derived by the system.
- Booking list/detail with confirm or decline actions.
- Blocked-date calendar, conversations, review replies, analytics, earnings,
  and subscription management.

### Admin

- Listing review and status controls.
- Student-verification queue and analytics.
- Roommate-report moderation.
- Refund and payout workflows.
- Payment-event review/retry, listing statistics, and search-index sync.
- No user-account management screen.

## Date-aware inventory contract

- A booking selects a specific room. New bookings cannot be created against a
  listing that has no room records.
- A stay occupies the half-open interval `[checkIn, checkOut)`. Availability
  must be sufficient for every occupied day, not merely on check-in or as a
  monthly average.
- Date inputs are calendar dates (`YYYY-MM-DD`); the server uses a single,
  explicit Pakistan-local calendar boundary when translating dates to stored
  timestamps. Browser-local timezone must not change the stay.
- The requested guest count must fit the room's available capacity throughout
  the entire stay. Booking input continues to enforce the existing 1–4 guest
  rule.
- Pending bookings hold seats until cancellation, decline, expiry, abandonment,
  or checkout. Confirmed bookings hold seats through checkout. Cancelled and
  completed stays do not consume future inventory.
- Unpaid bookings retain the existing 30-minute payment window; paid pending
  requests retain the existing 24-hour owner-response window.
- Owner-blocked full calendar dates are unavailable. Preserve the current
  inclusive blocked-date endpoint behavior when checking overlap.
- Room capacity reductions, room deletion, and date blocks must not invalidate
  active holds. Return a clear conflict and preserve existing booking and room
  relationships.
- Availability reads and booking writes share one source of truth. The current
  global `Room.available` counter and monthly occupancy average are not
  sufficient as booking authority.
- The recommended persistence approach is the PostgreSQL seat-hold model
  described in [SYSTEM.md, Appendix A](../../../SYSTEM.md). It must enforce
  non-overlapping use of each room seat transactionally. Keep any existing
  columns through an expand-and-contract migration; do not silently drop or
  repurpose booking data.
- Before migrating, preflight future active bookings with no `roomId`. Do not
  silently discard or automatically detach them. Require an explicit mapping or
  support resolution before switching inventory authority.
- Validate concurrency against real PostgreSQL, including parallel attempts
  for the last available seat.

## Availability-alert contract

- Every alert has a stay date range and guest count; saved-search alerts also
  store a canonical subset of the existing search filters.
- A hostel alert matches when that hostel is active, matches the requested
  dates, and has at least one room with enough seats for the full stay.
- A saved-search alert matches when at least one active search result satisfies
  the same date and guest requirements. It produces one notification for the
  alert's unavailable-to-available transition, linking to the matching search,
  rather than one notification per hostel.
- Evaluate on alert creation and immediately notify if it already matches.
  Inventory-affecting changes must re-evaluate relevant alerts: booking
  creation/cancellation/expiry, owner decisions, room/capacity edits, date
  blocks, and listing activation changes.
- Store the alert state transition and its in-app `Notification` atomically and
  idempotently. While the alert remains matched, do not send repeats. Reset the
  match state when it no longer matches so a later availability cycle can
  notify.
- Alerts are user-managed and remain active after a notification. They can be
  paused, edited, or deleted; date-bound alerts expire when check-in begins.
- Alert notifications use English text and in-app delivery only: no email, SMS,
  or push.

## API and data boundaries

The UI consumes existing APIs where their current authorization and output
shape are safe. New or extended contracts are required for:

- A public-safe hostel detail projection. The current
  `GET /api/hostels/[param]` is admin-only and includes owner contact details;
  do not expose that response to students. The public projection returns only
  fields needed for discovery, booking, and display.
- Exact room availability for a required date range and guest count. It returns
  per-room capacity and available seats, without exposing booking identities or
  other students' data. The existing monthly summary may remain for overview
  display but cannot authorize bookings.
- Booking creation with a required `roomId` and server-side overlap/capacity
  enforcement.
- Availability-alert list/create/update/delete contracts. A discriminated
  input distinguishes hostel alerts from search alerts; validate dates,
  guests, and filters at the API boundary.
- Owner room edits that preserve stable room IDs and booking relations, derive
  hostel totals from room entries where applicable, and never trust a
  client-supplied `available` count.

New endpoint names and response schemas are to be finalized in the module specs
and implementation plan. Follow established bounded-input, pagination,
rate-limit, authorization, structured logging, and error-response patterns.
Do not broaden public projections or weaken role checks to make the UI easier.

## Visual and interaction direction

- Use platform system typography, clear size/weight hierarchy, and restrained
  green accent color on calm, high-contrast surfaces.
- Keep student discovery image-led and scannable; make date/room availability
  explicit before the booking action.
- Give owners dense but legible operational views; prioritize booking state,
  response deadline, room capacity, and earnings over decorative cards.
- Give admins queue-oriented tables and clear confirmation/error feedback for
  irreversible money or moderation actions.
- Make navigation role-specific and unambiguous. Support keyboard navigation,
  visible focus, semantic labels, and touch-sized controls.
- Motion is restrained and interruptible; respect `prefers-reduced-motion` and
  do not use motion to hide a state transition.
- Do not stack translucent surfaces or sacrifice contrast for visual effects.
- The mockups are reference direction only; the implementation must be checked
  at narrow and wide viewports and with reduced motion.

## Tech stack

- Next.js 16.4 App Router, React 19, TypeScript 6.
- Tailwind CSS 4, Framer Motion 13, Lucide React.
- Prisma 7 and PostgreSQL (Neon).
- Auth.js v5 JWT sessions; same-origin web requests.
- Vitest 4.1; Playwright is present as a development dependency, but its
  configuration and browser tests were removed and must be restored before
  relying on the `e2e` script.

Before writing Next.js code, read the relevant Next.js 16.4 guides under
`node_modules/next/dist/docs/` and follow the repository's `AGENTS.md`
instruction.

## Commands

```bash
npm run dev
npm run test -- --run
npm run typecheck
npm run lint
npm run build
```

`npm run e2e` is currently unsupported until its Playwright configuration and
tests are restored.

## Target project structure

The final route-group layout is an implementation detail to validate against
the installed Next.js 16.4 documentation. Keep the existing backend in place
and organize UI code by role and reusable domain components:

```text
src/app/                    Next.js routes and layouts
src/components/             shared UI and role-specific components
src/components/student/     discovery, booking, and alert surfaces
src/components/owner/       listings, room editor, booking tools
src/components/admin/       moderation and operations
src/lib/                     services, auth, server utilities
packages/shared/             shared types and Zod validation
prisma/                      schema and forward-only migrations
```

## Code style

Use explicit domain types, server-derived state, and semantic controls:

```tsx
type RoomAvailability = {
  roomId: string;
  capacity: number;
  availableSeats: number;
};

function RoomAvailabilityLabel({ room }: { room: RoomAvailability }) {
  return (
    <p>
      {room.availableSeats} of {room.capacity} seats available
    </p>
  );
}
```

Follow existing formatting, shared Zod schemas, route-handler authorization,
and component conventions. Do not introduce `any`, suppressions, or new
dependencies to work around unclear contracts.

## Testing strategy

- Vitest unit tests for date interval semantics, availability aggregation,
  alert matching, validation, and role-specific UI state.
- Service/API tests for authorization, public DTO redaction, booking transitions,
  blocked dates, capacity edits, alert lifecycle, idempotent notifications,
  and pagination.
- Real PostgreSQL integration tests for seat-hold exclusion, concurrent last
  seat attempts, cancellation/rebooking, migration/backfill behavior, and
  capacity reduction conflicts. Mocks alone do not prove concurrency safety.
- Restore focused Playwright smoke tests for public search/detail, student
  booking/alerts, owner room/booking workflows, and admin queue navigation.
- Manually verify responsive layouts, keyboard access, focus, error states, and
  reduced motion in a real browser.
- Run focused tests during implementation, then the full Vitest suite,
  typecheck, lint, build, docs check, and browser suite.

## Boundaries

- **Always:** enforce authorization in server handlers; validate external input;
  keep public hostel data minimal; use whole-integer PKR; preserve existing
  payment and cancellation rules; use date-aware availability for both booking
  and alerts; make state changes transactionally safe; surface conflicts and
  errors explicitly.
- **Ask first:** applying database or data migrations; changing CI/deployment
  configuration; adding dependencies; changing payment, cancellation, or
  legal-agreement behavior; publishing legal copy; expanding admin scope.
- **Never:** expose owner contact details in public DTOs; accept client
  availability as authoritative; delete/detach rooms with active bookings;
  send availability alerts by email/SMS/push; invent Terms or Privacy text;
  add admin user-management pages; suppress failing tests.

## Success criteria

- All listed student, owner, admin, public, and legal-shell surfaces are
  navigable and role-protected.
- A student sees date-specific availability for each selectable room, and a
  booking is rejected if capacity or blocked dates changed before commit.
- Concurrent requests cannot exceed room capacity for any overlapping stay.
- Existing future active bookings are preserved or explicitly reconciled before
  inventory migration.
- Roomless listings cannot accept new bookings; room edits preserve existing
  identifiers and booking relationships.
- Alerts support hostel and saved-search criteria, evaluate immediately at
  creation, notify only on false-to-true availability transitions, and create
  no duplicate notifications during one open cycle.
- Alert notifications are in-app and English-only.
- Public hostel responses contain no owner contact details or admin-only data.
- Legal pages contain no unapproved legal text.
- Automated, real-database, and browser checks pass before release.

## Open questions

- No remaining product-scope question blocks the design. The seat-hold
  persistence approach is a documented technical recommendation based on
  `SYSTEM.md` Appendix A; its database migration still requires explicit
  approval before implementation.
- Legal copy remains external input and must be supplied before Terms/Privacy
  pages are published as final policies.
