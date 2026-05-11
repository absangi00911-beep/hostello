# Graph Report - .  (2026-05-10)

## Corpus Check
- Corpus is ~36,789 words - fits in a single context window. You may not need a graph.

## Summary
- 445 nodes · 891 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_User Auth & Profiles|User Auth & Profiles]]
- [[_COMMUNITY_Email Notifications|Email Notifications]]
- [[_COMMUNITY_Auth & Registration|Auth & Registration]]
- [[_COMMUNITY_Hostel Search & Indexing|Hostel Search & Indexing]]
- [[_COMMUNITY_EasyPaisa Payment|EasyPaisa Payment]]
- [[_COMMUNITY_Types & Session|Types & Session]]
- [[_COMMUNITY_Notifications & Reviews|Notifications & Reviews]]
- [[_COMMUNITY_API Client Utilities|API Client Utilities]]
- [[_COMMUNITY_Middleware & Environment|Middleware & Environment]]
- [[_COMMUNITY_Safepay Payment|Safepay Payment]]
- [[_COMMUNITY_Validation Schemas|Validation Schemas]]
- [[_COMMUNITY_Support & Contact|Support & Contact]]
- [[_COMMUNITY_SMS & OTP|SMS & OTP]]
- [[_COMMUNITY_Scheduled Tasks|Scheduled Tasks]]
- [[_COMMUNITY_Performance Optimization|Performance Optimization]]
- [[_COMMUNITY_Mobile Auth Services|Mobile Auth Services]]
- [[_COMMUNITY_Amenities Config|Amenities Config]]
- [[_COMMUNITY_Styling Constants|Styling Constants]]
- [[_COMMUNITY_File Upload|File Upload]]
- [[_COMMUNITY_Auth Context|Auth Context]]
- [[_COMMUNITY_Hostel Types|Hostel Types]]
- [[_COMMUNITY_Filter Modal|Filter Modal]]
- [[_COMMUNITY_Search Bar|Search Bar]]
- [[_COMMUNITY_University Config|University Config]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Routes Manifest|Routes Manifest]]

