# Remaining pages build plan

Status legend: [x] built, [ ] pending. Build order follows
`HOSTELLO-CAPABILITY-MAP.md`: foundation, notification center, student,
owner, admin.

## 1. web-foundation: auth and public
- [x] `/signup` (honours `?role=OWNER`, posts to `/api/auth/signup`)
- [x] `/forgot-password`
- [x] `/reset-password?token=` (token never sent in Referer)
- [x] `/terms` and `/privacy` placeholder shells (no invented legal text)
- [x] `/contact` (posts to `/api/contact`; prefills name and email for signed-in users; linked from the terms and privacy shells)

## 2. notification-center
- [x] `/notifications` (list, unread count, mark read, mark all, delete, pagination)
- [x] Unread badge in the account menu, plus a Notifications menu link for every role. The count loads once and follows the notification center via a window event

## 3. student-marketplace
- [x] Booking creation and checkout start already live in the hostel detail booking card
- [x] `/bookings/[id]` booking detail: status, payment retry, cancellation terms and cancel (target of booking emails)
- [x] `/booking/[id]/payment` provider return, redirects to the booking detail with the payment state
- [x] "View booking" link on each trip
- [x] Review form on completed bookings (`POST /api/reviews`; resubmitting updates). Note: no student-readable "my reviews" API exists, so no list page
- [x] `/hostels/[param]/roommates`: list, publish/edit/delete own post, report others; linked from the hostel page for students. No student-to-student messaging API exists, so posts cannot be contacted yet
- [x] `/profile/verification` (upload then submit; status from `/api/profile`, which now also returns `verificationStatus`)

## 4. owner-workspace
- [x] Dashboard and listing list (`/owner`, `/api/hostels/mine`): status filters, review-state notes, pagination, public link for live listings only, owner-only. Create/edit links are deliberately absent until those routes exist
- [x] Listing create with room editor (`/owner/listings/new`, `POST /api/hostels`). The API requires at least one room type, so the room editor ships with create. Hostel price, room count and bed count are derived from the room entries. Amenities are saved as ids (`wifi`, `cctv`) like the seed data. Room photos, map coordinates and per-room images are not in the form yet
- [x] Listing edit (`/owner/listings/[id]/edit`, `PATCH /api/hostels/[param]`): the listing is loaded server-side scoped by `ownerId` (`src/lib/owner-listing.ts`), the form prefills from it and keeps room ids, room photos and map coordinates so an edit doesn't wipe them. Any edit sends the listing back to review (the API sets `PENDING_REVIEW` and, for live listings, removes it from search), and the form says so. Unpublish (live to draft) and submit (draft to review) are separate status actions. Suspended listings show a notice instead of the form. 409 room-conflict messages come straight from the API. "Edit" is linked from the dashboard for every non-suspended listing
- [x] Booking queue with confirm/decline (`/owner/bookings`, the target of the owner booking emails): lists paid bookings from `GET /api/bookings` (the API only returns paid ones to owners), defaults to "Needs response" with status filters and pagination, shows the 24-hour response countdown, confirms in one click and declines after an explicit full-refund confirmation (`PATCH /api/bookings/[id]`). Actions disappear once the window ends; a 409 refreshes the list. Linked from the dashboard. There is no owner booking detail page, so the queue shows the student's contact details inline
- [x] Earnings (`/owner/earnings`, `GET`/`PATCH /api/owner/earnings`): "Ready for payout" balance (confirmed, paid stays past check-out and not yet in a batch), bank details card (the full account number is never shown or prefilled; only the last four digits, and changing it means re-entering the number), payout history with pagination. Linked from the dashboard. Payout batches are created by admins and the transfer happens outside the product, so the page says so rather than offering a withdraw button
- [ ] Subscription (`/api/owner/subscription`)
- [ ] Blocked dates (`/api/owner/hostels/[id]/...`)
- [ ] Review replies

## 5. admin-console
- [ ] Overview and listing review
- [ ] Verification queue
- [ ] Roommate reports
- [ ] Refunds, payouts, payment events, search sync
