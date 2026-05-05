Now I'll write the System Design Document for HostelLo using the codebase provided, applying the humanizer approach throughout.

---

# System Design Document — HostelLo

**Version:** 1.0 | **Date:** May 5, 2026 | **Author:** Engineering Team

---

## 1. Project Overview

HostelLo is a student hostel marketplace for Pakistan. Students use it to find verified accommodation near their university. Hostel owners use it to list rooms, manage booking requests, and reply to reviews — all without a phone call.

The problem it solves is specific: finding a hostel in Pakistan currently means calling phone numbers from a WhatsApp group, visiting in person, or trusting word of mouth. There is no reliable source of truth for prices, amenities, or safety. HostelLo puts that information in one place with photos, verified listings, direct messaging, and online booking.

Target users fall into three groups. Students (ages 17–25) who need accommodation near one of Pakistan's major universities. Hostel owners (typically individuals managing 10–100 beds) who want online visibility and a booking system. Admins who review new listings and moderate the platform.

Success means a student in Lahore can find, compare, message the owner of, and book a verified hostel in under 10 minutes. For owners, it means receiving a booking request without picking up the phone.

---

## 2. Scope and Boundaries

**In scope:**
- Hostel discovery with full-text search, filtering, and sorting
- Student account creation, login, and profile management
- Hostel listing creation and management by owners
- Booking requests with online payment (Safepay initially)
- In-app messaging between students and hostel owners
- Reviews (only after a completed stay)
- Price alerts when a hostel drops below a target price
- Admin moderation: approve, suspend, or activate listings
- Transactional emails and in-app notifications

**Out of scope (deliberate):**
- Native mobile apps — the web app is responsive, not native
- Multi-city or international expansion (Pakistan only for now)
- Property management features beyond booking (lease agreements, maintenance requests)
- Aggregating hostel data from external sources
- Revenue sharing or commission tracking for owners
- Customer support chat

**Assumptions:**
- All users have a Pakistani phone number and email address
- Payments are in PKR only
- The platform does not verify student enrollment
- Hostel owners self-certify their listings; admin spot-checks before approval

---

## 3. Stakeholders and Roles

**Student (STUDENT role)**
Can browse and search hostels without an account. With an account, they can save favorites, send messages, submit booking requests, leave reviews after a completed stay, and set price alerts. Cannot see other students' data.

**Hostel Owner (OWNER role)**
Can list hostels, upload photos, manage room inventory, respond to booking requests (confirm or decline), reply to reviews, and message students. Can only manage their own hostels.

**Admin (ADMIN role)**
Can approve, suspend, or activate any listing. Can read and delete any review. Can trigger a full Typesense re-index. Has access to all booking data. Receives email when a new listing is submitted for review.

**Unauthenticated visitors**
Can browse hostels, read reviews, and see availability. Cannot book, message, or save.

---

## 4. Functional Requirements

### Must-have

- User registration with email/password; phone number optional at signup, verifiable via OTP later
- Email verification before full account access
- Password reset via time-limited email link (30 minutes)
- Hostel search by city, gender, price range, and amenities with Typesense full-text search
- Hostel detail pages with photos, amenities, rules, room types, reviews, and a map
- Booking request flow: choose dates, guests, payment method → confirm → pay online
- Safepay card payment integration with webhook-based confirmation
- In-app messaging between student and owner per hostel
- Review submission gated on a completed booking (status = COMPLETED)
- Owner reply to reviews
- Admin approval workflow for new listings
- In-app notification bell with unread count
- Price alert: notify by email when a hostel drops below a user-set target price
- Account deletion with full data removal (GDPR Article 17 compliance)

### Should-have

- Phone number OTP verification (Twilio)
- Hostel comparison (up to 3 hostels side-by-side)
- Saved favorites list
- JazzCash and EasyPaisa payment (currently disabled, infrastructure ready)
- Availability calendar per hostel based on bookings
- Typesense search with automatic Prisma fallback

### Nice-to-have

- Push notifications (no current implementation)
- University-specific landing pages
- Owner analytics dashboard (view counts, booking conversion rate)

### Edge cases documented

- Two students booking the same room simultaneously: optimistic locking on `Room.version` prevents double-booking; second request receives 409
- Webhook arriving twice for the same payment: idempotency guard using `paymentStatus: { not: "PAID" }` in `updateMany`
- Payment amount mismatch in webhook: booking held, not confirmed, error logged for manual review
- Owner deletes account while active bookings exist: bookings cancelled, hostels deleted in batch

---

## 5. Non-Functional Requirements

**Availability:** 99.5% uptime. Acceptable for a consumer marketplace at this stage.

**Latency:** Search results under 300ms p95 when Typesense is available. Hostel detail pages under 500ms. API routes under 200ms for authenticated actions (booking, messaging).

**Throughput:** Designed for hundreds of concurrent users, not thousands. No horizontal scaling automation in place yet.

**Scalability:** The architecture is stateless (serverless functions on Vercel), so adding capacity is a platform concern, not an application concern. Redis handles rate limiting across instances.

