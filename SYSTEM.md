# System Design Document - HostelLo

**Version:** 1.5 | **Last updated:** June 1, 2026 | **Status:** Current repo audit

---

## 1. Overview

HostelLo is a Pakistan-focused student hostel marketplace. Students discover, compare, save, message, and book verified hostel accommodation. Owners manage listings, availability, bookings, messages, reviews, subscriptions, and analytics. Admins moderate listings, reviews, search sync, bookings, and student verification.

The product is implemented as a Next.js monolith with route handlers for API endpoints and an Expo mobile app that uses the same backend.

---

## 2. Scope

In scope:

- Hostel discovery, filters, city/university landing pages, detail pages, maps, comparison, and favorites.
- Student signup/login, email verification, password reset, phone OTP, profile, account deletion, and optional student verification.
- Owner listing creation/editing, blocked dates, booking management, messages, reviews, analytics, settings, and subscription surface.
- Booking flow with Safepay as primary payment and JazzCash/EasyPaisa infrastructure available but disabled for mobile.
- Messaging, reviews, owner replies, price alerts, notifications, FCM push backend, cron jobs, and admin moderation.
- Expo mobile app using the same backend APIs.

Out of scope for current MVP:

- Separate backend services.
- International expansion or multi-currency.
- Native owner/admin mobile dashboards.
- Offline search.
- Video reviews.
- Apple Pay / Google Pay until Safepay support is confirmed.

---

## 3. Architecture

| Layer | Implementation |
|---|---|
| Web framework | Next.js 16 App Router |
| API | Next.js Route Handlers under `src/app/api` |
| Mobile | Expo 54 / React Native 0.81 under `apps/mobile` |
| Database | Neon PostgreSQL via Prisma 7 |
| Auth | NextAuth v5 JWT strategy plus mobile Bearer bridge in `src/proxy.ts` |
| Search | Typesense with Prisma fallback |
| Cache/rate limits | Upstash Redis |
| Cron | Upstash QStash calling secured route handlers |
| Storage | Cloudflare R2 for uploads |
| Email | Resend |
| SMS | Twilio |
| Push | Firebase Admin + `DeviceToken` records |
| Payments | Safepay primary; JazzCash/EasyPaisa infrastructure present |
| Error tracking | Sentry configs for client/server/edge |
| Tests | Vitest and Playwright |

The application is intentionally not microservices. The API, web UI, database schema, and most business logic ship together, which keeps versioning and operational complexity low.

---

## 4. Current Repo Metrics

As of the June 1, 2026 audit:

| Area | Count |
|---|---:|
| Web `page.tsx` routes | 44 |
| API route files | 57 |
| Prisma models | 22 |
| Prisma migrations | 15 |
| Project test/spec files | 34 |
| Playwright E2E specs | 5 |
| Mobile screen/layout files | 15 |

---

## 5. Data Model

The Prisma schema lives in `prisma/schema.prisma`.

Core models:

- `User`: auth/profile fields, role, token version, email notifications, student verification fields, owner plan, subscription relation.
- `DeviceToken`: FCM/APNs token per mobile installation.
- `Subscription`: owner plan/status/payment reference.
- `Account`, `Session`, `VerificationToken`, `PasswordResetToken`, `PhoneVerificationToken`: auth support.
- `Hostel`: listing, ownership, status, location, pricing, amenities, images, ratings, and relations.
- `Room`: room availability and optimistic-lock version.
- `Booking`: stay dates, guests, amount, booking status, payment status/method, transaction ID.
- `Review`: rating breakdown, comment, owner reply.
- `Favorite`: saved hostels.
- `Conversation`, `ConversationParticipant`, `Message`: messaging.
- `PriceAlert`: target price, last known price, active flag, unsubscribe token.
- `Notification`: in-app notification rows and optional booking/review/hostel links.
- `CronLog`: last run/status/duration/error for scheduled jobs.
- `BlockedDate`: owner-managed unavailable date ranges.
- `RoommatePost`, `RoommateReport`: roommate finder data and moderation reports.

Money is stored as integer PKR. Review counts and ratings are denormalized on `Hostel` and maintained transactionally, with repair scripts available.

---

## 6. API Surface

All API routes live under `/api`. There are 57 route files. Responses generally use:

```json
{ "data": {}, "message": "...", "error": "..." }
```

Route categories:

- Auth: signup, NextAuth, email verification, resend verification, forgot/reset password, delete account, phone OTP, mobile login, mobile refresh.
- Profile: profile update and password change.
- Hostels: search/list/create, mine, detail/update/delete, favorite, availability, view count, roommate posts.
- Bookings: create/list/detail/status changes.
- Payments: initiate, Safepay webhook, JazzCash/EasyPaisa callback.
- Conversations: list/start/get messages/send messages.
- Reviews: create/list/mine/edit/delete/reply.
- Notifications: list/read/delete plus device-token registration routes.
- Price alerts: list/create/update/delete plus unsubscribe.
- Owner: analytics, subscription, blocked dates.
- Admin: hostels/listings/search sync/verifications.
- Cron: mark completed stays, cancel abandoned payments, check price alerts, cleanup tokens.
- Operations/support: upload, contact, report, cron health.

