# HostelLo Web Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a responsive student, owner, and admin web application with date-aware room booking and in-app hostel/search availability alerts.

**Architecture:** Keep the existing same-origin Next.js App Router application and API/service architecture. Build the shared shell first, then room inventory and the PostgreSQL seat-hold service, then role screens; alerts consume the shared date-aware availability service and notification center. Preserve existing payment, listing-review, cancellation, and admin authorization boundaries.

**Tech Stack:** Next.js 16.4, React 19, TypeScript 6, Tailwind CSS 4, Framer Motion 13, Prisma 7, PostgreSQL, Auth.js v5, Vitest 4, Playwright (already a dev dependency).

**Spec:** [Design](../specs/2026-10-25-hostello-web-design.md), [capability map](../../../HOSTELLO-CAPABILITY-MAP.md), and the eight module specs linked from that map.

## Global Constraints

- Use the existing same-origin Next.js deployment, Auth.js session, PostgreSQL/Prisma data layer, and established API services.
- Booking availability and alerts both use date-specific room capacity.
- A stay occupies the half-open interval `[checkIn, checkOut)` calendar dates.
- Normalize date-only input at one Pakistan-local calendar boundary on the server; browser timezone must not alter stay dates.
- The existing 1–4 guest booking rule remains in force.
- Pending bookings hold seats until cancellation, decline, expiry, abandonment, or checkout; confirmed bookings hold seats through checkout.
- Preserve the existing unpaid 30-minute payment window and paid pending 24-hour owner-response window.
- Owner-blocked full calendar dates are unavailable.
- Availability alerts are in-app only and English-only; do not add email, SMS, or push delivery.
- Store prices as whole-integer PKR and keep the existing Safepay-only payment behavior.
- Do not expose owner contact details in public hostel responses.
- Do not invent Terms or Privacy copy; legal text must be separately approved.
- Respect `prefers-reduced-motion` and retain visible keyboard focus.
- Read the relevant Next.js 16.4 guides under `node_modules/next/dist/docs/` before writing Next.js code.
- Do not apply a schema or data migration until the user explicitly approves it.
- Add no dependencies, admin user-management APIs, payment providers, or unrelated behavior.
- Commit each independently passing task separately after its verification step.

## Review Focus

1. **Timezone and interval boundaries:** date-only input must be independent of browser timezone, and checkout is excluded. Pin this in `src/lib/seat-holds.test.ts` with tests for equal calendar dates in different browser timezones, check-in inclusion, and checkout exclusion.
2. **Last-seat races:** concurrent bookings cannot exceed capacity. Pin this in the PostgreSQL integration test for `claimSeatHolds`.
3. **Legacy bookings without a room:** future pending/confirmed bookings with `roomId = null` must be surfaced before switching inventory authority; pin this in `src/lib/seat-hold-preflight.test.ts`.
4. **Alert retries and cycles:** a repeated inventory event while an alert remains matched cannot create another notification; a later unmatched-to-matched transition creates one. Pin this in `src/lib/availability-alerts.test.ts`.
5. **Public data and role boundaries:** student detail responses exclude owner contact/admin fields, and owner/admin actions reject other roles; pin this in the public hostel route test and affected role-route tests.

---

## File Structure

- `src/app/` — public, student, owner, and admin routes; global layout and styles.
- `src/components/` — shared shell, accessible UI primitives, and domain components grouped by role.
- `src/lib/` — availability, booking, alert, and presentation helpers alongside existing services.
- `packages/shared/src/validations/` — shared Zod boundary schemas.
- `prisma/` — PostgreSQL schema and forward-only migrations.
- `scripts/` — read-only migration preflight.
- `e2e/` — Playwright browser smoke tests.

The route-group and stylesheet conventions must be selected after reading the installed Next.js 16.4 documentation; do not copy conventions from older Next.js versions.

---

## Tasks

### Task 1: Establish the responsive web shell

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `playwright.config.ts`
- Create: `e2e/web-foundation.spec.ts`

**Interfaces:**
- Produces the root layout, global theme primitives, public home route, and a configured Chromium smoke-test command.
- Read the relevant Next.js 16.4 layout, CSS, metadata, and route-handler guides before implementation.

- [ ] **Step 1: Write failing browser tests** `home_has_student_and_owner_entry_points`, `keyboard_navigation_reaches_primary_actions`, and `prefers_reduced_motion_disables_nonessential_motion`.
- [ ] **Step 2: Configure the Chromium project and local web server in `playwright.config.ts`, then run `npm run e2e -- --project=chromium`**; expected: FAIL because the home route or links are missing.
- [ ] **Step 3: Implement the root layout, responsive global styles, and home page** using the approved provisional palette and semantic HTML.
- [ ] **Step 4: Run the focused test** with `npm run e2e -- --project=chromium`; expected: PASS at desktop and mobile viewport sizes.

### Task 2: Add role-aware navigation and account entry

**Files:**
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/components/layout/RoleNavigation.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `e2e/auth-shell.spec.ts`

