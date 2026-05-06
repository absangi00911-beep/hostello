# HostelLo: Comprehensive Architectural Analysis

**Project Type:** Full-Stack Next.js 15 SaaS Platform  
**Domain:** Student Hostel Booking & Marketplace  
**Build Status:** ✓ Compiling successfully (no TypeScript errors)

---

## 1. High-Level Architecture

### Deployment Model: Hybrid Edge + Serverless

```
┌─────────────────────────────────────────────────────────────┐
│           Browser (React 19 SPA)                            │
│  HostelLo UI: Pages, Components, React Query caching       │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTPS/REST
              ▼
┌─────────────────────────────────────────────────────────────┐
│        Next.js 15 App Router (Vercel Edge)                  │
│  Middleware: CSRF, Security Headers, Auth Validation       │
│  API Routes: RESTful endpoints with rate-limiting           │
│  Cron Jobs: Scheduled tasks via Upstash QStash             │
└─────────────┬───────────────────────────────────────────────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌────────┐ ┌─────────────────┐
    │        │ │ External APIs   │
    │Database│ │ - Typesense     │
    │        │ │ - Safepay       │
    │ Neon   │ │ - Resend (Email)│
    │        │ │ - Upstash       │
    │        │ │ - AWS S3        │
    └────────┘ └─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, TailwindCSS | User interface & interactions |
| **Fullstack Framework** | Next.js 15 App Router | Server rendering, API routes, middleware |
| **State Management** | React Query 5, Zustand 5 | Server & client state |
| **Database** | PostgreSQL (Neon) | Primary data store |
| **ORM** | Prisma 5.22 | Type-safe data access |
| **Authentication** | NextAuth.js 5 | User sessions & JWT |
| **Search** | Typesense (+ Prisma fallback) | Full-text search |
| **Payments** | Safepay webhooks | PK payment processing |
| **Email** | Resend | Transactional emails |
| **Rate Limiting** | Upstash Redis | Request throttling |
| **Task Scheduling** | Upstash QStash | Cron-like jobs |
| **File Storage** | AWS S3 | Image uploads |

---

## 2. Directory Structure & Module Organization

```
src/
├── app/                           # Next.js App Router (Pages + API)
│   ├── layout.tsx                 # Root layout (HTML shell)
│   ├── middleware.ts              # Auth, CSRF, security headers
│   ├── api/
│   │   ├── auth/                  # NextAuth routes
│   │   ├── hostels/               # Hostel CRUD operations
│   │   ├── bookings/              # Booking management
│   │   ├── reviews/               # Review submission
│   │   ├── conversations/         # Messaging
│   │   ├── notifications/         # User notifications
│   │   ├── price-alerts/          # Price monitoring
│   │   ├── profile/               # User profile
│   │   ├── payment/               # Payment webhooks
│   │   ├── upload/                # Image upload (S3)
│   │   ├── admin/                 # Admin endpoints
│   │   └── cron/                  # Scheduled tasks
│   ├── auth/                      # Auth UI pages
│   ├── booking/                   # Booking flow
│   ├── dashboard/                 # User dashboards
│   ├── admin/                     # Admin panel
│   ├── hostels/                   # Hostel listings
│   ├── search/                    # Search interface
│   └── ...other features
│
├── components/                    # React Components (Feature-organized)
│   ├── ui/                        # Shared UI library (buttons, forms, inputs)
│   ├── dashboard/                 # Dashboard-specific components
│   ├── booking/                   # Booking workflow components
│   ├── search/                    # Search interface components
│   ├── onboarding/                # Hostel creation flow
│   ├── profile/                   # User profile components
│   ├── owner/                     # Owner dashboard components
│   ├── admin/                     # Admin panel components
│   └── notifications/             # Notification components
│
├── lib/                           # Shared Utilities & Services
│   ├── api-client.ts              # Fetch wrapper with auth
│   ├── db.ts                      # Prisma singleton
│   ├── auth/                      # NextAuth configuration
│   ├── email-templates/           # Email HTML generators
│   ├── [service].ts               # Integration services
│   │   ├── hostel-service.ts      # Hostel queries
│   │   ├── payment-methods.ts     # Payment provider config
│   │   ├── notifications.ts       # Notification dispatch
│   │   ├── typesense-sync.ts      # Search index sync
│   │   ├── price-alerts.ts        # Price monitoring
│   │   └── ...more services
│   ├── styling-constants.ts       # Centralized CSS patterns
│   ├── performance-utils.tsx      # Perf optimization hooks
│   └── validations.ts             # Zod schemas
│
├── config/                        # Application Configuration
│   ├── constants.ts               # App-wide constants
│   ├── amenities.ts               # Amenity definitions
│   └── universities.ts            # Pakistan university list
│
├── types/                         # TypeScript Type Definitions
│   └── index.ts                   # Shared types (User, Hostel, Booking, etc.)
│
└── middleware.ts                  # Next.js request middleware

