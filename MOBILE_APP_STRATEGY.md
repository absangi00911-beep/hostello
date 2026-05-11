# HostelLo Mobile App Strategy

**Version:** 2.0 | **Date:** May 10, 2026 | **Status:** Approved for Development Planning  
**Author:** Product & Engineering Team  
**Replaces:** v1.0 (May 10, 2026)

---

## 1. Project Overview

HostelLo's web platform lets students in Pakistan find, compare, and book verified hostels near their university without relying on WhatsApp groups or phone calls. The web app is nearly complete and handles search, booking, payments via Safepay, in-app messaging, reviews, and owner management.

This document covers the strategy for building native iOS and Android apps on top of that existing platform. The mobile apps are not a parallel product — they are a new client for the same backend. Every API route, database schema, and business rule defined in the web system design document applies here. Where the mobile client requires backend changes, those are explicitly listed in Section 8 (Backend Prerequisites).

The strategic case for mobile is straightforward: 78% mobile internet penetration in Pakistan's urban areas, 65% of the 17–25 target demographic preferring apps over mobile web, and no mobile-native competitors in the Pakistan student hostel market. The web app works on mobile browsers, but native apps provide push notifications, camera integration, and a booking experience that doesn't require opening a browser.

**This is a user acquisition and retention investment, not a direct revenue play.** The financial model in Section 13 reflects that honestly.

**Estimated timeline:** 9–12 months from kickoff to General Availability  
**Estimated budget:** $310K–$370K (Year 1, all-in)  
**Target launch:** Q4 2026 (MVP), Q2 2027 (GA)

---

## 2. Scope and Boundaries

**In scope:**
- Native iOS and Android apps built with React Native (Expo)
- Hostel search and discovery with existing Typesense integration
- Hostel detail pages (photos, amenities, reviews, map)
- Booking flow with Safepay payment integration via deep links
- User account management (signup, login, profile, booking history)
- Saved favorites with local persistence
- Price alerts (creation and management)
- In-app notification list (polling-based, same data as web)
- Push notifications for booking events and price drops (requires new backend work)
- Owner booking management — Phase 2
- In-app messaging — Phase 2 (polling-based, push nudge on new message)
- Review submission — Phase 2

**Out of scope (deliberate):**
- A separate backend; the mobile app calls the same Next.js API routes as the web
- International expansion — this is a business model and payment infrastructure decision, not a mobile concern
- WebSocket or SSE real-time messaging — Vercel Edge doesn't support persistent connections; the path forward is push notifications as nudges, not true real-time
- Stripe payments — Stripe does not support Pakistani businesses as payees; not a viable option
- Anonymous reviews — the review model is gated on a completed verified booking; anonymous submission breaks the trust model
- Roommate matching — substantial product and privacy scope; requires its own planning document
- Offline search — requires syncing a local Typesense or SQLite index from the server; deferred to Phase 3
- Virtual tours / 360 photos — deferred to Phase 3+

**Assumptions:**
- The web backend remains the single source of truth; no mobile-specific data stores are introduced at the backend level
- All payments are PKR; no multi-currency support
- JazzCash and EasyPaisa remain disabled for mobile MVP; infrastructure exists on the backend but the mobile payment callback flow for these gateways needs separate design
- The go/no-go criteria in Section 3 are confirmed before development begins

---

## 3. Go/No-Go Decision

This section exists to close the loop. The v1.0 strategy defined green-light criteria but didn't answer whether they were met. That needs to be explicit.

**Green light criteria (all must be true):**

| Criterion | Required | Status |
|---|---|---|
| Sustainable web booking volume | 200+ bookings/month | ☐ Confirm |
| Budget allocated | $310K–$370K for 12 months | ☐ Confirm |
| Mobile engineering available | 2–3 React Native engineers | ☐ Confirm |
| Backend engineer allocation | 20% for 3 months (prerequisites) | ☐ Confirm |
| Executive commitment | 18+ month horizon | ☐ Confirm |
| Backend prerequisites scoped | Section 8 items estimated | ☐ Confirm |

**Decision:** ☐ Proceed | ☐ Delay until [date] | ☐ Do not proceed

*This table must be completed and signed off before sprint 1 begins. Development starting without confirmed budget and booking volume is the most common reason mobile projects stall after 3 months.*

---

## 4. Stakeholders and Roles

**Student (STUDENT role)**  
Primary mobile user. Searches for hostels, saves favorites, books rooms, tracks reservations, submits reviews after checkout, and sets price alerts. Ages 17–25. Likely has a budget Android device on university WiFi or mobile data.

**Hostel Owner (OWNER role)**  
Secondary mobile user. Receives booking notifications, manages reservation requests, responds to messages, and updates listing details from their phone. Phase 2 priority. Typically ages 25–50; device quality varies.

**Admin (ADMIN role)**  
Not a primary mobile use case. Admin moderation (listing approval, review deletion, search re-indexing) stays on the web dashboard. The mobile app may show admin-role users a basic management view, but no dedicated admin mobile UI is planned.

**Unauthenticated visitors**  
Can browse hostels and read reviews without an account. Cannot book, message, or save. Same as web.

---

## 5. Functional Requirements

### Must-have (MVP, Q4 2026)

**Discovery**
- Hostel search with Typesense integration; filters by city, price range, gender preference, amenities, rating
- Hostel detail page: photos (gallery), amenities checklist, rules, room types, reviews, map
- Map view with clustering for dense urban areas
- Saved favorites, persisted locally via Redux Persist and synced to the backend

**Booking**
- Booking flow: choose room, select dates, review total, pay
- Safepay payment via deep link redirect (see Section 11 for the flow)
- Booking confirmation screen and receipt
- Booking history and status tracking
- Cancel booking

**Account**
- Email/password signup and login
- Phone number OTP verification (existing backend, no changes needed)
- Password reset via email link
- Profile management (name, phone, bio, city, avatar)
- Account deletion (GDPR Article 17, existing backend endpoint)
- Push notification opt-in/opt-out at the OS level

