# HostelLo

Pakistan's student hostel booking platform.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix primitives)
- **Animations**: Framer Motion 11
- **State**: Zustand 5 + TanStack Query 5
- **ORM**: Prisma 5 + PostgreSQL (Neon)
- **Auth**: NextAuth v5 (JWT strategy)
- **Fonts**: Playfair Display + Plus Jakarta Sans

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in at minimum:

```
DATABASE_URL=        # Neon PostgreSQL connection string
AUTH_SECRET=         # Run: openssl rand -base64 32
```

### 3. Push schema to database

```bash
npm run db:generate
npm run db:push
```

### 4. Seed with sample data

```bash
npm run db:seed
```

This creates:
- 4 hostels (2 Lahore, 2 Islamabad)
- Test accounts (see `prisma/seed.ts` for credentials)

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup (no navbar)
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/              # Public-facing pages (with navbar + footer)
│   │   ├── page.tsx         # Homepage
│   │   └── hostels/
│   │       ├── page.tsx     # Search / listing page
│   │       ├── [slug]/      # Hostel detail
│   │       └── compare/     # Side-by-side compare
│   └── api/
│       ├── auth/            # NextAuth handler + signup
│       ├── hostels/         # CRUD + favorites
│       └── bookings/        # Booking creation + listing
├── components/
│   ├── layout/              # Navbar, Footer
│   ├── shared/              # Logo, reusable atoms
│   └── features/
│       ├── home/            # Homepage sections
│       ├── hostels/         # Cards, gallery, amenities, reviews
│       ├── search/          # Filters, results, pagination
│       └── booking/         # Booking widget
├── config/
│   └── amenities.ts         # Single source of truth for amenity labels/icons
├── lib/
│   ├── auth/config.ts       # NextAuth config
│   ├── db.ts                # Prisma singleton
│   ├── utils.ts             # cn, formatPrice, formatDate, …
│   └── validations.ts       # Shared Zod schemas
├── stores/
│   └── compare.ts           # Zustand compare store (persisted)
├── hooks/
│   └── use-debounce.ts
└── types/
    └── index.ts             # Shared TypeScript types
```

## Key design decisions

**Optimistic locking on bookings**: Each `Room` has a `version` column. Concurrent booking attempts that pass availability checks are resolved at the DB level — the second write fails and the user sees a "just became unavailable" message rather than a double-booking.

**Server Components first**: The homepage, search results, and hostel detail page are all Server Components fetching directly from Prisma. Client Components are used only where interactivity is needed (filters, gallery, booking widget, compare store).

**Single source of truth for amenities**: `src/config/amenities.ts` defines every amenity label, emoji, and category. Nothing else hard-codes amenity display names.

**Logical Tailwind properties throughout**: All directional classes use `ps`/`pe`/`text-start`/`text-end` instead of `pl`/`pr`/`text-left`/`text-right`. Switching to Urdu (RTL) in Phase 2 won't require a layout refactor.

## Test accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hostello.pk | admin123456 |
| Owner | ali.raza@hostello.pk | owner123456 |
| Owner | sara.khan@hostello.pk | owner123456 |
| Student | hamza@hostello.pk | student123456 |

## Roadmap

See `STRATEGY.md` for the full 12-week build plan.