**Interfaces:**
- `RoleNavigation` consumes the server-resolved role (`STUDENT | OWNER | ADMIN`) and returns only that role's navigation links.
- Login and signup forms submit to the existing Auth.js/API flows; never implement authorization in client state alone.

- [ ] **Step 1: Write the failing browser tests** `navigation_is_role_specific` and `account_forms_show_server_errors` for student/owner/admin links and invalid credential feedback.
- [ ] **Step 2: Run the focused tests**; expected: FAIL because account pages and role navigation do not exist.
- [ ] **Step 3: Implement the header, role navigation, login, and signup pages** with keyboard-visible focus and responsive menu behavior.
- [ ] **Step 4: Run `npm run e2e -- --project=chromium`**; expected: PASS for all role fixtures and form error states.

### Task 2B: Add server-side page role guards

**Files:**
- Create: `src/lib/auth/page-access.ts`
- Create: `src/lib/auth/page-access.test.ts`
- Create: `src/app/access-denied/page.tsx`

**Interfaces:**
- `requirePageRole(allowedRoles: readonly UserRole[]): Promise<Session>` returns the authenticated session, redirects anonymous users to `/login`, and redirects wrong-role users to `/access-denied`.
- Student, owner, and admin pages call this helper; hiding links in `RoleNavigation` is not authorization.

- [ ] **Step 1: Write failing tests** `anonymous_page_access_redirects_to_login` and `wrong_role_page_access_redirects_to_denied`.
- [ ] **Step 2: Run `npx vitest run src/lib/auth/page-access.test.ts`**; expected: FAIL because the helper does not exist.
- [ ] **Step 3: Implement the server-only page guard** using the existing Auth.js session and Next.js 16.4 redirect conventions.
- [ ] **Step 4: Run the focused tests**; expected: PASS for anonymous, allowed-role, and wrong-role cases.

### Task 3: Complete owner room validation and editor

**Files:**
- Create: `src/components/owner/RoomEditor.tsx`
- Create: `src/components/owner/RoomEditor.test.tsx`

**Interfaces:**
- Consume the existing `RoomTypeInput` and `roomTypeSchema` from `@/lib/validations`; do not duplicate validation logic.
- `RoomEditor` accepts `rooms: RoomTypeInput[]` and emits validated room-entry changes; it never accepts an editable `available` value.
- Props: `{ rooms: RoomTypeInput[]; onChange(next: RoomTypeInput[]): void }`.

- [ ] **Step 1: Add failing server-render tests** `room_form_exposes_room_details_and_capacity` and `room_form_has_no_available_count`.
- [ ] **Step 2: Run `npx vitest run src/components/owner/RoomEditor.test.tsx`**; expected: FAIL because the component does not exist.
- [ ] **Step 3: Implement the controlled room editor** with add/edit/remove actions, existing room IDs, and the existing shared validation contract.
- [ ] **Step 4: Run the focused server-render tests**; expected: PASS with all editable room fields rendered and no availability count. Task 12 browser tests cover create, edit, and remove interactions.

### Task 4: Gate and add the seat-hold schema