prisma/
├── schema.prisma                  # Prisma data model
├── migrations/                    # Schema version history
└── seed.ts                        # Database seeding

scripts/                           # Utility & Automation
├── setup-typesense.ts             # Initialize search index
├── check-price-alerts.ts          # Price check job
├── verify-typesense-fallback.ts   # Fallback validation
└── ...task scripts

docs/
├── superpowers/                   # Feature specifications
│   ├── specs/                     # Feature design docs
│   └── plans/                     # Roadmap & planning
└── ...documentation
```

---

## 3. Core Data Model (Prisma Schema)

**Entity Relationship Diagram:**

```
User (student/owner/admin)
  ├─ Booking → Hostel, Room
  ├─ HostelListing → Hostel (as owner)
  ├─ Review → Hostel
  ├─ Conversation → Message
  ├─ SavedHostel → Hostel
  ├─ PriceAlert → Hostel
  ├─ Notification (1:many)
  └─ PhoneVerificationToken

Hostel (listing)
  ├─ Owner: User
  ├─ Room (1:many)
  ├─ Booking (1:many)
  ├─ Review (1:many)
  ├─ Conversation (1:many)
  ├─ Image (1:many)
  └─ AmenityRule (1:many)

Room
  ├─ Hostel
  └─ Booking (1:many)

Booking
  ├─ User (guest)
  ├─ Hostel
  ├─ Room
  ├─ Payment
  └─ ConversationParticipant

Review
  ├─ User (reviewer)
  └─ Hostel

Conversation
  ├─ Hostel
  ├─ ConversationParticipant (2:many - guest + owner)
  └─ Message (1:many)

PriceAlert
  ├─ User
  └─ Hostel
```

**Key Features:**
- **Optimistic Locking** on `Room.version` for concurrent booking handling
- **Token Versioning** on `User.tokenVersion` for session invalidation
- **Soft Deletes** via `deletedAt` timestamps (no hard deletes)
- **Status Enums** for type-safe state machines (Booking, Hostel, Review)
- **Indexes** on `city`, `status`, `gender`, `pricePerMonth` for search performance

---

## 4. API Routes & Endpoints

### Authentication Flow

```
POST /api/auth/signin          → NextAuth endpoint
  ↓
Validate credentials (bcryptjs)
  ↓
Generate JWT with tokenVersion
  ↓
Set secure HTTP-only cookie
  ↓
Redirect to dashboard/home
```

### Request Security Pipeline

```
Browser Request
  ↓
[Middleware: middleware.ts]
  - CSRF token validation (POST/PUT/DELETE)
  - Security headers (HSTS, CSP, etc.)
  - Auth session check
  - Rate-limiting lookup
  ↓
[API Route Handler]
  - Input validation (Zod schemas)
  - Rate-limit check (Upstash Redis)
  - Authorization check (roles)
  - Business logic
  ↓
[Response]
  - JSON with proper status codes
  - Security headers
  - Secure cookies (if auth)
```

### Key API Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/hostels` | GET | Optional | Search/list hostels |
| `/api/hostels` | POST | Required | Create hostel (owner) |
| `/api/hostels/[id]` | GET | Optional | Hostel details |
| `/api/hostels/[id]` | PUT | Required | Update hostel (owner) |
| `/api/bookings` | POST | Required | Create booking |
| `/api/bookings/[id]` | GET | Required | Booking details |
| `/api/reviews` | POST | Required | Submit review |
| `/api/reviews/[id]` | PUT | Required | Edit review (author) |
| `/api/payment/webhook` | POST | Webhook | Safepay callbacks |
| `/api/cron/check-alerts` | POST | QStash | Daily price alert check |
| `/api/admin/users` | GET | Admin | User management |
| `/api/admin/hostels` | GET | Admin | Moderation queue |