**Notifications**
- In-app notification list, polling-based (same `Notification` table as web)
- Push notifications for: booking confirmed, booking cancelled, price drop, new message (requires backend work — see Section 8)

**Price Alerts**
- Create, view, toggle, and delete price alerts (existing backend endpoints, no changes needed)

### Should-have (Phase 2, Q1–Q2 2027)

- In-app messaging between students and hostel owners (polling, push nudge on new message)
- Review submission after completed stay
- Owner dashboard: view bookings, confirm/decline, respond to messages and reviews
- Apple Pay / Google Pay — contingent on Safepay SDK mobile support (must be confirmed with Safepay before committing to a timeline)
- Rich push notifications with hostel preview images
- Availability calendar per hostel

### Nice-to-have (Phase 3, Q3 2027+)

- Offline map caching (Google Maps SDK)
- Offline search (requires local SQLite index; significant data pipeline work)
- Video review upload
- Social sharing (WhatsApp, Instagram)
- Hostel comparison (up to 3 side-by-side)
- Voice search

### Features explicitly removed from roadmap

- Roommate matching — too large; needs its own scoping
- Anonymous reviews — conflicts with verified-booking trust model
- International expansion — business decision, not a mobile feature
- Stripe payments — not available to Pakistani businesses

### Edge cases

- **Network loss mid-booking:** Booking form state is held in Redux. If payment redirect fails to return via deep link, the backend's abandoned-payments cron (every 5 minutes) cancels PENDING bookings after 30 minutes and restores room availability. The user sees a "payment incomplete" state on next app open.
- **Duplicate push notification tap:** Deep links from notifications use booking/hostel IDs in the URL. The navigation handler is idempotent — tapping the same notification twice navigates to the same screen.
- **Device token stale after reinstall:** FCM returns `UNREGISTERED` for stale tokens. The backend cleans these up on the next notification send (see Section 9).
- **Multiple devices:** A user logging in on a new device registers a new device token. Both tokens receive notifications. On logout, only the current device's token is deregistered.
- **Camera permission denied:** Image upload falls back to gallery picker. If both are denied, the upload button is disabled with an explanatory message.

---

## 6. Non-Functional Requirements

**Availability:** Inherits the web backend's 99.5% uptime target. The mobile app has no separate infrastructure that could fail independently, except FCM (Google's target is 99.9%).

**Performance targets:**

| Metric | Target | Notes |
|---|---|---|
| App cold start to interactive | < 2.5s on mid-range Android | Tested on Moto G-class devices |
| Search results | < 300ms p95 | Same as web; Typesense response time |
| Booking flow completion | < 4 minutes for first-time users | Including Safepay redirect and return |
| Image load (hostel gallery) | < 1s on 4G | R2 + Cloudflare CDN, react-native-fast-image caching |
| Push notification delivery | < 30s p95 | FCM SLA |
| Frame rate | 60 FPS on 80%+ of sessions | — |

**Bundle size:** < 25MB initial download. Expo's hermes engine and code splitting help; monitor with `expo-bundle-analyzer`.

**Data usage:** < 10MB per typical session (search + 2 hostel views + booking).

**Offline behaviour:** The app degrades gracefully when offline. Previously loaded hostel details and favorites are readable from Redux Persist cache. Search, booking, and payment require connectivity. The app shows a clear offline indicator rather than silent failures.

**Crash rate:** < 1% of sessions. Monitored via Sentry.

**Accessibility:** Follows React Native accessibility APIs. All interactive elements have accessible labels. Minimum touch target size 44×44pt. Text scales with OS font size settings.

**Device support:** iOS 15+, Android 10+ (API level 29+). Covers 95%+ of the target demographic's devices. Budget Android devices (Moto G, Samsung A-series) are the primary test targets.

---

## 7. Technical Architecture

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React Native (Expo managed workflow) | Single codebase for iOS and Android; Expo managed workflow avoids native build config for MVP; OTA updates for bug fixes without app store review |
| Language | TypeScript | Consistent with the web codebase; shared types compile-time safety |
| State | Redux Toolkit + RTK Query | RTK Query handles server state (caching, background refetch, optimistic updates); Redux Persist handles offline persistence; note: the web uses React Query + Zustand — these are not the same libraries, and code is not shared at the state layer |
| Auth storage | expo-secure-store | Encrypted keychain/keystore storage for JWT; never AsyncStorage (unencrypted) |
| Push notifications | Firebase Cloud Messaging (FCM) | Single SDK for iOS (via APNs bridge) and Android; geo-targeting; reliable delivery |
| Payments | Safepay (primary) | Existing web integration; deep link flow for mobile — see Section 11 |
| Search | Existing `/api/hostels` endpoint (Typesense-backed) | No separate mobile search client; the backend handles Typesense + fallback |
| Maps | React Native Maps + Google Maps SDK | Familiar UX; clustering support |
| Images | react-native-fast-image | Persistent disk cache; correct handling of immutable R2 URLs |
| Forms | React Hook Form + Zod | Same Zod schemas as web (genuinely shared) |
| Navigation | React Navigation v7 | Standard for Expo; deep link handling built in |
| Error tracking | Sentry | React Native SDK; crash reporting + performance traces |
| Analytics | Mixpanel | Session tracking; funnel analysis for booking conversion |
| CI/CD | EAS Build (Expo) | Managed build infrastructure; no local macOS needed for iOS builds |

**Alternatives evaluated:**
- Flutter: Better raw performance, but breaks TypeScript code sharing with the web entirely
- Native (Swift/Kotlin): Best performance and OS integration, but requires two separate codebases, longer timeline (~18 months to MVP), and significantly higher budget
- WebView wrapper: Rejected — poor app store ratings, no push notification access, no camera integration

### Architecture diagram

