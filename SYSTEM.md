# System Design Document - HostelLo

**Version:** 3.114 | **Last updated:** October 8, 2026 | **Status:** Current repo audit

---

## 1. Overview

HostelLo is a Pakistan-focused student hostel marketplace. Students discover, compare, save, message, and book verified hostel accommodation. Owners manage listings, availability, bookings, messages, reviews, subscriptions, and analytics. Admins moderate listings, reviews, search sync, bookings, and student verification.

The product is implemented as a Next.js monolith with route handlers for API endpoints and an Expo mobile app that uses the same backend. This document distinguishes behavior verified in the repository from production settings that cannot be verified from source alone.

---

## 2. Scope

In scope:

- Hostel discovery, filters, city/university landing pages, detail pages, maps, comparison, and favorites.
- Student signup/login, email verification, password reset, phone OTP, profile, account deletion, and optional student verification.
- Owner listing creation/editing, blocked dates, booking management, messages, reviews, analytics, settings, and subscription surface.
- Booking flow with Safepay as primary payment and JazzCash/EasyPaisa infrastructure available but disabled for mobile.
- Messaging (students start conversations; participants continue them), reviews, owner replies, price alerts, notifications, FCM push backend, cron jobs, and admin moderation.
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
| Mobile | Expo 57.0.26 / React Native 0.86.3 / React 19.2.3 under `apps/mobile` |
| Database | Neon PostgreSQL via Prisma 7 and `@prisma/adapter-pg` / node-postgres |
| Auth | NextAuth v5 JWT strategy plus mobile Bearer bridge in `src/proxy.ts` |
| Search | Typesense with Prisma fallback |
| Cache/rate limits | Upstash Redis |
| Cron | Upstash QStash calling secured route handlers |
| Storage | Cloudflare R2 for public listing images and a separate private bucket for student verification documents |
| Email | Resend |
| SMS | Twilio |
| Push | Firebase Admin + `DeviceToken` records |
| Payments | Safepay primary; JazzCash/EasyPaisa infrastructure present |
| Error tracking | Sentry client/server/edge initialization with Next.js instrumentation hooks and explicit event-data minimization |
| Tests | Vitest and Playwright |

The application is intentionally not microservices. The API, web UI, database schema, and most business logic ship together, which keeps versioning and operational complexity low.

Client-side animation follows `prefers-reduced-motion` through Motion's `MotionConfig`; Lenis smooth scrolling stops while the preference is enabled and resumes if the preference changes back.

The hostel photo lightbox and admin review/suspension dialogs share app-owned modal focus handling: focus enters the dialog, Tab/Shift+Tab stay within the topmost dialog, Escape closes it when the action permits, and focus returns to the opener. Photo thumbnails are exposed as a labeled group of pressed-state buttons rather than tabs.

Homepage, auth marketing, comparison, and message-context hostel photos use the `PhotoImage` client wrapper; failed remote images are removed so the room-scene illustration stays visible, and nondecorative images retain accessible descriptions.

The navbar city selector uses a `Suspense` boundary around `useSearchParams()` and shows an inert, labeled “All cities” placeholder during prerender and hydration instead of an empty reserved box.

The web application is deployed to Vercel through GitHub Actions. Pull requests run web checks, mobile/shared TypeScript checks, and preview deployments; production deploys run a separate quality gate, apply migrations from Vercel's production environment, then build and deploy the artifact. Builds do not apply migrations, and preview schemas are managed separately. The CI workflows do not run Playwright E2E.

---

## 4. Current Repo Metrics

Filesystem audit on October 8, 2026:

| Area | Count |
|---|---:|
| Web page files | 53 |
| API route files | 69 |
| Prisma models | 23 |
| Prisma migrations | 21 |
| Vitest unit/integration test files | 122 |
| Playwright E2E specs | 5 |
| Mobile route/screen files | 16 |

---

## 5. Data Model

The Prisma schema lives in `prisma/schema.prisma`.

Core models:

- `User`: auth/profile fields, role, token version, email notifications, student verification fields, owner plan, subscription relation.
- `DeviceToken`: FCM/APNs token per mobile installation.
- `Subscription`: owner plan/status/payment reference.
- `Payout`: admin-created manual payout batches linked to eligible bookings, with paid status and transfer reference.
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

Booking refunds are represented by `Booking.paymentStatus`, `refundedAt`, and `refundedBy`; there is no separate refund record or immutable financial ledger. Payout batches likewise track gross booking totals and manual transfer references, not gateway settlement or a double-entry ledger.

---

## 6. API Surface

All API routes live under `/api`. There are 69 route files. Responses generally use:

```json
{ "data": {}, "message": "...", "error": "..." }
```

Route categories:

- Auth: signup, NextAuth, email verification, resend verification, forgot/reset password, delete account, phone OTP, mobile login, mobile refresh.
- Profile: profile update and password change.
- Hostels: search/list/create/edit, mine, admin detail/status, favorite, availability, view count, roommate posts. Public availability/review reads are limited to active hostels; owner edits are schema-validated, re-enter review, and are removed from Typesense while pending.
- Bookings: create/list/detail/status changes.
- Payments: initiate, Safepay webhook, JazzCash/EasyPaisa callback.
- Conversations: list, start with active hostels, read messages, and send messages.
- Reviews: create/list/mine/edit/delete/reply.
- Notifications: list/read/delete plus device-token registration routes.
- Price alerts: list/create/update/delete plus unsubscribe.
- Owner: analytics, subscription, blocked dates.
- Admin: hostels/listings/search sync/verifications, roommate report review/removal, payout batches, booking refunds.
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
- `tokenVersion` is checked in the JWT callback on every session read. A stale or malformed token returns `null`, causing Auth.js to clear the session cookie before route handlers can trust its role claim. Role changes must also increment `tokenVersion` and invalidate its cache entry.
- Profile edits cannot set an unverified phone number. The profile screen exposes OTP verification when the draft differs from the saved number; removing a number clears both the phone and `phoneVerified` timestamp.

Mobile:

- `POST /api/auth/mobile/login` returns an Auth.js encrypted JWE token, user payload, and server-supplied `expiresInSeconds`.
- Mobile stores the opaque token, expiry metadata, and user in `expo-secure-store`; it does not parse the encrypted token to infer expiry.
- Requests include `Authorization: Bearer <token>` and `X-Client: mobile`.
- `src/proxy.ts` injects the Bearer token into NextAuth-compatible cookie names.
- `POST /api/auth/mobile/refresh` accepts only a bounded (4,096-character maximum) unexpired Auth.js JWE, validates the decoded user ID and token version, and checks `tokenVersion` directly against the database before issuing a fresh token. Successful refresh responses use `Cache-Control: no-store`; expired or revoked sessions require sign-in.
- Mobile refresh runs within five days of expiry and when the app returns to the foreground. The API wrapper retries a 401 once; it clears local auth only after the server rejects the refresh, while transient network/server failures preserve the stored session for a later retry.

Authorization is role/ownership based:

- Students can access their own bookings, reviews, favorites, alerts, messages, and profile.
- Owners can manage their own hostels and related bookings/messages/reviews.
- Admins can moderate listings, reviews, verifications, and search sync.
- Admin student-verification decisions only update applications still in `PENDING`; stale decisions return a conflict. Hostel moderation validates each action against the current status and conditionally transitions from the observed state. Owner listing edits and status changes include ownership and the observed status in the write predicate, so a stale owner edit cannot undo an admin suspension.

`src/proxy.ts` performs request shaping (including the mobile bearer-to-cookie bridge) and CSRF checks. It is not the authorization boundary: route handlers and data/service functions must still authenticate, authorize roles and ownership, validate object fields, and return only client-safe data.

---

## 8. Security Design

Implemented:

- HTTPS-only deployment target.
- Content Security Policy in `next.config.ts`.
- CSRF Origin checks for browser state-mutating API routes.
- Bearer-authenticated mobile requests skip browser Origin checks.
- Zod validation on API payloads.
- Booking, refund, and payout actions return typed domain errors and map stale-state conflicts to HTTP 409; unexpected persistence failures return operation-specific generic HTTP 500 responses while logs use safe summaries.
- Upstash-backed rate limiting with in-memory fallback.
- User-keyed rate limits on high-risk authenticated routes.
- IP-based rate-limit keys share the Vercel-trusted client-IP extractor; alternate client-supplied proxy headers cannot rotate a caller's key.
- Paginated collection endpoints use a shared parser that clamps per-page limits, negative input, and page offsets (maximum page 10,000).
- Public review reads are limited to 120 requests per trusted client IP per minute; the administrator all-reviews list is limited to 60 requests per admin per minute. Both quotas run before review queries and return `Retry-After` when exceeded.
- Booking collection reads are limited to 60 per authenticated account per minute, and booking detail reads to 120 per account per minute. These limits run before booking queries and return `Retry-After`.
- Owner earnings reads, including pending-balance and payout-history lookups, are limited to 30 per authenticated account per minute before database/service work.
- Search and filter routes cap query-string size, free-text lengths, filter-array counts, and identifier/token lengths before starting database or search operations.
- Payment webhook/callback signature checks. Safepay uses its documented raw-body HMAC-SHA512 contract; callbacks also check the merchant key, signed order/tracker, provider, terminal state, currency, and exact amount before a conditional booking transition. The existing tracker makes an identical retry idempotent. The current handler settles inline; Safepay recommends durably storing the event, acknowledging it, then applying business logic. A durable webhook inbox and immutable refund evidence remain open. Sources: [Safepay HMAC guidance](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/) and [webhook delivery guidance](https://safepay-docs.netlify.app/developers/webhooks/overview/).
- Payment callback GET requests are read-only browser returns; only signed gateway POST callbacks can settle a booking.
- When `GATEWAY_IPS` is configured, JazzCash callbacks reject missing or non-allowlisted addresses before parsing payment data. The check trusts Vercel's overwritten single-IP `x-forwarded-for` value or a direct socket IP; it ignores client-controlled `cf-connecting-ip`/`x-real-ip` headers and rejects ambiguous forwarded chains. A proxy in front of Vercel requires Vercel Trusted Proxy configuration to preserve the original address ([Vercel request-header contract](https://vercel.com/docs/headers/request-headers)). HMAC remains the primary callback authentication.
- R2 URL allowlisting for submitted image URLs.
- Student identity documents use a dedicated private R2 bucket, student-only authenticated app uploads capped at 4 MiB, metadata/signature checks, and copy-on-submit to immutable review keys. Admins stream documents through an authenticated no-store route; an hourly QStash job deletes abandoned temporary uploads. The bucket API token is separate and bucket-scoped.
- Password-reset and email-verification tokens are short-lived and single-use. Both are stored as SHA-256 digests. The reset transaction conditionally claims a live token before changing the password, preventing concurrent replay. Email verification accepts the raw-token storage format only as a compatibility lookup for links issued before this change. Forgot-password requests return a generic account-neutral message and are limited to three attempts per IP per 15 minutes and three token sends per account per hour. Source: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- Reset-password pages send no referrer so bearer tokens in the URL are not disclosed through a subsequent navigation or request.
- Email-verification GET links only render a no-store confirmation form; a bounded same-origin POST atomically consumes the token and verifies the address, so mail scanners and link previews cannot consume it.
- Signup verification, resend, password-reset, subscription-checkout, and web-payment return URLs use the configured app origin; untrusted `Host` and forwarded-host request headers cannot choose security-sensitive destinations. The shared origin helper rejects HTTP in production while allowing localhost HTTP in development.
- Email-preference unsubscribe links use a signed, expiring HMAC token and verify the token email against the current account; unsigned userId/email encodings are rejected.
- Unsubscribe-link GET requests only render a no-store confirmation page; the bounded POST applies the preference change. Per-alert links and signed global price-alert email preferences are reachable from email, and users can re-enable them in profile settings.
- New, changed, and reset passwords are limited to 72 UTF-8 bytes before bcrypt hashing, avoiding bcrypt's silent input truncation. Account deletion removes associated user data in one transaction, recomputes ratings/counts for surviving reviewed hostels, and keyset-pages review cleanup in 200-row batches rather than materializing every review or owned-hostel ID.
- Profile updates and owner blocked-date writes have bounded JSON bodies and per-user rate limits; profile fields and calendar reasons are also length-validated. Admin student-verification actions accept only a small, schema-validated JSON body.
- Every owner blocked-date method requires the OWNER role before looking up the hostel; reads, counts, deletes, and creates are also scoped through the current hostel-owner relation. Blocked-date history, owner earnings history, and conversation/message reads use bounded page-scoped queries; conversation filters run server-side, and message-history reads have per-user rate limits.
- JSON request bodies are streamed through byte limits before parsing. Both multipart upload routes also enforce their byte caps while reading the stream, including requests without a `Content-Length` header. Write schemas cap fields and arrays where needed; listing creation retains and validates its image fields.
- Owner listing edits use the shared listing schema, preserve ownership, reset the listing to `PENDING_REVIEW`, and remove previously active listings from Typesense during review; suspended listings cannot be edited through the owner route.
- The hostel detail API that returns owner contact fields is admin-only; unauthenticated availability/review reads only expose active listings. The public view counter only increments active listings.
- Students can create favorites only for active listings. Favorite removal is an idempotent delete scoped by both the authenticated user and hostel slug, without a prior lookup that could reveal hidden-listing existence.
- Price-alert creation, list/update responses, and scheduled delivery require the related hostel to remain `ACTIVE`; suspended listings are hidden from alert owners and cannot trigger price-drop mail.
- Public hostel search is limited to 120 requests per trusted client IP per minute before querying Typesense or falling back to PostgreSQL; oversized queries are rejected first.
- Public 12-month availability aggregation is limited to 60 requests per trusted client IP per minute and rejects oversized hostel identifiers before database queries.
- Phone OTP requests have both per-destination daily limits and a per-IP hourly cap before invoking the SMS provider.
- Owner subscription endpoints require the OWNER role, do not return the Safepay tracker, and rate-limit checkout creation per owner.
- Booking checkout and booking-status actions, owner subscription checkout, SMS OTP, issue reports, uploads, and other high-cost writes apply per-user, destination, or trusted-IP rate limits. Booking status updates use conditional state transitions and restore room inventory only after winning the transition, preventing duplicate inventory restoration on concurrent actions. Student cancellations scope the write to the student's ID, require PENDING status, and are rejected after check-out or owner confirmation. Student/admin cancellation writes also require payoutId to remain null, so they cannot race a payout batch claim. Owner confirm/decline writes require the current hostel-owner relation. Owner payout bank-detail updates are limited to five per user per hour. Provider spending limits still need operational validation against production provider quotas.
- Owner listing creation reads the owner's plan, checks the current listing count, and creates the listing inside one PostgreSQL Serializable transaction. Prisma serialization conflicts (P2034) retry up to three attempts; the admin email is sent only after commit. This prevents concurrent requests from oversubscribing a plan quota. Source: [Prisma transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
- Review creation/edits are limited to 10 per user per hour, and push-token registration to 20 per user per hour, to curb repeat owner notifications and unbounded token writes.
- Notification inbox reads are limited to 60 requests per user per minute; read-all is limited to 5 writes per minute and per-notification read/delete actions share a 60-per-minute user cap. Limits are checked before database work or body parsing, while notification reads and mutations remain scoped to the authenticated user.
- Owner booking lists apply ownership through the hostel relation in the paginated booking query, avoiding an application-side preload of every hostel ID.
- Admin-only payout and refund endpoints enforce privileged role checks.
- Review collection APIs paginate public per-hostel results, restrict the all-reviews list to admins, and rate-limit both query paths before database work. Admin review deletion recalculates hostel rating/count transactionally and reindexes the hostel in Typesense.
- Review-reply save/removal is limited to 10 actions per user per hour; only owners and admins reach the review lookup, and owner writes remain scoped to current hostel ownership.
- Owner listing edits and status changes are limited to 30 PATCH actions per owner per hour before the listing lookup.
- Price-alert reads use bounded pagination and creation is rate-limited per account; alert fields are constrained before database operations.
- Favorites and the admin student-verification queue use server-side bounded pagination; verification name/email search is capped before querying.
- The admin payout queue pages eligible owners and sums booking totals with a database group aggregate instead of loading booking rows. It returns the latest 20 batches per owner and signals when older history is omitted.
- Roommate-post reads, writes, and reports require a student session; authors can delete their own post. Student roommate posts and reports have small JSON body caps and per-student rate limits. The board exposes reporting only to students and marks a report only after the API accepts it. Posts remain visible until three unique students report them; the shared threshold drives the student listing and admin queue. `/admin/roommate-reports` shows paginated reports and reasons, and admins can remove reported posts.
- Phone changes remain OTP-backed: `PATCH /api/profile` rejects nonempty phone changes, the settings form prompts verification when its draft differs from the saved number, and phone removal resets `phoneVerified`. Failed attempts use a conditional counter capped at five; a correct code is deleted in the same transaction that sets the verified number.
- Favorite creation/removal is student-only and limited to 60 actions per student per minute before the hostel database lookup.
- Paginated favorites and owner listing reads are capped at 60 requests per user per minute, owner review dashboards at 30, and batch-scanning owner analytics at 10; throttled responses include `Retry-After` and limits run before database queries.
- Admin booking state changes emit a correlated JSON audit event containing the action and keyed pseudonyms for actor and booking IDs; raw email, hostel name, and source identifiers are omitted. Booking IDs are capped at 64 characters before GET/PATCH database work.
- Credentials sign-in checks independent 10-per-15-minute trusted-IP and 5-per-15-minute keyed-account buckets; web and mobile share both buckets. Login success, rejection, and throttling emit correlated events with HMAC pseudonyms rather than raw emails or addresses.
- Admin listing-completeness and verification analytics scans are limited to 10 requests per admin per minute before database work. Sensitive admin collection reads share a 60-per-minute per-admin quota; private verification-document reads have a separate 30-per-minute cap. Cron health reads a fixed schedule set.
- Private student-verification document reads are limited to 30 requests per admin per minute before user lookup or R2 fetch; throttled responses include `Retry-After`.
- Price-alert edits/deletes are capped at 60 actions per user per minute and roommate-post deletion at 30 per minute; both reject overlong item IDs before the database lookup and return `Retry-After` for throttled requests.
- Review creation requires a `STUDENT` session; overlong request-body hostel IDs are rejected before a completed-booking lookup or review write.
- Listing-image uploads require an owner or administrator when a hostel ID is supplied. Owner-scoped lookup returns the same 404 for absent and foreign listings, and malformed or overlong multipart hostel IDs are rejected before lookup. Uploads require an identified session; missing R2 credentials or an invalid public image URL fail with 503 in production, while the placeholder response is limited to local development.
- Owner listing creation is capped at five per hour; device-token registration/removal is capped at 20 per user per hour. Email-verification token reads and price-alert unsubscribe lookups are capped per trusted client IP before database access.
- Admin refund actions are capped at five per admin per hour; payout writes at 10 per hour; hostel, verification, review, and roommate moderation at 30 per minute; full Typesense sync at two per hour. Throttled responses carry Retry-After.
- Full Typesense reindex uses narrow 100-row keyset pages and indexes each page directly, avoiding the full active-listing read and per-hostel follow-up reads.
- Notification read/delete and roommate-post deletion apply the authenticated user ID in the database write predicate and return 404 for both absent and non-owned resources.
- Method-level Route Handler review found state changes guarded by role-scoped user/admin quotas, trusted-IP caps, the shared notification-write quota, atomic OTP-attempt limits, or verified one-time/signed ingress. The intentionally public hostel view counter is IP-limited; provider callbacks and cron writes verify signatures before mutation.

Open / needs verification:

- Confirm production Neon backup/PITR retention, document recovery point objective (RPO) and recovery time objective (RTO), and exercise a restore.
- The draft [launch operations runbook](docs/LAUNCH-OPERATIONS-RUNBOOK.md) separates deployment rollback, Neon recovery, Safepay reconciliation, private-document exposure, and alert response. Assigning owners and exercising provider-console procedures remain release gates.
- Audit authorization at the data boundary for object-level, property-level, and function-level access on every public Route Handler. Targeted October 6–7 reviews removed the admin bypass from private conversation reads, stopped owner-edit metadata from disclosing listing names to unauthorized visitors, kept phone changes behind OTP verification, and restricted review creation to students before a bounded booking lookup; the route-by-route audit remains open.
- Verify `NEXT_PUBLIC_APP_URL`/`AUTH_URL` are set to each environment's intended canonical HTTPS host; password and verification links plus payment redirects now use that configured origin rather than the incoming request host.
- A production-mode unit regression exercises a rejected Upstash request: the per-instance in-memory fallback still denies requests above its configured window and does not log the provider error message. This does not verify production Redis behavior or coordinate limits across serverless instances; production still requires Upstash and provider-side transaction/idempotency safeguards.
- Review remaining per-user resource quotas and unbounded result sets. Account deletion now bounds intermediate review memory and scopes owner-hostel cleanup through relations, but it remains a single transaction whose duration and aggregate-update count scale with the account's data. URL/query bounds and request-body limits reduce individual request work but do not bound all accumulated per-user data.
- Verification and listing-completeness scoring process matching rows in 200-row keyset batches, bounding application memory while total reads remain proportional to result-set size. Owner analytics groups six months of bookings and paid revenue by month in one owner-scoped SQL aggregate, keeping raw booking rows out of application memory. Public availability uses date-range deltas and binary-searched calendar boundaries, so aggregation work is O(matches × log days + days) for at most 366 days. Benchmark at expected launch volume. Owner listing totals and booking status/revenue summaries use database aggregates.
- Sentry client/server/edge SDKs disable automatic collection of user data, cookies, HTTP headers/bodies, query parameters, database query data, and stack-frame locals; event and span callbacks strip request payloads and scrub common identifiers. Confirm project-level Sentry scrubbing and IP settings in the console.
- Sentry tracing is configured at a 100% sample rate for client/server/edge; measure production volume and tune sampling while preserving high-value errors and critical transaction traces.
- Application catches now log allowlisted error summaries; cron failures return and persist only generic status text, and cron-health reads only configured job names while redacting legacy error details. Replace remaining ad-hoc console output with correlated structured logs for critical operations and add alerts for payment, search, notification, and cron health.
- Confirm production database connection limits against Vercel instance/region scaling; the node-postgres pool uses its default maximum per process and a serverless fleet can multiply connections.
- A roommate post at the three-report threshold remains hidden until expiry unless an admin removes it. The current schema has no audited dismiss/restore state; decide whether that workflow needs a future schema change before adding moderator restore actions.
- The last successful web production dependency audit reported zero vulnerabilities after upgrading Next.js to 16.3.8. The full audit retains five high development-tool findings through `braces` in the ESLint chain; the current upstream advisory lists no patched version, so do not force-downgrade the Next ESLint configuration. A web audit refresh on October 6 at 13:35 UTC could not reach the npm advisory endpoint (`ENOTFOUND registry.npmjs.org`). Mobile was refreshed October 7 with 30 production findings (19 high, 11 moderate, zero critical), but a repeat request in this review failed with the same DNS error; these are the last successful counts.
- Complete physical-device QA for mobile deep links and push notifications.
- Create/configure the dedicated private R2 bucket and bucket-scoped token, schedule the abandoned-upload cleanup job, and clean up legacy student documents that remain public in the listing bucket. See [private verification storage setup](docs/PRIVATE-STUDENT-VERIFICATION.md).

---

## 9. Payments

Safepay:

- Primary payment method.
- `POST /api/payment/initiate` creates a Safepay v3 tracker and hosted checkout URL. App/database values remain whole PKR; the integration boundary converts to paisas. Configuration uses separate `SAFEPAY_API_KEY` (`sec_...`), `SAFEPAY_SECRET`, and `SAFEPAY_WEBHOOK_SECRET` values.
- `POST /api/payment/webhook` is the server-to-server source of truth. During webhook-key rotation it can temporarily accept an explicitly configured previous secret until an ISO-8601 expiry, capped at 72 hours; unset both overlap variables after the queue drains.
- Owner Pro currently uses a one-time PKR 3,000 checkout that grants one month of access; it is not automatic recurring billing.
- Webhook expects the current `payment.succeeded` / `payment.failed` event shape, a matching merchant key, HMAC-SHA512 signature, tracker, order ID, PKR currency, exact paisa amount, and `TRACKER_ENDED` for success. Booking events are bound to a Safepay `paymentMethod` at read and state-write time; legacy null methods retain the Safepay default.
- Mobile checkout return links carry only the booking ID; the app treats the URL as untrusted, then reads the authenticated booking endpoint and derives its result from the server-recorded payment and booking states. Pending stays in a checking state; resuming reuses the outstanding tracker, and a retry after recorded failure reuses the booking with a new tracker. A payment received after cancellation is shown distinctly. Redirect parameters never confirm a payment.
- A booking stores its active tracker in the existing `transactionId` field; a retry reuses the tracker. Conditional updates bind the provider and tracker, block duplicate settlement, and prevent delayed success from reviving cancelled bookings. Late successful payments stay CANCELLED + PAID for refund review. A durable webhook inbox/idempotency ledger remains unimplemented.
- Mobile clients send `X-Client: mobile` and receive `hostello://payment/return?...` return paths.
- Refund helper sends paisa-denominated `amount`/`currency` to `POST /order/payments/v3/{tracker}/refund` and accepts a full refund only when `data.tracker.state` is `TRACKER_REFUNDED`. An unknown/failed response leaves the booking PAID; the admin can record a manual refund after verifying it in Safepay. Merchant sandbox validation remains open.

JazzCash and EasyPaisa:

- Both remain disabled. JazzCash GET returns only redirect to the payment page; POST callbacks fail closed without an integrity salt, use constant-time HMAC comparison before settlement, and enforce the optional configured gateway IP allowlist before parsing callback data. EasyPaisa redirects are unsigned and cannot settle bookings until a server-side transaction inquiry is added.
- The callback route also checks the enabled-method registry before parsing JazzCash data. Before enabling JazzCash, bind the provider transaction reference and signed bill reference to the selected booking to prevent cross-booking replay.
- Mobile redirect design work is documented separately; provider enablement and physical-device flows remain out of scope for this launch.

Payouts:

- Admins can generate a manual batch from paid, confirmed/completed bookings whose checkout date has passed.
- One shared predicate defines payout eligibility for owner balance, admin queue, and the transactional claim: owner relation, `CONFIRMED`/`COMPLETED`, `PAID`, checkout passed, and no existing payout assignment.
- The admin queue is paginated; pending balances are grouped by hostel in the database, and inline history is limited to the latest 20 batches per owner. Batch generation rechecks the current OWNER role and requires nonempty bank-account title, account number, and bank name inside the transaction; the admin and owner screens use the same completeness rule.
- The batch atomically claims currently eligible bookings with a conditional update and computes its whole-PKR amount with a database aggregate; cancellation writes require payoutId to remain null, so a booking cannot be cancelled after a batch claims it. An admin performs the transfer outside the product and records the transfer reference only after completion. The existing CANCELLED enum state has no supported void/unclaim action. Durable cancellation actor/time/reason fields and a frozen transfer-destination snapshot are still needed before real transaction volume.
- There is no automated provider settlement, fee/commission accounting, payout reversal, or immutable ledger yet.

Refunds:

- An admin-only endpoint calls the Safepay refund helper for a cancelled, paid booking.
- The helper validates the documented full-refund tracker state; unknown, partial, nonterminal, and failed responses are unconfirmed. The booking stays PAID and the student is not told a refund completed. Admins may record a manual refund only after provider-side completion.
- The current schema does not persist refund attempts, provider evidence, a manual-confirmation note, or webhook/inbox events. A refund state machine and scheduled reconciliation still need a safe-target migration and operator runbook.

Abandoned payments:

- Cron cancels stale pending payments/bookings and restores availability after the configured timeout.

---

## 10. Notifications

In-app notifications:

- Written to the `Notification` table.
- Exposed through the web dashboard and the mobile profile-linked inbox; the mobile inbox loads the latest 100 from the paginated API and supports read/read-all actions.
- Notification taps route booking updates to bookings, message pushes to the exact conversation when push-only context exists (otherwise the message list), and other events to the inbox.

Push notifications:

- `DeviceToken` stores mobile tokens.
- The Expo client obtains native FCM/APNs device tokens because Firebase Admin sends directly through FCM; [Expo documents native tokens for direct FCM/APNs delivery](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#getdevicepushtokenasync).
- Firebase Admin sends multicast notifications from `createNotification()`.
- Invalid/stale tokens are deleted when FCM returns invalid-registration errors.
- Mobile caches its registered token in SecureStore. Sign-out unregisters the saved token and never prompts for permission; an existing installation may read the token only if permission was already granted.
- Push tap handling covers warm and cold starts using the SDK 57 response listener and last-response API, then clears the consumed response. Destinations are mapped from known event types instead of trusting an arbitrary URL; [Expo's SDK 57 notification API](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) documents these response APIs.
- Message bodies stay in the authenticated inbox; lock-screen pushes use a generic “You have a new message” preview. Push payloads include only a conversation ID for routing; the ID is not added to the notification table.
- Beta scope includes notifications and push. Mobile price alerts remain deferred; web email alerts remain available.

Remaining before mobile beta:

- Verify token registration/deletion on physical devices.
- Verify foreground/background/killed-state notification behavior.
- Verify tap routing, lock-screen privacy, and stale-token cleanup on physical devices.

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

Operator steps for health checks, schedule restoration, safe manual retries, payment support, and deployment rollback are in [`docs/OPERATIONS-RUNBOOK.md`](docs/OPERATIONS-RUNBOOK.md).

Cron endpoints:

- `POST /api/cron/mark-completed-stays`
- `POST /api/cron/cancel-abandoned-payments`
- `POST /api/cron/check-price-alerts`
- `POST /api/cron/cleanup-tokens`
- `POST /api/cron/cleanup-verification-uploads`

Cron security:

- `verifyUpstashRequest` validates QStash JWT signatures, endpoint URLs, body hashes, and token validity using the official QStash receiver SDK. Configure both `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` to enable signature verification and support key rotation.
- `CRON_SECRET` Bearer verification remains supported for manual/legacy schedulers. `npm run schedule-cron` adds this header to the QStash delivery while QStash also signs each request.

Schedules are defined once in `src/lib/cron-schedules.ts` and consumed by both the scheduler script and health endpoint. `npm run schedule-cron` uses the official QStash SDK, stable schedule IDs, five-field UTC cron expressions, and exits non-zero if any registration fails. It registers daily stay completion, five-minute abandoned-payment cleanup, six-hour price alerts, daily token cleanup, and hourly private-upload cleanup.

Observability:

- `CronLog` rows track last run/status/duration/error; the write is awaited before the route responds, and persistence failures are logged safely without changing the completed job result.
- `GET /api/health/crons` surfaces cron health.
- Completion and abandoned-payment jobs process batches of 100 and use conditional state updates. Completion notifications are written in the same transaction as the stay transition; push sends happen after commit. Abandoned-payment cleanup restores room availability only if it wins the conditional cancellation update.
- Price-alert checks page active alerts in keyset batches of 100. A failed email leaves the alert eligible for retry; after provider acceptance, the alert is deactivated and its price/timestamp are persisted immediately.
- There remains a duplicate-email crash window between provider acceptance and persistence. Durable outbox/provider idempotency is still needed for stronger delivery guarantees. No durable general-purpose job queue or structured application logger is present; cron retries must remain safe to repeat.

Scripts:

- `scripts/schedule-cron-jobs.ts`
- `scripts/check-price-alerts.ts`
- `scripts/setup-typesense.ts`
- `scripts/verify-typesense-fallback.ts`

---

## 13. Migrations

Migration workflow is enforced.

- New migrations: `npm run migrate:new`.
- Production migration command: `npm run db:migrate:deploy` (`prisma migrate deploy`). The production GitHub Actions workflow runs it against Vercel's production environment after the quality gate and before building the artifact; the database URL stays in Vercel rather than being copied into GitHub Actions secrets.
- Build command: `npm run build` runs `prisma generate && next build` and never applies migrations. Preview builds do not migrate their database; keep preview schema changes managed separately.
- Next.js prerendering still executes database-backed metadata reads, so successful local/preview builds need a reachable database with a compatible schema. Do not point a build or migration check at an unverified/shared database.
- Keep database changes backward-compatible across old and new app versions (expand, migrate/backfill, then contract); destructive or rename changes need a staged rollout.
- Pre-commit hook blocks staged `prisma/schema.prisma` changes without staged migration files.
- Migration ledger is in `prisma/MIGRATIONS.md`.

Current migration count: 21.

Never edit SQL for a migration that has been applied to any shared or production database. Create a corrective migration instead.

---

## 14. Mobile System Notes

Mobile app status:

- Expo Router app exists.
- Auth screens and main tabs exist.
- SecureStore auth, token refresh, and route guard exist.
- Hostel detail, booking, conversation, favorites, bookings, messages, profile, and notification inbox screens exist.
- The `hostello` custom scheme and native iOS associated-domain/Android intent filters are declared for `hostello.pk` and `www.hostello.pk`. Both association files are tracked. The Apple file currently sets `appID` to only `com.hostello.app`; Apple requires the app-ID prefix followed by the bundle ID. The Android file targets package `com.hostello.app`, but its SHA-256 fingerprint must match the release signing certificate (the Play App Signing certificate when enabled). Verify both files at the live HTTPS origins before beta. Sources: [Apple Universal Links](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html) and [Android App Links](https://developer.android.com/training/app-links/configure-assetlinks?hl=en).
- Push notification taps open allowlisted booking, message, or inbox destinations; message pushes use generic lock-screen text.

Current mobile risks:

- Safepay return and push delivery need physical-device QA.
- The `staging` EAS profile explicitly selects the `preview` environment and no longer embeds a placeholder API URL. Configure `EXPO_PUBLIC_API_URL` in EAS preview before building; the EAS dashboard value is not verified here. Follow the current [EAS environment-variable guidance](https://docs.expo.dev/eas/environment-variables/usage/) for builds and updates.
- Configure and verify Firebase native service files through EAS (`GOOGLE_SERVICES_INFO_PLIST` and `GOOGLE_SERVICES_JSON`) before building. The local iOS `./GoogleService-Info.plist` is absent; an ignored local `google-services.json` exists, but its EAS availability has not been verified. The Android JS export completed while warning about the missing iOS file.
- EAS signing credentials, first preview build, and mobile Sentry should be confirmed before external beta. The tracked Apple app-site association file needs the actual Apple App ID prefix added; the Android `assetlinks.json` fingerprint needs confirmation against the EAS/Play release signing certificate. The live host responses are also unverified.
- The app manifest now declares its `@hostello/shared` file dependency and Zod 4 runtime dependency; `packages/shared` also declares Zod as a runtime dependency. This fixes Metro's earlier unresolved shared-package import and allows the app package to install independently. Expo SDK 57 supports on-demand filesystem resolution for linked source outside the app directory. Sources: [Expo Metro file-system guidance](https://docs.expo.dev/versions/v57.0.0/config/metro/) and [EAS monorepo builds](https://docs.expo.dev/build-reference/build-with-monorepos/).
- The app is on Expo SDK 57.0.26 / React Native 0.86.3 / React 19.2.3 / TypeScript 6.0.3. The increment-by-increment SDK 54 → 55 → 56 → 57 upgrade, native dependency alignment, app-config plugin setup, and Android prebuild are complete. Expo SDK 58 is now stable (Expo 58.0.6 was released October 6) and targets React Native 0.88 / React 19.3. Its migration includes React Native 0.87 strict TypeScript/API changes and the iOS scene-based lifecycle. An SDK-major migration is pending explicit authorization and native migration review. The audit includes GHSA-vcc3-ghjq-m6fr in `decode-uri-component@0.2.2`. Static source tracing shows Expo Router 57 app links use its forked parser and URLSearchParams; the vulnerable `query-string.parse` function remains in React Navigation generic parser code, which ExpoRoot does not wire for app links. No active deep-link path to the decoder was found. Native artifact and remaining advisory review plus device tests still gate beta distribution. Sources: [Expo SDK reference](https://docs.expo.dev/versions/v58.0.0/), [Expo SDK upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [SDK 58 beta notes](https://expo.dev/changelog/sdk-58-beta).
- The last successful October 7 mobile `npm audit --omit=dev` report returned 30 findings (19 high, 11 moderate, zero critical); a recheck failed because registry DNS did not resolve. It initially identified critical command injection in `shell-quote@1.10.0`; the lockfile now resolves `shell-quote@1.12.0`, outside the vulnerable `<1.11.0` range. Compatible Expo SDK 57 patch updates also reduce the high finding count by one; direct Expo and React Native pins remain 57.0.26 / 0.86.3. The latest Android Metro export contains 1,563 bundled modules and 1,570 source records from 68 npm package names. It confirms `query-string@7.1.3` and `decode-uri-component@0.2.2` are in the app bundle; build-tool packages such as `node-forge`, `xcode`, `uuid`, and Metro file-map dependencies do not appear in the JavaScript bundle. The current native app-link call path uses Expo Router forked parsing and URLSearchParams; `query-string.parse` occurs in the generic React Navigation parser, while ExpoRoot supplies the custom Expo linking config. The decoder was not found on the active deep-link path. This remains a JavaScript-only assessment; native artifact and remaining advisory reviews are open. The bundle was exported without Hermes bytecode because the sandbox denied writes to Hermes' temporary output path. Remaining findings require per-advisory path and native artifact review; do not use blanket forced fixes.
- The generated Android project remains checked in, while `app.config.js` is the configuration source. Expo Doctor reports one native-config synchronization warning because EAS does not reapply app-config fields to an existing native directory. Android was regenerated from the current config; rerun `npx expo prebuild --platform android` after native app-config/plugin changes. There is no checked-in `ios` directory, so EAS generates iOS from config.
- Android prebuild succeeded, but this workstation has no JDK or Android SDK, so a Gradle build was not available. An EAS preview build, iOS build, signing setup, and physical-device QA remain release gates. The current SDK 57 EAS image is Xcode 26.6; if moving to Xcode 27/iOS 27, enable scene support through `expo-build-properties` as described in the [SDK 57 release notes](https://expo.dev/changelog/sdk-57).

---

## 15. Testing

Current coverage:

- 119 Vitest unit/integration test files.
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

Last successful local verification on October 8, 2026:

- `npx vitest run`: pass, 122 files and 733 tests. Coverage includes shared web/mobile IP and HMAC-account credential limits, expired encrypted mobile-token rejection, server-supplied expiry metadata, transient refresh preservation, and unauthenticated login 401 handling; JSON-LD inline-script delimiter escaping and round-trip serialization; oversized dynamic API path parameters are rejected before database work; oversized hostel-view slugs are rejected before rate-limit/database work; oversized conversation hostel IDs are rejected before database lookup; primary and destructive button inverse colors survive text-size class merging; About and authentication routes have one main landmark with an identified skip target; anonymous phone OTP issuance is rejected before storage or SMS delivery; trusted-IP public review-read, per-admin all-review-list, shared sensitive admin-queue reads, private verification-document, per-account booking-list/detail, and owner-earnings quotas; active-listing checks on new conversation creation; navbar Suspense fallback coverage; streamed body caps, bounded favorites/admin verification/payout queues, owner earnings history, owner blocked-date history, and account-deletion review batching; sanitized cron failure/health reporting; awaited CronLog persistence; shared five-job cron schedule registry; QStash JWT signature, key rotation, URL, and body verification; rejected token-cleanup auth skips cleanup; disabled JazzCash callback rejection; modal focus-boundary behavior; per-user review, device-token, notification, collection-read, admin-analytics, and password-reset throttles; hashed reset tokens with atomic claims; email-verification tokens stored as SHA-256 digests with legacy-link compatibility; development-only style-guide route behavior plus a desktop/mobile render regression for one H1, no overflow, failed responses, or browser errors; revoked/malformed JWT session rejection before route authorization; atomic OTP attempt/replay controls; student-only favorite mutations (active-hostel creation and user-scoped idempotent deletion) and throttling; Leaflet popup text/attribute escaping, URL restrictions, and unsafe-scheme rejection; review-reply role authorization and throttling; owner listing PATCH throttling; serializable owner plan-quota writes with bounded conflict retries and post-commit notification; stale verification/listing moderation compare-and-set writes; owner review-reply writes conditional on current hostel ownership; price-alert APIs and cron hide non-active hostel data; conversation notification failures log sanitized errors without participant IDs; IP-limited public hostel search with a structured degradation event; correlated payment/reconciliation and notification outcome logs; cron event logs with request/trace IDs; production-mode Redis outage fallback enforces per-instance rate limits without logging provider exception text; batched listing-completeness, owner/moderator analytics, and public availability; bounded conversation/message reads with participant-only access; owner booking relation scoping; owner blocked-date role and current-ownership checks; conditional cron state transitions; payment ingress, payout aggregation, and shared payout eligibility; read-only unsubscribe/payment/verification GETs; signed unsubscribe tokens; atomic one-time email verification; verification POST CSRF enforcement; configured-origin HTTPS link and checkout destinations; profile email preferences; OTP-backed phone changes; SMS limits; roommate moderation; listing edits; password byte limits; mobile push-notification routing, and conditional booking status transitions that prevent duplicate room restoration.
- Follow-up verification after review-submission authorization: `npx vitest run` passes 115 files and 710 tests, including non-student denial before quota/database work and oversized review hostel-ID rejection before the completed-booking query.
- Focused verification after listing-image upload hardening: `src/app/api/upload/route.test.ts` passes six tests covering authentication, owner/admin role boundaries, foreign-listing indistinguishability, and malformed or overlong multipart IDs. Full suite, root typecheck, and lint were subsequently verified after mobile refresh and conversation-input hardening; see the current 116-file/719-test baseline above.
- `npm run typecheck`: pass on October 8. `npm --prefix apps/mobile run typecheck`: pass on SDK 57 and TypeScript 6.0.3; removed deprecated `baseUrl` while keeping the `@/*` path mapping.
- `npm run lint`: last full run on October 8 passed with 0 errors and 26 warnings; the style-guide route and its new test pass targeted ESLint. Two public hostel-photo warnings and two React Hook warnings were removed; the map popup HTML is now escaped and its async effect cleanup is stable. City JSON-LD scripts use HTML-safe serialization. Remaining warnings are in existing `any` usage and three avatar/private-document image elements. The updated scheduler script and cron/security files also pass targeted ESLint and TypeScript checks.
- Mobile SDK 57 package alignment: incrementally upgraded Expo 54 → 55 → 56 → 57.0.26; React Native 0.86.3, React 19.2.3, and Expo native modules align. `expo install --check` and config evaluation pass. Expo Doctor passes 20/21 checks; the sole warning is the checked-in native directory/config synchronization behavior described above. Android prebuild completes.
- `npm audit --omit=dev` in `apps/mobile`: refreshed October 7 after fixing critical `shell-quote` and applying compatible Expo tooling patches; 30 findings remain (19 high, 11 moderate, zero critical). The app lock still targets Expo 57.0.26 / React Native 0.86.3. The latest Android Metro export contains 1,563 modules / 1,570 source records / 68 package names; `query-string` and `decode-uri-component` are in the JS bundle. Per-advisory vulnerable-function and native-binary reviews remain open. The export succeeded with `--no-bytecode` because Hermes could not write its temp output. `@hostello/shared` and Zod 4 are declared in the mobile package; Android bundling and mobile TypeScript pass. Expo's dependency check uses its bundled local map and is unreliable offline. The local `GoogleService-Info.plist` is absent; the ignored Android Firebase file exists locally, but EAS values must be verified. This workstation lacks Java and Android SDK. SDK 58's reachable Expo Router fix remains gated on explicit authorization for the major native SDK migration.
- Web runtime security: Next.js is 16.3.8; `npm audit --omit=dev` reports zero vulnerabilities. Full audit retains five high findings in `braces` through development lint tooling; [the current advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched release listed.
- Shared package `npx tsc --noEmit`: pass.
- `npx next build --webpack` with an unreachable localhost-only database URL: compilation and TypeScript passed; static page generation stopped on database-backed metadata reads for `/university/[slug]` and `/hostels/in/[city]`. This safely confirmed the `/about` Suspense error was fixed, but it did not produce a successful build. `npm run build` no longer applies migrations; a reachable, schema-compatible database is still needed for those prerendered metadata reads.
- Sentry client setup now uses Next.js `instrumentation-client.ts`; `instrumentation.ts` exports `onRequestError` for server errors and the client instrumentation exports `onRouterTransitionStart` for navigation tracing. See [Next.js instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) and [Sentry's Next.js setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).
- Browser smoke review: `/`, `/about`, `/contact`, `/list-your-hostel`, `/forgot-password`, `/login`, `/register`, and `/hostels` returned HTTP 200 without page errors at tested desktop/mobile widths. `/hostels` now has one descriptive H1 and one main landmark. Database-backed city/detail/search results remain unverified because the preview database and Typesense endpoint were intentionally unreachable.
- API/service error logs use a safe summary (name, allowlisted code, status) instead of serializing raw exceptions; payment callback inputs are no longer interpolated into log messages. Sentry's installed v10.74.0 SDK is configured to omit request/user payloads and scrub event/span fields before sending.

Run E2E only with a disposable local/test Postgres database. The guard is intentional and should not be bypassed for production or shared remote databases.
For local runs, create `.env.e2e` from `.env.e2e.example`; it is loaded before `.env` and ignored by git.

---

## 16. Open Issues And Decisions

| Item | Severity | Status | Next action |
|---|---|---|---|
| Safepay/refund reconciliation | P0 | Open | Safepay v3 amount/event/signature checks and fail-closed refund handling are implemented. Verify the configured merchant in sandbox, resolve any legacy in-flight sessions at rollout, persist refund/webhook evidence, and define safe operator retry/reconciliation before real transaction volume. |
| Owner payout/accounting | P0 | Partially implemented | Manual payout batches claim eligible bookings and now require complete bank details before claiming. Transfer execution is external; batches do not freeze the transfer destination or support audited void/release, and there is no immutable ledger, fee accounting, reversal, or settlement reconciliation. Define those controls and reconcile against Safepay before real transaction volume. |
| Operational alerting | P1 | Partially implemented | Critical business paths emit privacy-limited structured JSON events with request/trace correlation. Configure and exercise Sentry/Vercel alerts for payment reconciliation, search degradation, notification delivery, cron failures, and cron-health endpoint failures; choose rate thresholds after production volume is observable. |
| Mobile native build and dependency review | P1 for mobile beta | Partially complete | Expo SDK 57.0.26 / React Native 0.86.3 are aligned. The last successful production audit has 30 findings (19 high, 11 moderate, zero critical); the current recheck failed because registry DNS does not resolve. Metro's latest Android source map contains 1,563 modules / 1,570 sources / 68 package names and confirms the URL parser packages are bundled. Per-advisory/native review, Android/iOS builds, and device QA remain open. EAS Firebase values and the absent local iOS plist need verification. This workstation has no JDK or Android SDK. |
| Mobile app-link associations | P1 for mobile beta | Open | Both files are tracked, but the Apple `appID` omits the Apple App ID prefix. Confirm the prefix and Android release signing fingerprint from provider accounts, update the files, and verify HTTPS responses on both declared domains. |
| Development lint dependency advisory | P2 | Open | The `braces` version in the ESLint toolchain is affected by an upstream advisory with no patch release listed as of October 5, 2026. Track the fixed release; avoid forcing `eslint-config-next` to an older major. |
| Production build and E2E | P1 | Open | Run against a verified disposable PostgreSQL database. The isolated webpack build compiles and type-checks, but prerendered city/university metadata requires database access; Playwright E2E is also pending. |
| Physical-device Safepay QA | P1 for mobile beta | Open | Test paid/cancelled/failed/abandoned flows on iOS/Android. |
| Physical-device push QA | P1 for mobile beta | Open | Test registration, delivery, tap routing, stale cleanup. |
| Database recovery readiness | P1 | Open | Confirm Neon production retention and restore options, set RPO/RTO, and rehearse recovery against a disposable branch. |
| Business mobile gate | P1 for launch | Open | Confirm booking volume, support capacity, budget. |
| JazzCash/EasyPaisa mobile callback flow | Deferred | Investigated | The redirect design spike is complete (`docs/superpowers/specs/2026-07-05-jazzcash-easypaisa-mobile-spike.md`); keep both providers disabled unless they become an explicit beta requirement. |
| Mobile notification/price-alert coverage | P2 | Partial | Mobile now has an inbox, read actions, and push tap routing. Price alerts stay web-only for beta; device QA and a later parity decision remain open. |
| Production observability | P2 | Open | Add structured/correlated logs and critical-flow indicators; tune Sentry trace sampling from measured production traffic and validate scrubbing. |
| Database connection budget | P2 | Open | Verify per-process node-postgres pool settings multiplied by peak Vercel instances fit the Neon connection budget; configure an explicit cap/pooler if needed. |

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
- `SAFEPAY_API_KEY` (public `sec_...` key; sandbox and production keys differ)
- `SAFEPAY_WEBHOOK_SECRET`
- `SAFEPAY_WEBHOOK_SECRET_PREVIOUS` and `SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL` (optional, temporary webhook-key rotation overlap; maximum 72 hours)
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

**R2:** Cloudflare object storage for public listing images and private student verification documents.

**tokenVersion:** Integer on `User`; incrementing it revokes older JWTs.

---

## 19. Revision History

| Version | Date | Summary |
|---|---|---|
| 1.4 | May 23, 2026 | Previous doc/code sync audit. |
| 1.5 | June 1, 2026 | Refreshed against current repo; cleared resolved mobile blockers; added current mobile/API/operations risks. |
| 1.6 | July 1, 2026 | Verified this doc's claims against the actual code (route count was stale: 53 → 57, fixed here and in `PROJECT_STRUCTURE.md`). Logged the P0 payout/refund gaps and P2 coverage/parity gaps found on inspection as open issues. |
| 1.7 | October 5, 2026 | Re-audited the current repository; updated architecture metrics, documented implemented manual payouts/admin refunds, and replaced resolved/stale risks with current financial, recovery, security, observability, and connection-budget follow-ups. Added a research-based practice baseline. |
| 1.8 | October 5, 2026 | Recorded current local checks (341 passing tests, web/mobile/shared type checks, lint with no errors), clarified test-file counts, and linked the active project completion plan. |
| 1.9 | October 5, 2026 | Checked the current Safepay refund guide, aligned the helper payload and full-refund response validation, and added focused contract tests. Persisted refund state and safe admin recovery still require a migration and remain open. |
| 2.0 | October 5, 2026 | Added current Expo SDK/dependency status, updated the migration ledger, and recorded the expanded 344-test baseline and remaining mobile security upgrade. |
| 2.1 | October 5, 2026 | Patched Next.js to 16.3.8; web production audit is clean. Recorded the unpatched development-only `braces` advisory and confirmed mobile dependency-audit caveats. |
| 2.2 | October 5, 2026 | Refreshed Sentry's Next.js instrumentation, recorded the production-build result with an unreachable local database, and fixed the shared navbar's missing Suspense boundary for query-param access. |
| 2.3 | October 5, 2026 | Migrated the integration code to Safepay v3 checkout, paisa amounts, and SHA-512 payment events; fail-closed unsigned EasyPaisa and missing JazzCash secrets; prevent refund failures from being recorded as completed; documented remaining migration, sandbox, and rollout gates. |
| 2.4 | October 5, 2026 | Added allowlisted error summaries, Sentry event/span privacy controls, and browser-smoke findings; refreshed the verified check counts and remaining operational gates. |
| 2.5 | October 5, 2026 | Moved new student verification documents to a separate private R2 bucket using student-only size-capped uploads, immutable review copies, authenticated admin streaming, and hourly staging cleanup; documented token setup and public-object cleanup for legacy documents. |
| 2.6 | October 5, 2026 | Upgraded the mobile app incrementally to Expo SDK 57, aligned React Native/native modules, regenerated Android from app config, updated TypeScript 6 path settings, and recorded the remaining native build, audit, and device gates. |
| 2.7 | October 6, 2026 | Fixed spoofable IP extraction for callback allowlisting and rate-limit keys, bounded collection pagination, corrected review moderation/list APIs and aggregate/search updates, restored author-scoped roommate-post deletion, and refreshed local verification. Rechecked Expo's current stable/beta SDK status. |
| 2.8 | October 6, 2026 | Implemented the selected three-report roommate hide threshold, bounded and rate-limited roommate writes, and added a paginated admin report queue with report reasons and confirmed post removal. |
| 2.9 | October 6, 2026 | Required student sessions for roommate reads; aligned the board’s reporting UI with API outcomes; bounded and rate-limited profile and owner blocked-date writes; capped admin verification action bodies; and tightened field validation. |
| 3.0 | October 6, 2026 | Bounded JSON and multipart request bodies, capped bcrypt inputs at 72 UTF-8 bytes, repaired account-deletion review aggregates, and completed the owner listing edit/review path; refreshed verification to 416 tests across 59 files. |
| 3.1 | October 6, 2026 | Restricted owner-contact hostel details to admins, hid non-active listing availability/reviews, signed account unsubscribe tokens, capped SMS OTP and owner checkout traffic, returned less payment data, and narrowed conversation creation to students; verification is 424 tests across 60 files. |
| 3.2 | October 6, 2026 | Capped search/filter query size and free-text, array, identifier, and token inputs before database/search work; documented provider rate limits and the per-instance Redis-outage fallback as remaining operational risks. |
| 3.3 | October 6, 2026 | Made unsubscribe GET routes read-only with bounded confirmation POSTs, connected signed global price-alert preference links, and added a profile control to re-enable optional alert email. |
| 3.4 | October 6, 2026 | Paginated favorites, verification, and admin payout queues; switched payout totals to database aggregates; made cron transitions conditional and batched; documented price-alert retry behavior and its remaining duplicate-send window. Current checks pass 442 tests across 66 files. |
| 3.5 | October 6, 2026 | Bounded owner earnings history and conversation/message reads, enforced OWNER role checks on blocked-date routes, and refreshed verification to 451 tests across 68 files, with 31 lint warnings. |
| 3.6 | October 6, 2026 | Added trusted-IP rate limiting to public availability aggregation and refreshed verification to 452 tests across 68 files. |
| 3.7 | October 6, 2026 | Scoped owner booking reads through the hostel relation to avoid materializing all owned hostel IDs. Documented the remaining analytics/backlog queries that need volume review. |
| 3.8 | October 6, 2026 | Rechecked the current Prisma release posture; retained the locked Prisma 7 line for production because Prisma 8 is still a release candidate and this app relies on atomic field increments not yet listed as available. |
| 3.9 | October 6, 2026 | Changed admin listing-completeness scoring to keyset batches of 200 rows while preserving the exact flagged count; verified 454 tests across 69 files. |
| 3.10 | October 6, 2026 | Bounded owner and moderator analytics to 200-row batches, replaced owner hostel ID materialization with relation-scoped aggregates, and verified 458 tests across 71 files. |
| 3.11 | October 6, 2026 | Batched public availability booking and blocked-date reads in 200-row keyset pages, switched date aggregation to interval deltas, and verified 460 tests across 71 files. |
| 3.12 | October 6, 2026 | Made payment callback GET returns read-only so only signed gateway POSTs can settle bookings; added regression coverage and verified 461 tests across 71 files. |
| 3.13 | October 6, 2026 | Paginated owner blocked-date history and added owner-calendar page controls; verified 462 tests across 71 files, root/mobile typechecks, and lint with 0 errors/31 warnings. |
| 3.14 | October 6, 2026 | Keyset-batched account-deletion review cleanup and removed owned-hostel ID materialization; verified 463 tests across 72 files, root/mobile typechecks, and lint with 0 errors/31 warnings. |
| 3.15 | October 6, 2026 | Redacted cron failure details from responses, logs, persistence, and health output; limited health reads to configured schedules; verified 467 tests across 74 files. |
| 3.16 | October 6, 2026 | Replaced the invalid raw-body QStash signature check with official JWT verification and key-rotation support; fixed schedule registration and added all health-monitored jobs to one shared registry; verified 477 tests across 76 files. |
| 3.17 | October 6, 2026 | Awaited cron health writes, rejected callbacks for disabled JazzCash, documented the operator runbook and recovery limits, and verified 480 tests across 76 files. |
| 3.18 | October 6, 2026 | Added per-user limits to review and push-token writes; updated verification to 484 tests across 77 files. |
| 3.19 | October 6, 2026 | Added a mobile notification inbox and allowlisted push-tap routing, made message pushes lock-screen safe, and updated verification to 488 tests across 78 files. |
| 3.20 | October 6, 2026 | Made booking status actions compare-and-set transitions, prevented duplicate room inventory restoration under concurrency, and verified 493 tests across 79 files. |
| 3.21 | October 6, 2026 | Capped owner payout bank-detail changes at five per hour per owner and refreshed verification to 494 tests across 79 files. |
| 3.22 | October 6, 2026 | Exported the Android Metro JavaScript bundle with an external source map and inventoried package reachability. Recorded the DNS failure preventing a current npm advisory refresh; native-binary exposure and per-finding decisions remain open. |
| 3.23 | October 6, 2026 | Rate-limited public hostel search before Typesense/PostgreSQL work, corrected the search route's misplaced test coverage, and verified 496 tests across 79 files. |
| 3.24 | October 6, 2026 | Removed the staging API placeholder and explicitly selected the EAS preview environment; documented the environment variable and live app-link verification gates. |
| 3.25 | October 6, 2026 | Applied reduced-motion preferences to Motion animations and stopped/restarted Lenis smooth scrolling as the OS preference changes; verified the 496-test suite. |
| 3.26 | October 6, 2026 | Restricted private conversation reads to participants, guarded owner-edit metadata by session and ownership, and verified 500 tests across 80 files, root typecheck, and changed-file ESLint. |
| 3.27 | October 6, 2026 | Refreshed stale project-structure counts and corrected the mobile app-link inventory; documented the missing Apple App ID prefix and unverified Android release fingerprint. |
| 3.28 | October 6, 2026 | Made email-verification GET requests read-only and moved one-time token consumption behind a bounded same-origin confirmation POST; focused route and unsubscribe checks pass. |
| 3.29 | October 6, 2026 | Ran the full Vitest suite after the email-verification change: 504 tests across 81 files pass; the root TypeScript check and changed-file ESLint pass. |
| 3.30 | October 6, 2026 | Added proxy-boundary regression coverage for verification POST CSRF and read-only GET previews; full suite passes with 506 tests across 82 files. |
| 3.31 | October 6, 2026 | Stopped deriving password, verification, and payment destinations from request host headers; use the configured app origin. Full suite passes with 509 tests across 83 files. |
| 3.32 | October 6, 2026 | Added a per-account password-reset throttle in addition to the per-IP cap; throttled and unknown-user responses remain the same. |
| 3.33 | October 6, 2026 | Full verification after the Host-header and reset-abuse fixes: 512 tests across 84 files pass; root typecheck and changed-file ESLint pass. |
| 3.34 | October 6, 2026 | Required HTTPS for configured security-sensitive origins in production; full suite passes with 514 tests across 84 files. |
| 3.35 | October 6, 2026 | Hashed reset tokens with atomic single-use claims and legacy-link support; race-safe admin/owner listing transitions; reset-page no-referrer; sanitized listing dispatch logs. Full suite: 525 tests across 85 files. |
| 3.36 | October 6, 2026 | Bound owner review-reply updates/deletes to current hostel ownership to close a stale-authorization race. Full suite: 528 tests across 86 files. |
| 3.37 | October 6, 2026 | Removed participant identifiers and raw exception text from conversation notification failure logs. Full suite: 529 tests across 86 files. |
| 3.38 | October 6, 2026 | Added local room-scene fallbacks beneath homepage and auth photos when remote image delivery fails. Full suite: 529 tests across 86 files. |
| 3.39 | October 6, 2026 | Restrict price-alert listing detail reads, updates, creation, and scheduled mail to active hostels. Full suite: 534 tests across 87 files. |
| 3.40 | October 6, 2026 | Bind booking status writes to the acting student or current hostel owner to prevent stale authorization after lookup. Full suite: 536 tests across 87 files. |
| 3.41 | October 6, 2026 | Scope owner blocked-date reads and writes through current hostel ownership. Full suite: 538 tests across 87 files. |
| 3.42 | October 6, 2026 | Bind Safepay booking webhook reads and writes to the booking payment method; preserve the legacy null-as-Safepay default. Full suite: 541 tests across 87 files. |
| 3.43 | October 6, 2026 | Prevent student/admin cancellation from racing payout claims and disallow student cancellations after check-out. Full suite: 543 tests across 87 files. |
| 3.44 | October 6, 2026 | Enforce the documented student cancellation rule before owner confirmation; expose cancellation for every pending booking. Full suite: 544 tests across 87 files. |
| 3.45 | October 6, 2026 | Require a current owner role and complete bank details before payout batch creation/booking claims; align payout-ready flags. Full suite: 550 tests across 87 files. |
| 3.46 | October 6, 2026 | Remove failed remote marketing images so the room-scene fallback remains visible; retain alt descriptions. Full suite: 552 tests across 88 files. |
| 3.47 | October 6, 2026 | Separate production migration deployment from builds; migrations run as a gated CI step using Vercel's production environment. |
| 3.48 | October 6, 2026 | Return null for stale or malformed JWTs so role-only route guards cannot accept revoked claims; full suite passes 556 tests across 89 files. |
| 3.49 | October 6, 2026 | Keep profile phone changes OTP-backed, expose verification when an existing number changes, clear verification on removal, and consume successful OTPs atomically; full suite passes 562 tests across 90 files. |
| 3.50 | October 6, 2026 | Restrict favorite mutations to students and throttle them at 60/minute; update OTP design practice from NIST SP 800-63B-4; full suite passes 566 tests across 91 files. |
| 3.51 | October 6, 2026 | Reject unauthorized review-reply roles before database access and cap reply edits/deletes at 10 per hour; full suite passes 568 tests across 91 files. |
| 3.52 | October 6, 2026 | Cap owner listing PATCH operations at 30 per hour before the lookup; full suite passes 569 tests across 91 files. |
| 3.53 | October 6, 2026 | Added correlated, privacy-limited JSON events for Safepay outcomes, search fallback, notification delivery, and cron runs; verified production-mode Redis outage fallback; production alert rules still need dashboard setup and live-volume tuning. |
| 3.54 | October 6, 2026 | Added per-user limits to notification inbox reads and read/delete actions before database work or body parsing; user ownership checks remain in place. Full suite: 583 tests across 94 files; root typecheck passes; ESLint reports 0 errors and 30 existing warnings. |
| 3.55 | October 6, 2026 | Capped price-alert edits/deletes and roommate-post deletion per user before database lookups; rejected oversized item IDs and returned `Retry-After` on throttling. Full suite: 586 tests across 94 files; root typecheck and lint pass. |
| 3.56 | October 6, 2026 | Refreshed dependency audit evidence: both web and mobile npm audit requests fail because the npm registry hostname does not resolve; last successful advisory results remain explicitly historical. |
| 3.57 | October 6, 2026 | Capped saved-hostel, owner-listing, owner-review, and expensive owner-analytics reads per user; throttle before database work and return `Retry-After`. Full suite: 592 tests across 96 files; typecheck and lint pass. |
| 3.58 | October 6, 2026 | Capped expensive admin listing and verification analytics scans at 10 requests per admin per minute; full suite passes 594 tests across 96 files, root typecheck passes, and lint has 0 errors/30 warnings. |
| 3.59 | October 6, 2026 | Centralized the payout eligibility predicate across owner balances, the admin queue, and transactional batch claims; sandbox validation and schema-backed payout recovery remain release gates. |
| 3.60 | October 6, 2026 | Replaced the booking admin audit line with a correlated JSON event carrying keyed actor/resource IDs, omitted contact/name data, and bounded booking IDs before reads and writes; 598 tests pass. |

| 3.61 | October 6, 2026 | Removed hostel names and raw identifiers from Typesense helper logs; a follow-up method-level review was needed because route-file scans could mistake a GET quota for a POST quota. |

| 3.62 | October 6, 2026 | Added owner/admin/IP quotas across remaining API writes and token lookups, bounded full Typesense sync to 100-row keyset pages, and verified 616 tests across 98 files plus root typecheck. |

| 3.63 | October 6, 2026 | Scoped notification and roommate delete writes by the authenticated user ID and removed the existence distinction for non-owned IDs; 617 tests pass across 98 files. |

| 3.64 | October 6, 2026 | Added trusted-IP and per-admin quotas to public/admin review collection reads before database queries; updated the practice baseline with OWASP API4, Vercel IP-trust, and Upstash serverless limiter guidance; 619 tests pass across 98 files. |

| 3.65 | October 6, 2026 | Added per-account quotas to booking list and detail reads before database queries; 621 tests pass across 99 files. |

| 3.66 | October 6, 2026 | Restricted new student conversations to active hostels and rate-limited owner earnings reads before balance/payout queries; 623 tests pass across 99 files. |

| 3.67 | October 6, 2026 | Replaced the blank Suspense fallback for the query-dependent navbar city selector with a visible “All cities” placeholder; 624 tests pass across 99 files. |
| 3.68 | October 6, 2026 | Adjusted light/dark accent foregrounds, placeholder text, and focus rings to meet WCAG AA token-pair contrast; added both-theme regression coverage. Full suite: 625 tests across 99 files. |
| 3.69 | October 6, 2026 | Replaced the six-month owner analytics row scan with a single parameterized, owner-scoped monthly SQL aggregate; focused route tests pass. No schema changes. |
| 3.70 | October 6, 2026 | Made owner listing plan checks and creation serializable and atomic, retrying write conflicts and sending notification only after commit; added route regression coverage. Full suite: 628 tests across 99 files; lint: 0 errors, 30 warnings. No schema changes. |
| 3.71 | October 6, 2026 | Restricted favorite creation to active listings and scoped idempotent removal by user and hostel relation, closing a hidden-listing lookup boundary; six route tests pass. No schema changes. |
| 3.72 | October 6, 2026 | Reused the shared Next Image-backed room-fallback component for hostel photos in comparison and message context; removed two image lint warnings. Full suite: 630 tests across 99 files; lint has 0 errors and 28 warnings. |
| 3.73 | October 6, 2026 | Added a bounded 72-hour previous-secret overlap for Safepay webhook-key rotation; full suite: 639 tests across 100 files; lint: 0 errors, 28 warnings. |
| 3.74 | October 6, 2026 | Escaped user-controlled content in Leaflet popup HTML, allowlisted popup image URLs, and fixed async map teardown; full suite: 642 tests across 102 files; lint: 0 errors, 26 warnings. |
| 3.75 | October 6, 2026 | Escaped `<` in both city-page JSON-LD payloads before rendering inline script elements; regression tests verify delimiter removal and JSON round-trip; full suite: 644 tests across 103 files. |
| 3.76 | October 6, 2026 | Rejected hostel-view path slugs over 200 characters before throttling or database work; full suite: 646 tests across 104 files; lint: 0 errors, 26 warnings. |
| 3.77 | October 6, 2026 | Required an authenticated account before phone OTP storage or SMS delivery; tests reject anonymous requests before provider/database work; full suite: 648 tests across 105 files; lint: 0 errors, 26 warnings. |
| 3.78 | October 6, 2026 | Bounded all dynamic API route parameters before database work using shared 128-character ID and 200-character hostel ID/slug limits; full suite: 653 tests across 106 files; lint: 0 errors, 26 warnings. |
| 3.79 | October 6, 2026 | Capped signed Safepay webhook order IDs at 128 characters and opaque trackers at 256 before database queries; refreshed trace-sampling guidance to use measured volume and criticality; full suite: 655 tests across 106 files; typecheck passes; lint: 0 errors, 26 warnings. |
| 3.80 | October 6, 2026 | Fixed booking-review data loading with a bounded, student-scoped, minimal server query; full suite: 659 tests across 107 files; typecheck passes; lint: 0 errors, 26 warnings. |
| 3.81 | October 6, 2026 | Added shared web/mobile sign-in IP throttling, a separately HMAC-keyed account limit, and privacy-limited login outcome events; full suite: 667 tests across 109 files; typecheck passes; lint: 0 errors, 26 warnings. |
| 3.82 | October 6, 2026 | Updated anti-automation guidance to distinguish edge, application, and business-velocity controls; hosted edge rules and anomaly signals remain unverified. |
| 3.83 | October 7, 2026 | Fixed mobile refresh scheduling for encrypted Auth.js tokens using server-supplied expiry metadata; expired JWE rejection and transient refresh preservation are covered. Full suite: 672 tests across 110 files; root/mobile typechecks pass; lint: 0 errors, 26 warnings. |
| 3.84 | October 7, 2026 | Applied the shared HMAC-keyed account throttle to mobile sign-in as well as web credentials, closing a distributed-attempt bypass; full suite: 673 tests across 110 files; root/mobile typechecks pass; lint: 0 errors, 26 warnings. |
| 3.85 | October 7, 2026 | Refreshed mobile release posture: Expo SDK 58 is stable, while SDK 57 remains the current beta target pending an EAS preview build and a reviewed migration; the npm production audit remains stale because registry DNS is unavailable. |
| 3.86 | October 7, 2026 | Refreshed the mobile production audit and upgraded transitive `shell-quote` from 1.10.0 to 1.12.0, removing one critical finding without changing Expo 57 / React Native 0.86.3; 31 high/moderate findings remain. Mobile typecheck passes and Expo's local dependency alignment reports up to date. |
| 3.87 | October 7, 2026 | Fixed the mobile shared-package install/bundle path, added Zod 4 as a mobile runtime dependency, regenerated the Android JS source map, and applied compatible SDK 57 tooling patches; mobile audit is now 30 findings (19 high, 11 moderate, zero critical). |
| 3.88 | October 7, 2026 | Reconciled mobile release status with the fresh source-map audit, recorded the reachable URL-parser packages, and clarified Firebase EAS, native-build, and SDK 58 authorization gates. |
| 3.89 | October 7, 2026 | Made Safepay mobile return links non-authoritative: the app now verifies payment state through the authenticated booking API, distinguishes pending and late-paid/cancelled bookings, and rejects malformed or oversized return URLs; full suite: 688 tests across 111 files. |
| 3.90 | October 7, 2026 | Booking, refund, and payout APIs now preserve typed client-facing domain errors, translate stale-state conflicts to 409, and keep unexpected persistence details out of responses; web confirmation derives payment success from authenticated booking state. |
| 3.91 | October 7, 2026 | Standardized focus entry, containment, Escape, scroll locking, and focus restoration across the custom lightbox and admin modal surfaces; changed photo thumbnails to native pressed-state buttons. |
| 3.92 | October 7, 2026 | Capped private student-verification document reads at 30 per admin per minute before database and object-storage work; excess requests receive `Retry-After`. Rejected token-cleanup cron requests now return 401 before deletion. |
| 3.93 | October 7, 2026 | Shared a 60-per-minute per-admin read budget across listing, payout, roommate-report, and student-verification queues to limit cross-endpoint enumeration. |
| 3.97 | October 7, 2026 | Bound mobile refresh bearer tokens and decoded identity claims before rate-limit/database work, marked issued session responses no-store, and refreshed the verified test baseline to 718 tests across 116 files. |
| 3.98 | October 7, 2026 | Bounded conversation-creation hostel IDs before database lookup and added a regression test; full verification now passes 719 tests across 116 files with 0 lint errors. |
| 3.99 | October 7, 2026 | Fixed primary/destructive button foreground loss caused by ambiguous Tailwind text utilities; responsive homepage renders at 1440px and 390px without overflow or runtime errors, with a measured 5.25:1 CTA contrast ratio. Full suite: 721 tests across 117 files. |
| 3.100 | October 7, 2026 | Completed desktop/mobile visual smoke for seven public/auth routes; fixed duplicate/missing main landmarks and removed a class-like documentation example that generated invalid Tailwind CSS. Full suite: 723 tests across 119 files; root typecheck passes; lint has 0 errors. |
| 3.101 | October 7, 2026 | Made production image uploads fail closed for missing R2 credentials or invalid HTTPS public URLs, confined placeholders to local development, and reject sessions without a user ID. Full suite: 727 tests across 119 files; root typecheck passes; lint has 0 errors and 26 warnings. |
| 3.102 | October 7, 2026 | Traced the bundled `decode-uri-component` advisory through Expo Router 57: the active app-link path uses its forked parser with URLSearchParams, not `query-string.parse`; native and remaining advisory reviews stay open. Full suite: 728 tests across 119 files; root typecheck passes; lint has 0 errors and 26 warnings. |
| 3.103 | October 8, 2026 | Synchronized the completion tracker to the then-current verification baseline (728 tests across 119 files) and clarified the October 7 run date. No application code or runtime configuration changed. |
| 3.104 | October 8, 2026 | Store new email-verification tokens as SHA-256 digests while accepting raw-token records for already-issued links until expiry. Full suite: 731 tests across 121 files; root typecheck passes; full ESLint has 0 errors and 26 warnings. No schema change or migration. |
| 3.105 | October 8, 2026 | Re-audited the active Safepay settlement path and verified signed raw-body, merchant, order/tracker, amount/currency, provider, and conditional state checks. Same-tracker delivery is idempotent; Safepay documentation recommends a durable store-ack-process inbox, which remains open alongside refund evidence and sandbox validation. Focused payment tests: 33 pass. |
| 3.106 | October 8, 2026 | Restricted the unlinked design token reference route to development; production renders a 404. Regression covers both environments. Full suite: 733 tests across 122 files; root typecheck and changed-file ESLint pass. |
| 3.107 | October 8, 2026 | Added the app's SVG mark as its browser icon, replaced the broken avatar specimen with a local SVG, and removed the sample typography's duplicate H1. Chrome review at 1440×1000 and 390×844: one H1, no overflow, failed responses, or console errors. Full suite: 733 tests; root typecheck passes; full ESLint has 0 errors and 26 warnings. |
| 3.108 | October 8, 2026 | Added explicit Tailwind type hints to 2,173 CSS-variable text utilities across 103 source files: `--text-*` tokens use length utilities and `--color-*` tokens use color utilities. Fixed the homepage primary CTA foreground (5.25:1 light, 8.06:1 dark). Seven public routes pass desktop/mobile light/dark structure and overflow checks; full suite: 733 tests across 122 files, root typecheck passes, ESLint has 0 errors and 26 warnings. |
| 3.109 | October 8, 2026 | The post-migration palette audit found muted/placeholder text at 4.09:1 on the light overlay surface. Darkened the light neutral to #686868, raising that pair to 4.67:1 while preserving dark theme values (5.31:1 minimum on the overlay surface). Full suite: 733 tests across 122 files; root typecheck passes; ESLint has 0 errors and 26 warnings. |
| 3.110 | October 8, 2026 | Scoped price-alert PATCH/DELETE preflight reads to the authenticated owner, returning the same 404 for foreign and missing IDs, with minimal selected fields. Added two regression cases. Full suite: 735 tests across 122 files; root typecheck passes; full ESLint has 0 errors and 26 warnings. |
| 3.111 | October 8, 2026 | Booking PATCH preflight checks now return the same 404 for unrelated users and preserve 403 for participants whose role cannot perform the action. Added four authorization regression cases alongside the owner-scoped price-alert checks. Full suite: 739 tests across 122 files; full ESLint: 0 errors, 26 warnings. Refreshed the authorization baseline against current Next.js guidance and OWASP API1/API3. |
| 3.112 | October 8, 2026 | Review-reply preflight reads now scope owners by current hostel ownership and select only the review ID; foreign and missing review IDs both return 404, while admin access and role checks remain intact. Added PATCH and DELETE regression tests. Full suite: 741 tests across 122 files; root typecheck passes; full ESLint: 0 errors, 26 warnings. |
| 3.113 | October 8, 2026 | Booking GET/PATCH now scope the preflight query to the booking student or current hostel owner, with an admin path, before selecting party contact data. Foreign bookings return 404 at the query boundary. Added two GET regression tests. Full suite: 743 tests across 122 files; root typecheck passes; full ESLint: 0 errors, 26 warnings. |
| 3.114 | October 8, 2026 | Conversation GET/POST now require the caller in the participant relation within the preflight query; nonparticipants, including admins, receive 404 before message reads, read-state changes, or sends. Added a message-send boundary regression test. Full suite: 744 tests across 122 files; root typecheck passes; full ESLint: 0 errors, 26 warnings. |

## 20. Current Practice Baseline

Reviewed October 8, 2026 against current official framework, security, database, and reliability guidance. Apply these as design guardrails; they are not claims that every control is already implemented:

- **Bound resource consumption at every API boundary:** validate request and response sizes, cap page size, rate-limit by trusted client or account before expensive work, and set provider spending limits/alerts. The public review collection now applies an IP cap, and the admin review list applies an account cap before queries. Source: [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).
- **Authorize server-side reads at the data boundary:** scope private reads by the signed-in principal in the query and return only the fields the render needs. If a Server Component calls an HTTP API, forward the caller's credentials explicitly. Source: [Next.js data security](https://nextjs.org/docs/app/guides/data-security).
- **Layer anti-automation controls:** combine edge reputation/basic WAF limits, application endpoint and identity quotas, and backend account/transaction-velocity signals; a single IP or IP-plus-account bucket is insufficient against distributed credential attacks. Hostello implements application-level Upstash quotas, including independent trusted-IP and HMAC-keyed account buckets shared by web and mobile sign-in. Hosted edge bot/WAF rules and business anomaly signals remain unverified and require environment-level review. Keep account identifiers pseudonymous in limiter keys and logs. Sources: [OWASP Bot Management and Anti-Automation](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html) and [Auth.js Credentials](https://authjs.dev/getting-started/providers/credentials).
- **Treat Auth.js session tokens as opaque client-side:** Auth.js encrypts JWT-strategy tokens as JWE by default; clients should receive expiry metadata from the server instead of inspecting token segments. The mobile beta follows this pattern and refreshes from the server-provided lifetime. Source: [Auth.js Core reference](https://authjs.dev/reference/core).
- **Use the deployment's documented client-IP trust boundary:** this app keys IP quotas from Vercel's overwritten `x-forwarded-for` value and ignores alternate client-supplied forwarding headers. If another proxy is introduced, configure Vercel Trusted Proxy explicitly before changing the extractor. Source: [Vercel request headers](https://vercel.com/docs/headers/request-headers).
- **Treat serverless throttling as distributed state:** production quotas use Upstash's Redis-backed sliding-window limiter, with limiter instances cached outside route handlers. The documented in-memory fallback only coordinates within one runtime instance during Redis outages, so outage telemetry and abuse review remain operational requirements. Sources: [Upstash rate-limit overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) and [features](https://upstash.com/docs/redis/sdks/ratelimit-ts/features).
- **Set explicit contrast targets in both themes:** normal text, including placeholder text and hover/focus text, needs 4.5:1 contrast; large text needs 3:1. Meaningful control states and graphical indicators need 3:1 against adjacent colors. The design-token regression checks CTA states, accent/link text, semantic action foregrounds, and placeholders in light and dark themes; a page-wide visual contrast audit remains open. Sources: [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

- **Authorization near data:** Next.js guidance treats Proxy checks as optimistic and says Route Handlers and Server Actions need endpoint-level authorization. Prefer server-only data access functions that enforce roles/ownership and return minimal DTOs. Source: [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication) and [Proxy](https://nextjs.org/docs/app/getting-started/proxy).
- **Check object and property authorization for every identifier-driven API operation:** OWASP API1:2023 calls for object-level permission checks whenever a user-supplied ID selects data; API3:2023 combines excessive data exposure and mass assignment under property-level authorization. Query with actor ownership/relationship constraints when possible, minimize selected and returned fields, and test foreign IDs against missing IDs where existence is private. Source: [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/) and [API1:2023](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).
- **Keep URL-dependent client UI behind Suspense:** `useSearchParams()` makes the client subtree up to the nearest Suspense boundary client-render during prerendering. Wrap the smallest affected component so the rest of the page can remain in the static shell. Source: [Next.js `useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params).
- **Use Effect Events for latest callbacks in effect-owned listeners:** React's `useEffectEvent` lets an Effect-installed listener read the latest callback without resubscribing; call Effect Events only from Effect logic. Source: [React `useEffectEvent`](https://react.dev/reference/react/useEffectEvent).
- **Use current framework observability hooks:** initialize browser monitoring in `instrumentation-client.ts`, load runtime-specific server SDK setup from `instrumentation.ts`, export `onRequestError` for server request errors, and `onRouterTransitionStart` when navigation tracing is configured. Sources: [Next.js instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) and [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).
- **Correlate operational logs with requests and traces:** emit one JSON record per event with a stable event name, severity, timestamp, service, request ID, and bounded attributes. Include a trace ID only when a valid W3C `traceparent` is present; do not treat correlation identifiers as identity or authorization data. Keep raw request/provider payloads, credentials, contact details, and free-text search queries out of event attributes. This matches the OpenTelemetry log data model and its trace-context field guidance. Sources: [OpenTelemetry Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/), [Trace Context in non-OTLP Log Formats](https://opentelemetry.io/docs/specs/otel/compatibility/logging_trace_context/), and [Next.js OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry).
- **Tune trace sampling to traffic and criticality:** retaining 100% of traces can be reasonable for a small new service, but revisit it as traffic and telemetry cost grow. Keep error capture complete, then use measured volume and route-aware sampling to preserve higher detail for checkout and other high-impact journeys. Source: [Sentry sampling strategy](https://blog.sentry.io/sampling-strategy-sentry/).
- **Keep sensitive audit identifiers pseudonymous:** when an operational audit event needs actor/resource correlation, use a keyed HMAC of those identifiers and omit names, emails, phones, and raw IDs. `AUTH_SECRET`/`NEXTAUTH_SECRET` supplies the HMAC key; if neither exists, omit hashed identifiers rather than falling back to raw values.
- **Minimize observability data at the SDK boundary:** disable automatic collection of request bodies, headers, cookies, query strings, database values, and local variables unless a specific diagnostic need justifies them; apply a final event scrubber and keep Session Replay text masked/media blocked. Sentry exposes a final `beforeSend` hook for modifying events and documents Replay masking as a privacy control. Sources: [Sentry event hooks](https://docs.sentry.io/platforms/javascript/enriching-events/attachments/) and [Sentry Session Replay](https://sentry.io/product/session-replay/).
- **API abuse boundaries:** Review every endpoint for object-, property-, and function-level authorization, plus limits on payloads, page sizes, execution time, uploads, and paid third-party calls. Apply authorization or verified signed ingress before mutations and enforce quotas before expensive parsing or work. Source: [OWASP API Security Top 10 (2023)](https://api-security.owasp.org/editions/2023/en/0x11-t10/).
- **Keep API errors within a public contract:** Return approved messages for typed domain failures; log unexpected database/provider exceptions through safe summaries and send generic responses. Translate a known conditional-write miss such as Prisma `P2025` into a conflict only where the write's predicate establishes a stale-resource race. Source: [Prisma ORM error reference](https://www.prisma.io/docs/orm/reference/error-reference).
- **Manage modal focus as part of the dialog contract:** Move focus into an opened modal, keep Tab and Shift+Tab within it, let Escape close the active dialog when permitted, and return focus to the invoker. Source: [WAI-ARIA APG Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **Encode at the final HTML sink:** React escapes JSX text, but third-party libraries that accept HTML strings bypass that protection. Escape untrusted values for their HTML/attribute context, URL-encode path or query components, validate URL schemes, and prefer APIs that accept DOM nodes or text where available. Source: [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
- **Serialize JSON-LD for the HTML script context:** `JSON.stringify` alone does not prevent an untrusted `</script>` substring from terminating an inline JSON-LD element. Replace `<` with the JSON escape `\u003c` before setting `dangerouslySetInnerHTML`, then verify round-trip JSON parsing. Source: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- **OTP verification is single-use and concurrency-safe:** Cap failed guesses, claim a valid code once, and consume it atomically with the identity change it authorizes. NIST SP 800-63B-4 requires one-time acceptance while a code is valid and rate limiting for low-entropy OTP outputs; this is a design reference, not a compliance claim. Source: [NIST SP 800-63B-4, Authenticators](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).
- **Bound work before parsing or processing:** Enforce body-byte caps while reading streams (including chunked JSON and multipart uploads), constrain strings/arrays/pages/upload sizes, and throttle expensive or paid operations per client. OWASP identifies these as controls against unrestricted resource consumption. Source: [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).
- **Bound URL-driven work too:** Cap query-string size, dynamic route identifiers, and individual search/filter/token values before database or search operations; apply explicit pagination and query-cost budgets to collection and analytics endpoints. These complement request-body and rate limits. Source: [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).
- **Aggregate summaries in the database:** Use narrow selections, bounded pages, and `aggregate()`/`groupBy()` for totals instead of loading every matching detail row into application memory. Source: [Prisma ORM 7 Client Reference](https://www.prisma.io/docs/orm/v7/reference/prisma-client-reference).
- **Render public photography with dimensions and a resilient fallback:** Use `next/image` through `PhotoImage` for hostel cover images across landing, comparison, and message-context cards to reserve layout space and keep the room illustration visible on load failure. For auth-protected image routes, bypass server image optimization when needed because the optimizer does not forward request headers. Source: [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image).
- **Make quota checks concurrency-safe:** When a resource entitlement depends on a count, perform the read-check-write in a short serializable transaction and retry serialization conflicts with a bounded attempt count. Keep external side effects outside the transaction and trigger them only after commit. Source: [Prisma transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
- **ORM release posture:** On October 6, 2026, Prisma ORM 8 is still a release candidate, with GA expected during October. Its release-status guide lists atomic `increment` updates and several other Prisma 7 features as unavailable in the RC; HostelLo uses atomic increments for room inventory, optimistic booking versions, view counts, auth token versions, and OTP attempts. Keep production on the current Prisma 7 line (`prisma` and `@prisma/client` `^7.9.1`, lockfile resolved) and reassess after Prisma 8 GA and a feature-by-feature migration review. Avoid unqualified `prisma@latest` in one-off upgrade commands: it currently selects the v8 RC. Sources: [Prisma ORM release status](https://www.prisma.io/docs/orm/release-status) and [Coming from Prisma ORM 7](https://www.prisma.io/docs/orm/coming-from-prisma-orm-7).
- **Separate schema changes from artifact builds:** Run reviewed `prisma migrate deploy` as an explicit CI/CD stage, keep the build command focused on client generation and compilation, and use expand-and-contract changes so the currently deployed app remains compatible during rollout and rollback. Vercel CLI can inject environment-scoped variables into a command without copying a database URL into GitHub secrets. Sources: [Prisma development and production workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) and [Vercel `env run`](https://vercel.com/docs/cli/env).
- **Treat database-plus-email/push writes as dual writes:** When delivery must survive process crashes, persist an outbox event in the same transaction as the state change, then dispatch it with retries and idempotency. The current price-alert worker still has a small duplicate window after provider acceptance and before local persistence. Source: [AWS Transactional Outbox Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
- **Preserve safe HTTP method semantics:** Keep GET read-only so crawlers, email security scanners, and browser prefetch do not trigger state changes; require explicit bounded same-origin POSTs for unsubscribe and email-verification confirmation, and signed gateway POSTs for payment settlement. Sources: [RFC 9110, Safe Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.1) and [RFC 8058, One-Click Unsubscribe](https://www.rfc-editor.org/rfc/rfc8058.html).
- **Store and consume bearer tokens safely:** Generate high-entropy reset tokens, store only a fast digest, expire and invalidate each token after one use, and use a conditional transaction so concurrent submissions cannot replay it. Keep the reset page's `no-referrer` policy because URL tokens can otherwise leak through referrer headers. Source: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- **Use a trusted origin for absolute links:** Build password-reset, verification, and payment-return URLs from configured canonical hosts or a strict allowlist; never trust incoming `Host` or forwarded-host values for security-sensitive destinations. OWASP documents password-reset poisoning through Host-header injection. Sources: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) and [OWASP Host Header Injection Testing Guide](https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/07-Injection/17-Host_Header_Injection/).
- **Respect password-hash limits:** Argon2id is OWASP's preferred choice for new password storage; where bcrypt remains for compatibility, enforce its 72-byte input limit and use a work factor of at least 10. HostelLo currently retains bcrypt at cost 12 and now applies a 72 UTF-8-byte cap to new/change/reset flows. Source: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- **Bound maintenance jobs as well as customer reads:** Treat operator-triggered reindexing and reconciliation like public scans: select only required columns, process bounded keyset pages, and cap the initiating admin's request rate.
- **Connection capacity:** Prisma 7's driver adapter delegates pool behavior to the underlying driver. Budget connections across all concurrently warm/serverless app instances, set explicit pool limits that match the database plan, and monitor connection saturation. Source: [Prisma ORM 7 PostgreSQL connector](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql).
- **Keep Expo native dependencies aligned and builds reproducible:** Install SDK packages with `expo install`, use the SDK-targeted React Native version, and preserve the lockfile because EAS uses it for immutable installs. Upgrade Expo SDKs one at a time, run Expo Doctor, regenerate CNG native projects as required, and validate with native preview builds before distribution. Sources: [Expo SDK upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and [EAS build caching and immutable lockfiles](https://docs.expo.dev/build-reference/caching/).
- **Recovery is exercised, not assumed:** Select RPO/RTO from business needs, verify the database provider's retention settings, and test restoration from backups or point-in-time history in an isolated environment. Source: [AWS Well-Architected reliability failure management](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel-failmgmt.html).
- **Observe customer outcomes and dependencies:** Track success as well as failures for critical flows (search, booking, payment, notifications, cron), and correlate request logs, metrics, and traces. Use bounded-cardinality attributes and redact sensitive data. Sources: [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/) and [AWS workload monitoring](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/monitor-workload-resources.html).
- **Treat payment outcomes as state transitions:** Only move an order to a completed financial state after validating the provider's documented terminal state; preserve uncertain outcomes for reconciliation and make replay/retry behavior explicit. Safepay's refund guide documents `TRACKER_REFUNDED` for a full refund and `TRACKER_PARTIAL_REFUND` for a partial refund. Source: [Safepay Refund](https://safepay-docs.netlify.app/modify-payments/refund/).
- **Honor provider currency units and verify the current webhook contract:** Safepay represents PKR in paisas; its current payment event includes tracker, state, amount, currency, and metadata order ID; its documented webhook HMAC is SHA-512 over the raw body. During key rotation, configure the prior key for a short explicit grace period because events already queued may still use it; this app caps overlap at 72 hours. Sources: [Safepay Money](https://safepay-docs.netlify.app/concepts/money/), [Express Checkout](https://safepay-docs.netlify.app/build-your-integration/express-checkout/?platform=web), [Webhook types](https://safepay-docs.netlify.app/developers/webhooks/webhook-types/), [HMAC verification](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/).
- **Keep sensitive uploads private end to end:** Use a separate private bucket and narrowly scoped credentials, a strict application request/file-size cap, server-side metadata/content validation, immutable review copies, authenticated no-store delivery, and a retention path for abandoned uploads. Include legacy public objects in the data-cleanup/release plan. Sources: [Cloudflare R2 API token permissions](https://developers.cloudflare.com/r2/api/tokens/) and [Vercel Function limits](https://vercel.com/docs/functions/limitations).
- **Respect platform ingress limits for direct uploads:** Vercel Functions cap request and response bodies at 4.5 MB. Use direct-to-storage uploads for larger files; for small identity documents, an authenticated server upload capped below the platform limit allows size/signature validation before storage. Sources: [Vercel Function limits](https://vercel.com/docs/functions/limitations) and [Vercel large upload guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
- **Upgrade native SDKs in small steps:** Keep the Expo SDK, React Native, native modules, and native project aligned; upgrade one SDK release at a time and follow each migration note. With checked-in native directories, rerun prebuild when app config or plugins change because EAS will not synchronize those fields. Expo Doctor and an actual native build are separate checks. Sources: [Expo SDK upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57).
- **Keep TypeScript module aliases explicit:** TypeScript 6 deprecates `baseUrl`; remove it and resolve `paths` from the config file using explicit `./` prefixes. Source: [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- **Type ambiguous Tailwind text utilities:** when a CSS variable follows the shared `text-` namespace, annotate its intended type (`text-[length:var(--text-body)]` or `text-[color:var(--color-text-body)]`). This avoids emitting a valid but unintended property when Tailwind cannot infer whether the token is a font size or color; verify computed styles for key contrast pairs. Source: [Tailwind CSS arbitrary values and type hints](https://tailwindcss.com/docs/adding-custom-styles#resolving-ambiguities).

Maintenance rule: refresh the implementation metrics and open-issue table during architecture-affecting changes, and re-check linked framework guidance when upgrading Next.js, Prisma, the database provider, payment integrations, or the deployment platform. Verify production configuration in its provider console/runbooks; source inspection alone cannot establish backup retention, live sampling, or connection limits.