**Precondition:** Ask the user for explicit approval before creating or applying the schema/data migration. If approval is not given, stop this task and do not substitute global inventory.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<generated>_date_aware_seat_holds/migration.sql`
- Create: `scripts/preflight-seat-holds.ts`
- Create: `scripts/preflight-seat-holds.test.ts`
- Create: `src/lib/seat-hold-preflight.ts`
- Create: `src/lib/seat-hold-preflight.test.ts`
- Modify: `prisma/MIGRATIONS.md`

**Interfaces:**
- The read-only preflight reports counts of future `PENDING`/`CONFIRMED` bookings without `roomId` and overlapping room bookings that exceed capacity; it prints no student PII and exits non-zero if unresolved records exist.
- The `SeatHold` Prisma model stores room, seat number, booking, and `@db.Date` check-in/check-out values. The SQL migration adds a GiST exclusion constraint over `daterange(check_in, check_out, '[)')` for each room seat.

- [ ] **Step 1: Write failing tests** `reports_roomless_future_bookings_without_pii`, `reports_over_capacity_overlaps_without_booking_pii`, `preflight_passes_when_no_conflicts_exist`, `preflight_cli_reports_counts_without_booking_pii`, and `preflight_cli_exits_nonzero_when_unresolved`.
- [ ] **Step 2: Run `npx vitest run src/lib/seat-hold-preflight.test.ts scripts/preflight-seat-holds.test.ts`**; expected: FAIL because the preflight is not implemented.
- [ ] **Step 3: Implement the read-only preflight and schema migration** with `btree_gist`, `[checkIn, checkOut)` exclusion, booking foreign keys, and migration ledger notes. Backfill holds only when all active future bookings have room IDs and their overlapping seat demand fits room capacity; stop for explicit mapping or support resolution otherwise. Do not apply it to a shared or production database.
- [ ] **Step 4: Run `npx prisma validate` and the preflight tests**; expected: PASS, with migration application still gated on explicit approval and resolved legacy rows.

### Task 5: Implement the date-aware availability service

**Files:**
- Create: `src/lib/seat-holds.ts`
- Create: `src/lib/seat-holds.test.ts`
- Create: `src/lib/seat-holds.postgres.test.ts`
- Modify: `src/lib/room-inventory-service.ts`
- Modify: `src/lib/room-inventory-service.test.ts`

**Interfaces:**
- `claimSeatHolds(tx: Prisma.TransactionClient, input: SeatHoldInput): Promise<void>`
- `releaseSeatHolds(tx: Prisma.TransactionClient, bookingId: string): Promise<void>`
- `SeatHoldInput` contains `roomId`, `bookingId`, `checkIn`, `checkOut`, and `guests`; the service loads room capacity itself.
- `getRoomAvailabilityForRange(client: Prisma.TransactionClient | typeof db, hostelId: string, checkIn: string, checkOut: string, guests: number): Promise<RoomAvailability[]>`
- `RoomAvailability` contains `roomId`, `capacity`, `availableSeats`, and `isAvailable`; it never contains booking identities.

- [ ] **Step 1: Write failing tests** `checkin_date_is_inclusive`, `checkout_is_exclusive`, `date_only_is_timezone_independent`, `blocked_full_day_is_unavailable`, `block_range_is_inclusive_per_calendar_day`, `capacity_reduction_conflicts_with_active_hold`, and `free_seats_equal_capacity_minus_overlapping_holds_after_each_transition`.
- [ ] **Step 2: Run `npx vitest run src/lib/seat-holds.test.ts src/lib/room-inventory-service.test.ts`**; expected: FAIL on missing date-aware behavior.
- [ ] **Step 3: Implement seat allocation, release, and range availability** using bound SQL parameters and the database exclusion constraint as the final concurrency guard.
- [ ] **Step 4: Add `parallel_last_seat_allows_exactly_one_booking` to the PostgreSQL integration test** and run it against an isolated PostgreSQL test database; expected: one claim succeeds and all others receive a conflict.

### Task 6A: Require room selection for new bookings

**Files:**
- Modify: `src/lib/booking-service.ts`
- Modify: `src/lib/booking-service.test.ts`

**Interfaces:**
- The shared `bookingSchema` already requires `roomId`; keep that contract.
- `createBooking(userId: string, input: BookingInput)` claims holds in the same transaction as booking creation.

- [ ] **Step 1: Add the failing service test** `booking_rechecks_capacity_inside_transaction`.
- [ ] **Step 2: Run `npx vitest run src/lib/booking-service.test.ts`**; expected: FAIL because the service still uses global `Room.available`.
- [ ] **Step 3: Require the selected room and replace global-counter authority with `claimSeatHolds`** without changing payment behavior.
- [ ] **Step 4: Run the focused booking-service tests**; expected: PASS. Keep the existing validation test proving that a room is required.

### Task 6B: Release holds on booking actions

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`
- Modify: `src/app/api/bookings/[id]/route.test.ts`

**Interfaces:**
- Pre-check-in student/admin cancellation and owner decline release holds in the same transaction as the booking transition. Preserve the existing behavior for a cancellation after check-in: keep that stay occupied through checkout.
- Completed stays need no release; the exclusive checkout boundary ends occupancy.

- [ ] **Step 1: Add failing tests** `cancel_releases_future_holds`, `midstay_cancel_retains_hold_through_checkout`, `decline_releases_holds`, and `admin_cancel_releases_holds`.
- [ ] **Step 2: Run `npx vitest run "src/app/api/bookings/[id]/route.test.ts"`**; expected: FAIL because actions do not manage date-aware holds.
- [ ] **Step 3: Add transactional hold release to each action** and preserve existing refund/status behavior.
- [ ] **Step 4: Run the route tests and PostgreSQL cancel/rebook lifecycle test**; expected: PASS.

### Task 6C: Release holds during background cancellation

**Files:**
- Modify: `src/app/api/cron/cancel-abandoned-payments/route.ts`
- Modify: `src/app/api/cron/cancel-abandoned-payments/route.test.ts`
- Modify: `src/app/api/cron/expire-unanswered-bookings/route.ts`
- Create: `src/app/api/cron/expire-unanswered-bookings/route.test.ts`

**Interfaces:**
- Abandoned-payment cancellation and unanswered-owner expiration call `releaseSeatHolds` in the same transaction as the booking transition.

- [ ] **Step 1: Add failing tests** `abandoned_payment_releases_holds`, `unanswered_booking_releases_holds`, and `existing_expiry_windows_are_unchanged`.
- [ ] **Step 2: Run the affected booking and cron route tests**; expected: FAIL because transitions do not manage date-aware holds.
- [ ] **Step 3: Add transactional hold release to both cron transitions** and preserve existing refund/status behavior.
- [ ] **Step 4: Run the affected cron route tests and PostgreSQL cancel/rebook lifecycle test**; expected: PASS.