```
┌──────────────────────────────────────────────────────────────┐
│   Mobile App (iOS + Android)                                 │
│   React Native + Expo + TypeScript                           │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Redux Store (Redux Persist → expo-secure-store)      │   │
│   │ ├── auth: { jwt, user }                              │   │
│   │ ├── hostels: { cached list, detail cache }           │   │
│   │ ├── bookings: { user reservations }                  │   │
│   │ ├── ui: { filters, search state, favorites }         │   │
│   │ └── offlineQueue: { unsent messages, form drafts }   │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Screens & Navigation (React Navigation)              │   │
│   │ ├── Auth stack (Login, Signup, Reset)                │   │
│   │ ├── Main tabs (Search, Bookings, Messages, Profile)  │   │
│   │ └── Modal stack (Hostel Detail, Booking Flow)        │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   FCM SDK (push) │ expo-secure-store (JWT) │ Deep Links     │
└──────────────────────────────────────────────────────────────┘
              │ HTTPS + Authorization: Bearer <jwt>
              ▼
┌──────────────────────────────────────────────────────────────┐
│   Existing Next.js Backend (no separate mobile backend)      │
│   ├── Auth middleware updated for Bearer token support       │
│   ├── CSRF exempted for Bearer-authenticated requests        │
│   ├── New: POST /api/notifications/device-token              │
│   └── New: FCM dispatch in createNotification()             │
└──────────────────────────────────────────────────────────────┘
         │        │          │         │
         ▼        ▼          ▼         ▼
      [Neon]  [Upstash]  [R2/CDN]  [Typesense]
```

---

## 8. Backend Prerequisites

This section lists backend work that must be completed before the mobile app can function. It is not optional and should be scoped and scheduled before mobile sprint 1.

### 8.1 Bearer Token Authentication (Blocker)

**Problem:** The web uses HTTP-only session cookies for JWTs. Mobile HTTP clients do not persist cookies across app restarts, and HTTP-only cookies are inaccessible to JavaScript by design. Every protected API route currently returns 401 for mobile requests.

**Required change:** Update `src/middleware.ts` to check for an `Authorization: Bearer <token>` header in addition to the existing session cookie. If a valid Bearer token is present and its `tokenVersion` matches, treat the request as authenticated. The token validation logic (Redis cache → database fallback) is identical to the cookie path.

**Token lifecycle on mobile:**
- On login, the API returns the JWT as a JSON field (e.g., `{ data: { token } }`) in addition to setting the cookie (web clients use the cookie; mobile clients store the token in `expo-secure-store`)
- The JWT has a 30-day expiry. Mobile clients must check expiry before each request and re-authenticate when expired. A silent re-login using stored credentials (if the user chose "stay logged in") is the recommended pattern
- On logout, the mobile client deletes the stored token and calls `DELETE /api/auth/logout` to invalidate the Redis token version cache

**Estimated effort:** 2–3 days backend.

---

### 8.2 CSRF Exemption for Bearer-Authenticated Requests (Blocker)

**Problem:** The middleware validates the `Origin` header on all state-mutating requests (POST, PUT, PATCH, DELETE). Mobile apps do not send an `Origin` header. In production, requests missing `Origin` are rejected.

**Required change:** Add a condition to the CSRF check: if the request includes a valid `Authorization: Bearer` header (i.e., it has already passed the auth check in 8.1), skip the `Origin` header validation. Bearer token auth already proves identity; CSRF is a browser-specific attack vector and does not apply to native mobile clients.

**Estimated effort:** 1 day backend.

---

### 8.3 Push Notification Infrastructure (Required for MVP notifications)

**Problem:** The `createNotification()` function in `src/lib/notifications.ts` writes to the `Notification` table but sends no push. There is no device token storage, no FCM integration, and no APNs configuration.

**Required changes:**

1. Add `DeviceToken` model to `prisma/schema.prisma`:
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

2. New endpoint: `POST /api/notifications/device-token` — registers or refreshes a device token for the authenticated user. Upserts on `token` to handle reinstalls.

3. New endpoint: `DELETE /api/notifications/device-token` — called on logout to deregister the current device token.

4. Firebase Admin SDK integration in `src/lib/notifications.ts` — after writing the `Notification` record, dispatch a FCM push to all active device tokens for the user. Handle `UNREGISTERED` responses by deleting stale tokens.

5. Add `FIREBASE_SERVICE_ACCOUNT_JSON` to environment variables.

**What gets a push:**
- Booking confirmed (to student)
- Booking cancelled (to student)
- Booking request received (to owner) — Phase 2
- New message received (to recipient) — Phase 2
- Price alert triggered (to student)

**Estimated effort:** 1 week backend (schema migration, endpoints, FCM integration, testing).

---

### 8.4 Safepay Deep Link Return (Blocker for payments)

**Problem:** The Safepay payment flow redirects the user to Safepay's web page, then redirects back to a URL when payment is complete. On web, that return URL is `https://hostello.app/booking/[id]/confirm`. On mobile, that URL needs to open the app, not a browser tab.

**Required changes:**

1. **Universal Links (iOS) and App Links (Android):** The `hostello.app` domain must serve an Apple App Site Association file (`/.well-known/apple-app-site-association`) and a Digital Asset Links file (`/.well-known/assetlinks.json`). These tell iOS and Android to open the app instead of the browser when the return URL is tapped.

2. **Deep link scheme fallback:** Register a custom URI scheme (e.g., `hostello://`) as a fallback for devices where Universal Links fail. Safepay's redirect URL configuration should include both.

3. **Backend return URL:** The `POST /api/payment/initiate` endpoint accepts a `returnUrl` parameter. For mobile clients, pass the deep link URL instead of the web URL. The mobile client should send a `X-Client: mobile` header (or similar) so the backend can construct the correct return URL.

4. **No changes to webhook flow:** `POST /api/payment/webhook` is a server-to-server call and is unaffected by client type.

