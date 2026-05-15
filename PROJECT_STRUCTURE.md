# Hostello Project File Structure

A comprehensive hostel booking platform built with Next.js, React, TypeScript, Prisma ORM, and supporting mobile app in React Native.

```
hostello/
│
├── 📄 Configuration & Build Files
├── package.json                          # Project dependencies, scripts, npm config
├── package-lock.json                     # Locked npm dependency versions
├── tsconfig.json                         # TypeScript compiler configuration
├── next.config.ts                        # Next.js build & optimization config
├── postcss.config.js                     # PostCSS for Tailwind CSS
├── tailwind.config.js                    # Tailwind CSS theme & configuration
├── eslint.config.mjs                     # ESLint rules for JS/TS linting
├── vitest.config.ts                      # Vitest test runner configuration
├── components.json                       # shadcn/ui components config
├── vercel.json                           # Vercel deployment configuration
├── prisma.config.ts                      # Prisma ORM configuration
├── next-env.d.ts                         # Generated Next.js types
├── tsconfig.tsbuildinfo                  # TypeScript build cache
├── skills-lock.json                      # Agent customization lock file
│
├── 📋 Environment & Setup
├── .env                                  # Local environment variables (git-ignored)
├── .env.example                          # Environment variables template
├── .env.production.local                 # Production env vars (git-ignored)
├── .env.sentry.example                   # Sentry config example
├── .gitignore                            # Git ignore rules
├── .gitattributes                        # Git attributes (line endings)
├── .graphifyignore                       # Files to exclude from graphify
│
├── 📊 Instrumentation & Monitoring
├── instrumentation.ts                    # Application monitoring setup
├── sentry.client.config.ts               # Sentry client-side error tracking
├── sentry.edge.config.ts                 # Sentry Edge functions config
├── sentry.server.config.ts               # Sentry server-side config
│
├── 📚 Documentation
├── MASTER_PLAN.md                        # High-level project roadmap
├── SYSTEM.md                             # System architecture & design
├── DESIGN.md                             # Frontend design guidelines
├── DESIGN_MOBILE.md                      # Mobile app design specs
├── MOBILE_APP_STRATEGY.md                # Mobile app development strategy
├── MOBILE_ALIGNMENT.md                   # Web & mobile alignment
├── AGENTS.md                             # Agent & MCP tools documentation
├── CLAUDE.md                             # Claude agent configuration
├── GEMINI.md                             # Gemini agent configuration
├── QODER.md                              # Qoder tool documentation
├── SENTRY_SETUP.md                       # Sentry setup guide
│
├── 🛠️ Tool Configuration Directories
├── .vscode/                              # VS Code workspace settings
├── .github/
│   ├── code-review-graph.instruction.md
│   └── workflows/                        # GitHub Actions CI/CD
├── .agents/
│   └── skills/                           # Agent skill definitions
├── .claude/
│   ├── settings.json
│   ├── settings.json.bak
│   └── skills/                           # Claude skill configs
├── .code-review-graph/                   # Code review graph cache
├── .cursor/                              # Cursor AI editor config
├── .gemini/                              # Gemini AI config
├── .kiro/                                # Kiro config
├── .mcp.json                             # Model Context Protocol config
├── .opencode.json                        # OpenCode config
├── .qoder/                               # Qoder config
├── .impeccable-live/                     # Impeccable design config
├── .impeccable-live.json                 # Impeccable design tool config
├── .windsurfrules                        # Windsurf IDE rules
│
├── 🔧 Build & Cache Directories (git-ignored)
├── .next/                                # Next.js build output
├── node_modules/                         # NPM dependencies
├── .git/                                 # Git version control
│
├── 📂 MAIN APPLICATION - src/
├── src/
│   │
│   ├── 📍 Root Application Setup
│   ├── middleware.ts                     # Next.js middleware (auth, redirects)
│   │
│   ├── 📄 App Router (Next.js 13+)
│   └── app/
│       │
│       ├── 📑 Root Level Pages
│       ├── layout.tsx                    # Root layout with global providers
│       ├── page.tsx                      # Home page
│       ├── error.tsx                     # Error boundary component
│       ├── global-error.tsx              # Global error handler
│       ├── globals.css                   # Global CSS styles
│       │
│       ├── 🔐 Authentication Pages Group
│       └── (auth)/
│           ├── signup/                   # User signup flows
│           ├── login/
│           │   └── page.tsx              # Login page
│           ├── register/
│           │   └── page.tsx              # Registration page
│           ├── forgot-password/
│           │   └── page.tsx              # Password reset request
│           ├── reset-password/
│           │   └── page.tsx              # Password reset confirmation
│           └── verify-email-sent/
│               └── page.tsx              # Email verification status
│       │
│       ├── 🔌 API Routes
│       └── api/
│           ├── auth/                     # NextAuth.js endpoints
│           ├── admin/                    # Admin panel APIs
│           ├── bookings/                 # Booking management APIs
│           ├── contact/                  # Contact form endpoints
│           ├── conversations/            # Messaging APIs
│           ├── cron/                     # Background job triggers
│           ├── hostels/                  # Hostel data APIs
│           ├── notifications/            # Notification delivery
│           ├── payment/                  # Payment processing
│           ├── price-alerts/             # Price alert endpoints
│           ├── profile/                  # User profile APIs
│           ├── report/                   # Analytics & reporting
│           ├── reviews/                  # Review management
│           └── upload/                   # File upload handlers
│       │
│       ├── 📊 Feature Pages
│       ├── admin/                        # Admin dashboard pages
│       ├── owner/                        # Hostel owner management
│       ├── dashboard/                    # User dashboard
│       ├── booking/                      # Booking flow
│       └── hostels/                      # Hostel listings & details
│
│   ├── 🎨 React Components - components/
│   └── components/
│       │
│       ├── 🏗️ Layout Components
│       ├── Navbar.tsx                    # Main navigation bar
│       ├── Footer.tsx                    # Footer component
│       ├── Providers.tsx                 # Global React Query, Theme, etc.
│       ├── AccountMenu.tsx               # User account dropdown
│       ├── NotificationBell.tsx          # Notification bell icon
│       ├── booking-dialog.tsx            # Booking modal dialog
│       ├── index.ts                      # Component exports
│       └── layout/                       # Layout wrapper components
│       │
│       ├── 🔐 Authentication Components
│       ├── auth/
│       │   └── AuthCardLayout.tsx        # Auth page card layout
│       │
│       ├── 🎯 Feature Components
│       ├── landing/                      # Landing page components
│       ├── booking/                      # Booking flow components
│       ├── dashboard/                    # Dashboard-specific UI
│       ├── hostel/                       # Hostel listing & details
│       ├── owner/                        # Owner management UI
│       │
│       ├── 🎨 UI Component Library (Radix + Tailwind)
│       └── ui/                           # Reusable UI components
│           ├── avatar.tsx                # Avatar display
│           ├── badge.tsx                 # Badge/tag component
│           ├── button.tsx                # Button variants
│           ├── calendar.tsx              # Date picker
│           ├── card.tsx                  # Card container
│           ├── dialog.tsx                # Modal dialog
│           ├── dropdown-menu.tsx         # Dropdown menu
│           ├── form.tsx                  # Form wrapper
│           ├── input.tsx                 # Text input
│           ├── label.tsx                 # Form label
│           ├── navigation-menu.tsx       # Navigation menu
│           ├── popover.tsx               # Popover tooltip
│           ├── radio-group.tsx           # Radio buttons
│           ├── select.tsx                # Dropdown select
│           ├── separator.tsx             # Divider
│           ├── shared.tsx                # Shared UI utilities
│           ├── skeleton.tsx              # Loading skeleton
│           ├── table.tsx                 # Table component
│           ├── tabs.tsx                  # Tab navigation
│           ├── textarea.tsx              # Text area input
│           ├── toast.tsx                 # Toast notification
│           └── toaster.tsx               # Toast container
│
│   ├── 🪝 React Hooks - hooks/
│   └── hooks/
│       └── use-toast.ts                  # Toast notification hook
│
│   ├── 🔧 Library Services & Utilities - lib/
│   └── lib/
│       │
│       ├── 💾 Core Database & Config
│       ├── db.ts                         # Prisma client instance
│       ├── app-url.ts                    # App URL utilities
│       ├── env-validation.ts             # Environment validation
│       ├── csrf.ts                       # CSRF token validation
│       │
│       ├── 🔐 Authentication Services
│       ├── auth/
│       │   ├── config.ts                 # NextAuth.js config
│       │   ├── session.ts                # Session management
│       │   └── token-version-cache.ts    # Token versioning cache
│       │
│       ├── 📖 Feature Services
│       ├── booking-service.ts            # Booking logic & operations
│       ├── hostel-service.ts             # Hostel data management
│       ├── hostel-search.ts              # Hostel search & filtering
│       ├── price-alerts.ts               # Price alert notifications
│       │
│       ├── 💳 Payment Integration
│       ├── payment-methods.ts            # Payment configuration
│       ├── easypaisa.ts                  # EasyPaisa gateway
│       ├── jazzcash.ts                   # JazzCash gateway
│       └── safepay.ts                    # SafePay gateway
│       │
│       ├── 📧 External Services
│       ├── firebase-admin.ts             # Firebase Admin SDK
│       ├── email.ts                      # Email sending service
│       ├── email-templates/              # HTML email templates
│       ├── sms.ts                        # SMS notifications
│       ├── notifications.ts              # Push notifications
│       ├── typesense.ts                  # Typesense search client
│       └── typesense-sync.ts             # Search index sync
│       │
│       ├── 🔒 Infrastructure & Security
│       ├── gateway-ip-allowlist.ts       # IP whitelist for gateways
│       ├── rate-limit.ts                 # Rate limiting config
│       ├── verify-upstash.ts             # Upstash Redis verify
│       ├── routes-manifest.ts            # Route manifest patching
│       │
│       ├── 🛠️ General Utilities
│       ├── utils.ts                      # General utilities
│       ├── validations.ts                # Data validation schemas
│       └── support.ts                    # Support utilities
│       │
│       ├── ✅ Test Files
│       ├── bookings.test.ts              # Booking service tests
│       ├── reviews.integration.test.ts   # Reviews integration tests
│       └── validations.test.ts           # Validation tests
│
│   ├── ⚙️ Configuration - config/
│   └── config/
│       ├── constants.ts                  # App-wide constants
│       ├── amenities.ts                  # Hostel amenities config
│       └── universities.ts               # University listings
│
│   └── 📘 TypeScript Types - types/
│       └── types/
│           └── index.ts                  # Centralized type exports
│
├── 📱 MOBILE APP - apps/mobile/
├── apps/
│   └── mobile/
│       │
│       ├── 🎯 Mobile App Root
│       ├── App.tsx                       # Root React Native component
│       ├── app.json                      # Expo app configuration
│       ├── index.ts                      # App entry point
│       ├── package.json                  # Mobile dependencies
│       └── tsconfig.json                 # Mobile TypeScript config
│       │
│       ├── 📱 Mobile App Structure
│       ├── app/                          # Mobile screens & navigation
│       ├── src/                          # Mobile source code (components, hooks)
│       └── assets/                       # Images, fonts, static files
│
├── 📦 SHARED MONOREPO PACKAGE - packages/shared/
├── packages/
│   └── shared/
│       │
│       ├── package.json                  # Shared package config
│       │
│       └── src/                          # Shared source code
│           ├── api/                      # Shared API utilities
│           ├── types/                    # Shared TypeScript types
│           ├── constants/                # Shared constants
│           ├── utils/                    # Shared utility functions
│           ├── validations/              # Shared validation schemas
│           └── index.ts                  # Main export file
│
├── 🗄️ DATABASE - prisma/
├── prisma/
│   │
│   ├── 📊 Schema & Configuration
│   ├── schema.prisma                     # Prisma ORM schema definition
│   ├── client.ts                         # Prisma client config
│   ├── seed.ts                           # Database seeding script
│   │
│   └── 🔄 Database Migrations
│       └── migrations/
│           ├── migration_lock.toml       # Migration lock file
│           ├── 0_init/
│           │   └── migration.sql         # Initial database schema
│           ├── 1_currency_int/
│           │   └── migration.sql         # Currency data type migration
│           ├── 2_add_notifications/
│           │   └── migration.sql         # Notifications table
│           ├── 3_add_phone_verification/
│           │   └── migration.sql         # Phone verification
│           ├── 4_add_last_known_price/
│           │   └── migration.sql         # Price tracking
│           ├── 20260426075853_add_conversation_participants_table/
│           │   └── migration.sql         # Conversation participants
│           └── 20260510065319_add_device_token/
│               └── migration.sql         # Device token storage
│
├── 🔨 BUILD & AUTOMATION SCRIPTS - scripts/
├── scripts/
│   ├── patch-routes-manifest.mjs         # Patch Next.js routes manifest post-build
│   ├── schedule-cron-jobs.ts             # Setup background job scheduling
│   ├── check-price-alerts.ts             # Price alert checker/trigger
│   ├── reset-review-stats.ts             # Review stats reset utility
│   ├── fix-phantom-reviews.ts            # Fix corrupted review data
│   ├── setup-typesense.ts                # Typesense index initialization
│   ├── verify-typesense-fallback.ts      # Typesense fallback verification
│   ├── Check-Gitignore.ps1               # PowerShell gitignore validator
│   └── One-Time-Migration.ps1            # PowerShell migration utility
│
├── 🌐 PUBLIC ASSETS - public/
├── public/
│   └── .well-known/                      # Well-known config files (ACME challenges)
│
├── 📊 CODE ANALYSIS OUTPUT - graphify-out/
├── graphify-out/
│   │
│   ├── 📈 Analysis Artifacts
│   ├── graph.json                        # Code dependency graph (JSON)
│   ├── graph.html                        # Visualized dependency graph
│   ├── hostello-callflow.html            # Call flow visualization
│   ├── GRAPH_REPORT.md                   # Analysis report & findings
│   ├── cost.json                         # Analysis cost metrics
│   │
│   ├── 🐍 Analysis Scripts
│   ├── detect_summary.py                 # Change detection summary
│   ├── step2_detect.py                   # Change detection script
│   ├── step3a_ast.py                     # Abstract Syntax Tree generation
│   ├── step3c_merge.py                   # Graph merge logic
│   ├── step4_build_graph.py              # Graph builder script
│   ├── step5_label_communities.py        # Community detection
│   ├── step9_cleanup.py                  # Cleanup operations
│   │
│   └── cache/                            # AST & analysis cache
│       └── ast/                          # AST cache files
│
├── ✅ ROOT LEVEL UTILITIES
├── test.py                               # Python test utility script
│
└── 📊 PROJECT METADATA (hidden/git)
    ├── .git/                             # Git version control
    ├── .gitignore                        # Git ignore patterns
    ├── .github/                          # GitHub config
    └── node_modules/                     # NPM packages (git-ignored)
```

