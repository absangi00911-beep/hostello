# HostelLo Security Controls

Companion to [`SYSTEM.md`](../SYSTEM.md) (§13 summarizes the security design and threat model). Moved out of the design document on October 20, 2026 so that the design stays readable and this inventory can be maintained on its own.

**Status of the contents.** The controls below are carried forward from design document v3.127. During the October 2026 audit I re-read the code for CSRF/origin checks, rate limiting, credentials sign-in, token-version revocation, Safepay webhook verification, uploads, payouts and refunds. Everything else is an unverified claim until a test or the docs check covers it. Items marked **Audit note** were added by that audit. Risk IDs (R-nn) refer to the register in `SYSTEM.md` §16.

**Maintenance.** When a route's limit or guard changes, change it here. Planned improvement: generate the route-to-limit table from a single rate-limit policy module instead of prose.


## Transport and request integrity

- HTTPS-only deployment target.
- `next.config.ts` still sets a UI-era Content Security Policy (inline scripts, third-party image and map origins, payment-gateway form targets). It does not protect JSON responses and is not a control for an API-only service. Replace it with an API-appropriate header set when the client topology is decided (see R-09 in `SYSTEM.md`).
- CSRF Origin checks for browser state-mutating API routes.
- Signup verification, resend, password-reset, subscription-checkout, and web-payment return URLs use the configured app origin; untrusted `Host` and forwarded-host request headers cannot choose security-sensitive destinations. The shared origin helper rejects HTTP in production while allowing localhost HTTP in development.

## Input validation and resource bounds

- Zod validation on API payloads.
- Paginated collection endpoints use a shared parser that clamps per-page limits, negative input, and page offsets (maximum page 10,000).
- Search and filter routes cap query-string size, free-text lengths, filter-array counts, and identifier/token lengths before starting database or search operations.
- Profile updates and owner blocked-date writes have bounded JSON bodies and per-user rate limits; profile fields and calendar reasons are also length-validated. Admin student-verification actions accept only a small, schema-validated JSON body.
- JSON request bodies are streamed through byte limits before parsing. Both multipart upload routes also enforce their byte caps while reading the stream, including requests without a `Content-Length` header. Write schemas cap fields and arrays where needed; listing creation retains and validates its image fields.
- Favorites and the admin student-verification queue use server-side bounded pagination; verification name/email search is capped before querying.

## Errors, logging and audit trail

- Booking, refund, and payout actions return typed domain errors and map stale-state conflicts to HTTP 409; unexpected persistence failures return operation-specific generic HTTP 500 responses while logs use safe summaries.
- Admin booking state changes emit a correlated JSON audit event containing the action and keyed pseudonyms for actor and booking IDs; raw email, hostel name, and source identifiers are omitted. Booking IDs are capped at 64 characters before GET/PATCH database work.
- Method-level Route Handler review found state changes guarded by role-scoped user/admin quotas, trusted-IP caps, the shared notification-write quota, atomic OTP-attempt limits, or verified one-time/signed ingress. The intentionally public hostel view counter is IP-limited; provider callbacks and cron writes verify signatures before mutation.

## Rate limits and quotas

- Upstash-backed rate limiting with in-memory fallback.
- User-keyed rate limits on high-risk authenticated routes.
- IP-based rate-limit keys share the Vercel-trusted client-IP extractor; alternate client-supplied proxy headers cannot rotate a caller's key.
- Public review reads are limited to 120 requests per trusted client IP per minute; the administrator all-reviews list is limited to 60 requests per admin per minute. Both quotas run before review queries and return `Retry-After` when exceeded.
- Booking collection reads are limited to 60 per authenticated account per minute, and booking detail reads to 120 per account per minute. These limits run before booking queries and return `Retry-After`.
- Owner earnings reads, including pending-balance and payout-history lookups, are limited to 30 per authenticated account per minute before database/service work.
- Public hostel search is limited to 120 requests per trusted client IP per minute before querying Typesense or falling back to PostgreSQL; oversized queries are rejected first.
- Public 12-month availability aggregation is limited to 60 requests per trusted client IP per minute and rejects oversized hostel identifiers before database queries.
- Review creation/edits are limited to 10 per user per hour to curb repeat owner notifications.
- Notification inbox reads are limited to 60 requests per user per minute; read-all is limited to 5 writes per minute and per-notification read/delete actions share a 60-per-minute user cap. Limits are checked before database work or body parsing, while notification reads and mutations remain scoped to the authenticated user.
- Review-reply save/removal is limited to 10 actions per user per hour; only owners and admins reach the review lookup, and owner writes remain scoped to current hostel ownership.
- Owner listing edits and status changes are limited to 30 PATCH actions per owner per hour before the listing lookup.
- Price-alert reads use bounded pagination and creation is rate-limited per account; alert fields are constrained before database operations.
- Paginated favorites and owner listing reads are capped at 60 requests per user per minute, owner review dashboards at 30, and batch-scanning owner analytics at 10; throttled responses include `Retry-After` and limits run before database queries.
- Admin listing-completeness and verification analytics scans are limited to 10 requests per admin per minute before database work. Sensitive admin collection reads share a 60-per-minute per-admin quota; private verification-document reads have a separate 30-per-minute cap. Cron health reads a fixed schedule set.
- Private student-verification document reads are limited to 30 requests per admin per minute before user lookup or R2 fetch; throttled responses include `Retry-After`.
- Price-alert edits/deletes are capped at 60 actions per user per minute and roommate-post deletion at 30 per minute; both reject overlong item IDs before the database lookup and return `Retry-After` for throttled requests.
- Owner listing creation is capped at five per hour. Email-verification token reads and price-alert unsubscribe lookups are capped per trusted client IP before database access.
- Admin refund actions and Safepay webhook retries are capped at five per admin per hour; payout writes at 10 per hour; hostel, verification, review, and roommate moderation at 30 per minute; full Typesense sync at two per hour. Throttled responses carry Retry-After.