**JazzCash and EasyPaisa:** These use browser form POST callbacks, not webhooks. The mobile deep link return pattern is more complex for these gateways. Keep them disabled for mobile MVP; revisit in Phase 2 after confirming the callback mechanism works with deep links.

**Apple Pay / Google Pay:** Conditional on Safepay's mobile SDK supporting passthrough. Confirm with Safepay before committing to Phase 2 timeline. Do not schedule engineering time until confirmed.

**Estimated effort:** 3–4 days (backend return URL logic + iOS/Android app configuration).

---

### 8.5 Rate Limiting by User ID for Authenticated Routes

**Problem:** The web rate limits by IP address. University students on campus WiFi or dorm networks share IP addresses. A single campus network could trigger rate limits for dozens of unrelated users simultaneously.

**Required change:** For authenticated API routes, key the rate limiter on `user:{id}` rather than IP. Upstash's rate limiter already supports custom keys — this is a small change. Unauthenticated routes (search, hostel detail) continue to rate limit by IP.

**Estimated effort:** 1 day backend.

---

### Summary of backend work

| Item | Effort | Blocks |
|---|---|---|
| Bearer token auth in middleware | 2–3 days | All authenticated mobile endpoints |
| CSRF exemption for Bearer requests | 1 day | All write operations |
| DeviceToken schema + endpoints | 2–3 days | Push notifications |
| FCM Admin SDK integration | 3–5 days | Push notifications |
| Deep link configuration (Safepay) | 3–4 days | Payments |
| Rate limiting by user ID | 1 day | Rate limiting correctness |
| **Total** | **~3–4 weeks** | — |

This work requires a backend engineer at roughly 50–75% allocation for the first month of the project. It should be scheduled as sprint 0, before the mobile team writes their first screen.

---

## 9. Shared Code Strategy

**Realistic reuse: ~25%.** The following can be shared directly between the web codebase and the mobile app:

```
/packages/shared/
├── types/
│   └── index.ts          # User, Hostel, Booking, Room, Review, Notification, etc.
│                          # Ported from src/types/index.ts — no changes needed
├── validations/
│   └── index.ts          # All Zod schemas (forms and API contracts)
│                          # Ported from src/lib/validations.ts — works in React Native
├── constants/
│   ├── amenities.ts      # Amenity definitions and labels
│   ├── universities.ts   # Pakistan university list
│   └── config.ts         # App-wide constants (pagination sizes, timeouts, etc.)
├── api/
│   └── client.ts         # Fetch wrapper — needs Bearer token support added (Section 8.1)
│                          # fetch is available in React Native; no changes beyond auth
└── utils/
    ├── currency.ts       # PKR formatting (integers, no floats)
    ├── dates.ts          # Date formatting, stay duration calculation
    └── strings.ts        # sanitizeString, escapeHtml (already unit tested)
```

**What is not shared:**

| Category | Web | Mobile | Why not shared |
|---|---|---|---|
| State management | React Query 5 + Zustand 5 | Redux Toolkit + RTK Query | Different libraries entirely |
| Auth client | NextAuth.js hooks | Custom JWT + expo-secure-store | NextAuth is web-only |
| UI components | TailwindCSS + React DOM | React Native StyleSheet | Different rendering targets |
| Routing | Next.js App Router | React Navigation | Platform-specific |
| Email templates | HTML in `src/lib/email-templates/` | Not applicable | Server-side only |

The 25% reuse is still valuable — it means the mobile app validates data identically to the web, calls the same API shapes, and shares business logic utilities. But the team should plan mobile-specific implementations for state, auth, UI, and navigation from scratch.

---

## 10. Data Design

No new entities are required for MVP beyond the `DeviceToken` model described in Section 8.3. The existing schema supports all MVP features.

**Existing schema fields used by mobile (no changes):**
- `User` — profile, role, phone, avatar, tokenVersion
- `Hostel` — all fields including rating (denormalized), reviewCount, images, amenities
- `Room` — availability, version (optimistic lock)
- `Booking` — full lifecycle (PENDING → CONFIRMED → COMPLETED → CANCELLED)
- `Review` — ratings breakdown, ownerReply
- `Conversation + Message` — existing messaging tables
- `Notification` — existing in-app notification table
- `PriceAlert` — existing price alert table
- `SavedHostel` — existing favorites table

**New schema addition (Phase 1 prerequisite):**
- `DeviceToken` — see Section 8.3 for full model definition

**Phase 2 additions (no schema defined yet, noted for planning):**
- No new entities anticipated for Phase 2; owner booking management and messaging use existing tables

---

## 11. Authentication and Authorization

**Login flow:**
1. User submits email + password
2. Mobile client calls `POST /api/auth/signin` with credentials
3. Backend validates, returns JWT in response body (in addition to setting cookie for web)
4. Mobile client stores JWT in `expo-secure-store` (encrypted, hardware-backed where available)
5. All subsequent requests include `Authorization: Bearer <token>` header

**Token expiry and refresh:**
- JWT expires after 30 days. The mobile client checks expiry before each request.
- If expired and "stay logged in" was selected, the client silently re-authenticates with stored credentials before the request.
- If re-authentication fails (wrong password, account deleted), the client clears stored credentials and redirects to the login screen.

**Session invalidation:**
- On password change, `User.tokenVersion` increments. The next API call with the old token returns 401. The mobile client catches 401 and redirects to login.
- On logout, the client calls `DELETE /api/auth/logout` (or the equivalent NextAuth signout endpoint), clears the stored JWT, and deregisters the FCM device token via `DELETE /api/notifications/device-token`.

**Role-based access:** Identical to web. The JWT contains `role`; the backend enforces permissions. The mobile UI conditionally renders owner vs. student views based on the same role field.

**Email verification gate:** Unverified users can log in and browse, but booking and messaging are gated on `emailVerified: true` — same as web. The mobile app shows a verification banner and links to resend the verification email.

---

