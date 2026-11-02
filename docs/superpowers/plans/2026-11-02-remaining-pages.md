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
- [ ] Listing create/edit with room editor
- [ ] Booking queue with confirm/decline
- [ ] Blocked dates, earnings, subscription, review replies

## 5. admin-console
- [ ] Overview and listing review
- [ ] Verification queue
- [ ] Roommate reports
- [ ] Refunds, payouts, payment events, search sync
