# Graph Report - hostello  (2026-05-15)

## Corpus Check
- 206 files · ~78,839 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 931 nodes · 1876 edges · 70 communities (56 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb760e02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 35 edges
2. `rateLimit()` - 28 edges
3. `sendEmail()` - 23 edges
4. `formatPKR()` - 22 edges
5. `getAppUrl()` - 22 edges
6. `emailLayout()` - 22 edges
7. `PageSpinner()` - 17 edges
8. `emailButton()` - 17 edges
9. `Button` - 15 edges
10. `InlineError()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `createHostelRecord()` --calls--> `slugify()`  [INFERRED]
  src/lib/hostel-service.ts → packages/shared/src/utils/strings.ts
- `accountDeletedEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/email-templates/account-deleted.ts → packages/shared/src/utils/strings.ts
- `bookingStatusEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/email-templates/booking-status.ts → packages/shared/src/utils/strings.ts
- `priceAlertEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/email-templates/price-alert.ts → packages/shared/src/utils/strings.ts
- `verificationEmail()` --calls--> `escapeHtml()`  [INFERRED]
  src/lib/email-templates/verification.ts → packages/shared/src/utils/strings.ts

## Communities (70 total, 14 thin omitted)

### Community 0 - "User Auth & Profiles"
Cohesion: 0.06
Nodes (31): AdminRootLayout(), getPendingCount(), AccountMenu(), AdminLayoutProps, NAV_ITEMS, CITIES, CitySelector(), NotificationBell() (+23 more)

### Community 1 - "Email Notifications"
Cohesion: 0.07
Nodes (40): DELETE(), PUT(), verifyCsrfOrigin(), ENV_VALIDATION_RULES, EnvValidationRule, getOptionalEnv(), getRequiredEnv(), validateEnvironment() (+32 more)

### Community 2 - "Auth & Registration"
Cohesion: 0.07
Nodes (19): getFeaturedHostels(), HomePage(), Footer(), LEGAL_LINKS, NAV_LINKS, Navbar(), PublicLayoutProps, DashboardTabs() (+11 more)

### Community 3 - "Hostel Search & Indexing"
Cohesion: 0.08
Nodes (26): BookingForm(), BookingPanel(), BookingPanelProps, monthsBetween(), Room, ALL_AMENITIES, FilterControlsProps, FilterSidebar() (+18 more)

### Community 4 - "EasyPaisa Payment"
Cohesion: 0.07
Nodes (20): NotFound(), EditListingPage(), getHostel(), HostelMap(), HostelMapProps, NoMapAvailable(), ReviewData, ReviewList() (+12 more)

### Community 5 - "Types & Session"
Cohesion: 0.13
Nodes (21): BookingDialog(), BookingDialogProps, Room, BookingsTab(), cn(), Avatar, AvatarFallback, AvatarImage (+13 more)

### Community 6 - "Notifications & Reviews"
Cohesion: 0.1
Nodes (26): APP_URL, confirmBooking(), GET(), handleCallback(), parseFormBody(), POST(), aes128Encrypt(), createEasypaisaSession() (+18 more)

### Community 7 - "API Client Utilities"
Cohesion: 0.15
Nodes (16): HostelCard(), HostelCardProps, MessagesTab(), PriceAlertsTab(), SavedHostelsTab(), BookingRequestsTab(), ListingsTab(), Badge() (+8 more)

### Community 8 - "Middleware & Environment"
Cohesion: 0.15
Nodes (18): ListingForm(), ProfileForm(), Card, CardDescription, CardFooter, CardHeader, CardTitle, FormControl (+10 more)

### Community 9 - "Safepay Payment"
Cohesion: 0.12
Nodes (21): hasRole(), requireAuth(), requireRole(), AdapterUser, AmenityConfig, ApiResponse, Booking, BookingWithHostel (+13 more)

### Community 10 - "Validation Schemas"
Cohesion: 0.11
Nodes (24): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+16 more)

### Community 11 - "Support & Contact"
Cohesion: 0.12
Nodes (23): POST(), cleanupInterval, Entry, getRedis(), getUpstashLimiter(), limiters, rateLimit(), rateLimitInMemory() (+15 more)

### Community 12 - "SMS & OTP"
Cohesion: 0.11
Nodes (12): AuthCardLayout(), AuthCardLayoutProps, FormField(), FormFieldProps, OrDivider(), ReviewDialog(), ReviewDialogProps, SUBCATEGORIES (+4 more)

### Community 13 - "Scheduled Tasks"
Cohesion: 0.21
Nodes (20): bookingConfirmationEmail(), BookingEmailProps, bookingNotificationEmail(), formatDate(), formatPrice(), emailButton(), emailLayout(), emailRow() (+12 more)

### Community 14 - "Performance Optimization"
Cohesion: 0.11
Nodes (13): GENDER_LABELS, HostelCard(), HostelCardData, HostelCardProps, countActiveFilters(), DEFAULT_FILTERS, SearchPageClient(), SearchPageClientProps (+5 more)

### Community 15 - "Mobile Auth Services"
Cohesion: 0.13
Nodes (9): Booking, BookingCard(), BookingStatus, STATUS_OPTIONS, STATUS_TABS, BookingRow(), OwnerDashboardPage(), PageSpinner() (+1 more)

### Community 16 - "Amenities Config"
Cohesion: 0.11
Nodes (17): BookingInput, bookingSchema, HostelCreateInput, hostelCreateSchema, LoginInput, loginSchema, PasswordInput, passwordSchema (+9 more)