**Data integrity:** Booking totals are integers (PKR). No floats for currency. Review counts and ratings are denormalized on the hostel row and recomputed transactionally on every write.

**Search degradation:** If Typesense is unreachable, search falls back to Prisma with full filter support. Users see results; they may be slightly slower.

---

## 6. System Architecture

HostelLo is a Next.js monolith deployed on Vercel. This is not a microservices architecture, and that was intentional. At this stage, the overhead of service boundaries (inter-service auth, distributed tracing, independent deploys) adds complexity without meaningful benefit. A single codebase with clear module separation is easier to reason about, debug, and ship quickly.

**Components:**

- **Next.js App Router** — handles both the UI (React Server Components) and the API (Route Handlers). No separate backend process.
- **Neon PostgreSQL** — primary database, accessed via Prisma ORM. Neon provides serverless connection pooling, which matters on Vercel where each invocation gets a fresh process.
- **Upstash Redis** — rate limiting and token version cache. Accessed via REST API (Upstash Redis), which works in serverless environments without persistent TCP connections.
- **Typesense** — full-text search engine. Separate process (cloud-hosted). The app syncs hostels to Typesense on write operations; reads go directly to Typesense. On failure, Prisma handles the query.
- **Cloudflare R2** — object storage for hostel photos. S3-compatible API. Images are served from a public CDN URL.
- **Resend** — transactional email delivery.
- **Twilio** — SMS OTP delivery.
- **Safepay, JazzCash, EasyPaisa** — payment gateways. Safepay uses a redirect flow with HMAC-signed webhook callbacks. JazzCash and EasyPaisa use signed form POST flows.
- **Upstash QStash** — cron job scheduling. Posts to three endpoint crons daily/every 5 minutes/every 6 hours.

---

## 7. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Co-located API and UI, RSCs for faster page loads, mature ecosystem |
| Language | TypeScript | Catches shape errors at build time; essential when Prisma types flow through the whole app |
| Database | Neon PostgreSQL | Serverless-friendly connection pooling, branching for dev environments |
| ORM | Prisma | Type-safe queries, migration tooling, schema-as-code |
| Auth | NextAuth v5 (Credentials) | JWT strategy, token version checking for cross-instance session revocation |
| Search | Typesense | Faster than Postgres full-text for faceted search, self-hostable, open-source |
| Cache / Rate limit | Upstash Redis | REST-based, works in serverless, no persistent connection needed |
| Storage | Cloudflare R2 | S3-compatible, cheaper egress than AWS S3, global CDN |
| Email | Resend | Clean API, good deliverability, React Email compatible |
| SMS | Twilio | Industry standard, Pakistani numbers supported |
| Payments | Safepay (primary) | Pakistani gateway, cleaner API than JazzCash |
| Cron | Upstash QStash | Vercel doesn't support persistent background jobs; QStash POSTs to API routes on a schedule |
| Styling | Tailwind CSS v4 | Utility-first, no CSS-in-JS runtime overhead |
| Deployment | Vercel | Zero-config Next.js deploys, edge network, preview environments |
| Validation | Zod | Runtime schema validation that produces TypeScript types |
| Animation | Framer Motion | Declarative, well-documented, React-native |

---

## 8. Data Design

The schema lives in `prisma/schema.prisma`. Key entities:

**User** — `id`, `email` (unique), `emailVerified`, `password` (bcrypt hash), `name`, `phone`, `phoneVerified`, `avatar`, `role` (STUDENT/OWNER/ADMIN), `bio`, `city`, `tokenVersion`. The `tokenVersion` integer is incremented on password change; sessions with a stale version are invalidated.

**Hostel** — `id`, `slug` (unique), `name`, `description`, `status` (DRAFT/PENDING_REVIEW/ACTIVE/SUSPENDED), `city`, `area`, `address`, `latitude`, `longitude`, `pricePerMonth` (integer PKR), `rooms`, `capacity`, `gender` (MALE/FEMALE/MIXED), `amenities` (string array), `rules` (string array), `images` (string array), `coverImage`, `verified`, `featured`, `viewCount`, `rating` (denormalized float), `reviewCount` (denormalized int), `ownerId`.

The `rating` and `reviewCount` fields are denormalized for read performance. Every review write recomputes them in a transaction. Scripts exist to fix drift if it occurs.

**Room** — belongs to a hostel, tracks `available` (remaining spots) and `version` (optimistic lock counter). When a booking is created for a specific room, `available` decrements and `version` increments atomically.

**Booking** — `hostelId`, `roomId` (nullable), `userId`, `checkIn`, `checkOut`, `months`, `guests`, `total` (integer PKR), `paymentStatus` (PENDING/PAID/REFUNDED/FAILED), `paymentMethod`, `transactionId` (unique), `status` (PENDING/CONFIRMED/CANCELLED/COMPLETED).

**Review** — unique per `(hostelId, userId)`. Fields: `rating` (1–5), `title`, `comment`, `cleanliness`, `location`, `value`, `safety` (each 0–5), `ownerReply`, `repliedAt`.

**Conversation + Message** — a conversation ties two participants (student + owner) to a hostel. Messages belong to a conversation. Unread count is computed via a filtered count query.

