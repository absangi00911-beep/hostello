# HostelLo Mobile ↔ Web Alignment Analysis

**Prepared:** May 10, 2026  
**Based on:** ARCHITECTURE.md, SYSTEM.md, MOBILE_APP_STRATEGY.md  
**Scope:** Gap analysis, conflict flags, and concrete recommendations before mobile development begins

---

## TL;DR

The mobile strategy is well-intentioned and the technology choices are reasonable. But several assumptions about the existing backend are wrong, the 70% code reuse claim is optimistic by roughly double, and three features in the roadmap require backend work that doesn't exist yet. Fix these before writing the first screen.

---

## 1. What's Actually Well-Aligned

Before the gaps: the strategy gets several things right.

**API reuse is correct.** The mobile app talking to the same Next.js API routes is the right call. No parallel backend. The existing endpoints already return clean JSON envelopes (`{ data, message, error }`) with standard HTTP status codes, which mobile clients handle fine.

**Typesense integration.** The strategy correctly plans to hit the same search API. The existing dual-mode fallback (Typesense → Prisma) is transparent at the API level, so the mobile app gets resilience for free.

**Safepay as primary payment.** Consistent with the web. Good.

**Zod schemas are portable.** The validation schemas in `src/lib/validations.ts` are plain TypeScript and work in React Native. This is real shareable code.

**Role model.** STUDENT, OWNER, ADMIN — the mobile strategy maps to this correctly. The scoped JWT (`{ id, role, emailVerified, tokenVersion }`) is the same for both platforms.

**R2 image storage.** The mobile strategy plans camera uploads to the same R2 bucket via `/api/upload`. The backend already handles multipart, MIME validation, size limits, and ownership checks. No changes needed there.

---

## 2. Critical Misalignments

These will break the mobile app if not addressed before development starts.

### 2.1 Auth: Cookies Don't Work on Mobile

**The problem.** The web stores JWTs in HTTP-only cookies. That's correct for browsers. Mobile HTTP clients don't use cookies the same way — React Native's `fetch` doesn't persist cookies across app restarts, and HTTP-only cookies are deliberately inaccessible to JavaScript anyway. If the mobile app sends requests without a valid session cookie, every protected route returns 401.

**What the mobile strategy says.** "Mobile sends JWT." That's the right idea, but the existing backend middleware doesn't accept a Bearer token — it only reads the NextAuth session cookie. The middleware needs to be updated to support both: cookie-based for web, `Authorization: Bearer <token>` header for mobile.