### Task 7: Add public-safe hostel detail and exact availability APIs

**Files:**
- Create: `src/app/api/public/hostels/[param]/route.ts`
- Create: `src/app/api/public/hostels/[param]/route.test.ts`
- Create: `src/app/api/public/hostels/[param]/availability/route.ts`
- Create: `src/app/api/public/hostels/[param]/availability/route.test.ts`
- Modify: `packages/shared/src/validations/index.ts`

**Interfaces:**
- `GET /api/public/hostels/[param]` returns an explicit allowlisted public DTO, excluding owner contacts and admin-only fields.
- `GET /api/public/hostels/[param]/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=1` returns date-range room availability.

- [ ] **Step 1: Write failing route tests** `public_detail_redacts_owner_contact`, `availability_requires_valid_range`, and `availability_never_returns_booking_identity`.
- [ ] **Step 2: Run `npx vitest run src/app/api/public/hostels/[param]/route.test.ts src/app/api/public/hostels/[param]/availability/route.test.ts`**; expected: FAIL because these routes do not exist.
- [ ] **Step 3: Implement allowlisted DTO selection, input validation, rate limiting, and calls to `getRoomAvailabilityForRange`.**
- [ ] **Step 4: Run the focused route tests**; expected: PASS, while the existing admin-only `GET /api/hostels/[param]` remains unchanged.

### Task 8: Build the notification center

**Files:**
- Create: `src/app/notifications/page.tsx`
- Create: `src/components/notifications/NotificationCenter.tsx`
- Create: `src/components/layout/NotificationButton.tsx`
- Modify: `src/components/layout/AppHeader.tsx`
- Create: `src/lib/notification-view-model.ts`
- Create: `src/lib/notification-view-model.test.ts`

**Interfaces:**
- Use `GET /api/notifications`, `PUT /api/notifications`, `PUT /api/notifications/[id]`, and `DELETE /api/notifications/[id]`.
- `getNotificationDestination(notification): string | null` maps only known notification types to safe in-app routes.

- [ ] **Step 1: Write failing unit tests** `unknown_notification_type_has_no_destination` and `destination_is_role_safe`.
- [ ] **Step 2: Run `npx vitest run src/lib/notification-view-model.test.ts`**; expected: FAIL because the view-model helper is absent.
- [ ] **Step 3: Implement the view model and notification page/button** with unread, empty, paginated, error, mark-read, mark-all-read, and delete states.
- [ ] **Step 4: Add browser tests** `notifications_can_be_marked_read`, `notifications_shows_empty_and_error_states`, and `notifications_paginates` to `e2e/auth-shell.spec.ts`, then run them; expected: PASS with unread count updating and recoverable empty/error/pagination states.

### Task 9: Build student discovery and hostel detail screens

**Files:**
- Create: `src/app/hostels/page.tsx`
- Create: `src/app/hostels/[slug]/page.tsx`
- Create: `src/components/student/HostelSearch.tsx`
- Create: `src/components/student/HostelDetail.tsx`
- Create: `e2e/student-discovery.spec.ts`

**Interfaces:**
- Search calls `GET /api/hostels` with only supported filters.
- Detail calls the public-safe detail and exact availability APIs; it does not call the admin-only route.

- [ ] **Step 1: Write failing browser tests** `search_filters_and_paginates`, `hostel_detail_shows_date_range_room_availability`, and `legacy_listing_without_rooms_is_visible_but_not_bookable`.
- [ ] **Step 2: Run `npm run e2e -- --project=chromium`**; expected: FAIL because student pages are absent.
- [ ] **Step 3: Implement results and detail screens** with loading, empty, error, date-change, and no-room states.
- [ ] **Step 4: Run the focused browser tests**; expected: PASS at mobile and desktop viewports with availability shown for the whole stay.

### Task 10: Build student booking and booking-management screens

**Files:**
- Create: `src/app/student/bookings/page.tsx`
- Create: `src/app/student/bookings/[id]/page.tsx`
- Create: `src/components/student/BookingForm.tsx`
- Create: `src/components/student/BookingSummary.tsx`
- Create: `e2e/student-booking.spec.ts`

**Interfaces:**
- Booking form posts the selected `roomId`, date-only range, guests, and existing payment method to `POST /api/bookings`.
- Payment initiation uses the existing `/api/payment/initiate`; booking actions use `PATCH /api/bookings/[id]`.

- [ ] **Step 1: Write failing browser tests** `student_can_review_booking_before_payment` and `stale_availability_shows_retry_path`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because the booking screens are absent.
- [ ] **Step 3: Implement booking review, payment initiation, list/detail, cancellation, and status messaging** without claiming confirmation before the existing backend state confirms it.
- [ ] **Step 4: Run the focused browser tests and booking route tests**; expected: PASS for success, validation, cancellation-policy, and 409 conflict states.