## Authentication and account security

- Password-reset and email-verification tokens are short-lived and single-use. Both are stored as SHA-256 digests. The reset transaction conditionally claims a live token before changing the password, preventing concurrent replay. Email verification accepts the raw-token storage format only as a compatibility lookup for links issued before this change. Forgot-password requests return a generic account-neutral message and are limited to three attempts per IP per 15 minutes and three token sends per account per hour. Source: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- Reset-password pages send no referrer so bearer tokens in the URL are not disclosed through a subsequent navigation or request. (The reset page was removed with the UI; the requirement now applies to the future frontend.)
- Email-verification GET links only render a no-store confirmation form; a bounded same-origin POST atomically consumes the token and verifies the address, so mail scanners and link previews cannot consume it.
- Email-preference unsubscribe links use a signed, expiring HMAC token and verify the token email against the current account; unsigned userId/email encodings are rejected.
- Unsubscribe-link GET requests only render a no-store confirmation page; the bounded POST applies the preference change. Per-alert links and signed global price-alert email preferences are reachable from email, and users can re-enable them in profile settings.
- New, changed, and reset passwords are limited to 72 UTF-8 bytes before bcrypt hashing, avoiding bcrypt's silent input truncation. Account deletion requires typed confirmation and password confirmation when available, blocks while stays/refunds/payouts or plan payments need attention, and runs through a resumable minute worker. It preserves completed financial history with the account anonymized and removes personal data in bounded batches.
- Phone OTP requests have both per-destination daily limits and a per-IP hourly cap before invoking the SMS provider.
- Phone changes remain OTP-backed: `PATCH /api/profile` rejects nonempty phone changes, clients must prompt for verification when the draft differs from the saved number, and phone removal resets `phoneVerified`. Failed attempts use a conditional counter capped at five; a correct code is deleted in the same transaction that sets the verified number.
- Credentials sign-in checks independent 10-per-15-minute trusted-IP and 5-per-15-minute keyed-account buckets. Login success, rejection, and throttling emit correlated events with HMAC pseudonyms rather than raw emails or addresses. **Audit note (Oct 2026):** the per-account bucket counts every attempt before the password is checked, so anyone who knows an email can lock that account out (R-10).

## Authorization and object scoping