## God Nodes (most connected - your core abstractions)
1. `rateLimit()` - 26 edges
2. `escapeHtml()` - 23 edges
3. `sendEmail()` - 23 edges
4. `emailLayout()` - 22 edges
5. `getAppUrl()` - 20 edges
6. `emailButton()` - 17 edges
7. `indexSingleHostel()` - 14 edges
8. `createNotification()` - 11 edges
9. `getIp()` - 11 edges
10. `getRequestOrigin()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `PATCH()` --calls--> `createNotification()`  [INFERRED]
  src/app/api/price-alerts/[id]/route.ts → src/lib/notifications.ts
- `PATCH()` --calls--> `bookingStatusEmail()`  [INFERRED]
  src/app/api/price-alerts/[id]/route.ts → src/lib/email-templates/booking-status.ts
- `DELETE()` --calls--> `removeHostelIndex()`  [EXTRACTED]
  src/app/api/hostels/[param]/route.ts → src/lib/typesense-sync.ts
- `PATCH()` --calls--> `sendEmail()`  [EXTRACTED]
  src/app/api/admin/hostels/route.ts → src/lib/email.ts
- `PATCH()` --calls--> `listingApprovedEmail()`  [EXTRACTED]
  src/app/api/admin/hostels/route.ts → src/lib/email-templates/listing-status.ts

## Communities (29 total, 5 thin omitted)

### Community 0 - "User Auth & Profiles"
Cohesion: 0.05
Nodes (26): credentialsProvider, { handlers, signIn, signOut, auth }, invalidateLocalSessionCache(), loginSchema, GET(), ownerQuerySchema, changePasswordSchema, POST() (+18 more)

### Community 1 - "Email Notifications"
Cohesion: 0.12
Nodes (34): accountDeletedEmail(), APP_URL, bookingConfirmationEmail(), BookingEmailProps, bookingNotificationEmail(), formatDate(), formatPrice(), APP_URL (+26 more)

### Community 2 - "Auth & Registration"
Cohesion: 0.11
Nodes (30): POST(), verificationEmail(), POST(), schema, GET(), POST(), PATCH(), POST() (+22 more)

### Community 3 - "Hostel Search & Indexing"
Cohesion: 0.13
Nodes (26): PATCH(), schema, DELETE(), PUT(), searchHostelsWithFallback(), SearchParams, SearchResult, markNotificationAsRead() (+18 more)

### Community 4 - "EasyPaisa Payment"
Cohesion: 0.14
Nodes (19): APP_URL, confirmBooking(), GET(), handleCallback(), parseFormBody(), POST(), parseEasypaisaCallback(), ALLOWED_GATEWAY_IPS (+11 more)

### Community 5 - "Types & Session"
Cohesion: 0.11
Nodes (18): hasRole(), requireAuth(), requireRole(), AdapterUser, AmenityConfig, ApiResponse, BookingWithHostel, CompareItem (+10 more)

### Community 6 - "Notifications & Reviews"
Cohesion: 0.13
Nodes (15): GET(), messageSchema, POST(), getFirebaseAdmin(), createNotification(), CreateNotificationInput, getUnreadCount(), markAllNotificationsAsRead() (+7 more)

### Community 7 - "API Client Utilities"
Cohesion: 0.11
Nodes (11): BookingResult, createBooking(), CreateBookingPayload, fetchHostels(), HostelDetail, HostelSummary, PaginatedHostels, request() (+3 more)

### Community 8 - "Middleware & Environment"
Cohesion: 0.14
Nodes (17): verifyCsrfOrigin(), ENV_VALIDATION_RULES, EnvValidationRule, getOptionalEnv(), getRequiredEnv(), validateEnvironment(), validateEnvironmentOnce(), DELETE() (+9 more)

### Community 9 - "Safepay Payment"
Cohesion: 0.16
Nodes (15): aes128Encrypt(), createEasypaisaSession(), EasypaisaCallbackResult, EasypaisaSession, formatTimestamp(), getCheckoutUrl(), getConfig(), PAYMENT_METHODS (+7 more)

### Community 10 - "Validation Schemas"
Cohesion: 0.13
Nodes (13): BookingInput, bookingSchema, HostelCreateInput, hostelCreateSchema, LoginInput, loginSchema, ReviewInput, reviewSchema (+5 more)

### Community 11 - "Support & Contact"
Cohesion: 0.21
Nodes (12): POST(), ContactInput, contactSchema, EmailPayload, EmailResult, EmailSender, REPORT_LABELS, ReportInput (+4 more)

### Community 12 - "SMS & OTP"
Cohesion: 0.26
Nodes (11): generateOTP(), normalizePhoneNumber(), sendOtpSms(), sendPhoneChangeNotification(), sendSms(), SendSmsOptions, SendSmsResult, POST() (+3 more)

### Community 13 - "Scheduled Tasks"
Cohesion: 0.29
Nodes (6): POST(), POST(), checkPriceAlerts(), VerifyOptions, verifyUpstashRequest(), POST()

### Community 14 - "Performance Optimization"
Cohesion: 0.2
Nodes (6): LazyImage, LazyImageProps, ListItemProps, MemoizedListItem, VirtualizedList, VirtualizedListProps

### Community 15 - "Mobile Auth Services"
Cohesion: 0.39
Nodes (7): apiRequest(), clearAuthToken(), getAuthHeaders(), setAuthToken(), AuthResponse, login(), logout()

### Community 16 - "Amenities Config"
Cohesion: 0.25
Nodes (7): AMENITIES, Amenity, AMENITY_MAP, CITIES, City, PRICE_RANGES, SORT_OPTIONS

### Community 17 - "Styling Constants"
Cohesion: 0.25
Nodes (7): BUTTON_STYLES, FOCUS_RINGS, FORM_STYLES, HOVER_EFFECTS, INPUT_STYLES, TRANSITIONS, UTILITY

### Community 18 - "File Upload"
Cohesion: 0.38
Nodes (5): ACCEPTED_IMAGE_TYPES, API_RATE_LIMIT, AUTH_RATE_LIMIT, POST(), uploadToR2()

### Community 20 - "Hostel Types"
Cohesion: 0.4
Nodes (4): HostelDetails, HostelSearchResult, Room, TabType

### Community 23 - "University Config"
Cohesion: 0.5
Nodes (3): POPULAR_UNIVERSITIES, UNIVERSITIES, University

## Knowledge Gaps
- **140 isolated node(s):** `FilterModalProps`, `styles`, `SearchBarProps`, `styles`, `AuthContextType` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sendEmail()` connect `Auth & Registration` to `Hostel Search & Indexing`, `EasyPaisa Payment`, `Safepay Payment`, `Support & Contact`, `Scheduled Tasks`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `getAppUrl()` connect `Email Notifications` to `Middleware & Environment`, `Safepay Payment`, `EasyPaisa Payment`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `rateLimit()` connect `Auth & Registration` to `Notifications & Reviews`, `Safepay Payment`, `Support & Contact`, `SMS & OTP`, `File Upload`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `FilterModalProps`, `styles`, `SearchBarProps` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Auth & Profiles` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Email Notifications` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Auth & Registration` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._