**PriceAlert** — `userId`, `hostelId` (unique together), `targetPrice`, `lastKnownPrice`, `active`, `lastAlertAt`.

**Notification** — `userId`, `type` (enum), `title`, `message`, optional foreign keys to `bookingId`, `reviewId`, `hostelId`. `read` boolean, `readAt` timestamp.

**VerificationToken, PasswordResetToken, PhoneVerificationToken** — short-lived tokens for auth flows.

**Key indexes:** `Hostel` on `(city)`, `(slug)`, `(ownerId)`, `(status, featured)`, `(gender)`, `(pricePerMonth)`. `Booking` on `(hostelId)`, `(userId)`, `(status)`, `(checkIn, checkOut)`. `Review` on `(hostelId)`, `(userId)`. `Notification` on `(userId)`, `(read)`, `(createdAt)`.

---

## 9. API Design

All API routes live under `/api/`. They return JSON with this envelope:

```json
{ "data": ..., "message": "...", "error": "..." }
```

Errors always include a human-readable `error` string. Validation errors may include a `details` object from Zod's `.flatten()`.

HTTP status codes follow standard conventions: 200 for success, 201 for created, 400 for validation failure, 401 for unauthenticated, 403 for forbidden, 404 for not found, 409 for conflict (double booking, duplicate email), 429 for rate limit, 500 for internal error.