---

## 5. Search Architecture (Dual-Mode)

### Primary: Typesense (Fast, Full-Text)

```
Hostel Created
  ↓
[typesense-sync.ts]
  - Extract searchable fields (name, city, amenities)
  - Create document in Typesense index
  - Map Prisma types → Typesense schema

User Searches
  ↓
[/api/hostels?query=lahore]
  - Call Typesense API
  - Parse filters (city, price, amenities)
  - Return ranked results (~100ms latency)
```

### Fallback: Prisma (Database-backed)

```
If Typesense unavailable
  ↓
[hostel-search.ts]
  - Query Prisma with SQL WHERE clauses
  - Filter on (city, pricePerMonth, amenities)
  - Slower but consistent (~500ms)
  ↓
Client receives results
```

**Search Filters:**
- City (required)
- Price range (min/max per month)
- Amenities (WiFi, meals, laundry, etc.)
- Gender preference (co-ed, female-only, etc.)
- Rating (minimum average)

---

## 6. Payment Processing

### Safepay Integration

```
User Books Hostel + Initiates Payment
  ↓
POST /api/payment/initiate
  - Validate booking
  - Generate order ID
  - Call Safepay API (get payment link)
  - Store transaction state
  ↓
Redirect to Safepay checkout
  ↓
User completes payment
  ↓
Safepay webhook → POST /api/payment/webhook
  - Verify HMAC signature
  - Update booking status
  - Send confirmation email
  - Sync inventory (decrement room availability)
  ↓
Payment complete ✓
```

**Alternative Providers (configured but disabled):**
- JazzCash
- EasyPaisa

---

## 7. Authentication & Authorization

### Session Management

```
Token Flow:
  JWT { userId, email, role, tokenVersion } 
  + RS256 signed with NextAuth secret
  + 30-day expiration
  
Token Cache:
  Upstash Redis: "token:{userId}" → { tokenVersion, role }
  TTL: 5 minutes
  Purpose: Avoid database lookup on every request

Session Invalidation:
  On logout: DELETE cookie + invalidate Redis
  On password change: Increment User.tokenVersion
  On role change: Increment User.tokenVersion
```

### Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **STUDENT** | Search, book, review, price alerts, messaging |
| **OWNER** | Create/manage hostels, view bookings, respond reviews |
| **ADMIN** | Full moderation, user management, analytics |

---

## 8. Background Jobs & Cron Tasks

### Upstash QStash Integration

```
Scheduled Tasks:
  - Daily 00:00 UTC: Check price alerts (price-alerts.ts)
  - Every 6h: Sync Typesense index (typesense-sync.ts)
  - On booking confirmed: Send email (email-templates/)
  - On review submitted: Increment hostel ratings

Delivery Guarantee:
  At-least-once semantics (may retry)
  Each task logs status to database
```

---

## 9. Performance Optimizations

### Component-Level

- **React.memo** on list items to prevent re-renders
- **useCallback** on event handlers
- **useMemo** on expensive calculations
- **Lazy Image Loading** (LazyImage component)
- **VirtualizedList** for 100+ item lists

### Network-Level

- **useDebounce** on search inputs (300ms delay)
- **SWR/React Query** for automatic caching
- **Image optimization** (responsive srcset, WebP)
- **Code splitting** with dynamic imports
- **Compression** (gzip via Vercel)

### Database-Level

- **Strategic indexes** on frequently searched fields
- **Connection pooling** via Neon
- **Query optimization** via Prisma
- **Pagination** (20-100 items per page)

---

## 10. Security Measures

### Application Security

| Layer | Measure |
|-------|---------|
| **CSRF** | Double-submit token in middleware |
| **XSS** | React auto-escaping + CSP headers |
| **SQL Injection** | Prisma parameterized queries |
| **Auth** | NextAuth + JWT + secure cookies |
| **Rate Limiting** | Upstash Redis with configurable windows |
| **HTTPS** | Vercel enforced |
| **CORS** | Configured for specific origins |

