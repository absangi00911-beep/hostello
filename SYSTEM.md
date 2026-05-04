# Hostello System Overview

**Hostello** is a full-stack hostel booking platform built with Next.js, PostgreSQL, and modern payment gateways. It connects students with affordable hostel accommodations through an intuitive search and booking interface, with administrative tools for hostel owners and platform admins.

---

## Architecture

### Tech Stack

**Frontend:**
- Next.js 14+ with App Router (SSR/CSR)
- React with TypeScript
- CSS Modules for component styling
- Mapbox for location-based search
- Responsive design (mobile-first)

**Backend:**
- Next.js API Routes (serverless functions on Vercel)
- NextAuth v5 (session-based authentication with JWT)
- Prisma ORM
- Zod for runtime schema validation

**Data & Storage:**
- PostgreSQL (Neon Serverless)
- Cloudflare R2 for image hosting
- Upstash Redis for rate limiting, caching, and session management
- Typesense for full-text search

**Payment Gateways:**
- SafePay (card payments)
- JazzCash (mobile wallet - Pakistan)
- EasyPaisa (mobile wallet - Pakistan)

**External Services:**
- Resend (transactional email)
- Twilio (SMS for phone verification)
- Upstash QStash (cron jobs)
- Vercel (deployment & serverless hosting)

---

## Core Features

### 1. Authentication & Authorization

**User Roles:**
- **STUDENT**: Can search, book, and review hostels
- **OWNER**: Can create and manage hostel listings
- **ADMIN**: Platform administrator with full control

**Authentication Flow:**
1. Users sign up with email/password or OAuth (Google/GitHub)
2. Email verification required before booking
3. Password strengthened with regex (8+ chars, uppercase, number)
4. Password reset via secure token
5. Sessions managed via JWT with `tokenVersion` for invalidation
6. Phone verification available for extra security

**Session Invalidation:**
- When a user changes password, all existing sessions are revoked immediately
- Achieved by incrementing `user.tokenVersion` in database
- Session callback validates token version on every request
- Expired/revoked sessions return 401 Unauthorized

### 2. Search & Discovery

**Core Search:**
- Full-text search via Typesense (hostel names, locations, universities)
- Location-based filtering with geospatial queries
- Price range filtering
- Amenities filtering (WiFi, AC, Parking, etc.)
- Availability filtering based on calendar dates

**Data Sync:**
- Typesense synced automatically after hostel updates
- Fallback to Prisma full-text search if Typesense unavailable
- Search includes hostel details, amenities, reviews, pricing

### 3. Booking System

**Booking Workflow:**
1. User selects hostel, check-in/out dates, and room type
2. System validates availability (no conflicting bookings)
3. Booking created in PENDING status with 30-minute payment window
4. User redirected to payment gateway
5. After payment, booking moves to CONFIRMED
6. Confirmation email sent to student
7. After checkout date, booking auto-transitions to COMPLETED (enables reviews)
8. If payment abandoned after 30 min, booking auto-cancelled (cron job)

**Booking Statuses:**
- `PENDING`: Awaiting payment
- `CONFIRMED`: Payment received
- `COMPLETED`: Stay finished (can leave review)
- `CANCELLED`: User or system cancelled
- `REFUNDED`: Payment refunded

**Payment Statuses:**
- `PENDING`: Payment initiated
- `PAID`: Payment received
- `FAILED`: Payment failed
- `REFUNDED`: Refund processed

**Currency:** All prices stored in PKR (Pakistani Rupees) as integers

### 4. Payment Processing

**Payment Workflow:**
1. Booking created with total = months × hostel.pricePerMonth (in PKR)
2. System initiates payment with gateway (SafePay, JazzCash, or EasyPaisa)
3. User completes payment on gateway
4. Gateway POSTs callback to `/api/payment/callback`
5. System verifies HMAC signature (gateway-specific)
6. Amount verified: must match within ±1 PKR
7. Booking marked PAID, confirmation email sent
8. User redirected to success page

**Security:**
- IP allowlisting (defense-in-depth, optional)
- HMAC signature verification (primary)
- Amount verification to prevent tampering
- All callbacks exempt from CSRF in middleware (they originate from gateway servers)
- Idempotent: webhook duplication handled safely

**Gateway-Specific Details:**
- **SafePay**: Uses HMAC-SHA256 signature
- **JazzCash**: Uses HMAC-SHA256 signature with specific header format
- **EasyPaisa**: Verifies amount matches and response code

### 5. Reviews & Ratings

**Review System:**
- Students can only review after stay is COMPLETED
- One review per student per hostel per stay
- Review includes: rating (1-5 stars), comment, images
- Anonymity option available
- Admin can moderate/delete inappropriate reviews

**Statistics Tracked:**
- Average rating per hostel
- Rating distribution (1-5 star counts)
- Total review count
- Recent reviews displayed on hostel detail page

### 6. Notifications & Alerts

**Price Alerts:**
- Students set target price for hostels
- Target price must be lower than current price (prevents immediate triggers)
- Background job checks prices every 6 hours
- Email sent when hostel price drops below target
- Alert auto-disables after trigger to prevent spam

**Booking Notifications:**
- Confirmation email after payment
- Reminder before check-in
- Checkout reminder
- Review invitation after stay completion

### 7. Admin Dashboard

**Owner Functions:**
- Create and manage hostel listings
- Upload hostel images (to R2)
- Set pricing and availability calendar
- View booking history
- Respond to reviews
- Track revenue and analytics

**Admin Functions:**
- Approve/reject hostel listings
- Suspend/reactivate hostels
- View all bookings and revenue
- Moderate reviews
- Generate reports and analytics
- Manage user accounts

---

## Database Schema (Key Tables)

