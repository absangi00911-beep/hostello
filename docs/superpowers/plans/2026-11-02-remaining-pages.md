# Remaining pages build plan

Status legend: [x] built, [ ] pending. Build order follows
`HOSTELLO-CAPABILITY-MAP.md`: foundation, notification center, student,
owner, admin.

## 1. web-foundation: auth and public
- [x] `/signup` (honours `?role=OWNER`, posts to `/api/auth/signup`)
- [x] `/forgot-password`
- [x] `/reset-password?token=` (token never sent in Referer)
- [x] `/terms` and `/privacy` placeholder shells (no invented legal text)
- [ ] `/contact` (posts to `/api/contact`)

## 2. notification-center
- [x] `/notifications` (list, unread count, mark read, mark all, delete, pagination)
- [ ] Unread badge in the account header and menu

## 3. student-marketplace
- [ ] Booking review and payment (`/api/bookings`, `/api/payment/initiate`)
- [ ] Booking detail and cancellation
- [ ] Reviews (`/api/reviews`, `/api/reviews/mine`)
- [ ] Roommate finder (`/api/hostels/[param]/roommates`, `/api/roommates/[id]`)
- [ ] Student verification (`/api/user/verify-student`)

## 4. owner-workspace
- [ ] Dashboard and listing list (`/api/hostels/mine`)
- [ ] Listing create/edit with room editor
- [ ] Booking queue with confirm/decline
- [ ] Blocked dates, earnings, subscription, review replies

## 5. admin-console
- [ ] Overview and listing review
- [ ] Verification queue
- [ ] Roommate reports
- [ ] Refunds, payouts, payment events, search sync