### Task 11: Add student account capabilities

**Files:**
- Create: `src/app/student/favorites/page.tsx`
- Create: `src/app/student/messages/page.tsx`
- Create: `src/app/student/profile/page.tsx`
- Create: `src/app/student/verify/page.tsx`
- Create: `e2e/student-account.spec.ts`

**Interfaces:**
- Reuse existing favorites, conversations, profile, and student-verification APIs; no client-only substitutes for server rules.
- The student shell links to the review and roommate screens from Task 22; those screens use the current APIs.

- [ ] **Step 1: Write failing browser tests** `student_can_open_favorites_messages_profile_and_verification` and `verification_errors_are_visible`.
- [ ] **Step 2: Run the focused browser test**; expected: FAIL because student account screens are absent.
- [ ] **Step 3: Implement the account pages and route navigation** with authorization, pagination, upload progress, and recoverable errors.
- [ ] **Step 4: Run the focused browser and existing API tests**; expected: PASS without exposing private verification documents in public routes.

### Task 12: Build owner listing and room-management screens

**Files:**
- Create: `src/app/owner/hostels/page.tsx`
- Create: `src/app/owner/hostels/new/page.tsx`
- Create: `src/app/owner/hostels/[id]/edit/page.tsx`
- Create: `src/components/owner/ListingForm.tsx`
- Create: `e2e/owner-listings.spec.ts`

**Interfaces:**
- Listing forms use `POST /api/hostels`, `GET /api/hostels/mine`, and `PATCH /api/hostels/[param]`.
- `ListingForm` composes the `RoomEditor` from Task 3 and submits stable room IDs.

- [ ] **Step 1: Write failing tests** `owner_can_create_listing_with_rooms` and `owner_edit_preserves_room_ids`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because owner listing pages are absent.
- [ ] **Step 3: Implement listing list/create/edit and review states**; preserve listing quota and return-to-review behavior.
- [ ] **Step 4: Run browser tests plus `npx vitest run src/lib/hostel-service.test.ts src/lib/room-inventory-service.test.ts`**; expected: PASS, with invalid room edits rejected atomically.

### Task 13: Build owner booking and availability operations

**Files:**
- Create: `src/app/owner/bookings/page.tsx`
- Create: `src/app/owner/calendar/page.tsx`
- Create: `src/components/owner/BookingQueue.tsx`
- Modify: `src/app/api/owner/hostels/[id]/blocked-dates/route.ts`
- Modify: `src/app/api/owner/hostels/[id]/blocked-dates/route.test.ts`
- Create: `e2e/owner-bookings.spec.ts`

**Interfaces:**
- Booking queue uses owner-scoped `GET /api/bookings` and actions through `PATCH /api/bookings/[id]`.
- Blocked-date writes call the availability service before persistence; overlapping active holds return 409.

- [ ] **Step 1: Add failing tests** `owner_block_conflicts_with_active_hold` and `owner_only_sees_paid_bookings`.
- [ ] **Step 2: Run the focused blocked-date and booking route tests**; expected: FAIL for block enforcement and missing owner screens.
- [ ] **Step 3: Implement the booking queue, calendar, and transactional block validation.**
- [ ] **Step 4: Add `owner_can_confirm_or_decline_paid_request` to `e2e/owner-bookings.spec.ts` and run focused API/browser tests**; expected: PASS.

### Task 14: Add owner business tools

**Files:**
- Create: `src/app/owner/analytics/page.tsx`
- Create: `src/app/owner/earnings/page.tsx`
- Create: `src/app/owner/reviews/page.tsx`
- Create: `src/app/owner/subscription/page.tsx`
- Create: `e2e/owner-tools.spec.ts`

**Interfaces:**
- Reuse existing analytics, earnings, review-reply, and subscription APIs; do not add payout or payment behavior.

- [ ] **Step 1: Write failing browser tests** `owner_tools_use_existing_api_and_show_empty_state`.
- [ ] **Step 2: Run the focused browser test**; expected: FAIL because owner tools are absent.
- [ ] **Step 3: Implement the analytics, earnings, reviews, and subscription screens** with explicit loading, empty, error, and permission states.
- [ ] **Step 4: Run focused browser/API tests**; expected: PASS without exposing bank details outside the existing authorized response.

