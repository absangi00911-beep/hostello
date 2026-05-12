# Graph Report - .  (2026-05-12)

## Corpus Check
- Corpus is ~49,702 words - fits in a single context window. You may not need a graph.

## Summary
- 656 nodes · 1389 edges · 41 communities (32 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Error Handler|Error Handler]]
- [[_COMMUNITY_Global Error Handler|Global Error Handler]]
- [[_COMMUNITY_Shared Exports|Shared Exports]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 31 edges
2. `rateLimit()` - 28 edges
3. `sendEmail()` - 23 edges
4. `getAppUrl()` - 22 edges
5. `emailLayout()` - 22 edges
6. `emailButton()` - 17 edges
7. `Button` - 15 edges
8. `escapeHtml()` - 14 edges
9. `Card` - 14 edges
10. `CardContent` - 14 edges

## Surprising Connections (you probably didn't know these)
- `createHostelRecord()` --calls--> `slugify()`  [INFERRED]
  src/lib/hostel-service.ts → packages/shared/src/utils/strings.ts
- `createBooking()` --calls--> `calculateMonths()`  [INFERRED]
  src/lib/booking-service.ts → packages/shared/src/utils/dates.ts
- `formatMultiline()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/support.ts → packages/shared/src/utils/strings.ts
- `renderContactEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/support.ts → packages/shared/src/utils/strings.ts
- `renderIssueReportEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/support.ts → packages/shared/src/utils/strings.ts

## Communities (41 total, 9 thin omitted)

### Community 0 - "User Auth & Profiles"
Cohesion: 0.05
Nodes (61): BookingDialog(), BookingDialogProps, Room, HostelCard(), HostelCardProps, BookingsTab(), MessagesTab(), PriceAlertsTab() (+53 more)

### Community 1 - "Email Notifications"
Cohesion: 0.08
Nodes (48): POST(), POST(), accountDeletedEmail(), bookingConfirmationEmail(), BookingEmailProps, bookingNotificationEmail(), formatDate(), formatPrice() (+40 more)

### Community 2 - "Auth & Registration"
Cohesion: 0.08
Nodes (36): POST(), schema, GET(), POST(), POST(), getRequestOrigin(), getResendClient(), sendEmail() (+28 more)

### Community 3 - "Hostel Search & Indexing"
Cohesion: 0.07
Nodes (43): PATCH(), schema, DELETE(), PUT(), verifyCsrfOrigin(), ENV_VALIDATION_RULES, EnvValidationRule, getOptionalEnv() (+35 more)

### Community 4 - "EasyPaisa Payment"
Cohesion: 0.08
Nodes (30): ListingForm(), ProfileForm(), FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem (+22 more)

### Community 5 - "Types & Session"
Cohesion: 0.07
Nodes (23): AccountMenu(), AdminLayoutProps, NAV_ITEMS, CITIES, CitySelector(), Footer(), LEGAL_LINKS, NAV_LINKS (+15 more)

### Community 6 - "Notifications & Reviews"
Cohesion: 0.1
Nodes (26): APP_URL, confirmBooking(), GET(), handleCallback(), parseFormBody(), POST(), aes128Encrypt(), createEasypaisaSession() (+18 more)

### Community 7 - "API Client Utilities"
Cohesion: 0.12
Nodes (21): hasRole(), requireAuth(), requireRole(), AdapterUser, AmenityConfig, ApiResponse, Booking, BookingWithHostel (+13 more)

### Community 8 - "Middleware & Environment"
Cohesion: 0.11
Nodes (24): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+16 more)

### Community 9 - "Safepay Payment"
Cohesion: 0.26
Nodes (11): generateOTP(), normalizePhoneNumber(), sendOtpSms(), sendPhoneChangeNotification(), sendSms(), SendSmsOptions, SendSmsResult, POST() (+3 more)

### Community 10 - "Validation Schemas"
Cohesion: 0.14
Nodes (5): BADGE_LABELS, BADGE_STYLES, BadgeVariant, EmptyStateProps, StatusBadgeProps

### Community 11 - "Support & Contact"
Cohesion: 0.19
Nodes (7): GET(), ownerQuerySchema, POST(), createBooking(), mockBookings, mockDb, calculateMonths()

### Community 12 - "SMS & OTP"
Cohesion: 0.27
Nodes (7): POST(), POST(), POST(), checkPriceAlerts(), VerifyOptions, verifyUpstashRequest(), POST()

### Community 13 - "Scheduled Tasks"
Cohesion: 0.15
Nodes (5): adapter, globalForPrisma, pool, loginSchema, createSchema

### Community 14 - "Performance Optimization"
Cohesion: 0.21
Nodes (8): credentialsProvider, { handlers, signIn, signOut, auth }, invalidateLocalSessionCache(), loginSchema, changePasswordSchema, POST(), POST(), schema

### Community 15 - "Mobile Auth Services"
Cohesion: 0.35
Nodes (8): apiRequest(), clearAuthToken(), getAuthHeaders(), setAuthToken(), mockData, AuthResponse, login(), logout()

### Community 16 - "Amenities Config"
Cohesion: 0.29
Nodes (7): getFirebaseAdmin(), CreateNotificationInput, getUnreadCount(), markAllNotificationsAsRead(), sendPushNotification(), GET(), PUT()

### Community 17 - "Styling Constants"
Cohesion: 0.27
Nodes (7): GET(), messageSchema, PATCH(), POST(), RouteParams, updateSchema, createNotification()

### Community 18 - "File Upload"
Cohesion: 0.25
Nodes (7): AMENITIES, Amenity, AMENITY_MAP, CITIES, City, PRICE_RANGES, SORT_OPTIONS

### Community 19 - "Auth Context"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 20 - "Hostel Types"
Cohesion: 0.29
Nodes (4): mockDb, mockReview, reviewData, POST()

### Community 21 - "Filter Modal"
Cohesion: 0.33
Nodes (4): bricolageGrotesque, dmSans, jetbrainsMono, metadata

### Community 26 - "Error Handler"
Cohesion: 0.5
Nodes (3): ACCEPTED_IMAGE_TYPES, API_RATE_LIMIT, AUTH_RATE_LIMIT

### Community 27 - "Global Error Handler"
Cohesion: 0.5
Nodes (3): POPULAR_UNIVERSITIES, UNIVERSITIES, University

### Community 29 - "Community 29"
Cohesion: 0.83
Nodes (3): DELETE(), getHostelId(), POST()

## Knowledge Gaps
- **169 isolated node(s):** `FilterModalProps`, `styles`, `SearchBarProps`, `styles`, `AuthContextType` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `User Auth & Profiles` to `Middleware & Environment`, `Auth Context`, `EasyPaisa Payment`, `Types & Session`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `sendEmail()` connect `Auth & Registration` to `Email Notifications`, `Hostel Search & Indexing`, `Notifications & Reviews`, `SMS & OTP`, `Styling Constants`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `getAppUrl()` connect `Email Notifications` to `Auth & Registration`, `Hostel Search & Indexing`, `Notifications & Reviews`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `FilterModalProps`, `styles`, `SearchBarProps` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Auth & Profiles` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Email Notifications` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Auth & Registration` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._