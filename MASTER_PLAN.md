# HostelLo — Master Development Plan
**Solo Founder Edition** | May 2026 | Living Document

---

## Honest Baseline

The strategy docs were written assuming a team of 5–7 people. You are one person. Everything in this plan is adjusted for that reality.

**Two rules that override everything else:**

1. **Web first, mobile second.** Mobile cannot launch until the web is stable and generating real bookings. Building mobile on top of a shaky web foundation means fixing the same bugs twice, on two platforms, alone.

2. **Sequential, not parallel.** The strategy assumes backend and mobile work happens simultaneously across two teams. You cannot do that. Backend prerequisites come first, then mobile. Cutting corners on this sequencing is the single most common reason solo-built mobile apps fail mid-development.

**Revised timeline expectation:** The strategy targets a Q4 2026 MVP with a team. Solo, a realistic mobile MVP is **Q2–Q3 2027**, with General Availability in late 2027. This is not pessimism — it is arithmetic. Adjust external commitments accordingly.

---

## Decision Gates

These are hard stops. Do not proceed past a gate until its criteria are confirmed. Gates exist because the cost of fixing a wrong assumption grows the further you are past it.

| Gate | Criteria | Located Before |
|---|---|---|
| **Gate 1** | Web app is in production with zero P0 bugs. All known open issues either resolved or explicitly accepted as technical debt. | Phase 1 |
| **Gate 2** | Web platform is generating ≥ 200 bookings/month consistently. Budget for mobile is confirmed and allocated. | Phase 2 |
| **Gate 3** | All 5 Sprint 0 backend prerequisites are complete, tested, and deployed to staging. | Phase 3 |
| **Gate 4** | Core mobile flows (auth, search, hostel detail, booking) work end-to-end on both iOS and Android against staging. | Phase 5 |
| **Gate 5** | Beta crash rate < 1%, booking flow confirmed working on 6+ device targets, app store assets ready. | Phase 6 |

---

## Phase 0 — Web App Completion & Stabilization
**Goal:** Ship a production web app that can stand alone. Not "nearly complete" — complete.
**Estimated duration:** 4–8 weeks (depends on remaining web work)
**Must finish before:** anything else

### 0.1 Complete Remaining Web Features
- Audit every "should-have" and "must-have" item in SYSTEM.md Section 4
- Build a short punch list of what is genuinely incomplete vs. what can be deferred
- Ship only what is necessary for the first real cohort of students and owners

### 0.2 Resolve the Prisma Migration Problem
**This is a production risk that must be fixed now, not later.**
- Switch from `prisma db push` to `prisma migrate dev` for all future schema changes
- Generate a baseline migration file from the current schema state: `prisma migrate dev --name baseline`
- Add `prisma migrate deploy` to the Vercel build/deploy pipeline
- Test a non-destructive schema change (e.g., adding a nullable column) through the full migration flow before going live
- *Why now:* Every mobile sprint 0 item requires schema changes. Doing those without migration files in production is how you corrupt the database and lose bookings.

### 0.3 Add Jest to the Project
- Add `jest`, `ts-jest`, `@types/jest` to devDependencies
- Confirm `validations.test.ts` runs and passes
- Write one integration test for the booking creation endpoint as a template for future tests
- This unblocks confidence in shared package changes later

### 0.4 Production Hardening
- Verify Sentry is connected and capturing errors in production (not just installed)
- Confirm Neon PITR (point-in-time recovery) is enabled on the production database — check in the Neon dashboard, don't assume
- Smoke test every critical path in production: signup → verify email → search → book → pay → webhook confirmation
- Confirm the three cron jobs are running and completing successfully (check QStash logs)

### 0.5 Set Up Axiom Log Drain (Optional but High Value)
- Connect Vercel's log drain to Axiom
- This gives you structured, queryable logs before the bugs arrive, not after
- Cost: ~$25/month. Worth it before mobile traffic arrives.

---

## Phase 1 — Validate the Business Before Building Mobile
**Goal:** Confirm that building mobile is the right next investment.
**This phase has no code. It has a decision.**