### Community 17 - "Styling Constants"
Cohesion: 0.19
Nodes (11): verificationEmail(), welcomeEmail(), GET(), POST(), searchHostelsWithFallback(), createHostelRecord(), getIp(), result (+3 more)

### Community 18 - "File Upload"
Cohesion: 0.18
Nodes (10): BookingStepLayout(), BookingStepLayoutProps, STEP_LABELS, BookingSummaryCard(), BookingSummaryCardProps, PAYMENT_OPTIONS, PaymentMethod, getBooking() (+2 more)

### Community 19 - "Auth Context"
Cohesion: 0.15
Nodes (8): credentialsProvider, { handlers, signIn, signOut, auth }, invalidateLocalSessionCache(), loginSchema, changePasswordSchema, POST(), POST(), schema

### Community 20 - "Hostel Types"
Cohesion: 0.22
Nodes (11): POST(), accountDeletedEmail(), formatPrice(), priceAlertEmail(), PriceAlertEmailProps, POST(), schema, getResendClient() (+3 more)

### Community 21 - "Filter Modal"
Cohesion: 0.13
Nodes (6): adapter, globalForPrisma, pool, loginSchema, GET(), updateSchema

### Community 22 - "Search Bar"
Cohesion: 0.17
Nodes (9): ListingCard(), OwnerHostel, AddAlertSheet(), AlertRow(), PriceAlert, SavedHostel, SavedHostelCard(), EmptyState() (+1 more)

### Community 23 - "University Config"
Cohesion: 0.2
Nodes (9): APP_URL, BookingStatusEmailProps, APP_URL, WelcomeEmailProps, getAppUrl(), isAbsoluteHttpUrl(), normalizeUrl(), SAFE_METHODS (+1 more)

### Community 24 - "Root Layout"
Cohesion: 0.23
Nodes (11): bookingStatusEmail(), POST(), getRequestOrigin(), PAYMENT_METHODS, PaymentMethodValue, createCheckoutSession(), getSafepayBaseUrl(), getSafepaySecret() (+3 more)

### Community 25 - "Routes Manifest"
Cohesion: 0.26
Nodes (11): generateOTP(), normalizePhoneNumber(), sendOtpSms(), sendPhoneChangeNotification(), sendSms(), SendSmsOptions, SendSmsResult, POST() (+3 more)

### Community 26 - "Error Handler"
Cohesion: 0.19
Nodes (7): GET(), ownerQuerySchema, POST(), createBooking(), mockBookings, mockDb, calculateMonths()

### Community 27 - "Global Error Handler"
Cohesion: 0.16
Nodes (6): Pagination(), PaginationProps, AdminHostel, StatusTab, TABS, AdminReview

### Community 28 - "Shared Exports"
Cohesion: 0.14
Nodes (5): BADGE_LABELS, BADGE_STYLES, BadgeVariant, EmptyStateProps, StatusBadgeProps

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): POST(), POST(), POST(), VerifyOptions, verifyUpstashRequest(), POST()

### Community 30 - "Community 30"
Cohesion: 0.35
Nodes (8): apiRequest(), clearAuthToken(), getAuthHeaders(), setAuthToken(), mockData, AuthResponse, login(), logout()

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): getFirebaseAdmin(), CreateNotificationInput, getUnreadCount(), markAllNotificationsAsRead(), sendPushNotification(), GET(), PUT()

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (7): GET(), messageSchema, PATCH(), POST(), RouteParams, updateSchema, createNotification()

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (7): AMENITIES, Amenity, AMENITY_MAP, CITIES, City, PRICE_RANGES, SORT_OPTIONS

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (5): bricolageGrotesque, dmSans, jetbrainsMono, metadata, Providers()

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (4): mockDb, mockReview, reviewData, POST()

### Community 38 - "Community 38"
Cohesion: 0.36
Nodes (4): Label, labelVariants, RadioGroup, RadioGroupItem

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (5): BADGE_LABELS, BADGE_STYLES, BadgeVariant, EmptyStateProps, StatusBadgeProps

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (3): DEFAULT_TYPE, Notification, TYPE_CONFIG

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (3): ACCEPTED_IMAGE_TYPES, API_RATE_LIMIT, AUTH_RATE_LIMIT

### Community 49 - "Community 49"
Cohesion: 0.5
Nodes (3): POPULAR_UNIVERSITIES, UNIVERSITIES, University

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (3): emptySelectorLines, readGlobalsCss(), transformGlobalsCss()

### Community 52 - "Community 52"
Cohesion: 0.83
Nodes (3): DELETE(), getHostelId(), POST()

## Knowledge Gaps
- **243 isolated node(s):** `FilterModalProps`, `styles`, `SearchBarProps`, `styles`, `AuthContextType` (+238 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Types & Session` to `User Auth & Profiles`, `Community 32`, `Auth & Registration`, `Hostel Search & Indexing`, `Community 38`, `Community 39`, `Middleware & Environment`, `API Client Utilities`, `Validation Schemas`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `formatPKR()` connect `Search Bar` to `Hostel Search & Indexing`, `EasyPaisa Payment`, `Community 40`, `Performance Optimization`, `Mobile Auth Services`, `File Upload`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `PublicLayout()` connect `Auth & Registration` to `EasyPaisa Payment`, `Performance Optimization`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `FilterModalProps`, `styles`, `SearchBarProps` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Auth & Profiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Email Notifications` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Auth & Registration` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._