---

## Directory Hierarchy Summary

### **Tier 1: Project Root**
Configuration, environment, and documentation at the top level.

### **Tier 2: Application Source** (`/src`)
- **app/**: Next.js pages and API routes
- **components/**: React component library
- **hooks/**: Custom React hooks
- **lib/**: Business logic and services
- **config/**: Constants and configuration
- **types/**: TypeScript definitions

### **Tier 3: Mobile App** (`/apps/mobile`)
React Native + Expo separate mobile application.

### **Tier 4: Shared Code** (`/packages/shared`)
Monorepo shared utilities for web and mobile.

### **Tier 5: Database** (`/prisma`)
Schema definition and 8 migration versions.

### **Tier 6: Build & Analysis**
- `/scripts`: Automation and build helpers
- `/graphify-out`: Code analysis outputs
- `/public`: Static assets
- `/.next`, `/node_modules`: Build artifacts (git-ignored)

---

## Key File Organization Principles

| Principle | Implementation |
|-----------|---|
| **Separation of Concerns** | Pages, Components, Services in separate directories |
| **Feature Grouping** | Related UI in `/components/{feature}`, APIs in `/api/{feature}` |
| **Reusable UI** | All UI components in `/components/ui/` with Radix + Tailwind |
| **Business Logic** | Services in `/lib/{feature}.ts` or `/lib/{feature}/` |
| **Authentication** | Centralized in `/lib/auth/` with NextAuth config |
| **External Services** | Payment, Email, SMS, Search each in dedicated files |
| **Database** | Single `/prisma` with schema and migrations |
| **Monorepo** | Shared package at `/packages/shared/` |

---

## Tech Stack by Directory

| Layer | Technology | Location |
|-------|-----------|----------|
| **Framework** | Next.js 15+ | `/src/app`, `next.config.ts` |
| **UI Library** | React + Radix UI + Tailwind | `/src/components/ui` |
| **Language** | TypeScript | Throughout `**/*.ts(x)` |
| **Database** | PostgreSQL + Prisma ORM | `/prisma/**` |
| **Authentication** | NextAuth.js | `/src/lib/auth/` |
| **Search** | Typesense | `/src/lib/typesense*` |
| **Payments** | EasyPaisa, JazzCash, SafePay | `/src/lib/*paisa.ts`, `jazzcash.ts`, `safepay.ts` |
| **Notifications** | Firebase, Push, SMS | `/src/lib/notifications.ts` |
| **Error Tracking** | Sentry | `sentry.*.config.ts` |
| **Mobile** | React Native + Expo | `/apps/mobile/**` |
| **State Management** | React Query | `package.json` |
| **Code Analysis** | Graphify | `/graphify-out/**` |

---

## File Naming Conventions

- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx`
- **Components**: PascalCase (e.g., `Navbar.tsx`)
- **Utilities**: camelCase (e.g., `db.ts`, `utils.ts`)
- **Types**: `index.ts` for exports
- **Tests**: `*.test.ts` or `*.integration.test.ts`
- **Config**: `*.config.ts` or `*.config.js`

---

## Development Workflow

```
Root Files → Environment Setup → src/ → Database → Build
   ↓              ↓                ↓        ↓        ↓
Config    .env Config      App Logic   Schema   Scripts
          Secrets          & UI        & Migrations
```

---

*Last Updated: 2026-05-14*
*Project: Hostello - Hostel Booking Platform*