Current device-token route convention:

- `/api/device-tokens` is canonical for mobile push-token registration.
- `/api/notifications/device-token` remains as a compatibility export for older clients.

---

## 7. Authentication And Authorization

Web:

- NextAuth v5 Credentials provider.
- JWT session strategy.
- HTTP-only cookies for browser sessions.
- `tokenVersion` is checked to revoke sessions after password changes.

Mobile:

- `POST /api/auth/mobile/login` returns a NextAuth-compatible JWT and user payload.
- Mobile stores token/user in `expo-secure-store`.
- Requests include `Authorization: Bearer <token>` and `X-Client: mobile`.
- `src/proxy.ts` injects the Bearer token into NextAuth-compatible cookie names.
- `POST /api/auth/mobile/refresh` issues a fresh token after validating signature and `tokenVersion`.
- Mobile API wrapper retries once after refresh, then clears auth on failure.

Authorization is role/ownership based:

- Students can access their own bookings, reviews, favorites, alerts, messages, and profile.
- Owners can manage their own hostels and related bookings/messages/reviews.
- Admins can moderate listings, reviews, verifications, and search sync.

---

## 8. Security Design

Implemented:

- HTTPS-only deployment target.
- Content Security Policy in `next.config.ts`.
- CSRF Origin checks for browser state-mutating API routes.
- Bearer-authenticated mobile requests skip browser Origin checks.
- Zod validation on API payloads.
- Upstash-backed rate limiting with in-memory fallback.
- User-keyed rate limits on high-risk authenticated routes.
- Payment webhook/callback signature checks.
- R2 URL allowlisting for submitted image URLs.
- Password reset and verification tokens are short-lived and single-use.
- Account deletion removes associated user data.

Open / needs verification:

- Confirm Neon PITR/backup retention for production.
- Add structured logging if production traffic warrants it.
- Verify Sentry/log scrubbing for Authorization headers and secrets.
- Complete physical-device QA for mobile deep links and push notifications.

---

## 9. Payments

Safepay:

- Primary payment method.
- `POST /api/payment/initiate` creates a checkout session.
- `POST /api/payment/webhook` is the server-to-server source of truth.
- Webhook updates payment/booking state idempotently.
- Mobile clients send `X-Client: mobile` and receive `hostello://payment/return?...` return paths.

JazzCash and EasyPaisa:

- Infrastructure exists for signed form-post flows.
- Kept disabled for mobile MVP because their callback model needs a separate mobile design spike.

Abandoned payments:

- Cron cancels stale pending payments/bookings and restores availability after the configured timeout.

---

## 10. Notifications

In-app notifications:

- Written to the `Notification` table.
- Exposed through notification routes and dashboard/mobile surfaces.

Push notifications:

- `DeviceToken` stores mobile tokens.
- Firebase Admin sends multicast notifications from `createNotification()`.
- Invalid/stale tokens are deleted when FCM returns invalid-registration errors.

Remaining before mobile beta:

- Verify token registration/deletion on physical devices.
- Verify foreground/background/killed-state notification behavior.
- Verify notification tap deep-link routing.

---

## 11. Search

Typesense is the preferred search path. Prisma fallback is used when Typesense is unavailable or not configured.

Search supports:

- text query,
- city/area/university surfaces,
- gender,
- price,
- amenities,
- rating/sorting,
- pagination.

Search degradation should be visible enough for debugging without breaking user discovery.

---

## 12. Cron And Background Jobs

Cron endpoints:

- `POST /api/cron/mark-completed-stays`
- `POST /api/cron/cancel-abandoned-payments`
- `POST /api/cron/check-price-alerts`
- `POST /api/cron/cleanup-tokens`

Cron security:

- QStash signing key and/or `CRON_SECRET` Bearer verification.

Observability:

- `CronLog` rows track last run/status/duration/error.
- `GET /api/health/crons` surfaces cron health.

Scripts:

- `scripts/schedule-cron-jobs.ts`
- `scripts/check-price-alerts.ts`
- `scripts/setup-typesense.ts`
- `scripts/verify-typesense-fallback.ts`

---

## 13. Migrations

Migration workflow is enforced.

- New migrations: `npm run migrate:new`.
- Production/build: `prisma migrate deploy && prisma generate && next build`.
- Pre-commit hook blocks staged `prisma/schema.prisma` changes without staged migration files.
- Migration ledger is in `prisma/MIGRATIONS.md`.

Current migration count: 15.

