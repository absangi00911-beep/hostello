# Graph Report - d:\Projects\Personal\hostello  (2026-05-05)

## Corpus Check
- 115 files · ~59,012 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 295 nodes · 545 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 72% EXTRACTED · 28% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]

## God Nodes (most connected - your core abstractions)
1. `rateLimit()` - 27 edges
2. `sendEmail()` - 25 edges
3. `escapeHtml()` - 23 edges
4. `emailLayout()` - 22 edges
5. `getAppUrl()` - 20 edges
6. `getIp()` - 20 edges
7. `emailButton()` - 18 edges
8. `indexSingleHostel()` - 14 edges
9. `getRequestOrigin()` - 10 edges
10. `bookingStatusEmail()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `verifyFallbackFiltering()` --calls--> `searchHostelsWithFallback()`  [INFERRED]
  scripts/verify-typesense-fallback.ts → src/lib/hostel-search.ts
- `main()` --calls--> `initializeHostelCollection()`  [INFERRED]
  scripts/setup-typesense.ts → src/lib/typesense.ts
- `main()` --calls--> `syncAllHostelsToTypesense()`  [INFERRED]
  scripts/setup-typesense.ts → src/lib/typesense-sync.ts
- `POST()` --calls--> `createHostelRecord()`  [INFERRED]
  src/app/api/hostels/route.ts → src/lib/hostel-service.ts
- `PATCH()` --calls--> `indexSingleHostel()`  [INFERRED]
  src/app/api/admin/hostels/route.ts → src/lib/typesense-sync.ts

## Communities (46 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (25): POST(), accountDeletedEmail(), bookingConfirmationEmail(), bookingNotificationEmail(), formatDate(), formatPrice(), bookingStatusEmail(), emailButton() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (23): POST(), POST(), GET(), POST(), POST(), POST(), getRequestOrigin(), isAbsoluteHttpUrl() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (21): Typesense Search Engine, DELETE(), PUT(), searchHostelsWithFallback(), markNotificationAsRead(), deleteHostelCollection(), getClient(), getCollectionStats() (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (19): confirmBooking(), GET(), handleCallback(), parseFormBody(), POST(), aes128Encrypt(), createEasypaisaSession(), formatTimestamp() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (10): verifyCsrfOrigin(), getOptionalEnv(), getRequiredEnv(), validateEnvironment(), validateEnvironmentOnce(), sanitizeString(), getAllowedImageOrigins(), isImageUrlAllowed() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (10): POST(), getResendClient(), sendEmail(), createHostelRecord(), createCheckoutSession(), getSafepayBaseUrl(), getSafepaySecret(), verifyWebhookSignature() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (5): createBooking(), fetchHostels(), request(), submitReview(), buildSearchParams()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (8): GET(), PATCH(), createNotification(), getUnreadCount(), markAllNotificationsAsRead(), GET(), PUT(), POST()

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (6): BookingPanel(), HeroGallery(), RoomsTable(), BottomNav(), Footer(), TopNav()

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (5): POST(), POST(), checkPriceAlerts(), verifyUpstashRequest(), POST()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (7): generateOTP(), normalizePhoneNumber(), sendOtpSms(), sendPhoneChangeNotification(), sendSms(), POST(), POST()

### Community 11 - "Community 11"
Cohesion: 0.38
Nodes (3): invalidateLocalSessionCache(), POST(), POST()

### Community 12 - "Community 12"
Cohesion: 0.6
Nodes (6): Booking Entity, Hostel Entity, Neon PostgreSQL Database, Prisma ORM, Review Entity, User Entity

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (3): DELETE(), getHostelId(), POST()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (4): Auth Onboarding Role Split Design Specification, Auth Onboarding Role Split Implementation Plan, Role-First Signup Pattern, Single-Page Signup Pattern (No Multi-Step)

## Knowledge Gaps
- **9 isolated node(s):** `Auth Onboarding Role Split Implementation Plan`, `Student Account Role`, `Owner Account Role`, `Next.js 15 App Router`, `Typesense Search Engine` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sendEmail()` connect `Community 5` to `Community 0`, `Community 1`, `Community 3`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `rateLimit()` connect `Community 1` to `Community 0`, `Community 10`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `indexSingleHostel()` connect `Community 2` to `Community 0`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `rateLimit()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`rateLimit()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `sendEmail()` (e.g. with `PATCH()` and `POST()`) actually correct?**
  _`sendEmail()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `escapeHtml()` (e.g. with `formatMultiline()` and `renderContactEmail()`) actually correct?**
  _`escapeHtml()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `emailLayout()` (e.g. with `renderContactEmail()` and `renderIssueReportEmail()`) actually correct?**
  _`emailLayout()` has 12 INFERRED edges - model-reasoned connections that need verification._