**What needs to happen:**
- Add Bearer token parsing to `src/middleware.ts`, alongside the existing cookie check
- Store the JWT securely on mobile using `expo-secure-store` (not AsyncStorage — it's unencrypted)
- Implement token refresh: the current 30-day JWT expiry is fine for browsers where sessions persist passively, but mobile users expect to stay logged in indefinitely. The app needs a refresh flow before the token expires

**Severity: Blocker.** Nothing works until this is sorted.

---

### 2.2 CSRF Middleware Will Reject Mobile Requests

**The problem.** The web middleware validates the `Origin` header on all POST/PUT/DELETE/PATCH requests. Mobile apps don't send an `Origin` header. The middleware currently rejects missing Origin in production.

**The fix is small** but it has to happen before any write operation works from mobile: add a check for a known mobile client identifier — either a custom header (`X-Client: mobile`) verified by a shared secret, or exempt requests that present a valid Bearer token (since Bearer token auth is already proof of identity, CSRF doesn't apply the same way).

**Severity: Blocker.**

---

### 2.3 Safepay Payment Flow Needs Deep Linking

**The problem.** Safepay uses a browser redirect flow. The user leaves the app, completes payment on Safepay's web page, and Safepay redirects back to a URL. On web, that redirect URL is `https://hostello.app/booking/...`. On mobile, that redirect needs to open the app, not a browser tab.

**What's missing:**
- Universal Links (iOS) and App Links (Android) configuration pointing to the HostelLo domain
- A deep link handler in the mobile app to parse the return URL and resume the booking confirmation screen
- The backend webhook flow (`POST /api/payment/webhook`) is fine as-is — it's a server-to-server call, not affected by client type

**JazzCash and EasyPaisa** use form POST callbacks rather than webhooks. The mobile flow for these will be even more complex — they POST to a browser URL, not a deep link. Recommend keeping these disabled for mobile MVP and revisiting in Phase 2.

**Severity: Blocker for payment.**

---

### 2.4 Push Notifications Require Backend Changes

**The problem.** The mobile strategy lists push notifications as a core MVP feature. The web system explicitly documents that push notifications don't exist and notes it as a known gap. The in-app notification system writes to the `Notification` table, but nothing currently sends a push.

**What's needed on the backend:**
1. A new `DeviceToken` model in the Prisma schema: `userId`, `token`, `platform` (ios/android), `createdAt`
2. A registration endpoint: `POST /api/notifications/device-token`
3. Firebase Admin SDK integration to dispatch FCM push notifications from the existing `createNotification()` function
4. Logic to deactivate stale tokens when FCM returns `UNREGISTERED`

This is real backend work — probably 1–2 weeks for a backend engineer. It's not something the mobile team can build around.

**Severity: High. Don't list push notifications as MVP until this backend work is scoped and scheduled.**

---

### 2.5 Real-Time Messaging Isn't Real-Time on Either Platform

**The problem.** The web uses polling for messaging. The mobile strategy implies native-feeling real-time chat. But the backend still uses polling — there are no WebSockets, no SSE, nothing that pushes new messages to clients.

On mobile, polling every N seconds drains battery and burns mobile data. It also feels sluggish compared to WhatsApp.

**Practical path forward:**
- For MVP: use polling at 10–15 second intervals, same as web. Set expectations accordingly
- For Phase 2: use push notifications (once FCM backend work above is done) to alert users of new messages, then fetch on open. This is what most booking apps actually do — not true WebSockets
- Long-term: WebSockets aren't available on Vercel Edge anyway. SSE is an option but adds complexity. The push-notification-as-nudge pattern is the pragmatic choice here

**Severity: Medium. Just remove "real-time messaging" language from the MVP description. It's not real-time on web either.**

---

## 3. The 70% Code Reuse Claim

The strategy says "70% code reuse target" between web and mobile. Here's what can realistically be shared:

| Category | Shareable? | Notes |
|---|---|---|
| TypeScript types (`User`, `Hostel`, `Booking`, etc.) | ✓ Yes | Direct reuse |
| Zod validation schemas | ✓ Yes | Plain TS, works in RN |
| API client (`lib/api-client.ts`) | ✓ Yes, with changes | Needs Bearer token support; fetch-based so it works in RN |
| Constants (amenities, cities, universities) | ✓ Yes | |
| Business utilities (date formatting, price formatting) | ✓ Yes | |
| React Query hooks | ✗ No | Mobile strategy uses RTK Query, not React Query |
| Zustand stores | ✗ No | Mobile uses Redux Toolkit |
| UI components | ✗ No | TailwindCSS classes don't exist in React Native |
| Next.js-specific code (RSC, App Router patterns) | ✗ No | |
| Auth flow (NextAuth hooks) | ✗ No | NextAuth is web-only |
| Email templates | ✗ No | Backend-only, not relevant to client |

**Realistic reuse: 20–30%.** Types, schemas, constants, utilities. That's still valuable — it means the mobile app validates data the same way and calls the same API shapes — but it's not 70%. Plan for mobile-specific implementations of state, auth, UI, and navigation from scratch.

---

## 4. Feature-Specific Conflicts

### 4.1 Features That Don't Exist in the Backend Yet

These are in the mobile roadmap but have zero backend implementation:

| Mobile Feature | Backend Gap | Phase |
|---|---|---|
| Push notifications | No FCM integration, no DeviceToken table | MVP |
| QR code check-in for owners | No endpoint, no concept in schema | Phase 2 |
| Video reviews | `/api/reviews` only handles text + ratings | Phase 3 |
| Revenue dashboard for owners | Only booking count exists; no revenue analytics | Phase 3 |
| Roommate matching | Not in schema or scope at all | Phase 3+ |
| "Check-in QR code" for guests | No concept in current booking model | Phase 2 |

None of these are blockers for MVP — they're correctly placed in later phases. But they need to be explicitly listed as backend deliverables in those phase plans. Don't let the mobile roadmap treat these as mobile-only features. They require database schema changes and new API routes.

---

### 4.2 Anonymous Reviews Toggle

The mobile strategy mentions an anonymous reviews toggle. The current review model ties every review to a `userId` (and requires a completed booking to submit). Anonymous reviews would break the 1-review-per-user-per-hostel constraint, and more importantly, the owner reply system and admin moderation both rely on knowing who submitted a review.

**Recommendation:** Remove this from the roadmap. It conflicts with the trust model the platform is built on. If the goal is reducing friction for reviewers who worry about owner retaliation, the better fix is to not surface the reviewer's name publicly — but still store it internally.

---

### 4.3 Stripe as a Payment Option

Section 3.1 of the mobile strategy lists "Stripe (PK support)" alongside Safepay. Stripe doesn't support Pakistan as a business country — Pakistani businesses can't create Stripe accounts to receive payouts. This has been the case for years. Stripe can process cards from Pakistani cardholders paying international merchants, but HostelLo is a Pakistani business collecting PKR.

**Remove Stripe from the payments list.** The options are: Safepay (already integrated), JazzCash (backend-ready, disabled), EasyPaisa (backend-ready, disabled). Apple Pay and Google Pay on mobile can layer on top of Safepay if Safepay's mobile SDK supports it — check this with Safepay directly.

---

### 4.4 International Expansion in Executive Summary

The executive summary states "Expand international coverage with offline-capable app" as a strategic objective. The web system design explicitly scopes the product to Pakistan only — PKR-only payments, Pakistani phone numbers, Pakistan universities list, Safepay (a Pakistani gateway).

International expansion isn't a mobile concern. It's a product and business model decision that affects the backend, the payment infrastructure, the currency handling, and the data model. Don't frame it as a mobile feature. Take it out of the mobile strategy and put it in a separate expansion document if the business wants to pursue it.

---

### 4.5 Rate Limiting: Mobile Behind NAT

The web rate limits by IP. University students are exactly the users most likely to share an IP — campus WiFi, dorm networks. A single university network might put dozens of students behind one IP address, and the current limits (10 bookings/hour, 60 searches/minute per IP) could cause false positives.

**Recommendation:** When implementing Bearer token auth, shift rate limiting to user ID for authenticated endpoints. The Upstash rate limiter already supports custom keys — changing the key from IP to `user:{id}` for authenticated routes is a small change with significant impact.

---

## 5. State Management Decision

The web uses React Query 5 + Zustand 5. The mobile strategy proposes Redux Toolkit + RTK Query. These are different libraries that solve the same problems differently.

The strategy's rationale ("same state container as web") is wrong — the web doesn't use Redux at all.

This isn't necessarily a bad choice for mobile. Redux Toolkit has good offline patterns (Redux Persist), and RTK Query is a solid data fetching library. But the team should go in knowing it's a mobile-specific choice, not a shared architecture. The benefit of Redux Persist for offline drafts and the Offline Queue described in the architecture diagram is real.

One thing to settle before starting: Expo's managed workflow vs. bare workflow. Redux Persist with SQLite requires the bare workflow (or Expo's `expo-sqlite` module). Confirm which path the team is taking — the CI/CD and native module story differs significantly between the two.

---

## 6. Infrastructure Additions Required

Work that has to happen on the backend before mobile goes live, regardless of phase:

| Item | Effort | Needed For |
|---|---|---|
| Bearer token auth in middleware | 1–2 days | All authenticated mobile endpoints |
| CSRF exemption for mobile clients | 1 day | All write operations |
| `DeviceToken` schema + registration endpoint | 2–3 days | Push notifications |
| FCM Admin SDK integration | 3–5 days | Push notifications |
| Deep link configuration for Safepay callback | 2–3 days (backend + mobile) | Payments |
| Rate limiting by user ID (authenticated routes) | 1 day | Rate limiting sanity |

This is roughly 3–4 weeks of backend engineering time. It needs to be in the project plan before mobile sprint 1 starts, not discovered at sprint 4 when payments break.

---

## 7. What the Shared Package Actually Looks Like

Given the analysis above, here's a realistic `/packages/shared` structure:

```
/packages/shared/
├── types/
│   └── index.ts          # User, Hostel, Booking, Room, Review, etc.
│                          # (port from src/types/index.ts — no changes needed)
├── validations/
│   └── index.ts          # Zod schemas for all forms & API contracts
│                          # (port from src/lib/validations.ts)
├── constants/
│   ├── amenities.ts      # Amenity definitions
│   ├── universities.ts   # Pakistan university list
│   └── config.ts         # Shared app-wide constants
├── api/
│   └── client.ts         # Fetch wrapper — needs Bearer token support added
└── utils/
    ├── currency.ts       # PKR formatting
    ├── dates.ts          # Date formatting utilities
    └── strings.ts        # sanitizeString, escapeHtml (already tested)
```

Everything else — state management, UI, navigation, auth — is platform-specific. Don't try to share it.

---

## 8. Recommended Changes to the Mobile Strategy Document

| Section | Change |
|---|---|
| Executive Summary, Strategic Objectives | Remove "international coverage" — it's not a mobile feature |
| Section 3.1, Tech Stack | Remove Stripe; keep Safepay + JazzCash/EasyPaisa |
| Section 3.3, Shared Code | Update reuse estimate from 70% to ~25%; revise the shared package structure |
| Section 4.1 (MVP), Push Notifications | Mark as "pending backend work" with estimated backend effort |
| Section 4.2 (Pillar 4), Anonymous Reviews | Remove — conflicts with booking-gated review model |
| Section 5.1 (Payments, Pillar 2) | Add deep linking as a prerequisite for Safepay integration |
| Section 10.2, Technical Debt | Add "Bearer token auth backend work" as a prerequisite item |
| Section 2.4 (Messaging, Pillar 3) | Clarify messaging is polling-based, not real-time, for MVP |
| Financial Projections | Separate "backend enablement work" from mobile dev costs (~$15–20K) |

---

## 9. Suggested MVP Scope (Revised)

Given the gaps above, here's what a realistic MVP looks like with the existing backend:

**In (works today with small backend changes):**
- Hostel search and detail pages
- Favorites
- Map view
- Booking flow with Safepay (after deep linking is set up)
- User profile, booking history, cancel booking
- Email/password login and signup
- In-app notification list (read from existing `Notification` table via polling)
- Price alert creation and management

**Defer (needs new backend work):**
- Push notifications (needs FCM backend)
- In-app messaging (technically works today via polling, but battery impact is bad — consider push nudges first)
- Apple Pay / Google Pay (verify Safepay SDK mobile support first)

**Remove from roadmap (conflicts with web model):**
- Anonymous reviews
- International expansion as a mobile feature
- Stripe payments

---

*This document should be reviewed alongside SYSTEM.md Section 25 (Open Issues, Risks, and Decisions Pending), which already flags several of the backend gaps referenced here.*