## 12. Payment Integration

### Safepay flow on mobile

```
1. User submits booking form
   POST /api/bookings → booking created, status: PENDING
   ↓
2. User taps "Pay Now"
   POST /api/payment/initiate
   - Mobile client sends X-Client: mobile header
   - Backend returns Safepay checkout URL
   ↓
3. App opens Safepay checkout in in-app browser (expo-web-browser)
   (In-app browser preferred over system browser — keeps user in context)
   ↓
4. User completes payment on Safepay
   ↓
5. Safepay redirects to return URL (hostello://booking/{id}/confirm
   or https://hostello.app/booking/{id}/confirm via Universal Link)
   ↓
6. App receives deep link, closes in-app browser, navigates to
   Booking Confirmation screen, polls /api/bookings/{id} until
   status is CONFIRMED (webhook may arrive in 1–5 seconds)
   ↓
7. Safepay posts webhook to POST /api/payment/webhook (server-to-server)
   - HMAC verified
   - Booking updated to PAID + CONFIRMED
   - Push notification sent to student (if FCM configured)
   ↓
8. Booking Confirmation screen shows confirmed state
```

**Webhook is the source of truth.** The mobile app polls for confirmation as a UX affordance; the actual state change happens via webhook. If the webhook takes longer than expected, the booking list shows "Payment processing..." until the state resolves.

**Payment failure handling:** If Safepay returns a failed payment, the deep link includes an error parameter. The app navigates to a payment failure screen with options to retry or cancel. The backend's abandoned-payments cron cancels PENDING bookings with PENDING payment status after 30 minutes regardless.

### Apple Pay / Google Pay

Not in scope until Safepay confirms mobile SDK support for Apple Pay / Google Pay passthrough. Confirm before scheduling Phase 2 engineering time.

### JazzCash and EasyPaisa

Backend infrastructure exists (disabled). Mobile support requires designing the callback flow for non-webhook gateways. Deferred to Phase 2 with explicit design spike required.

---

## 13. Push Notifications

FCM handles both iOS (via APNs) and Android. The backend dispatches notifications; the mobile app receives and renders them.

**Notification types and payloads:**

| Event | Trigger | Recipient | Deep link |
|---|---|---|---|
| Booking confirmed | Owner confirms or payment webhook fires | Student | `hostello://bookings/{id}` |
| Booking cancelled | Owner or student cancels | Other party | `hostello://bookings/{id}` |
| Booking request received | Student submits booking | Owner | `hostello://owner/bookings/{id}` |
| New message | Message sent | Recipient | `hostello://messages/{conversationId}` |
| Price drop | Cron: price falls below target | Student | `hostello://hostels/{slug}` |

**Permission handling:** On first launch, the app requests notification permission at an appropriate moment — not immediately on install. The recommended pattern is to explain the value first ("Get notified when prices drop") then request permission. Users who deny can enable manually from Settings. The backend registers/deregisters device tokens accordingly.

**Stale token cleanup:** FCM returns `UNREGISTERED` when a token is invalid (device reset, app uninstalled). The backend `createNotification()` function removes stale tokens on receiving this error. No cron needed — cleanup happens lazily on the next notification send.