### Task 15: Build admin moderation and verification screens

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/listings/page.tsx`
- Create: `src/app/admin/verifications/page.tsx`
- Create: `src/app/admin/roommate-reports/page.tsx`
- Create: `e2e/admin-moderation.spec.ts`

**Interfaces:**
- Reuse existing admin listing, verification, analytics, document, and roommate-report APIs.
- Route guards use the authenticated role; backend checks remain authoritative.

- [ ] **Step 1: Write failing tests** `student_cannot_open_admin_queue` and `admin_can_review_listing_and_verification`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because admin pages are absent.
- [ ] **Step 3: Implement queue/list/detail surfaces** and use protected document access only for authorized verification review.
- [ ] **Step 4: Run focused browser tests and existing admin route tests**; expected: PASS with forbidden access and loading/error cases covered.

### Task 16: Build admin payment and operations screens

**Files:**
- Create: `src/app/admin/bookings/[id]/page.tsx`
- Create: `src/app/admin/refunds/page.tsx`
- Create: `src/app/admin/payouts/page.tsx`
- Create: `src/app/admin/payment-events/page.tsx`
- Create: `src/app/admin/search/page.tsx`
- Create: `e2e/admin-operations.spec.ts`

**Interfaces:**
- Reuse existing booking detail, refund, payout, payment-event retry, listing-statistics, and search-sync APIs; link booking details from authorized refund/operations surfaces.
- Irreversible money actions require explicit confirmation and show uncertain/provider states without a false success result.

- [ ] **Step 1: Write failing tests** `admin_can_open_booking_detail`, `admin_refund_requires_confirmation`, and `uncertain_payment_event_is_not_shown_as_success`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because admin operations pages are absent.
- [ ] **Step 3: Implement the existing operations screens**; do not add new finance APIs or retry semantics.
- [ ] **Step 4: Run focused browser tests and existing refund/payout/payment route tests**; expected: PASS.

### Task 17: Implement availability-alert persistence and matching

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<generated>_availability_alerts/migration.sql`
- Create: `src/lib/availability-alerts.ts`
- Create: `src/lib/availability-alerts.test.ts`
- Create: `src/lib/availability-alerts.postgres.test.ts`
- Modify: `src/lib/notifications.ts`

**Interfaces:**
- `createAvailabilityAlert(userId: string, input: AvailabilityAlertInput): Promise<AvailabilityAlert>`
- `evaluateAvailabilityAlert(tx: Prisma.TransactionClient, alertId: string): Promise<"matched" | "unmatched">`
- `reevaluateAvailabilityAlerts(tx: Prisma.TransactionClient, hostelId: string): Promise<void>` finds active hostel alerts for that hostel and active saved-search alerts whose canonical filters match it, then fully reevaluates each affected alert.
- Alert criteria are a discriminated union: hostel target or saved-search filters, each with `checkIn`, `checkOut`, and `guests`.
- `AvailabilityAlert` stores user, target type, optional hostel ID, canonical search filters, date-only range, guest count, active/matched state, last notification time, and timestamps.
- `Notification.actionUrl` is an optional server-generated same-origin path; clients reject non-relative paths and protocol-relative URLs.
- `evaluateAvailabilityAlert` locks the alert row before reading/updating match state; alert state and notification creation commit together, making concurrent false-to-true evaluation idempotent. Alerts whose check-in date has begun are no longer evaluated and are exposed as expired.

- [ ] **Step 1: Write failing tests** `normalizes_supported_search_filters`, `rejects_invalid_or_past_alert_dates`, `matching_alert_notifies_on_create`, `matched_alert_does_not_repeat`, `unmatched_then_matched_notifies_again`, `search_alert_emits_one_alert_level_notification`, `alert_expires_when_check_in_begins`, `notification_action_url_is_relative`, and PostgreSQL test `parallel_alert_evaluations_emit_one_notification`.
- [ ] **Step 2: Run `npx vitest run src/lib/availability-alerts.test.ts`**; expected: FAIL because the model/service is absent.
- [ ] **Step 3: Obtain explicit schema-migration approval if not already recorded; then add the model, migration, matching service, notification type, and optional internal action URL.**
- [ ] **Step 4: Run focused service tests and `parallel_alert_evaluations_emit_one_notification` against PostgreSQL**; expected: PASS with one notification per alert availability cycle.

### Task 17A: Reevaluate alerts after booking changes

**Files:**
- Modify: `src/lib/booking-service.ts`
- Modify: `src/lib/booking-service.test.ts`
- Modify: `src/app/api/bookings/[id]/route.ts`
- Modify: `src/app/api/bookings/[id]/route.test.ts`

**Interfaces:**
- Call `reevaluateAvailabilityAlerts(tx, hostelId)` in the same transaction after booking creation or an owner/student/admin booking action that changes occupancy.
- Preserve the existing rule that a cancellation after check-in remains occupied through checkout.

- [ ] **Step 1: Add failing tests** `booking_creation_rechecks_alerts`, `decline_reopens_hostel_alert_once`, and `midstay_cancel_keeps_alert_unmatched_until_checkout`.
- [ ] **Step 2: Run the focused booking service and route tests**; expected: FAIL because booking transitions do not reevaluate alerts.
- [ ] **Step 3: Invoke the alert evaluator after each inventory-affecting booking transition** in the same transaction as the transition and any hold change.
- [ ] **Step 4: Run focused tests and PostgreSQL booking/alert lifecycle tests**; expected: PASS with no notification emitted before transaction commit.

### Task 17B: Reevaluate alerts after scheduled booking cleanup