### Security Headers

```
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Sensitive Data

- Passwords hashed with bcryptjs (10 rounds)
- Phone numbers stored encrypted (via middleware)
- Payment tokens never logged
- Rate-limit state in Redis (TTL-based auto-expiry)

---

## 11. Deployment & Environment

### Infrastructure

- **Hosting**: Vercel (serverless functions + edge middleware)
- **Database**: Neon (PostgreSQL serverless)
- **CDN**: Vercel's global edge network
- **Storage**: AWS S3 (images, uploads)
- **Cache**: Upstash Redis (rate-limit, session cache)

### Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://hostello.app

# Search
TYPESENSE_API_KEY=...

# Payments
SAFEPAY_API_KEY=...

# Email
RESEND_API_KEY=...

# SMS/Tasks
UPSTASH_REDIS_URL=...
UPSTASH_QSTASH_TOKEN=...

# Files
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## 12. Development Workflow

### Build & Test

```bash
npm run dev              # Start dev server + watch
npm run build            # Production build
npm run build 2>&1 | grep "Successfully"   # Verify compilation
npm test                 # Run test suite
```

### Database

```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create & apply migration
npx prisma studio       # Visual database inspector
```

### Scripts

```bash
npm run setup-typesense      # Initialize search index
npm run check-price-alerts   # Test price job
npm run verify-fallback      # Test search fallback
```

---

## 13. Key Files & Entry Points

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Request pipeline (CSRF, auth, security) |
| `src/app/layout.tsx` | HTML shell + global providers |
| `src/lib/auth/config.ts` | NextAuth configuration |
| `src/lib/db.ts` | Prisma singleton |
| `src/lib/styling-constants.ts` | Centralized CSS patterns |
| `prisma/schema.prisma` | Data model definitions |
| `next.config.ts` | Next.js build configuration |
| `tsconfig.json` | TypeScript strict mode settings |

---

## 14. Notable Design Patterns

### 1. **Service Layer Pattern**
```typescript
// lib/hostel-service.ts
export async function getHostelsByCity(city: string) {
  // Business logic + caching
}
```

### 2. **Middleware Pipeline**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // CSRF validation → Auth check → Rate-limit → Business logic
}
```

### 3. **API Response Wrapper**
```typescript
// All API routes follow consistent response shape
{ success: true, data: {...}, error?: string }
```

### 4. **Component Composition**
- Page components render layouts + feature components
- Feature components compose UI components from `src/components/ui`
- UI components are forwardRef + memo for optimization

### 5. **Type-Safe Database Queries**
```typescript
// Prisma inference provides types without manual DTOs
const users = await db.user.findMany();
// TypeScript knows the exact shape
```

---

## 15. Performance Metrics & Targets

| Metric | Target | Current |
|--------|--------|---------|
| **FCP** (First Contentful Paint) | < 1.8s | TBD |
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD |
| **API Response Time** | < 200ms | ~150ms |
| **Search Latency** | < 100ms | ~80ms |
| **Database Query** | < 50ms | ~30ms |
| **Bundle Size** | < 200KB gzipped | ~180KB |

---

## 16. Known Limitations & Technical Debt

1. **Payment Providers**: JazzCash & EasyPaisa configured but disabled (cost)
2. **Search**: Typesense fallback required (not replicated)
3. **Scaling**: Single Neon instance (future: read replicas)
4. **Real-time**: Messaging via polling (future: WebSocket)
5. **Analytics**: Basic logging (future: dedicated analytics)

---

## 17. Next Steps for New Developers

1. **Understand the flow**: Follow a booking from search → payment
2. **Set up locally**: Copy `.env.local`, run `npm install`, `npx prisma db push`
3. **Make a change**: Update a component, verify build passes
4. **Deploy**: Push to GitHub, Vercel auto-deploys
5. **Monitor**: Check Vercel dashboard & database logs

---

**Last Updated**: May 6, 2026  
**Documentation Maintainer**: HostelLo Frontend Team