**Silent hours:** The mobile app respects OS Do Not Disturb settings automatically (FCM doesn't override system settings). No app-level silent hours configuration is needed for MVP.

---

## 14. Offline Strategy

**What works offline (MVP):**
- Browsing hostel detail pages previously loaded in the current session (Redux in-memory cache)
- Viewing saved favorites (Redux Persist, written to disk)
- Reading previously loaded booking history
- Reading previously loaded notification list

**What requires connectivity:**
- Search (calls `/api/hostels` → Typesense)
- Booking creation and payment
- Sending messages
- Submitting reviews

**Offline indicator:** The app detects connectivity via `@react-native-community/netinfo` and shows a banner when offline. API calls fail gracefully with user-facing messages ("You're offline — showing saved results") rather than error screens.

**Offline booking drafts:** Redux Persist saves in-progress booking form state. If the app is backgrounded during booking, state is restored. This is not "offline booking" — it is session recovery for interrupted flows. A network connection is required to submit.

**Phase 3 offline search:** Requires downloading a subset of the Typesense index to SQLite, with a sync mechanism to keep it fresh. This is a significant data pipeline addition; not in scope until Phase 3.

---

## 15. Security

**Token storage:** JWT stored in `expo-secure-store`, not AsyncStorage. On iOS, backed by the Keychain; on Android, backed by the Keystore system. Neither is accessible to other apps.

**Certificate pinning:** Not implemented for MVP. Add for Phase 2 if the threat model warrants it (adds complexity around certificate rotation).

**Deep link validation:** Incoming deep links (from push notifications or payment returns) must be validated before trusting their parameters. The navigation handler validates link format and confirms the booking ID belongs to the authenticated user before navigating.

**Image URL validation:** Same as web — image URLs submitted in any payload must match the R2 public URL prefix. The backend enforces this; the mobile client does not need separate validation.

**API security:** Inherits all web security measures — Zod input validation, rate limiting, Upstash Redis, parameterized Prisma queries. The mobile client does not bypass any of these.

**Jailbroken/rooted devices:** No special handling for MVP. `expo-secure-store` on jailbroken devices may be less secure, but this is an accepted risk for the target market.

**No sensitive data in logs:** Sentry is configured to scrub `Authorization` headers and any fields named `password`, `token`, or `card`. Review Sentry's default scrubbing rules before enabling in production.

---

## 16. Feature Roadmap

### MVP (Q4 2026) — "Find and Book"

Target: functional app on both stores, covering the core student booking journey.

**Scope:**
- Hostel search and discovery
- Hostel detail pages (photos, reviews, amenities, map)
- Saved favorites
- Booking flow with Safepay
- User account (signup, login, profile, booking history, cancel)
- In-app notification list
- Push notifications for booking events and price drops
- Price alert management

**Explicit MVP exclusions:** messaging, review submission, owner dashboard, Apple Pay / Google Pay, offline search, video reviews.

**Exit criteria for MVP launch:**
- Crash rate < 1% on both platforms across 500+ beta users
- Full booking flow tested end-to-end on iOS 15+ and Android 10+
- Safepay deep link return working on both platforms
- Push notifications delivering on both platforms
- 4.0+ average rating on TestFlight / Google Play Beta

---

### Phase 2 (Q1–Q2 2027) — "Engage and Retain"

- In-app messaging (polling; push nudge on new message)
- Review submission after completed stay
- Owner dashboard (view bookings, confirm/decline, respond to messages)
- Rich push notifications with hostel images
- Apple Pay / Google Pay (if Safepay confirms SDK support)
- Availability calendar

---

### Phase 3 (Q3–Q4 2027) — "Advanced"

- Offline map caching
- Offline search (significant data pipeline work; requires separate scoping)
- Video review upload and trimming
- Social sharing (WhatsApp, Instagram)
- Hostel comparison (up to 3)
- Voice search

---

## 17. User Journey — Student Booking (Primary)

```
1. DISCOVERY
   - Open app (cold start)
   - Search for city; see results from Typesense within 300ms
   - Filter by price, amenities, gender preference
   - Tap hostel to view detail page

2. EVALUATION
   - Scroll photos in gallery
   - Read reviews (sorted by recency)
   - Check amenities, rules, room types
   - View location on map
   - Check availability calendar

3. DECISION
   - Save to favorites OR proceed to booking
   - (Phase 2) Message owner with a question

4. BOOKING
   - Select room type and number of months
   - Confirm dates and see price breakdown
   - Tap "Pay with Safepay"
   - Complete payment in in-app browser
   - Return to app via deep link

5. CONFIRMATION
   - Booking Confirmation screen shows confirmed state
   - Push notification confirms booking
   - Booking appears in "My Bookings"

6. POST-STAY
   - Daily cron marks booking COMPLETED after checkout date
   - (Phase 2) App prompts for review
   - (Phase 2) Student submits review
```

---

## 18. Development Roadmap and Timeline

### Sprint 0 (Weeks 1–4): Backend Prerequisites + Project Setup

**Backend team (50–75% allocation):**
- Bearer token auth in middleware
- CSRF exemption for Bearer requests
- DeviceToken schema + FCM integration
- Rate limiting by user ID
- Safepay deep link return URL support

**Mobile team:**
- Expo project scaffold with TypeScript, ESLint, Prettier
- Shared package setup (types, validations, constants, API client)
- Redux store with auth slice and Redux Persist
- React Navigation structure (auth stack, main tabs, modal stack)
- CI/CD with EAS Build

---

### Sprint 1–3 (Weeks 5–12): MVP Core

**Auth & Account:**
- Login, signup, email verification, forgot password screens
- JWT storage in expo-secure-store
- Profile screen and edit

**Discovery:**
- Search screen with Typesense-backed API
- Filter sheet (price, city, amenities, gender)
- Hostel detail screen (photos, reviews, amenities, map)
- Map view with clustering
- Favorites (local + backend sync)

**Booking:**
- Booking flow (3 screens: room selection, dates + guests, payment)
- Safepay integration with deep link return
- Booking confirmation screen
- Booking history and status
- Cancel booking

---

### Sprint 4 (Weeks 13–16): Notifications, Polish, QA

- FCM device token registration
- Push notification handling (foreground + background + killed state)
- In-app notification list
- Price alert management screens
- Performance profiling on Moto G-class Android device
- Accessibility audit
- Security review (token handling, deep link validation, Sentry scrubbing)

---

### Sprint 5 (Weeks 17–20): Beta, Submission, Launch

- TestFlight beta (500+ users)
- Google Play Closed Beta
- Fix critical bugs from beta feedback
- App store asset preparation (screenshots, preview video, descriptions)
- Apple App Store submission
- Google Play submission
- Coordinate web banner and email campaign for launch

---

### Phase 2 Build (Months 6–9)

- In-app messaging with push nudge
- Review submission
- Owner dashboard
- Rich push notifications
- Apple Pay / Google Pay (if Safepay confirms)

---

## 19. Team and Resources

### Core team

| Role | Allocation | Notes |
|---|---|---|
| Mobile Lead (React Native) | 1 FTE | Architecture, code review, App Store coordination |
| Senior Mobile Engineer | 1 FTE | Payments, native bridging, iOS-specific |
| Mobile Engineer | 1 FTE | Android-specific, testing, performance |
| Backend Engineer | 50% for months 1–3, 20% ongoing | Sprint 0 prerequisites; ongoing mobile endpoint support |
| QA Engineer | 1 FTE | Device lab testing, regression, accessibility |
| Product Manager | 20% | Existing team member |
| Designer | 15% | Mobile-specific screens; existing team member |

### Contractors (one-time)

| Role | Duration | Cost estimate |
|---|---|---|
| React Native / Expo architecture review | 2–3 weeks | $10K–$15K |
| App Store Optimization (ASO) | 2 weeks | $5K |
| Security audit (token handling, deep links) | 2–3 weeks | $8K–$12K |

### Required skills

- React Native + Expo (managed workflow) with TypeScript
- Redux Toolkit + RTK Query
- Mobile payment SDK integration (redirect flows, deep links)
- FCM push notification integration (iOS APNs + Android)
- Expo EAS Build and submit pipeline
- React Navigation including deep link configuration

---

## 20. Go-to-Market Strategy

### Launch sequence

**4 weeks before launch:**
- TestFlight (iOS) and Google Play Closed Beta open to 500 users
- Fix critical bugs; target crash rate < 1% before public launch
- Submit to App Store and Google Play (allow 1–2 week review buffer)

**Launch week:**
- Simultaneous iOS and Android release
- Email to existing web users (segment by mobile device usage in web analytics if available)
- In-web banner ("HostelLo is now on mobile")
- Social posts (Instagram, TikTok)

**Post-launch (weeks 2–8):**
- Monitor crash rate, booking conversion, push opt-in rate daily
- Respond to App Store reviews within 24 hours
- Weekly builds with bug fixes and UX improvements

### User acquisition

**Organic (primary):**
- App Store Optimization: keywords around "hostel booking Pakistan," "student accommodation Lahore," "rooms near university"
- Web-to-app conversion: existing web users are the most qualified cohort; prioritize converting them first
- Word of mouth: students refer friends; the referral mechanic doesn't need to be in-app — a simple share link pointing to the App Store listing is sufficient for MVP

**Paid (secondary, post-MVP):**
- Meta ads targeting students aged 17–25 in Pakistan's university cities
- Google App Campaigns

**Paid acquisition should not begin until the organic funnel is validated.** Spend on paid ads before the app store rating is above 4.0 is wasteful — the conversion rate from store page visits is driven by rating and screenshots, not ad spend.

---

## 21. Success Metrics and KPIs

Metrics are split by phase. Targets are based on comparable booking app benchmarks, not aspirational round numbers.

### MVP (first 90 days post-launch)

| Metric | Target | Notes |
|---|---|---|
| Installs | 8,000–12,000 | Driven primarily by web-to-app conversion |
| Crash-free sessions | > 99% | Sentry |
| Push opt-in rate | > 60% | Median for utility apps; travel apps typically 55–65% |
| D1 retention | 30–40% | Users who return the day after install |
| D7 retention | 15–20% | Typical for booking/marketplace apps |
| D30 retention | 7–12% | Booking apps are inherently low-frequency |
| Booking conversion | 10–15% of search sessions | Comparable to web |
| App store rating | ≥ 4.0 | Both stores |

**Note on DAU targets:** The v1.0 strategy targeted 25% DAU. That is a social media metric, not a booking app metric. Students don't search for hostels daily — they search when moving, between semesters, or helping friends. 5–8% DAU is realistic for an active monthly cohort. Optimizing for DAU is the wrong lever; optimize for D7 and D30 retention and booking conversion instead.

### Phase 2 (months 4–9)

| Metric | Target |
|---|---|
| Monthly bookings (mobile) | 500–1,000/month by month 9 |
| Mobile share of total bookings | 20–30% |
| In-app messaging adoption | 40%+ of active users |
| Review submission rate (post-stay) | 30%+ of completed bookings |
| Push notification open rate | 15–25% |

### Quality floor (ongoing)

| Metric | Threshold | Action if breached |
|---|---|---|
| Crash rate | > 1% of sessions | Hotfix release within 48h |
| App Store rating | < 3.8 | Pause paid acquisition; triage reviews |
| ANR rate (Android) | > 0.5% | Profile and fix before next release |
| Booking payment failure rate | > 5% | Escalate to Safepay; review deep link flow |

---

## 22. Financial Model

### Development costs (Year 1)

| Item | Cost |
|---|---|
| Mobile Lead (12 months) | $96K–$108K |
| Senior Mobile Engineer (12 months) | $84K–$96K |
| Mobile Engineer (12 months) | $72K–$84K |
| QA Engineer (12 months) | $48K–$60K |
| Backend Engineer (partial, 12 months) | ~$24K (20% of annual cost) |
| Architecture consultant | $10K–$15K |
| ASO consultant | $5K |
| Security audit | $8K–$12K |
| Infrastructure (Firebase, Sentry, EAS Build, device lab) | $12K |
| App store fees + signing certificates | $2K |
| Marketing (launch campaign, ASO assets) | $20K–$30K |
| Contingency (10%) | $38K–$42K |
| **Total** | **$419K–$466K** |

*The budget range in the executive summary ($310K–$370K) reflects a reduced team configuration: no dedicated QA engineer and a shorter backend engineering allocation. This is viable but increases risk of post-launch quality issues. The team should decide which configuration to fund before committing.*

### Revenue model

Mobile generates revenue the same way the web does — commission on bookings. The mobile app does not introduce new pricing or a new revenue stream at this stage.

**Bookings attribution is indirect.** A student who downloads the app from the web, browses on mobile, then books may be attributed to mobile or web depending on where the final booking action happens. Set up Mixpanel attribution before launch so the data is clean.

**Year 1 revenue contribution (mobile-attributed bookings):**

| Period | Mobile Bookings/Month | Commission per Booking (PKR) | Mobile Revenue/Month (PKR) |
|---|---|---|---|
| Month 1–3 (launch) | 50–100 | ~525 | 26K–53K |
| Month 4–6 | 150–300 | ~525 | 79K–158K |
| Month 7–12 | 400–700 | ~525 | 210K–368K |
| **Year 1 Total** | — | — | **~1.2M–2.5M PKR (~$4K–$9K USD)** |

**The direct ROI on a $420K+ investment is not the case for building this app.** The actual case is:

1. Mobile acquisition reduces customer acquisition cost — app store organic traffic is cheaper than paid web traffic
2. Push notifications improve booking conversion from users who searched but didn't book (re-engagement)
3. A native app raises the perceived quality of the platform, which affects owner trust and listing quality
4. Being first to market in mobile in this category creates a defensible position

These are real benefits. They are difficult to model precisely. The team should be honest in executive conversations: this is an infrastructure investment with an 18–24 month payback horizon through platform growth, not through direct mobile revenue alone.

---

## 23. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Safepay deep link return fails on certain devices | Medium | High | Test on 10+ devices before launch; implement polling fallback on confirmation screen |
| Apple App Store rejection | Low | High | Follow App Store Review Guidelines strictly; submit for review 2 weeks before target launch date |
| Push opt-in rate below 50% | Medium | Medium | Improve opt-in prompt copy; show value before requesting permission |
| Fragmented Android device ecosystem | High | Medium | Test on Moto G Play (budget), Samsung A32 (mid-range), Samsung S23 (premium) at minimum |
| Low D7 retention | Medium | High | Focus on booking confirmation and price drop push notifications to bring users back |
| Backend sprint 0 overruns | Medium | High | Scope sprint 0 items conservatively; don't start mobile UI work until Bearer auth and CSRF are confirmed working |
| Apple Pay / Google Pay not supported by Safepay SDK | Medium | Medium | Do not commit to Phase 2 timeline for this feature until confirmed; it is gated on Safepay's response |
| FCM delivery failures in Pakistan (connectivity) | Low | Medium | FCM handles retry; push is a nudge, not the only path to information |

---

## 24. Testing Strategy

**Unit tests:** Shared package utilities (date formatting, currency formatting, sanitizeString) — same Jest suite as web. Mobile-specific business logic (token expiry check, deep link parser) unit tested separately.

**Component tests:** React Native Testing Library for key screens (search, booking flow, confirmation). Focus on interaction paths, not visual rendering.

**Integration tests:** End-to-end booking flow tested against the staging backend. Detox (for Expo) or a manual scripted flow on physical devices. Target: full booking flow (search → hostel detail → booking → payment → confirmation) on iOS and Android before each release.

**Device testing matrix (minimum for MVP):**

| Device | Category | OS |
|---|---|---|
| Moto G Play | Budget Android | Android 11 |
| Samsung Galaxy A32 | Mid-range Android | Android 12 |
| Samsung Galaxy S23 | Premium Android | Android 13 |
| iPhone SE (2nd gen) | Budget iOS | iOS 15 |
| iPhone 13 | Mid-range iOS | iOS 16 |
| iPhone 15 | Current iOS | iOS 17 |

**Performance profiling:** Use React Native's Flipper integration and Sentry performance traces to identify slow renders and network calls. Profile on the Moto G before each release — if it's fast there, it's fast everywhere.

**Security testing:** Review token storage, deep link input validation, and Sentry scrubbing configuration before launch. No full penetration test for MVP; schedule for Phase 2.

---

## 25. Open Issues, Risks, and Decisions Pending

**Unresolved (must be closed before development starts):**

1. **Go/no-go criteria (Section 3).** The checklist must be completed and signed off. Development should not start without confirmed booking volume and budget.

2. **Safepay Apple Pay / Google Pay support.** Contact Safepay before Phase 2 planning. If supported, add to Phase 2 scope. If not, remove from the roadmap until an alternative is identified.

3. **Backend engineer allocation.** Sprint 0 requires a backend engineer at 50–75% for 4 weeks. This needs to be explicitly allocated, not assumed.

4. **Expo managed vs. bare workflow.** The managed workflow covers MVP requirements. If Phase 2 features require native modules that Expo doesn't support, migration to bare workflow mid-project is disruptive. Evaluate this during sprint 0 and decide early.

**Trade-offs made:**

- **Redux over React Query for mobile.** React Query is used on the web. Redux Toolkit + RTK Query is the choice for mobile because Redux Persist's offline patterns are better documented and the offline queue use case is cleaner. This means no shared state management code between web and mobile, which was already the case.

- **Polling for messaging in Phase 2.** True real-time messaging (WebSockets, SSE) is not available on Vercel Edge. Push notification as nudge + polling on open is the practical path forward. Users see "1 minute ago" on messages, not live typing indicators. This is acceptable for the use case.

- **No video reviews in MVP.** Video upload introduces content moderation concerns (storage cost, inappropriate content) that aren't solved yet. Text + photo reviews are sufficient for Phase 2; video is Phase 3.

---

## 26. Glossary

**APNs:** Apple Push Notification service. FCM routes iOS push notifications through APNs.

**Deep link:** A URL that opens a specific screen within the app rather than a web page. Two types: Universal Links (HTTPS URLs that open the app on iOS) and App Links (HTTPS URLs that open the app on Android). Custom URI schemes (e.g., `hostello://`) are a fallback.

**Device token:** A unique identifier assigned by FCM to a specific app installation on a specific device. Used to address push notifications to that device. Changes on app reinstall.

**EAS Build:** Expo Application Services Build. Managed cloud build infrastructure for Expo apps. Produces signed `.ipa` and `.aab` files without requiring a local macOS machine for iOS builds.

**Expo managed workflow:** Expo's configuration where native iOS and Android project files are managed by Expo and not committed to the repo. Lower overhead; limited to modules Expo supports. The alternative is "bare workflow" (full native project files checked in).

**FCM:** Firebase Cloud Messaging. Google's cross-platform push notification service. Handles delivery to both Android (directly) and iOS (via APNs bridge).

**Redux Persist:** A library that serializes Redux store slices to persistent storage (AsyncStorage or expo-secure-store) so state survives app restarts.

**RTK Query:** Redux Toolkit's built-in data fetching and caching solution. Analogous to React Query but integrated with the Redux store.

**Universal Link (iOS) / App Link (Android):** An HTTPS URL associated with both a website and an app. When tapped on a device with the app installed, the OS opens the app instead of the browser. Requires serving a well-known file from the domain.

All other terms (HMAC, optimistic locking, QStash, PKR, tokenVersion, etc.) are defined in the web system design document's glossary (SYSTEM.md Section 26).

---

## 27. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | May 10, 2026 | Product Team | Initial strategy |
| 2.0 | May 10, 2026 | Product & Engineering | Full revision: fixed budget discrepancy, corrected ROI framing, added backend prerequisites section, corrected auth/CSRF/payment architecture, revised engagement metrics to booking-app benchmarks, removed Stripe, anonymous reviews, international expansion as mobile objectives, corrected code reuse estimate from 70% to ~25% |

---

**Approval Sign-Off**

| Role | Name | Date |
|---|---|---|
| CEO / Founder | | |
| CTO | | |
| Product Lead | | |
| Finance Lead | | |