**Key routes:**

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/forgot-password` | Request password reset link |
| POST | `/api/auth/reset-password` | Set new password using token |
| GET | `/api/auth/verify-email` | Confirm email via token link |
| POST | `/api/auth/resend-verification` | Re-send email verification |
| POST | `/api/auth/delete-account` | Permanently delete account |
| POST | `/api/auth/phone/request-otp` | Send SMS OTP |
| POST | `/api/auth/phone/verify-otp` | Verify phone number |
| PATCH | `/api/profile` | Update name, phone, bio, city |
| POST | `/api/profile/change-password` | Change password (authenticated) |
| GET | `/api/hostels` | Search hostels (paginated) |
| POST | `/api/hostels` | Create hostel listing |
| GET | `/api/hostels/[slug]` | Hostel detail |
| PATCH | `/api/hostels/[id]` | Update hostel (owner or admin) |
| DELETE | `/api/hostels/[id]` | Suspend hostel + cancel bookings |
| POST | `/api/hostels/[slug]/favorite` | Save hostel |
| DELETE | `/api/hostels/[slug]/favorite` | Unsave hostel |
| POST | `/api/hostels/[slug]/view` | Increment view count |
| GET | `/api/hostels/[slug]/availability` | 12-month occupancy calendar |
| POST | `/api/bookings` | Create booking request |
| GET | `/api/bookings` | List current user's bookings |
| GET | `/api/bookings/[id]` | Booking detail |
| PATCH | `/api/bookings/[id]` | Cancel / confirm / decline booking |
| POST | `/api/payment/initiate` | Start payment session (Safepay redirect or JazzCash/EasyPaisa form) |
| POST | `/api/payment/webhook` | Safepay payment confirmation webhook |
| POST,GET | `/api/payment/callback` | JazzCash / EasyPaisa browser redirect callback |
| POST | `/api/reviews` | Submit or update review |
| GET | `/api/reviews` | List reviews for a hostel |
| PUT | `/api/reviews/[id]` | Edit own review |
| DELETE | `/api/reviews/[id]` | Delete own review |
| PATCH | `/api/reviews/[id]/reply` | Owner reply to review |
| DELETE | `/api/reviews/[id]/reply` | Remove owner reply |
| GET | `/api/conversations` | List user's conversations |
| POST | `/api/conversations` | Start conversation with hostel owner |
| GET | `/api/conversations/[id]` | Get messages (marks unread as read) |
| POST | `/api/conversations/[id]` | Send message |
| GET | `/api/notifications` | List notifications (paginated) |
| PUT | `/api/notifications` | Mark all as read |
| PUT | `/api/notifications/[id]` | Mark one as read |
| DELETE | `/api/notifications/[id]` | Delete notification |
| GET | `/api/price-alerts` | List user's price alerts |
| POST | `/api/price-alerts` | Create price alert |
| PATCH | `/api/price-alerts/[id]` | Update or toggle alert |
| DELETE | `/api/price-alerts/[id]` | Delete alert |
| POST | `/api/upload` | Upload image to R2 |
| PATCH | `/api/admin/hostels` | Admin: verify, suspend, activate |
| POST | `/api/admin/search/sync` | Admin: sync Typesense |
| POST | `/api/report` | Submit issue report |
| POST | `/api/contact` | Contact support |
| POST | `/api/cron/mark-completed-stays` | Cron: CONFIRMED → COMPLETED after checkout |
| POST | `/api/cron/cancel-abandoned-payments` | Cron: cancel PENDING bookings after 30 min |
| POST | `/api/cron/check-price-alerts` | Cron: check and send price alert emails |

There is no API versioning currently. The app is a monolith; API and frontend ship together, so version drift is not possible. If the API is ever exposed externally, versioning via URL prefix (`/api/v2/`) would be the approach.

---

## 10. Authentication and Authorization

**Login mechanism:** Email + password via NextAuth v5 Credentials provider. JWT strategy (no database sessions). Tokens stored in HTTP-only cookies.

**Token structure:** JWT contains `id`, `role`, `emailVerified`, `tokenVersion`. The `tokenVersion` field mirrors the `User.tokenVersion` database column. On every authenticated request, the session callback checks the JWT's `tokenVersion` against the value in Redis (or the database on cache miss). If they don't match, the session is treated as invalid. This is how a password change revokes all active sessions across all Vercel instances.

**Password reset:** A `PasswordResetToken` record with a 30-minute expiry links to the user. Single-use: `usedAt` is set on first use. After reset, `tokenVersion` is incremented and the Redis cache key is deleted.

**Email verification:** Signup creates a `VerificationToken` (24-hour expiry). The user clicks a link; the API marks `emailVerified` and deletes the token. Unverified users can log in but certain actions (messaging, booking) are gated on verified status.

**Role-based access:**

| Action | STUDENT | OWNER | ADMIN |
|---|---|---|---|
| Browse hostels | ✓ | ✓ | ✓ |
| Book hostel | ✓ | — | ✓ |
| Create listing | — | ✓ | ✓ |
| Manage own listing | — | ✓ | ✓ |
| Confirm/decline booking | — | ✓ (own hostels) | ✓ |
| Approve/suspend listing | — | — | ✓ |
| Delete any review | — | — | ✓ |

Owner actions on bookings check `booking.hostel.ownerId === session.user.id`. Admin bypasses ownership checks. Students can only access their own bookings and reviews.

---

## 11. Security Design

**Transport:** HTTPS everywhere. HSTS header with 2-year max-age, `includeSubDomains`, `preload`.

**Content Security Policy:** Configured in `next.config.ts`. In production, `unsafe-eval` is removed (development only, needed for Next.js HMR). `unsafe-inline` remains for Next.js hydration scripts. Image sources are allowlisted to R2, Unsplash, and a few OAuth CDNs. Payment gateways are in `connect-src` and `form-action`.

**CSRF protection:** Middleware validates the `Origin` header on all state-mutating API routes. Payment gateway callbacks (which POST from external servers) and NextAuth internals are explicitly exempted. Missing `Origin` is allowed in development, rejected in production.

**Rate limiting:** Upstash Redis sliding window. Falls back to in-process in-memory limiting if Redis is unavailable (rather than dropping all limits). Key limits: signup 5/hour, login via NextAuth's built-in, search 60/minute, booking 10/hour, upload 5/10 minutes, messaging 30/minute, OTP 5/24 hours.

**Input validation:** Zod schemas on every API route. Strings that go into HTML emails are passed through `escapeHtml()`. User-submitted text in hostel descriptions and review comments is sanitized via `sanitizeString()` which strips HTML tags without decoding entities (prevents the entity-decode bypass).

**Payment security:** Safepay webhooks verified via HMAC-SHA256 using `timingSafeEqual`. Amount verified against `booking.total` with ±1 PKR tolerance. JazzCash callbacks verified via computed HMAC. EasyPaisa callbacks verified by `orderRefNum` matching the booking ID, plus amount cross-check in the caller. Optional IP allowlisting for gateway IPs via `GATEWAY_IPS` env var.

**Image URL allowlisting:** Images submitted in hostel update payloads must start with the configured R2 public URL. In development, Unsplash is also allowed. This prevents owners from injecting arbitrary URLs.

**Secret management:** All secrets in environment variables, never committed. `.env` files are in `.gitignore`. Production secrets live in Vercel environment configuration.

**Audit logging:** Admin actions on bookings (cancel/confirm/decline) log the admin's user ID, action, booking ID, hostel name, and student email to the application logger.

**Password hashing:** bcrypt with cost factor 12.

---

## 12. Infrastructure and Deployment

**Hosting:** Vercel. Next.js deploys as serverless functions (individual Route Handlers) plus a static CDN layer for assets.

**Database:** Neon PostgreSQL. Neon handles connection pooling via its serverless driver; Prisma connects to the pooled endpoint. Neon supports branching for preview environments.

**Redis:** Upstash Redis. REST API access, no TCP connection management needed.

**Search:** Typesense Cloud (or self-hosted via Docker). The application connects to a single Typesense node; if that node is unreachable, the Prisma fallback activates.

**Storage:** Cloudflare R2. S3-compatible, served via a public CDN URL. Uploaded objects are immutable (name includes a timestamp and 8 random bytes); old images are cleaned up via `purgeOrphanedImages()` when an owner removes them from a listing.

**Cron jobs:** Upstash QStash sends POST requests to three API endpoints on a schedule. The endpoints verify the request with either an HMAC signature (QStash signing key) or a Bearer token (CRON_SECRET), whichever is present.

**Environment strategy:**
- `development` — local Next.js dev server, local or shared Neon branch, Typesense on Docker or skipped (Prisma fallback), Resend skipped (emails logged to console), Twilio skipped (OTP logged to console), R2 optional (Unsplash placeholder URLs used)
- `production` — Vercel production deployment, Neon production branch, Typesense Cloud, Resend, Twilio, Safepay live credentials

**CI/CD:** Vercel handles this automatically on push to `main`. Preview deployments are created for every pull request. `npm run build` runs `prisma generate` then `next build` then a post-build script that patches the routes manifest for `next start` compatibility.

---

## 13. Scalability and Performance

**Caching strategy:**
- Hostel listings page: `next: { revalidate: 30 }` on fetch calls (30-second ISR)
- Hostel detail pages: `HOSTEL_REVALIDATE = 3600` (1 hour)
- Search results: `SEARCH_REVALIDATE = 300` (5 minutes)
- Token versions: Upstash Redis with 5-minute TTL, reducing database round-trips on auth checks

**Denormalized fields:** `Hostel.rating` and `Hostel.reviewCount` are computed once on review write and stored on the hostel row. This avoids a `COUNT` + `AVG` aggregate on every listing render. The trade-off is occasional drift, managed by maintenance scripts.

**Database indexing:** See Section 8. Queries against `Hostel` filter on `status`, `city`, `gender`, and `pricePerMonth` — all indexed.

**Search:** Typesense handles full-text queries with sub-100ms response times at moderate scale. The Prisma fallback uses the same indexed columns.

**Image delivery:** R2 with Cloudflare CDN. Images are immutable (content-addressed by timestamp + random bytes) and served with `Cache-Control: public, max-age=31536000, immutable`.

**Rate limiting:** Sliding window via Upstash prevents any single IP from overloading the API.

**No horizontal database scaling currently.** Neon scales vertically. If read throughput becomes a problem, Neon supports read replicas. The application code does not currently route reads and writes separately.

---

## 14. Third-Party Integrations

**Neon (PostgreSQL)**
What: Primary database. How: Prisma ORM, serverless connection pooling. Failure mode: All API routes return 500. No retry logic at the application layer; Neon handles reconnection.

**Upstash Redis**
What: Rate limiting and token version cache. How: REST API via `@upstash/redis` and `@upstash/ratelimit`. Failure mode: Rate limiting falls back to per-process in-memory map. Token version checks fall back to database query.

**Typesense**
What: Full-text search. How: `typesense` npm client, HTTPS to Typesense Cloud. Failure mode: All search falls back to Prisma queries. `isSearchDegraded: true` flag is returned in the API response so the frontend can show a notice if desired.

**Cloudflare R2**
What: Image storage. How: `@aws-sdk/client-s3` with Cloudflare endpoint. Failure mode: Upload returns 500. Images already stored remain available via CDN.

**Resend**
What: Transactional email. How: `resend` npm package. Failure mode: Emails are fire-and-forget in most flows. A failed welcome email does not block account creation. A failed booking confirmation email is logged but does not fail the booking.

**Twilio**
What: SMS OTP. How: Raw fetch to Twilio REST API (deliberate — avoids the `twilio` SDK dependency). Failure mode: OTP request returns 500. In development without credentials, OTP is logged to console.

**Safepay**
What: Card payments. How: REST API to create a checkout session; browser redirected to Safepay; HMAC-signed webhook confirms payment. Failure mode: If the webhook fails or is never delivered, the booking stays PENDING and is cancelled by the abandoned payments cron after 30 minutes.

**JazzCash / EasyPaisa**
What: Mobile wallet payments (disabled). Infrastructure is implemented but `enabled: false` in `PAYMENT_METHODS`. Failure mode: If enabled and callback fails, same abandoned booking cron applies.

**Upstash QStash**
What: Cron job scheduling. How: QStash POSTs to API endpoints; endpoints verify the Bearer token or QStash signature. Failure mode: If an endpoint returns 5xx, QStash retries (configured in QStash dashboard). If QStash itself is down, cron jobs don't run; missed runs of `mark-completed-stays` would delay review eligibility by up to 24 hours.

---

## 15. Error Handling and Fault Tolerance

Every API route is wrapped in a try/catch that returns `{ error: "Something went wrong." }` with status 500 and logs the full error server-side. User-facing errors are always strings, never stack traces.

**Validation errors:** Zod's `safeParse` is used, never `parse`. If validation fails, a 400 is returned with the first error message. The `details` field includes the full flatten output for debugging.

**Payment webhook idempotency:** The Safepay webhook uses `updateMany` with `paymentStatus: { not: "PAID" }`. If the webhook fires twice, the second invocation updates zero rows and returns 200 without re-processing.

**Room double-booking:** Optimistic locking on `Room.version`. If two requests read the same version and both try to update, only one succeeds (Prisma P2025 error on the other); the loser gets a 409.

**Search degradation:** If Typesense throws, the error is caught, `isSearchDegraded` is set to true, and Prisma handles the query. No error is surfaced to the user.

**Email failures:** Booking-related emails (owner notification, student confirmation) are sent with `void Promise.all([...])` and no error propagation. A failed email does not roll back the booking.

**Cron job failures:** Each cron endpoint catches all errors and returns a structured 500 with details. QStash retries on non-2xx responses. The `mark-completed-stays` cron runs daily; a single failed run means some bookings stay CONFIRMED for up to 48 hours, delaying review eligibility.

**R2 image cleanup failures:** `purgeOrphanedImages` is called as a fire-and-forget promise. A failure is logged but does not affect the hostel update response. Orphaned objects cost storage but cause no data integrity issues.

---

## 16. Logging, Monitoring, and Observability

**Application logging:** `console.error` for unexpected errors (caught in try/catch blocks). `console.warn` for expected non-critical conditions (rate limit fallback, unauthorized webhook, CSRF header missing in development). No `console.log` in production — the ESLint rule `"no-console": ["warn", { allow: ["error", "warn"] }]` enforces this.

**What gets logged:**
- All 500-level errors with the request path and the raw error object
- Admin actions on bookings (user ID, action, booking ID, hostel, student)
- Payment webhook signature failures and amount mismatches
- Cron job execution results (count of updated records)
- Typesense sync failures (per-hostel, as fire-and-forget errors)
- Email send failures

**What is not currently implemented:**
- Structured logging (JSON format for log aggregation tools)
- Distributed tracing (no OpenTelemetry)
- Custom metrics or dashboards
- Alerting (Vercel provides basic error alerting via the dashboard)

**Recommendation:** For production monitoring beyond Vercel's built-in logs, integrate Axiom or Better Uptime. Axiom natively integrates with Vercel's log drain.

---

## 17. Data Flow — Key User Journeys

**Student books a hostel:**
1. Student searches for hostels (`GET /api/hostels`) → Typesense returns IDs → Prisma fetches details
2. Student views hostel detail (`GET /api/hostels/[slug]`) → view count incremented via fire-and-forget POST
3. Student submits booking form (`POST /api/bookings`) → rate limit check → session check → hostel lookup → stay duration validation → room availability check with optimistic lock → booking record created → emails sent (fire-and-forget) → in-app notification to owner → booking ID returned
4. Student initiates payment (`POST /api/payment/initiate`) → Safepay session created → redirect URL returned to client
5. Student completes payment on Safepay → Safepay posts webhook (`POST /api/payment/webhook`) → HMAC verified → amount verified → booking updated to PAID/CONFIRMED → confirmation email sent to student
6. After checkout date, daily cron (`POST /api/cron/mark-completed-stays`) transitions booking to COMPLETED
7. Student can now submit a review (`POST /api/reviews`)

**Owner approves a booking (manual, without online payment):**
1. Owner receives in-app notification + email of new booking request
2. Owner visits dashboard, clicks confirm → `PATCH /api/bookings/[id]` with `{ action: "confirm" }` → ownership verified → status updated to CONFIRMED → confirmation email sent to student → in-app notification to student

**Admin approves a listing:**
1. Owner submits listing (`POST /api/hostels`) → status set to PENDING_REVIEW → admin notification email sent
2. Admin visits admin panel, clicks verify → `PATCH /api/admin/hostels` with `{ action: "verify" }` → status set to ACTIVE, verified = true → hostel synced to Typesense → owner receives approval email

---

## 18. Background Jobs and Async Processing

Three scheduled cron jobs run via Upstash QStash:

**mark-completed-stays** — Daily at 00:00 UTC. Finds all CONFIRMED bookings where `checkOut < now` and transitions them to COMPLETED. This is the prerequisite for review eligibility. A single `updateMany` call handles the transition; no per-record processing.

**cancel-abandoned-payments** — Every 5 minutes. Finds PENDING bookings created more than 30 minutes ago with PENDING payment status. Cancels them and restores room availability. Uses a transaction to atomically cancel the booking and restore the `Room.available` counter.

**check-price-alerts** — Every 6 hours. Loads all active price alerts with hostel current prices. For each alert where `hostel.pricePerMonth < targetPrice`, sends a price drop email and deactivates the alert. Also updates `lastKnownPrice` for all remaining alerts.

All three endpoints require either a QStash HMAC signature or a Bearer token matching `CRON_SECRET`. Unauthorized requests receive 401.

---

## 19. File and Media Handling

**Upload flow:** Client POSTs multipart/form-data to `POST /api/upload`. The endpoint:
1. Checks authentication
2. Rate limits to 5 uploads per user per 10 minutes
3. Validates content type (JPEG, PNG, WebP only)
4. Validates file size (5MB max)
5. If `hostelId` is provided, checks ownership and current image count (15 max per hostel)
6. Uploads to R2 with key format `hostels/{timestamp}-{8 random hex bytes}-{sanitized filename}`
7. Sets `Cache-Control: public, max-age=31536000, immutable`
8. Returns the public R2 URL

**Storage:** Cloudflare R2 bucket. Objects are never mutated after upload (immutable naming scheme). Old images are deleted from R2 when an owner removes them from a listing, via `purgeOrphanedImages`.

**CDN delivery:** R2 public URL serves images through Cloudflare's CDN with the immutable cache header.

**Next.js image optimization:** The `next/image` component is configured with R2, Unsplash, Google, and GitHub as allowed remote patterns.

**No virus scanning** is currently implemented. File type validation is based on MIME type, which can be spoofed. If this becomes a concern, Cloudflare R2 can be configured to run ClamAV on uploads via a Worker.

---

## 20. Notifications and Communication

**Email** via Resend. All templates are HTML strings assembled in TypeScript template functions in `src/lib/email-templates/`. The `escapeHtml()` utility sanitizes all user-supplied values before interpolation. Templates are inline-styled (email clients don't support external CSS). A shared `emailLayout()` function wraps all templates with the logo, card, and footer.

Templates: verification, welcome, password reset, booking notification (to owner), booking confirmation (to student), booking status (confirmed/cancelled to student), listing approved, listing suspended, new listing (to admin), price alert, account deleted.

**SMS** via Twilio. Used only for phone number OTP verification. The message is a fixed template: "Your HostelLo verification code is: XXXXXX\n\nValid for 10 minutes."

**In-app notifications** stored in the `Notification` table. Created by `createNotification()` which is fire-and-forget (errors are caught and logged, never thrown). The notification bell polls `GET /api/notifications` with an unread count. Users can mark individual or all notifications as read.

**No push notifications** currently. The infrastructure for in-app notifications is in place, but there is no web push (Service Worker, VAPID keys) or mobile push (FCM, APNs).

---

## 21. Testing Strategy

**Unit tests:** `src/lib/validations.test.ts` covers `sanitizeString` with 20+ test cases including XSS vectors, encoded entities, Unicode, emoji, and edge cases. Test runner: Jest (inferred from the test file structure; not explicit in `package.json` — this is a gap).

**No integration tests** currently exist for API routes.

**No end-to-end tests** currently exist.

**Manual QA process:** Documented in the implementation plan (`docs/superpowers/plans/`). Includes browser checks at desktop (1280px) and mobile (375px), network panel verification of request payloads, and validation error walkthroughs.

**Gaps:**
- Jest is not in `devDependencies`. The test file exists but may not run without additional setup.
- No test coverage for API routes, auth flows, or payment callbacks.
- No load testing configured.
- No security penetration testing documented.

**Recommended additions:**
- Add Jest + `ts-jest` to devDependencies
- Add integration tests for `/api/bookings`, `/api/reviews`, and `/api/payment/webhook` using MSW or a test database
- Add Playwright end-to-end tests for the signup → search → book flow
- Add `k6` load tests for the search endpoint

---

## 22. Migration and Versioning Strategy

**Database migrations:** Prisma handles schema changes. `prisma db push` is used in development for rapid iteration. For production, the correct approach is `prisma migrate dev` to generate a migration file and `prisma migrate deploy` in CI. Currently the `db:push` script is listed in `package.json`, suggesting the migration file approach has not been fully adopted. This is a risk for production schema changes.

**Data migrations:** When computed fields (like `rating`) need to be recalculated, maintenance scripts in `scripts/` handle this (`reset-review-stats.ts`, `fix-phantom-reviews.ts`). These run manually via `npx tsx scripts/...`.

**Slug collisions:** Hostel slug generation includes a collision retry loop (up to 10 attempts with incrementing suffixes, then timestamp fallback).

**API versioning:** No versioning currently. The API is private to the co-located frontend. If public API access is ever introduced, URL-prefix versioning (`/api/v2/`) is the intended approach.

**Backward compatibility:** Not formally tracked. Since API and frontend ship together, breaking changes don't create client compatibility issues.

---

## 23. Compliance and Regulatory Considerations

**GDPR Article 17 (Right to Erasure):** `DELETE /api/auth/delete-account` performs an explicit, sequential delete of all user-associated data: notifications, conversation participants, messages, favorites, price alerts, reviews, bookings, password reset tokens, phone verification tokens, sessions, OAuth accounts, and the user record itself. For owner accounts, hostel-related data (bookings, reviews) is deleted and then the hostels are deleted in a batch operation. A confirmation email is sent.

**Data retention:** No formal retention policy beyond active use. Deleted account data is removed immediately. There is no soft-delete pattern.

**User consent:** No cookie consent banner is implemented. The app uses HTTP-only authentication cookies (necessary cookies). If analytics or tracking is added, a consent mechanism will be required.

**Data residency:** Not specified. Neon and Vercel are US-based by default. If Pakistani data residency is required, this needs to be addressed at the infrastructure level.

**PECA compliance (Pakistan Electronic Crimes Act):** The platform collects name, email, phone, and booking history. No specific PECA data handling procedures are documented beyond the deletion capability.

**Email unsubscribe:** Transactional emails do not include an unsubscribe link. This is acceptable for strictly transactional emails (booking confirmations, password resets) but would need to be added for marketing emails if any are introduced.

---

## 24. Disaster Recovery and Backup

**Database backups:** Neon provides automated daily backups and point-in-time recovery (PITR) with a configurable retention window (7 days on the free plan, longer on paid). No application-level backup process is implemented.

**Recovery Time Objective (RTO):** Approximately 1–4 hours. Restoring a Neon database from backup and redeploying Vercel functions is the main recovery path. No hot standby exists.

**Recovery Point Objective (RPO):** Up to 24 hours for a full-day backup restore, or minutes for PITR recovery if Neon PITR is enabled.

**R2 storage:** Cloudflare R2 provides redundancy within its infrastructure. No cross-region replication is configured. Deleted objects cannot be recovered.

**Redis (Upstash):** Rate limit data and token version cache. Loss of Redis data on Upstash failure is tolerable: rate limits fall back to in-memory, token version checks fall back to the database. No backup needed.

**Typesense:** The index can be rebuilt from the database at any time via `POST /api/admin/search/sync` (admin-only) or the `scripts/setup-typesense.ts` script.

**Recovery steps for a full outage:**
1. Restore Neon database from backup or PITR
2. Verify environment variables in Vercel are intact
3. Trigger a Vercel redeploy (or it will automatically redeploy on the next push)
4. Run `npx tsx scripts/setup-typesense.ts` to rebuild the search index
5. Verify cron jobs are still scheduled in Upstash QStash dashboard
6. Smoke test: signup, search, booking, payment

---

## 25. Open Issues, Risks, and Decisions Pending

**Risk: No database migration files.** Using `prisma db push` in a team context or for production schema changes is dangerous. A breaking migration applied without a rollback path could corrupt production data. **Decision needed:** Adopt `prisma migrate dev` workflow before the next schema change.

**Risk: Jest not in devDependencies.** The `validations.test.ts` file exists but may fail to run. **Decision needed:** Add Jest + ts-jest and confirm the test suite runs in CI.

**Risk: Single Typesense node.** If Typesense Cloud goes down, all searches degrade to Prisma. Prisma full-text search is not indexed for text (only for filter fields). A long Typesense outage would degrade search quality noticeably. **Option:** Add a secondary Typesense node or accept the Prisma fallback as sufficient.

**Risk: No email unsubscribe for price alerts.** Price alert emails are transactional, but users may not remember setting an alert. **Decision needed:** Add an unsubscribe or alert-management link in the price alert email.

**Decision pending: Push notifications.** The in-app notification system exists but doesn't push. Messaging is a real-time-adjacent feature; users checking for replies have to reload the page. **Options:** Polling (current), SSE, WebSockets (not available on Vercel Edge), or web push.

**Trade-off made: Denormalized rating fields.** Faster reads at the cost of potential drift. Maintenance scripts exist to fix drift. The alternative (computing rating on every read) would require a subquery on every listing render.

**Trade-off made: Fire-and-forget emails.** A failed booking email does not block the booking. This is the right trade-off (email failures are rare and recoverable), but it means some users may not receive a confirmation and would need to check the platform directly.

**Known gap: No structured logging.** `console.error` goes to Vercel's log drain but is not structured JSON. Searching logs for specific booking IDs or user IDs requires string matching. Recommend Axiom or Logtail integration.

**Known gap: No PITR confirmation.** Neon PITR availability depends on the plan. The team should confirm PITR is enabled for the production Neon database and document the recovery procedure.

---

## 26. Glossary

**Booking status lifecycle:** PENDING → CONFIRMED or CANCELLED. CONFIRMED → COMPLETED (by cron after checkout) or CANCELLED (by student or owner). COMPLETED enables review submission.

**Denormalization:** Storing computed values (`rating`, `reviewCount`) directly on the hostel row to avoid expensive aggregate queries on every read. Updated transactionally on review write.

**ISR (Incremental Static Regeneration):** Next.js feature that serves a cached static page and regenerates it in the background after a specified interval (`revalidate`).

**Optimistic locking:** A concurrency control pattern where a record includes a version counter. An update specifies the expected version; if the version has changed (another process updated the record), the update fails (Prisma P2025). Used on `Room` to prevent double-booking.

**OTP (One-Time Password):** A 6-digit code sent via SMS, valid for 10 minutes, used to verify a phone number.

**PKR:** Pakistani Rupee. All monetary values in the system are stored as integers representing PKR (not paisa).

**PITR (Point-in-Time Recovery):** A database backup feature that allows restoring the database to any specific moment within the retention window.

**QStash:** Upstash's HTTP message queue and scheduler service, used here to trigger cron API endpoints on a schedule.

**R2:** Cloudflare's object storage product, S3-compatible.

**RSC (React Server Component):** A React component that renders on the server. Can fetch data directly without an API route.

**Slug:** A URL-friendly string derived from a hostel name (`green-valley-boys-hostel`). Unique. Used in hostel URLs instead of database IDs.

**Typesense:** An open-source, typo-tolerant search engine. Used for full-text hostel search. Distinct from the Prisma database.

**tokenVersion:** An integer field on the User record. Incremented on password change. The JWT stores the version at login time; if the stored version doesn't match the current version, the session is revoked.

**HMAC (Hash-based Message Authentication Code):** A cryptographic authentication code computed over a message using a shared secret key. Used to verify payment webhook authenticity.

**Idempotency:** The property that performing an operation multiple times produces the same result as performing it once. The Safepay webhook handler is idempotent: a duplicate webhook does not double-confirm a booking.

---

## 27. Revision History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-05-05 | Engineering Team | Initial system design document, derived from codebase analysis |