Never edit SQL for a migration that has been applied to any shared or production database. Create a corrective migration instead.

---

## 14. Mobile System Notes

Mobile app status:

- Expo Router app exists.
- Auth screens and main tabs exist.
- SecureStore auth, token refresh, and route guard exist.
- Hostel detail, booking, conversation, favorites, bookings, messages, and profile screens exist.
- Custom scheme and associated/app links are configured.

Current mobile risks:

- Safepay return and push delivery need physical-device QA.
- EAS profiles exist; signing credentials, first preview build, and mobile Sentry should be confirmed before external beta.

---

## 15. Testing

Current coverage:

- 34 project test/spec files.
- 5 Playwright specs.
- Unit/integration coverage for validations, booking/search/review services, CSRF/rate limits, payment initiation, hostels, notifications, profile, UI primitives, layouts/components, and mobile API wrapper.

Key commands:

```bash
npm run lint
npm run test
npm run build
npm run e2e
npm --prefix apps/mobile run typecheck
```

Latest command verification on June 1, 2026:

- `npx next build`: pass.
- `npm run test`: pass, 29 test files and 228 tests.
- `npm run lint`: pass with 0 errors and 54 existing warnings.
- `npm --prefix apps/mobile run typecheck`: pass.
- `npm run e2e`: blocked before tests because `DATABASE_URL` is not a local/test database; the Playwright global setup refused to seed it. Local runs can provide `.env.e2e`.

Run E2E only with a disposable local/test Postgres database. The guard is intentional and should not be bypassed for production or shared remote databases.
For local runs, create `.env.e2e` from `.env.e2e.example`; it is loaded before `.env` and ignored by git.

---

## 16. Open Issues And Decisions

| Item | Severity | Status | Next action |
|---|---|---|---|
| Owner payout/settlement system | P0 | Open | No `Payout` model, ledger, or admin "mark paid out" action exists. Design + implement before real transaction volume. |
| Booking refund flow | P0 | Open | `PATCH /api/bookings/[id]` never updates `paymentStatus` or calls a gateway refund. Decide policy, then build the transition + gateway call. |
| Physical-device Safepay QA | P1 for mobile beta | Open | Test paid/cancelled/failed/abandoned flows on iOS/Android. |
| Physical-device push QA | P1 for mobile beta | Open | Test registration, delivery, tap routing, stale cleanup. |
| Neon PITR confirmation | P2 | Open | Confirm production recovery window. |
| Business mobile gate | P1 for launch | Open | Confirm booking volume, support capacity, budget. |
| JazzCash/EasyPaisa mobile callback flow | P1 for launch | Open | Redirect model doesn't map cleanly onto the mobile deep-link pattern Safepay uses; needs a design spike. |
| Roommate finder test coverage | P2 | Open | Zero automated coverage on a public posting + moderation surface. |
| Admin route test coverage | P2 | Open | Zero coverage across `admin/listings`, `admin/hostels`, `admin/verifications`, `admin/search/sync`. |
| Mobile notifications/price-alerts parity | P2 | Open | Web dashboard has both; mobile's 5 tabs have neither. Needs a deliberate fold-in-vs-add-screen decision. |
| Structured logging | P3 | Open | Add when production traffic/log volume justifies it. |

---

## 17. Environment Notes

Required/important variables include:

- `DATABASE_URL`
- `HOSTELLO_E2E` for production-server E2E runs; Playwright sets this automatically for `npm run e2e`
- `AUTH_SECRET`
- `AUTH_URL`
- `R2_*`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SAFEPAY_SECRET`
- `SAFEPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`
- `QSTASH_CURRENT_SIGNING_KEY`
- `TYPESENSE_*` (optional fallback to Prisma)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (optional; push gracefully disables if absent)

Mobile also needs:

- `EXPO_PUBLIC_API_URL`

---

## 18. Glossary

**Bearer bridge:** The `src/proxy.ts` logic that maps mobile `Authorization: Bearer` tokens into NextAuth-compatible cookies for route handlers.

**Device token:** FCM/APNs token identifying one mobile app installation.

**PITR:** Point-in-time recovery for the production database.

**QStash:** Upstash scheduler used to call cron endpoints.

**R2:** Cloudflare object storage for uploaded images.

**tokenVersion:** Integer on `User`; incrementing it revokes older JWTs.

---

## 19. Revision History

| Version | Date | Summary |
|---|---|---|
| 1.4 | May 23, 2026 | Previous doc/code sync audit. |
| 1.5 | June 1, 2026 | Refreshed against current repo; cleared resolved mobile blockers; added current mobile/API/operations risks. |
| 1.6 | July 1, 2026 | Verified this doc's claims against the actual code (route count was stale: 53 → 57, fixed here and in `PROJECT_STRUCTURE.md`). Logged the P0 payout/refund gaps and P2 coverage/parity gaps found on inspection as open issues. |