**Files:**
- Modify: `src/app/api/cron/cancel-abandoned-payments/route.ts`
- Modify: `src/app/api/cron/cancel-abandoned-payments/route.test.ts`
- Modify: `src/app/api/cron/expire-unanswered-bookings/route.ts`
- Modify: `src/app/api/cron/expire-unanswered-bookings/route.test.ts`

**Interfaces:**
- Each expired booking transition reevaluates affected alerts in its existing transaction after releasing its holds.

- [ ] **Step 1: Add failing tests** `abandoned_payment_reopens_matching_alert` and `unanswered_expiration_reopens_matching_alert`.
- [ ] **Step 2: Run both focused cron route tests**; expected: FAIL because scheduled transitions do not reevaluate alerts.
- [ ] **Step 3: Invoke the evaluator with each affected hostel ID in the existing transaction.**
- [ ] **Step 4: Run focused cron and PostgreSQL alert-idempotency tests**; expected: PASS with retries remaining idempotent.

### Task 17C: Reevaluate alerts after inventory and listing changes

**Files:**
- Modify: `src/lib/room-inventory-service.ts`
- Modify: `src/lib/room-inventory-service.test.ts`
- Modify: `src/app/api/owner/hostels/[id]/blocked-dates/route.ts`
- Modify: `src/app/api/owner/hostels/[id]/blocked-dates/route.test.ts`
- Modify: `src/app/api/admin/hostels/route.ts`
- Modify: `src/app/api/admin/hostels/route.test.ts`

**Interfaces:**
- Room/capacity edits, owner block changes, and admin listing activation changes reevaluate affected alerts in the same transaction as the inventory/status update.
- Saved-search alerts use the same canonical search predicate as public search; a changed hostel triggers reevaluation only for filters it can affect, while the alert is evaluated against all current results.

- [ ] **Step 1: Add failing tests** `capacity_change_rechecks_alerts`, `block_change_closes_and_reopens_alert_match`, and `listing_activation_rechecks_alerts`.
- [ ] **Step 2: Run the focused room, blocked-date, and admin-hostel tests**; expected: FAIL because those transitions do not reevaluate alerts.
- [ ] **Step 3: Invoke the evaluator in the inventory/status transaction after its new state is visible.**
- [ ] **Step 4: Run focused route/service and PostgreSQL transition tests**; expected: PASS for hostel and saved-search alerts.

### Task 18: Add availability-alert APIs and student UI

**Files:**
- Create: `src/app/api/availability-alerts/route.ts`
- Create: `src/app/api/availability-alerts/route.test.ts`
- Create: `src/app/api/availability-alerts/[id]/route.ts`
- Create: `src/app/api/availability-alerts/[id]/route.test.ts`
- Create: `src/app/student/alerts/page.tsx`
- Modify: `src/components/layout/RoleNavigation.tsx`

**Interfaces:**
- `GET/POST /api/availability-alerts` lists and creates current-user student alerts.
- `PATCH/DELETE /api/availability-alerts/[id]` updates or deletes only the current user's alert.
- `POST` validates date-only range, 1–4 guests, active hostel or supported search filters, and immediately evaluates availability.

- [ ] **Step 1: Write failing route tests** `alert_is_user_scoped`, `invalid_range_is_rejected`, `create_notifies_if_already_available`, `pause_resume_rechecks`, and `editing_criteria_resets_and_evaluates_immediately`.
- [ ] **Step 2: Run focused API tests**; expected: FAIL because alert routes do not exist.
- [ ] **Step 3: Implement bounded, rate-limited student-only CRUD routes and alert management page.**
- [ ] **Step 4: Run focused service/API tests**; expected: PASS for validation, auth, conflict, immediate-match, pause/resume, and deletion.

### Task 19: Integrate alert controls and complete browser coverage

**Files:**
- Modify: `src/components/student/HostelDetail.tsx`
- Modify: `src/components/student/HostelSearch.tsx`
- Create: `src/components/student/AvailabilityAlertForm.tsx`
- Create: `e2e/availability-alerts.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Hostel detail opens a hostel-target alert with the selected date range and guest count.
- Search opens a saved-search alert with current supported filters and selected dates.
- Update README's API-only statement and document `npm run e2e` after Playwright setup is restored.

- [ ] **Step 1: Write failing browser tests** `hostel_alert_uses_selected_dates`, `search_alert_saves_supported_filters`, and `alert_notification_links_to_matching_results`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because alert controls are not integrated.
- [ ] **Step 3: Implement the alert form and integrate it into detail/search; update README to describe the first-party web app and supported tests.**
- [ ] **Step 4: Run focused browser tests**; expected: PASS for alert creation, management, in-app notification, and navigation.

### Task 20: Add public legal shells and contact page

**Files:**
- Create: `src/components/public/LegalShell.tsx`
- Create: `src/app/terms/page.tsx`
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/contact/page.tsx`
- Create: `e2e/public-pages.spec.ts`

**Interfaces:**
- Legal pages use a reusable shell with clearly unfinished content; do not invent policy text or present placeholder copy as an agreement.
- Contact uses the existing `/api/contact` endpoint.