The mobile strategy's go/no-go criteria in Section 3 are real. Here they are, bluntly:

**Stop and answer these before Phase 2:**

1. Is the web generating 200+ bookings/month? If not — mobile is premature. More owners need to be onboarded, or marketing needs to improve, or the booking flow has friction. These are web problems. Solve them on the web first, where iteration is faster.

2. Do you have $50–80K budgeted for mobile development over 12 months? Even solo, this covers contractors for specific problems (security audit, App Store coordination, Expo architecture review), device testing, EAS Build costs, Firebase costs, and your own time.

3. Are you prepared to not touch major new web features for 6+ months while mobile is in development? Building both in parallel solo is how neither gets done.

**If the answer to any of these is no:** pause mobile planning, continue web growth, revisit in 3 months.

---

## Phase 2 — Sprint 0: Backend Mobile Prerequisites
**Goal:** Make the existing backend work correctly with a mobile client.
**Estimated duration:** 6–8 weeks solo (the strategy says 3–4 weeks with a dedicated backend engineer; add time for context switching and self-review)
**Must finish before:** any mobile screen is written

These are not optional. They are the foundation. If you skip any of them and start building mobile screens, you will hit a wall at the exact moment the skipped item surfaces (usually during the booking flow or push notification implementation).

### 2.1 Bearer Token Authentication in Middleware
**Effort:** ~3 days
**File:** `src/middleware.ts`

Update the auth middleware to check for `Authorization: Bearer <token>` in addition to the existing NextAuth session cookie. Logic:
- If cookie present → use existing NextAuth session validation path
- If `Authorization: Bearer <token>` header present → validate JWT, check `tokenVersion` against Redis/database
- If neither → 401

The login endpoint (`POST /api/auth/signin`) must also return the JWT as a JSON field in the response body (not just set the cookie) so mobile clients can capture and store it.

Token lifecycle rules to implement:
- 30-day expiry on JWT
- Mobile stores JWT in `expo-secure-store` (this is mobile-side, but design it here)
- On 401 response, mobile will attempt silent re-auth; backend just needs to return clean 401s

**Test it:** Write a test that calls a protected endpoint with a Bearer token and confirms a 200, then calls it with an expired/invalid token and confirms a 401.

### 2.2 CSRF Exemption for Bearer-Authenticated Requests
**Effort:** ~1 day
**File:** `src/middleware.ts`

The existing CSRF check rejects requests without an `Origin` header in production. Mobile clients don't send `Origin`.