- Every owner blocked-date method requires the OWNER role before looking up the hostel; reads, counts, deletes, and creates are also scoped through the current hostel-owner relation. Blocked-date history, owner earnings history, and conversation/message reads use bounded page-scoped queries; conversation filters run server-side, and message-history reads have per-user rate limits.
- Owner listing edits use the shared listing schema, preserve ownership, reset the listing to `PENDING_REVIEW`, and remove previously active listings from Typesense during review; suspended listings cannot be edited through the owner route.
- The hostel detail API that returns owner contact fields is admin-only; unauthenticated availability/review reads only expose active listings. The public view counter only increments active listings.
- Students can create favorites only for active listings. Favorite removal is an idempotent delete scoped by both the authenticated user and hostel slug, without a prior lookup that could reveal hidden-listing existence.
- Price-alert creation, list/update responses, and scheduled delivery require the related hostel to remain `ACTIVE`; suspended listings are hidden from alert owners and cannot trigger price-drop mail.
- Owner subscription endpoints require the OWNER role, do not return the Safepay tracker, and rate-limit checkout creation per owner.
- Owner booking lists apply ownership through the hostel relation in the paginated booking query, avoiding an application-side preload of every hostel ID.
- Admin-only payout and refund endpoints enforce privileged role checks.
- Review collection APIs paginate public per-hostel results, restrict the all-reviews list to admins, and rate-limit both query paths before database work. Admin review deletion recalculates hostel rating/count transactionally and reindexes the hostel in Typesense.
- Roommate-post reads, writes, and reports require a student session; authors can delete their own post. Student roommate posts and reports have small JSON body caps and per-student rate limits. The API accepts reports only from students. Posts remain visible until three unique students report them; the shared threshold drives API results and the admin moderation queue. Admins can list reports and reasons through `/api/admin/roommate-reports` and remove reported posts through its API.
- Favorite creation/removal is student-only and limited to 60 actions per student per minute before the hostel database lookup.
- Review creation requires a `STUDENT` session; overlong request-body hostel IDs are rejected before a completed-booking lookup or review write.
- Notification read/delete and roommate-post deletion apply the authenticated user ID in the database write predicate and return 404 for both absent and non-owned resources.

## Payments, bookings and payouts