- [ ] **Step 1: Write failing browser tests** `legal_pages_are_shells_without_invented_terms` and `contact_form_shows_submission_state`.
- [ ] **Step 2: Run the focused browser tests**; expected: FAIL because the routes do not exist.
- [ ] **Step 3: Implement the legal shell and contact form** with accessible labels, inline validation, and visible submission errors.
- [ ] **Step 4: Run `npm run e2e -- --project=chromium`**; expected: PASS without fabricated legal copy.

### Task 21: Add account recovery and email verification screens

**Files:**
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/reset-password/page.tsx`
- Create: `src/app/verify-email/page.tsx`
- Create: `e2e/account-recovery.spec.ts`

**Interfaces:**
- Reuse existing forgot-password, reset-password, and verify-email APIs; never expose whether an unknown email exists beyond existing API behavior.

- [ ] **Step 1: Write failing browser tests** `recovery_submission_shows_generic_confirmation` and `verification_token_error_is_visible`.
- [ ] **Step 2: Run the focused browser test**; expected: FAIL because account recovery pages are absent.
- [ ] **Step 3: Implement the three account-flow screens** with bounded inputs and explicit success/error states.
- [ ] **Step 4: Run focused browser and auth API tests**; expected: PASS without account-enumeration copy.

### Task 22: Add student dashboard and community pages

**Files:**
- Create: `src/app/student/page.tsx`
- Create: `src/app/student/reviews/page.tsx`
- Create: `src/app/student/roommates/page.tsx`
- Create: `e2e/student-community.spec.ts`

**Interfaces:**
- Use existing student review and roommate APIs; the dashboard links to bookings, favorites, messages, profile, verification, notifications, and alerts.

- [ ] **Step 1: Write failing browser tests** `student_dashboard_links_to_account_tools` and `student_community_pages_show_empty_and_error_states`.
- [ ] **Step 2: Run the focused browser test**; expected: FAIL because dashboard and community pages are absent.
- [ ] **Step 3: Implement the dashboard, review history/create state, and roommate finder** without adding unsupported moderation or matching behavior.
- [ ] **Step 4: Run focused browser and existing review/roommate API tests**; expected: PASS.

### Task 23: Add owner dashboard and messages page

**Files:**
- Create: `src/app/owner/page.tsx`
- Create: `src/app/owner/messages/page.tsx`
- Create: `e2e/owner-overview.spec.ts`

**Interfaces:**
- The dashboard links to listings, rooms, bookings, calendar, messages, reviews, analytics, earnings, and subscription.
- Room management is reached through listing create/edit; do not link to a nonexistent standalone rooms route.
- Messages use existing participant-scoped conversation APIs.

- [ ] **Step 1: Write failing browser tests** `owner_dashboard_links_to_workspace` and `owner_messages_are_scoped_to_participant`.
- [ ] **Step 2: Run the focused browser test**; expected: FAIL because dashboard and owner messages pages are absent.
- [ ] **Step 3: Implement the overview and owner conversation list** with role-safe navigation and explicit empty/error states.
- [ ] **Step 4: Run focused browser and conversation API tests**; expected: PASS.

### Task 24: Final integration and release verification

**Files:**
- Modify only files required by failing integration checks.
- Verify: all files in the approved design and capability map.

- [ ] **Step 1: Run `npm run test -- --run`**; expected: all Vitest unit/API tests pass.
- [ ] **Step 2: Run PostgreSQL integration tests**; expected: seat-hold concurrency, migration preflight, alert idempotency, and booking lifecycle tests pass against a disposable database.
- [ ] **Step 3: Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run docs:check`, and `npm run e2e -- --project=chromium`**; expected: no new failures. If docs check still reports the two existing encoded-path links in `docs/API-MASTERY-GUIDE.md`, report them as pre-existing and do not broaden scope without approval.
- [ ] **Step 4: Review visual behavior at mobile/desktop sizes, keyboard-only navigation, reduced motion, public DTO redaction, and all role guards before release.**

## Self-review

- Every capability-map module is represented: foundation (Tasks 1–2B), inventory
  (Tasks 3–4), availability (Tasks 4–7), notification center (Task 8), student
  marketplace (Tasks 9–11), owner workspace (Tasks 12–14), admin console
  (Tasks 15–16), and alerts (Tasks 17–19). Remaining public, account, and
  community surfaces are covered by Tasks 20–23.
- Inventory migration approval and roomless-booking preflight are explicit
  gates; no global-counter fallback is planned.
- Every major API/UI feature has a focused test before implementation. The
  real-PostgreSQL suite covers exclusion constraints, not just mocks.
- The public-safe hostel read is separate from the current admin-only detail
  response.
- Public/legal/auth flows, student dashboard/reviews/roommates, and owner
  dashboard/messages have explicit tasks.
- No new dependencies, admin-user APIs, legal copy, or payment changes are
  included.