Fix: if a request has already passed the Bearer token auth check (i.e., it's an authenticated mobile request), skip the `Origin` validation entirely. Bearer auth already proves identity; CSRF is a browser-specific attack vector.

Do not add a custom header for this (`X-Client: mobile`). That approach requires coordinating a secret and adds a new attack surface. Bearer token presence is sufficient.

**Test it:** Make a POST to `/api/bookings` from a non-browser context (curl or a test) with a valid Bearer token and no Origin header. Confirm it doesn't get rejected by CSRF middleware.

### 2.3 Rate Limiting by User ID for Authenticated Routes
**Effort:** ~1 day
**File:** Wherever rate limiting is applied per route

Update authenticated API routes to use `user:{id}` as the rate limit key instead of IP address. The Upstash rate limiter already supports custom keys — this is a search-and-replace change, not an architectural one.

Unauthenticated routes (search, hostel detail) continue using IP.

**Why this matters for mobile:** University students on campus WiFi share an IP. Without this change, 20 students on the same WiFi would collectively trigger booking rate limits, then get 429 errors, then call you complaining about the app.

### 2.4 DeviceToken Schema + Registration Endpoints
**Effort:** ~3 days (schema + endpoints)
**Files:** `prisma/schema.prisma`, new route files

Add the `DeviceToken` model:
```
DeviceToken
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  platform   String   // "ios" | "android"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**This requires a proper migration file, not `db push`.** Generate the migration via `prisma migrate dev --name add_device_token` and test it on a staging database branch before applying to production.

New endpoints:
- `POST /api/notifications/device-token` — upsert on `token` field (handles reinstalls, where same physical device gets a new token)
- `DELETE /api/notifications/device-token` — called on logout; deregisters current device's token

### 2.5 FCM Admin SDK Integration
**Effort:** ~4–5 days (setup + integration + testing)

This is the longest sprint 0 item. Steps:
1. Set up Firebase project, generate service account JSON
2. Add `firebase-admin` to web app dependencies
3. Add `FIREBASE_SERVICE_ACCOUNT_JSON` to environment variables (and `.env.local` docs)
4. Update `src/lib/notifications.ts` — after writing the `Notification` table record, dispatch FCM push to all active device tokens for the user
5. Handle `UNREGISTERED` FCM response by deleting the stale token from the database
6. Handle partial failures (some tokens succeed, some fail) without throwing

What triggers a push notification (MVP):
- Booking confirmed → student
- Booking cancelled → student
- Price alert triggered → student

**Test it:** Register a real device token (from a physical phone running a dev build), trigger a booking confirmation, confirm the push arrives.

### 2.6 Safepay Deep Link Return
**Effort:** ~3–4 days (backend + domain configuration)
**Files:** `POST /api/payment/initiate`, domain DNS/hosting config, app config

Changes needed:
1. `POST /api/payment/initiate` must detect mobile clients (via a request header like `X-Client: mobile`) and return a deep link return URL (`hostello://booking/{id}/confirm`) instead of the web URL
2. Serve `/.well-known/apple-app-site-association` from `hostello.app` for Universal Links (iOS)
3. Serve `/.well-known/assetlinks.json` from `hostello.app` for App Links (Android)
4. Register `hostello://` as a custom URI scheme fallback in the Expo app config

The webhook flow (`POST /api/payment/webhook`) is unchanged — it's server-to-server.

**Note:** The `apple-app-site-association` and `assetlinks.json` files require your App Store Team ID (iOS) and SHA-256 certificate fingerprint (Android), which means the mobile app needs to be partially built before this step can be fully completed. Design the endpoint change now; finalize the well-known files when the app bundle IDs are confirmed in Phase 3.

---

## Phase 3 — Mobile Foundation
**Goal:** A running Expo app with correct structure, navigation, and auth — no real screens yet, just the skeleton.
**Estimated duration:** 2–3 weeks
**Depends on:** Gate 3 (all Sprint 0 items complete)

### 3.1 Monorepo Shared Package
Set up `packages/shared` with:
```
packages/shared/
├── types/index.ts         # Port from src/types/index.ts
├── validations/index.ts   # Port from src/lib/validations.ts
├── constants/
│   ├── amenities.ts
│   ├── universities.ts
│   └── config.ts
├── api/client.ts          # Fetch wrapper with Bearer token support
└── utils/
    ├── currency.ts        # PKR formatting (integers, no floats)
    ├── dates.ts           # Date/duration utilities
    └── strings.ts         # sanitizeString, escapeHtml
```

Run `turbo build` after every structural change to confirm both apps compile.

### 3.2 Expo Project Scaffold
- `npx create-expo-app@latest mobile --template` with TypeScript template
- Configure `app.json`: bundle IDs (`com.hostello.app` for both platforms), permissions (camera, photo library, notifications), deep link scheme (`hostello://`)
- ESLint + Prettier matching web app config
- EAS Build configuration (`eas.json`) for development, preview, and production profiles
- Sentry React Native SDK initialized (crash reporting from day one, not day of launch)

### 3.3 Redux Store Setup
- `configureStore` with auth slice, and placeholder slices for hostels/bookings
- Redux Persist with `expo-secure-store` as the storage adapter for auth slice only (JWT, user object)
- `AsyncStorage` for non-sensitive persisted state (favorites cache, notification list)
- RTK Query base API with Bearer token injection middleware

### 3.4 React Navigation Structure
```
Root Navigator
├── Auth Stack (shown when unauthenticated)
│   ├── Login
│   ├── Signup
│   ├── Email Verification
│   └── Forgot Password
└── Main Navigator (shown when authenticated)
    ├── Tab Navigator
    │   ├── Search Tab
    │   ├── Bookings Tab
    │   ├── Notifications Tab (badge on unread count)
    │   └── Profile Tab
    └── Modal Stack
        ├── Hostel Detail
        ├── Booking Flow (3 screens)
        └── Map Full Screen
```

Deep link handler registered here — maps `hostello://` URLs to the correct screen.

### 3.5 Auth Flow Implementation
- Login screen → calls `POST /api/auth/signin` → stores JWT in `expo-secure-store`
- Signup screen → email + password → triggers email verification gate
- Token expiry check on every RTK Query request; silent re-auth if "stay logged in" selected
- 401 interceptor → clears stored JWT → navigates to Login
- Logout → clears secure store → calls `DELETE /api/auth/logout` → deregisters FCM token

---

## Phase 4 — Discovery & Hostel Detail
**Goal:** A student can open the app, search for hostels, and read a hostel's detail page.
**Estimated duration:** 3–4 weeks

### 4.1 Search Screen
- RTK Query endpoint wrapping `GET /api/hostels`
- Search input with debounce (300ms)
- Filter sheet: city, price range, gender preference, amenities, rating
- Hostel card component (cover image, name, price, rating, city)
- Pagination / infinite scroll
- Empty state, loading skeleton, offline state (banner + cached results from Redux Persist)
- Performance: test on Moto G-class profile before moving on

### 4.2 Map View
- React Native Maps + Google Maps SDK
- Cluster markers for dense areas (use `react-native-maps-super-cluster` or similar)
- Tap marker → show hostel preview card → tap card → navigate to Hostel Detail
- Sync with list view (same filter state)

### 4.3 Hostel Detail Screen
- Photo gallery (`react-native-fast-image`, swipeable)
- Amenities checklist
- Rules section
- Room types with availability
- Reviews (sorted by recency, paginated)
- Location map (static, tap to open full map)
- "Save to Favorites" button (optimistic update + backend sync)
- "Book Now" CTA → navigates to Booking Flow

### 4.4 Favorites
- Save/unsave from Hostel Detail and Search results
- Local persistence via Redux Persist (available offline)
- Sync with backend on app foreground (resolve conflicts: backend is source of truth)
- Dedicated "Saved" section in profile or tab

---

## Phase 5 — Booking Flow & Payments
**Goal:** A student can complete a booking and payment end-to-end.
**Estimated duration:** 4–5 weeks (the most complex phase; Safepay integration will take longer than expected)
**Depends on:** Sprint 0 item 2.6 (Safepay deep link) must be complete

### 5.1 Booking Flow Screens
Three-screen flow as a modal stack:
1. **Room Selection** — room types, price per month, availability
2. **Dates & Review** — check-in, duration in months, guest count, price breakdown
3. **Payment** — payment method (Safepay), total, T&C, "Pay Now" button

State held in Redux during the flow. If the user backgrounds the app mid-booking, state is restored (Redux Persist). This is not offline booking — it is session recovery.

### 5.2 Safepay Integration
- `POST /api/bookings` → creates PENDING booking
- `POST /api/payment/initiate` with `X-Client: mobile` header → receives Safepay checkout URL
- Open checkout URL in `expo-web-browser` (in-app browser, keeps context)
- Listen for deep link return: `hostello://booking/{id}/confirm`
- On deep link received: close browser, navigate to Booking Confirmation screen
- Poll `GET /api/bookings/{id}` until status is `CONFIRMED` (webhook may take 1–10 seconds)
- Show "Payment processing..." while polling

**Payment failure path:** Deep link includes error parameter → navigate to Payment Failed screen → retry or cancel options.

**Abandoned payment path:** If deep link never returns (app killed, browser closed), the backend cron cancels the PENDING booking after 30 minutes. On next app open, the booking shows as cancelled.

Test this on a real device — deep link behaviour on iOS and Android differs in ways that only surface on hardware.

### 5.3 Booking History & Management
- `GET /api/bookings` → list with status badges (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Booking detail screen (receipt, hostel info, dates, total)
- Cancel booking with confirmation dialog
- "Payment incomplete" state surfaced clearly when a booking is PENDING with no payment after reopening the app

---

## Phase 6 — Notifications & Price Alerts
**Goal:** Students receive push notifications for booking events and price drops.
**Estimated duration:** 2–3 weeks
**Depends on:** Sprint 0 items 2.4 and 2.5 (DeviceToken + FCM)

### 6.1 Push Notification Setup (Mobile Side)
- Request permission at an appropriate moment — after a value proposition explanation, not on first open
- Register FCM device token on permission grant → `POST /api/notifications/device-token`
- Deregister on logout → `DELETE /api/notifications/device-token`
- Handle push in three app states: foreground (show in-app alert), background (OS handles), killed (deep link on tap)
- Deep link routing: notification tap → parse payload → navigate to correct screen

### 6.2 In-App Notification List
- `GET /api/notifications` (paginated, polling every 30 seconds when app is in foreground)
- Unread count badge on tab icon
- Mark read on open, mark all read button
- Notification types: booking confirmed, booking cancelled, price drop, new message (Phase 2)

### 6.3 Price Alert Management
- Create price alert from Hostel Detail screen
- View, toggle, delete alerts in Profile tab
- All existing backend endpoints — no new backend work needed here

---

## Phase 7 — Polish, QA & Security
**Goal:** The app is stable, performant, and ready for real users.
**Estimated duration:** 3–4 weeks

### 7.1 Device Testing Matrix
Test every critical flow on each of these before beta:

| Device | Category | OS |
|---|---|---|
| Moto G Play (or equivalent) | Budget Android | Android 11 |
| Samsung Galaxy A32 | Mid-range Android | Android 12 |
| iPhone SE 2nd gen | Budget iOS | iOS 15 |
| iPhone 13 | Mid-range iOS | iOS 16 |

Use EAS Build for both platforms. Do not rely only on simulators — Safepay deep links and FCM push will only behave correctly on physical devices.

### 7.2 Performance Profiling
Run the full booking flow on the Moto G Play equivalent. If it's performant there, it's fine everywhere.

Watch for:
- React Native re-renders caused by Redux selector shape changes
- `react-native-fast-image` cache misses on the hostel gallery (large images on slow connections)
- RTK Query waterfall requests (multiple sequential API calls where one parallel request would do)
- Map view on budget Android — clustering reduces marker count, but test with 50+ hostels visible

Target: cold start to interactive < 2.5s, search results < 300ms, 60 FPS on 80%+ of sessions.

### 7.3 Accessibility Audit
- All interactive elements have `accessibilityLabel` props
- Touch targets are minimum 44×44pt
- Text scales with OS font size (no hardcoded font sizes that break at large text)
- Test with iOS VoiceOver and Android TalkBack on the booking flow

### 7.4 Security Review (Self-Conducted)
Before beta, manually verify:
- JWT is stored in `expo-secure-store`, not `AsyncStorage`
- Deep link handler validates booking ID belongs to the authenticated user before navigating
- `Authorization` headers are scrubbed in Sentry (check Sentry's scrubbing config)
- No sensitive data (passwords, tokens, card info) appears in Mixpanel event properties
- The `apple-app-site-association` and `assetlinks.json` files are served correctly and restrict the app link scope appropriately

If budget allows, a focused security audit of the token handling and deep link flow by a contractor is worth $5–8K before public launch. This is not optional forever — schedule it for before General Availability if not before beta.

---

## Phase 8 — Beta & App Store Launch
**Goal:** The app is live on both stores.
**Estimated duration:** 4–6 weeks (including review buffer)

### 8.1 Beta Distribution
- iOS: TestFlight. Invite 50–100 users from the existing web user base first (most qualified testers).
- Android: Google Play Closed Testing. Same cohort.
- Fix critical bugs before expanding. Do not open to 500 users with a crash rate above 2%.

Success criteria to expand beta:
- Crash rate < 1% of sessions (Sentry)
- Full booking flow confirmed working end-to-end by at least 10 beta users
- Safepay deep link return working on both platforms
- Push notifications delivering on both platforms
- No P0 bugs open

### 8.2 App Store Assets
Prepare before submitting for review:
- Screenshots for every required device size (use Expo's simulator builds to capture)
- App preview video (optional but improves conversion — show the search → book flow)
- App Store description (primary keyword: "student hostel booking Pakistan")
- Privacy policy URL (required — must be hosted and accessible)
- Keywords list for ASO

### 8.3 Submission
- Apple App Store: 1–3 day review for new apps, can be longer. Submit 2 weeks before target launch date.
- Google Play: 3–7 days for new apps.
- Coordinate both submissions to go live simultaneously.
- Have a plan for rejection: read the App Store Review Guidelines before submitting, not after rejection.

### 8.4 Launch Week
- Email existing web users with the download link
- In-app web banner ("HostelLo is now on iOS and Android")
- Monitor crash rate, booking conversion, and push opt-in rate daily for the first two weeks
- Respond to every App Store review within 48 hours in the first month

---

## What Is Explicitly Not in This Plan

These items are real and will eventually need doing, but are not on the path to mobile MVP:

- **In-app messaging** — polling-based messaging works today, but the battery/data impact on mobile is not acceptable without push nudges fully working first. Push nudge → fetch on open is the right pattern. This is Phase 2.
- **Review submission** — gated on completed stay (cron job). Backend works. Mobile UI is Phase 2.
- **Owner dashboard on mobile** — significant scope. Phase 2.
- **Apple Pay / Google Pay** — gated on Safepay confirming SDK support. Contact Safepay. Do not schedule engineering time until they confirm.
- **JazzCash / EasyPaisa on mobile** — the callback flow for form-POST gateways via deep links needs a dedicated design spike. Phase 2.
- **Offline search** — requires local SQLite index with sync pipeline. Phase 3.
- **Video reviews** — content moderation problem not yet solved. Phase 3.

---

## Ongoing Commitments (Post-Launch)

These are not one-time tasks — they are recurring:

- **Weekly builds** with bug fixes in the first 2 months post-launch
- **App Store review response** within 48 hours
- **Crash rate monitoring** — if it exceeds 1%, a hotfix release within 48 hours
- **Dependency updates** — Expo SDK releases approximately quarterly; staying current avoids large migration debt
- **Backend compatibility** — any new API route added to the web must work correctly for both cookie (web) and Bearer token (mobile) auth. This is a standing discipline, not a one-time check.

---

## Reference: Phase Summary

| Phase | Goal | Solo Estimate | Gate |
|---|---|---|---|
| 0 | Web completion + stabilization | 4–8 weeks | Gate 1 |
| 1 | Business validation decision | 1–2 weeks | Gate 2 |
| 2 | Sprint 0 backend prerequisites | 6–8 weeks | Gate 3 |
| 3 | Mobile foundation | 2–3 weeks | — |
| 4 | Discovery + hostel detail | 3–4 weeks | — |
| 5 | Booking flow + payments | 4–5 weeks | Gate 4 |
| 6 | Notifications + price alerts | 2–3 weeks | — |
| 7 | Polish, QA, security | 3–4 weeks | — |
| 8 | Beta + app store launch | 4–6 weeks | Gate 5 |
| **Total** | | **~33–47 weeks** | |

33–47 weeks from now puts mobile MVP at **January–March 2027**, assuming Phase 0 starts immediately and the web app finishes on the fast end. This is the honest number.

---

*This document is the reference point for all development decisions. When a task or request conflicts with this plan, flag it and decide whether the plan needs updating or the request does — don't silently ignore the conflict.*