- Payment webhook/callback signature checks. Safepay uses its documented raw-body HMAC-SHA512 contract. Ingress checks the signature and merchant key, then stores verified events with bounded, sanitized evidence before QStash dispatch. The signed worker checks order/tracker, provider, terminal state, currency, and exact amount before conditional booking transitions for both success and failure events. `GET /api/admin/payment-events` exposes retryable and reconciliation-required events. Only retryable events can be re-queued after an admin verifies the current provider state, amount, currency, and exact tracker in Safepay; the actor, tracker, and reason are stored in an append-only audit table. Reconciliation-required events remain manual. Sources: [Safepay HMAC guidance](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/) and [webhook delivery guidance](https://safepay-docs.netlify.app/developers/webhooks/overview/).
- Payment callback GET requests are read-only browser returns; only signed gateway POST callbacks can settle a booking.
- When `GATEWAY_IPS` is configured, JazzCash callbacks reject missing or non-allowlisted addresses before parsing payment data. The check trusts Vercel's overwritten single-IP `x-forwarded-for` value or a direct socket IP; it ignores client-controlled `cf-connecting-ip`/`x-real-ip` headers and rejects ambiguous forwarded chains. A proxy in front of Vercel requires Vercel Trusted Proxy configuration to preserve the original address ([Vercel request-header contract](https://vercel.com/docs/headers/request-headers)). HMAC remains the primary callback authentication.
- Booking checkout and booking-status actions, owner subscription checkout, SMS OTP, issue reports, uploads, and other high-cost writes apply per-user, destination, or trusted-IP rate limits. Booking status updates use conditional state transitions and restore the booking's guest count to room inventory only after winning the transition, preventing duplicate inventory restoration on concurrent actions. Student cancellations scope the write to the student's ID, require PENDING status, and are rejected after check-out or owner confirmation. Student/admin cancellation writes also require payoutId to remain null, so they cannot race a payout batch claim. Owner confirm/decline writes require the current hostel-owner relation. Owner payout bank-detail updates are limited to five per user per hour. Provider spending limits still need operational validation against production provider quotas.
- Owner listing creation reads the owner's plan, checks the current listing count, and creates the listing inside one PostgreSQL Serializable transaction. Prisma serialization conflicts (P2034) retry up to three attempts; the admin email is sent only after commit. This prevents concurrent requests from oversubscribing a plan quota. Source: [Prisma transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
- The admin payout queue pages eligible owners and sums booking totals with a database group aggregate instead of loading booking rows. It returns the latest 20 batches per owner and signals when older history is omitted.

## Storage and uploads

- R2 URL allowlisting for submitted image URLs.
- Student identity documents use a dedicated private R2 bucket, student-only authenticated app uploads capped at 4 MiB, metadata/signature checks, and copy-on-submit to immutable review keys. Admins stream documents through an authenticated no-store route; an hourly QStash job deletes abandoned temporary uploads. The bucket API token is separate and bucket-scoped.
- Listing-image uploads require an owner or administrator when a hostel ID is supplied. Owner-scoped lookup returns the same 404 for absent and foreign listings, and malformed or overlong multipart hostel IDs are rejected before lookup. Uploads require an identified session; missing R2 credentials or an invalid public image URL fail with 503 in production, while the placeholder response is limited to local development. **Audit note (Oct 2026):** when `hostelId` is omitted, any signed-in user, students included, can upload to the public listing bucket (R-11).

## Search and jobs

- Full Typesense reindex uses narrow 100-row keyset pages and indexes each page directly, avoiding the full active-listing read and per-hostel follow-up reads.

## Known weaknesses found in the October 2026 audit

| Weakness | Risk ID |
|---|---|
| Per-account login bucket can be used to lock out a known account; login timing and signup 409 reveal whether an email exists | R-10 |
| Email, phone and student verification are recorded but required by no endpoint; no way to suspend a user; no MFA or second approver for admins | R-10 |
| Any signed-in user can upload to the public listing bucket when `hostelId` is omitted; 5 uploads per 10 minutes is too low for listing onboarding | R-11 |
| Typesense `filter_by` values are interpolated unquoted and unescaped | R-13 |
| Many per-IP limits may collide with carrier-grade NAT and campus networks (verify with real traffic) | R-10 |
| CSP and image/connect allowlists in `next.config.ts` target the removed UI | R-09 |


## Open verification items

- Confirm production Neon backup/PITR retention, document recovery point objective (RPO) and recovery time objective (RTO), and exercise a restore.
- The draft launch operations runbook (`docs/LAUNCH-OPERATIONS-RUNBOOK.md`, not in the audited archive; R-20) separates deployment rollback, Neon recovery, Safepay reconciliation, private-document exposure, and alert response. Assigning owners and exercising provider-console procedures remain release gates.
- Audit authorization at the data boundary for object-level, property-level, and function-level access on every public Route Handler. Targeted October 6–7 reviews removed the admin bypass from private conversation reads, stopped owner-edit metadata from disclosing listing names to unauthorized visitors, kept phone changes behind OTP verification, and restricted review creation to students before a bounded booking lookup; the route-by-route audit remains open.
- Verify `NEXT_PUBLIC_APP_URL`/`AUTH_URL` are set to each environment's intended canonical HTTPS host; password and verification links plus payment redirects now use that configured origin rather than the incoming request host.
- A production-mode unit regression exercises a rejected Upstash request: the per-instance in-memory fallback still denies requests above its configured window and does not log the provider error message. This does not verify production Redis behavior or coordinate limits across serverless instances; production still requires Upstash and provider-side transaction/idempotency safeguards.
- Review remaining per-user resource quotas and unbounded result sets. Account deletion now uses resumable, keyset-batched cleanup phases with bounded relation scans instead of one account-sized transaction. Its schema migration and signed QStash schedule still need release setup. URL/query bounds and request-body limits reduce individual request work but do not bound all accumulated per-user data.
- Verification and listing-completeness scoring process matching rows in 200-row keyset batches, bounding application memory while total reads remain proportional to result-set size. Owner analytics groups six months of bookings and paid revenue by month in one owner-scoped SQL aggregate, keeping raw booking rows out of application memory. Public availability uses date-range deltas and binary-searched calendar boundaries, so aggregation work is O(matches × log days + days) for at most 366 days. Benchmark at expected launch volume. Owner listing totals and booking status/revenue summaries use database aggregates.
- Sentry client/server/edge SDKs disable automatic collection of user data, cookies, HTTP headers/bodies, query parameters, database query data, and stack-frame locals; event and span callbacks strip request payloads and scrub common identifiers. Confirm project-level Sentry scrubbing and IP settings in the console.
- Sentry tracing is configured at a 100% sample rate for client/server/edge; measure production volume and tune sampling while preserving high-value errors and critical transaction traces.
- Application catches now log allowlisted error summaries; cron failures return and persist only generic status text, and cron-health reads only configured job names while redacting legacy error details. Payment health aggregates retryable and reconciliation-required webhook events; hosted alerts for payment, search, notification, and cron health still need setup and exercise.
- Confirm production database connection limits against Vercel instance/region scaling; the node-postgres pool uses its default maximum per process and a serverless fleet can multiply connections.
- A roommate post at the three-report threshold remains hidden until expiry unless an admin removes it. The current schema has no audited dismiss/restore state; decide whether that workflow needs a future schema change before adding moderator restore actions.
- Production dependencies audit clean (0 vulnerabilities; verified October 19, 2026 with `npm audit --omit=dev` against the committed lockfile). The full audit reports five high findings in the development-only `braces` chain through the ESLint toolchain ([advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); track the fix and do not force-downgrade `eslint-config-next`. `audit.yml` blocks only on production dependencies and reports these development-only findings without failing (R-06).
- Create/configure the dedicated private R2 bucket and bucket-scoped token, schedule the abandoned-upload cleanup job, and clean up legacy student documents that remain public in the listing bucket. See private verification storage setup (`docs/PRIVATE-STUDENT-VERIFICATION.md`, not in the audited archive; R-20).

---