### Users
```
id, email, password (hashed), name, avatar, phone, emailVerified, phoneVerified, role, tokenVersion, createdAt
```

### Hostels
```
id, ownerId, name, slug, description, address, city, lat, lng, images[], amenities[], 
pricePerMonth, verified, active, rating, reviewCount, createdAt, updatedAt
```

### Bookings
```
id, userId, hostelId, roomId, checkIn, checkOut, months, total (in PKR), status, paymentStatus, 
transactionId, createdAt, updatedAt
```

### Reviews
```
id, userId, hostelId, bookingId, rating, comment, images[], anonymous, createdAt
```

### PriceAlerts
```
id, userId, hostelId, targetPrice, active, createdAt
```

### Notifications
```
id, userId, type, content, read, link, createdAt
```

---

## Security Considerations

### Authentication
- Passwords hashed with bcryptjs (10 rounds)
- Session tokens validated on every request
- Password reset tokens are single-use and time-limited
- Email verification required before booking eligibility

### Authorization
- Role-based access control (RBAC) on all sensitive endpoints
- Row-level security: users can only access their own bookings/alerts
- Owners only see their own hostels
- Admins have full platform access

### Data Protection
- All API routes require authentication (except public search)
- User email never logged in audit trails (undefined risk)
- Admin actions logged with user ID for audit trail
- Payment details never stored (PCI compliance via gateway)

### Payment Security
- HMAC signature verification on all callbacks
- Amount verification prevents tampering
- IP allowlisting available (defense-in-depth)
- No sensitive data logged

### File Uploads
- Images stored on R2 (isolated from application)
- MIME type validation (only JPEG, PNG, WebP)
- File size limits enforced
- R2 keys include random bytes for uniqueness
- Public URL allowlisting in CSP

---

## Cron Jobs

### 1. `mark-completed-stays` (Daily, midnight UTC)
- Finds CONFIRMED bookings where checkout date has passed
- Transitions to COMPLETED status
- Enables review system for past stays
- **Auth:** Upstash QStash with Bearer token validation

### 2. `check-price-alerts` (Every 6 hours)
- Checks current hostel prices
- Compares against active price alerts
- Sends email if price drops below alert threshold
- Auto-disables alert to prevent spam
- **Auth:** Upstash QStash with Bearer token validation

### 3. `cancel-abandoned-payments` (Every 5 minutes)
- Finds PENDING bookings older than 30 minutes
- Cancels booking and restores room availability
- Prevents stale bookings from blocking rooms
- **Auth:** Upstash QStash with Bearer token validation

**Auth Pattern:** All cron jobs use `verifyUpstashRequest()` with `acceptBearerToken: true` to accept Bearer tokens from Vercel/Upstash. Requires `CRON_SECRET` env var set in both Vercel and `.env.local`.

---

## Recent Fixes & Improvements (May 4, 2026)

### Security
- ✅ Removed password logging from signup endpoint
- ✅ Removed undefined email exposure from admin audit logs
- ✅ Added session invalidation validation in auth config
- ✅ Standardized cron auth with `verifyUpstashRequest()`

### Validation & UX
- ✅ Strengthened reset-password validation (uppercase + number required)
- ✅ Added price alert validation (target must be below current price)

### Data Integrity
- ✅ Fixed currency bug: removed incorrect /100 division from PKR display (4 components)
- ✅ Added random bytes to R2 upload keys for uniqueness

### Code Quality
- ✅ Fixed error handling in admin/hostels (log errors, return 500)
- ✅ Made sendEmail calls fire-and-forget (non-blocking)
- ✅ Removed unused imports and schemas
- ✅ Documented critical environment variables

---

## Deployment

**Platform:** Vercel (serverless)
- Edge Functions for middleware
- Node.js functions for API routes
- Static exports for public pages
- Environment variables managed in Vercel dashboard

**Build Process:**
1. TypeScript compiled to JavaScript
2. Next.js optimizes bundles
3. CSS Modules scoped to components
4. Images optimized via `next/image`
5. Static pages pre-generated at build time

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection
- `AUTH_SECRET`: NextAuth secret
- `CRON_SECRET`: Cron job verification
- Payment gateway credentials (SafePay, JazzCash, EasyPaisa)
- `UPSTASH_REDIS_*`: Redis cache/rate limiting
- `R2_*`: Cloudflare R2 storage credentials
- `TYPESENSE_*`: Search engine credentials
- `RESEND_API_KEY`: Email service
- `TWILIO_*`: SMS service

---

## Performance & Scaling

### Caching
- Redis cache for price alerts, rate limits, sessions
- Cache TTL ~30 seconds for token version checks
- Typesense caches full-text search results

### Rate Limiting
- Login endpoint: 5 attempts per minute
- Booking creation: 10 per minute per user
- Email verification: 3 attempts per hour
- General API: 100 requests per minute per user

### Optimization
- Next.js incremental static regeneration (ISR)
- Image lazy loading via `next/image`
- Typesense for efficient search (avoids DB table scans)
- Database connection pooling via Neon

### Monitoring
- Error logging via console + external services
- Cron job success/failure tracking
- Payment callback verification with detailed logs
- Session validation with audit trail

---

## Future Roadmap

- [ ] Neon Auth integration for managed authentication
- [ ] Neon Data API for HTTP-based database access
- [ ] Advanced analytics dashboard for owners
- [ ] Wishlists and bookmarks
- [ ] Referral system
- [ ] Multi-currency support
- [ ] Hostel verification photos
- [ ] 24/7 support chat

---

## Development

### Setup
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Key Commands
```bash
npx prisma studio          # Database GUI
npx tsx scripts/setup-typesense.ts  # Initialize search
npm run build              # Production build
npm run start              # Production server
```

---

*Last updated: May 4, 2026*
