# HostelLo Web UI/UX Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first trust-led UX slice for HostelLo: shared state primitives, homepage trust support, search comparison clarity, hostel-card trust hierarchy, hostel-detail trust summary, and booking/payment confidence.

**Architecture:** Keep the existing Next.js, React Query, Tailwind token, Prisma/API, and shadcn-style component boundaries. Add focused reusable UI primitives in `src/components/ui/shared.tsx`, then apply them to public student conversion surfaces without touching owner/admin workflows in this phase.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS tokens, lucide-react, Vitest, Playwright.

**Current status (June 1, 2026 audit):** Implemented in the current repo. The referenced shared primitives, homepage/search trust cues, hostel card/detail trust components, booking summary updates, and related tests/specs are present. This file is retained as the implementation plan artifact; use `WEB_APP_PROGRESS.md` for current project status.

---

## Scope Check

The approved design spec covers the full web app. This plan intentionally implements only the first independent slice:

- Shared UX primitives for trust, recovery, and next-action states.
- Homepage trust support.
- Search result context and empty-state recovery.
- Hostel card trust hierarchy.
- Hostel detail trust summary.
- Booking review/payment/confirmation confidence copy and states.

Owner dashboards, admin queues, listing wizard polish, student account continuity, and final full-app QA get separate plans after this slice is complete.

## File Structure

- Modify `src/components/ui/shared.tsx`: add reusable `TrustCue`, `TrustCueList`, `RecoveryNotice`, and enhance `EmptyState` with a compact variant.
- Create `src/components/ui/shared.test.tsx`: server-render tests for the new shared primitives.
- Modify `src/app/page.tsx`: add a compact trust proof row near the hero search.
- Modify `src/app/page.test.tsx`: verify signed-in student owner CTA behavior still holds and trust proof renders.
- Modify `e2e/homepage.spec.ts`: verify search remains first-class and trust proof appears.
- Modify `src/app/hostels/SearchPageClient.tsx`: improve result context, active filters, empty-state recovery, and fallback-search copy.
- Modify `e2e/search.spec.ts`: verify city context, filter controls, and clear-filter recovery.
- Modify `src/components/hostel/HostelCard.tsx`: strengthen card trust hierarchy without changing data shape.
- Create `src/components/hostel/HostelCard.test.tsx`: server-render tests for card price, verification, safety, and rating output.
- Create `src/components/hostel/TrustSummary.tsx`: reusable detail-page trust summary for verified, safety, reviews, owner, rooms, and location.
- Create `src/components/hostel/TrustSummary.test.tsx`: server-render tests for trust summary labels and missing-state behavior.
- Modify `src/app/hostels/[slug]/page.tsx`: place `TrustSummary` in the detail page header area and keep tabs focused on deeper detail.
- Modify `src/components/booking/BookingSummaryCard.tsx`: add status/payment hints and clearer total breakdown.
- Create `src/components/booking/BookingSummaryCard.test.tsx`: server-render tests for dates, total, and status hints.
- Modify `src/app/booking/[id]/review/page.tsx`: make trust and cancellation/payment recovery copy clearer.
- Modify `src/app/booking/[id]/payment/page.tsx`: make payment method state and retry copy clearer.
- Modify `src/app/booking/[id]/confirmation/page.tsx`: make pending/cancelled/success next steps clearer.
- Modify `e2e/booking-flow.spec.ts`: verify booking confidence cues remain visible through review and dashboard states.

Every task must stage only the files named in that task. The worktree is already dirty, so do not reset or stage unrelated changes.

---

### Task 1: Shared Trust And Recovery Primitives

**Files:**
- Modify: `src/components/ui/shared.tsx`
- Create: `src/components/ui/shared.test.tsx`

- [ ] **Step 1: Write failing tests for shared primitives**

Create `src/components/ui/shared.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShieldCheck, Search } from "lucide-react";
import {
  EmptyState,
  RecoveryNotice,
  TrustCue,
  TrustCueList,
} from "@/components/ui/shared";

describe("shared UI trust and recovery primitives", () => {
  it("renders a trust cue with icon, label, and value", () => {
    const markup = renderToStaticMarkup(
      <TrustCue icon={ShieldCheck} label="Verified" value="Listing checked" />,
    );

    expect(markup).toContain("Verified");
    expect(markup).toContain("Listing checked");
  });

  it("renders multiple trust cues as a labelled list", () => {
    const markup = renderToStaticMarkup(
      <TrustCueList
        ariaLabel="Booking trust signals"
        cues={[
          { icon: ShieldCheck, label: "Payment", value: "Secured by Safepay" },
          { icon: Search, label: "Photos", value: "Uploaded by owner" },
        ]}
      />,
    );

    expect(markup).toContain("Booking trust signals");
    expect(markup).toContain("Secured by Safepay");
    expect(markup).toContain("Uploaded by owner");
  });

  it("renders a recovery notice with primary and secondary actions", () => {
    const markup = renderToStaticMarkup(
      <RecoveryNotice
        tone="warning"
        title="Payment pending"
        message="Your payment is still being verified."
        primaryAction={<a href="/dashboard/bookings">View booking</a>}
        secondaryAction={<a href="/hostels">Find another hostel</a>}
      />,
    );

    expect(markup).toContain("Payment pending");
    expect(markup).toContain("View booking");
    expect(markup).toContain("Find another hostel");
  });

  it("supports compact empty states for dashboard panels and search recovery", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        icon={Search}
        heading="No hostels match your filters"
        description="Clear filters or search a nearby city."
        compact
      />,
    );

    expect(markup).toContain("No hostels match your filters");
    expect(markup).toContain("py-10");
  });
});
```

- [ ] **Step 2: Run the failing shared primitive tests**

Run: `npx vitest run src/components/ui/shared.test.tsx`

Expected: FAIL with missing exports for `TrustCue`, `TrustCueList`, and `RecoveryNotice`, and missing `compact` support on `EmptyState`.

- [ ] **Step 3: Implement shared primitives**

Modify `src/components/ui/shared.tsx`:

```tsx
import { LucideIcon, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        compact ? "py-10" : "py-16",
      )}
    >
      <Icon
        size={compact ? 32 : 40}
        strokeWidth={1.5}
        className="mb-4 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <h3 className="mb-2 text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]">
        {heading}
      </h3>
      {description && (
        <p className="mb-6 max-w-[55ch] text-[var(--text-body)] text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

interface TrustCueProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "trust" | "neutral" | "warning";
}

const TRUST_CUE_TONES = {
  trust:
    "border-[var(--color-success)/0.18] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  neutral:
    "border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] text-[var(--color-text-body)]",
  warning:
    "border-[var(--color-warning)/0.22] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
};

export function TrustCue({
  icon: Icon,
  label,
  value,
  tone = "trust",
}: TrustCueProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2",
        TRUST_CUE_TONES[tone],
      )}
    >
      <Icon size={15} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.06em]">
          {label}
        </p>
        <p className="truncate text-[var(--text-body-sm)] font-[500]">{value}</p>
      </div>
    </div>
  );
}

interface TrustCueListProps {
  ariaLabel: string;
  cues: TrustCueProps[];
}

export function TrustCueList({ ariaLabel, cues }: TrustCueListProps) {
  if (cues.length === 0) return null;

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="list"
      aria-label={ariaLabel}
    >
      {cues.map((cue) => (
        <div key={`${cue.label}-${cue.value}`} role="listitem">
          <TrustCue {...cue} />
        </div>
      ))}
    </div>
  );
}

interface RecoveryNoticeProps {
  tone?: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

const RECOVERY_TONES = {
  info: "border-[var(--color-info)/0.2] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning:
    "border-[var(--color-warning)/0.25] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  error: "border-[var(--color-error)/0.2] bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  success:
    "border-[var(--color-success)/0.2] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
};

export function RecoveryNotice({
  tone = "info",
  title,
  message,
  primaryAction,
  secondaryAction,
}: RecoveryNoticeProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[var(--radius-lg)] border p-4", RECOVERY_TONES[tone])}>
      <p className="text-[var(--text-body-sm)] font-[700]">{title}</p>
      <p className="mt-1 text-[var(--text-body-sm)] leading-relaxed">{message}</p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
```

Keep the existing exports below this new code: `PageSpinner`, `InlineError`, `StatusBadge`, skeleton components, `SearchDegradedNotice`, and `formatPKR`.

- [ ] **Step 4: Run shared primitive tests**

Run: `npx vitest run src/components/ui/shared.test.tsx`

Expected: PASS, 4 tests pass.

- [ ] **Step 5: Commit shared primitive changes**

Run:

```bash
git add -- src/components/ui/shared.tsx src/components/ui/shared.test.tsx
git commit -m "Add shared trust and recovery UI primitives"
```

Expected: commit includes only the two files listed above.

---

### Task 2: Homepage Trust Proof Near Search

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `e2e/homepage.spec.ts`

- [ ] **Step 1: Add failing homepage trust tests**

Add to `src/app/page.test.tsx`:

```tsx
it("shows trust proof near the search experience", async () => {
  vi.mocked(auth).mockResolvedValue(null);

  const markup = renderToStaticMarkup(await HomePage());

  expect(markup).toContain("Verified hostel listings");
  expect(markup).toContain("Real prices before you call");
  expect(markup).toContain("Secure booking handoff");
});
```

Add to `e2e/homepage.spec.ts`:

```ts
test("homepage shows trust proof near search", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/verified hostel listings/i)).toBeVisible();
  await expect(page.getByText(/real prices before you call/i)).toBeVisible();
  await expect(page.getByText(/secure booking handoff/i)).toBeVisible();
});
```

- [ ] **Step 2: Run failing homepage tests**

Run: `npx vitest run src/app/page.test.tsx`

Expected: FAIL because trust proof labels are not rendered.

- [ ] **Step 3: Implement homepage trust proof row**

Modify `src/app/page.tsx` imports:

```tsx
import {
  Calendar,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Tags,
} from "lucide-react";
```

Add this component above `HomePage`:

```tsx
function HeroTrustProof() {
  const items = [
    {
      icon: ShieldCheck,
      label: "Verified hostel listings",
      description: "Listings are reviewed before students book.",
    },
    {
      icon: Tags,
      label: "Real prices before you call",
      description: "Monthly rent is visible before you message.",
    },
    {
      icon: CheckCircle2,
      label: "Secure booking handoff",
      description: "Payment and status updates stay inside HostelLo.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="HostelLo trust proof">
      {items.map(({ icon: Icon, label, description }) => (
        <div
          key={label}
          className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-3 shadow-[var(--shadow-xs)]"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Icon size={15} strokeWidth={1.5} className="text-[var(--color-action)]" aria-hidden="true" />
            <p className="text-[var(--text-body-sm)] font-[700] text-[var(--color-text-heading)]">
              {label}
            </p>
          </div>
          <p className="text-[var(--text-caption)] leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
```

Render it directly after `<HeroSearch />`:

```tsx
<HeroSearch />
<HeroTrustProof />
```

- [ ] **Step 4: Run homepage tests**

Run: `npx vitest run src/app/page.test.tsx`

Expected: PASS.

Run: `npx playwright test e2e/homepage.spec.ts`

Expected: PASS when the local test server and seed data are healthy.

- [ ] **Step 5: Commit homepage trust proof**

Run:

```bash
git add -- src/app/page.tsx src/app/page.test.tsx e2e/homepage.spec.ts
git commit -m "Add homepage trust proof near search"
```

Expected: commit includes only the three files listed above.

---

### Task 3: Search Results Context And Recovery

**Files:**
- Modify: `src/app/hostels/SearchPageClient.tsx`
- Modify: `e2e/search.spec.ts`

- [ ] **Step 1: Add failing search E2E assertions**

Add to `e2e/search.spec.ts`:

```ts
test("empty search recovery offers clearing filters", async ({ page }) => {
  await page.goto("/hostels?city=Lahore&minPrice=49000&maxPrice=50000&gender=FEMALE");

  const emptyHeading = page.getByRole("heading", { name: /no hostels match your filters/i });
  const clearButton = page.getByRole("button", { name: /clear all filters/i });

  if (await emptyHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
    await expect(clearButton).toBeVisible();
  }
});

test("search controls expose active result context", async ({ page }) => {
  await page.goto("/hostels?city=Lahore");

  await expect(page.getByText(/hostels in lahore|no hostels found/i)).toBeVisible({
    timeout: 8000,
  });
});
```

- [ ] **Step 2: Run search test before implementation**

Run: `npx playwright test e2e/search.spec.ts`

Expected: the new context or empty recovery assertion fails if current copy does not match.

- [ ] **Step 3: Implement clearer search summary and recovery notice**

Modify `src/app/hostels/SearchPageClient.tsx` imports:

```tsx
import {
  PageSpinner,
  SkeletonCard,
  SearchDegradedNotice,
  EmptyState,
  InlineError,
  RecoveryNotice,
} from "@/components/ui/shared";
```

Replace `resultsSummary()` with:

```tsx
function resultsSummary(): string {
  if (!data) return "";
  const { total } = data;
  const cityLabel = filters.city ? ` in ${filters.city}` : "";
  const queryLabel = q ? ` for "${q}"` : "";
  if (total === 0) return `No hostels found${cityLabel}${queryLabel}`;
  return `${total.toLocaleString()} hostel${total === 1 ? "" : "s"}${cityLabel}${queryLabel}`;
}
```

Replace the empty-state block with:

```tsx
{!isLoading && data && data.data.length === 0 && (
  <div className="space-y-4">
    <RecoveryNotice
      tone="warning"
      title="No exact matches yet"
      message="Try clearing filters, widening your price range, or searching a nearby city."
      primaryAction={
        activeCount > 0 ? (
          <button
            onClick={handleReset}
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] px-4 text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)]"
          >
            Clear all filters
          </button>
        ) : undefined
      }
    />
    <EmptyState
      icon={Building2}
      heading="No hostels match your filters"
      description="Clear filters or search a nearby area to see more options."
      compact
    />
  </div>
)}
```

Keep the existing `handleReset` behavior unchanged so URL state and filters remain consistent.

- [ ] **Step 4: Run search tests**

Run: `npx playwright test e2e/search.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit search recovery changes**

Run:

```bash
git add -- src/app/hostels/SearchPageClient.tsx e2e/search.spec.ts
git commit -m "Improve search context and recovery states"
```

Expected: commit includes only the two files listed above.

---

### Task 4: Hostel Card Trust Hierarchy

**Files:**
- Modify: `src/components/hostel/HostelCard.tsx`
- Create: `src/components/hostel/HostelCard.test.tsx`

- [ ] **Step 1: Write failing card tests**

Create `src/components/hostel/HostelCard.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";

vi.mock("@/components/hostel/ShareButton", () => ({
  ShareButton: () => <button>Share</button>,
}));

const hostel: HostelCardData = {
  id: "h1",
  name: "North Campus Hostel",
  slug: "north-campus-hostel",
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 25000,
  gender: "FEMALE",
  amenities: ["WiFi", "Laundry"],
  coverImage: null,
  images: [],
  verified: true,
  featured: false,
  rating: 4.4,
  reviewCount: 12,
  safetyScore: 4.7,
  capacity: 30,
  rooms: 5,
  owner: { id: "owner-1", name: "Owner" },
};

describe("HostelCard", () => {
  it("renders price, verification, reviews, and safety as scannable trust signals", () => {
    const markup = renderToStaticMarkup(<HostelCard hostel={hostel} />);

    expect(markup).toContain("PKR 25,000");
    expect(markup).toContain("Verified");
    expect(markup).toContain("12 reviews");
    expect(markup).toContain("Safety 4.7");
  });

  it("keeps compact cards focused on name, location, and price", () => {
    const markup = renderToStaticMarkup(<HostelCard hostel={hostel} compact />);

    expect(markup).toContain("North Campus Hostel");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("PKR 25,000");
  });
});
```

- [ ] **Step 2: Run failing card tests**

Run: `npx vitest run src/components/hostel/HostelCard.test.tsx`

Expected: FAIL because the card does not render `12 reviews` and `Safety 4.7` in the expected trust format.

- [ ] **Step 3: Implement card trust meta row**

In `src/components/hostel/HostelCard.tsx`, replace the separate rating and safety blocks in the non-compact card with:

```tsx
<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--text-caption)] text-[var(--color-text-muted)]">
  {hostel.reviewCount > 0 && (
    <span className="inline-flex items-center gap-1">
      <Star
        size={13}
        strokeWidth={1.5}
        className="fill-[var(--color-primary)] text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <span className="font-[600] text-[var(--color-text-body)]">
        {hostel.rating.toFixed(1)}
      </span>
      <span>
        {hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""}
      </span>
    </span>
  )}
  {hostel.safetyScore != null && hostel.safetyScore > 0 && (
    <span className="inline-flex items-center gap-1">
      <ShieldCheck
        size={13}
        strokeWidth={1.5}
        className="text-[var(--color-success)]"
        aria-hidden="true"
      />
      <span className="font-[600] text-[var(--color-text-body)]">
        Safety {hostel.safetyScore.toFixed(1)}
      </span>
    </span>
  )}
</div>
```

Keep the verified badge on the image and keep the existing price hierarchy.

- [ ] **Step 4: Run card tests**

Run: `npx vitest run src/components/hostel/HostelCard.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit card trust hierarchy**

Run:

```bash
git add -- src/components/hostel/HostelCard.tsx src/components/hostel/HostelCard.test.tsx
git commit -m "Strengthen hostel card trust hierarchy"
```

Expected: commit includes only the two files listed above.

---

### Task 5: Hostel Detail Trust Summary

**Files:**
- Create: `src/components/hostel/TrustSummary.tsx`
- Create: `src/components/hostel/TrustSummary.test.tsx`
- Modify: `src/app/hostels/[slug]/page.tsx`

- [ ] **Step 1: Write failing trust summary tests**

Create `src/components/hostel/TrustSummary.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrustSummary } from "@/components/hostel/TrustSummary";

describe("TrustSummary", () => {
  it("summarizes verification, reviews, owner, rooms, and location", () => {
    const markup = renderToStaticMarkup(
      <TrustSummary
        verified
        reviewCount={18}
        rating={4.6}
        safetyScore={4.8}
        ownerName="Ayesha Khan"
        ownerListingCount={3}
        availableRooms={2}
        hasLocation
      />,
    );

    expect(markup).toContain("Verified listing");
    expect(markup).toContain("4.6 from 18 reviews");
    expect(markup).toContain("Safety 4.8");
    expect(markup).toContain("Ayesha Khan");
    expect(markup).toContain("2 rooms available");
    expect(markup).toContain("Map location added");
  });

  it("uses honest missing-state copy", () => {
    const markup = renderToStaticMarkup(
      <TrustSummary
        verified={false}
        reviewCount={0}
        rating={0}
        safetyScore={null}
        ownerName="Owner"
        ownerListingCount={1}
        availableRooms={0}
        hasLocation={false}
      />,
    );

    expect(markup).toContain("Verification pending");
    expect(markup).toContain("No verified reviews yet");
    expect(markup).toContain("Ask owner for availability");
    expect(markup).toContain("Address only");
  });
});
```

- [ ] **Step 2: Run failing trust summary tests**

Run: `npx vitest run src/components/hostel/TrustSummary.test.tsx`

Expected: FAIL because `TrustSummary` does not exist.

- [ ] **Step 3: Implement `TrustSummary`**

Create `src/components/hostel/TrustSummary.tsx`:

```tsx
import {
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { TrustCueList } from "@/components/ui/shared";

interface TrustSummaryProps {
  verified: boolean;
  reviewCount: number;
  rating: number;
  safetyScore?: number | null;
  ownerName: string;
  ownerListingCount: number;
  availableRooms: number;
  hasLocation: boolean;
}

export function TrustSummary({
  verified,
  reviewCount,
  rating,
  safetyScore,
  ownerName,
  ownerListingCount,
  availableRooms,
  hasLocation,
}: TrustSummaryProps) {
  const reviewValue =
    reviewCount > 0
      ? `${rating.toFixed(1)} from ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`
      : "No verified reviews yet";
  const safetyValue =
    safetyScore != null && safetyScore > 0
      ? `Safety ${safetyScore.toFixed(1)}`
      : "Safety score not rated yet";
  const roomValue =
    availableRooms > 0
      ? `${availableRooms} room${availableRooms !== 1 ? "s" : ""} available`
      : "Ask owner for availability";

  return (
    <TrustCueList
      ariaLabel="Hostel trust summary"
      cues={[
        {
          icon: ShieldCheck,
          label: verified ? "Verified listing" : "Verification pending",
          value: verified ? "Reviewed before booking" : "Review status is not complete",
          tone: verified ? "trust" : "warning",
        },
        {
          icon: Star,
          label: "Student reviews",
          value: reviewValue,
          tone: reviewCount > 0 ? "trust" : "neutral",
        },
        {
          icon: ShieldCheck,
          label: "Safety",
          value: safetyValue,
          tone: safetyScore != null && safetyScore > 0 ? "trust" : "neutral",
        },
        {
          icon: UserCheck,
          label: "Owner",
          value: `${ownerName} - ${ownerListingCount} listing${ownerListingCount !== 1 ? "s" : ""}`,
          tone: "neutral",
        },
        {
          icon: CalendarCheck,
          label: "Availability",
          value: roomValue,
          tone: availableRooms > 0 ? "trust" : "warning",
        },
        {
          icon: MapPin,
          label: "Location",
          value: hasLocation ? "Map location added" : "Address only",
          tone: hasLocation ? "trust" : "neutral",
        },
      ]}
    />
  );
}
```

- [ ] **Step 4: Place trust summary on detail page**

Modify `src/app/hostels/[slug]/page.tsx` imports:

```tsx
import { TrustSummary } from "@/components/hostel/TrustSummary";
```

After the owner info strip and before the tabs, add:

```tsx
<div className="mb-8">
  <TrustSummary
    verified={hostel.verified}
    reviewCount={hostel.reviewCount}
    rating={hostel.rating}
    safetyScore={avgSafety}
    ownerName={hostel.owner.name}
    ownerListingCount={hostel.owner._count?.hostels || 1}
    availableRooms={rooms.reduce((sum: number, room: any) => sum + room.available, 0)}
    hasLocation={Boolean(hostel.latitude && hostel.longitude)}
  />
</div>
```

Move the existing inline `avgSafety` calculation above `return`:

```tsx
const ratedReviews = reviews.filter((r) => r.safety > 0);
const avgSafety =
  ratedReviews.length > 0
    ? ratedReviews.reduce((sum, r) => sum + r.safety, 0) / ratedReviews.length
    : null;
```

Remove the old inline safety block in the detail header so the page does not duplicate safety.

- [ ] **Step 5: Run trust summary tests**

Run: `npx vitest run src/components/hostel/TrustSummary.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run booking detail E2E smoke path**

Run: `npx playwright test e2e/booking-flow.spec.ts --grep "hostel detail page loads"`

Expected: PASS.

- [ ] **Step 7: Commit detail trust summary**

Run:

```bash
git add -- src/components/hostel/TrustSummary.tsx src/components/hostel/TrustSummary.test.tsx src/app/hostels/[slug]/page.tsx
git commit -m "Add hostel detail trust summary"
```

Expected: commit includes only the three files listed above.

---

### Task 6: Booking Confidence And Recovery Copy

**Files:**
- Modify: `src/components/booking/BookingSummaryCard.tsx`
- Create: `src/components/booking/BookingSummaryCard.test.tsx`
- Modify: `src/app/booking/[id]/review/page.tsx`
- Modify: `src/app/booking/[id]/payment/page.tsx`
- Modify: `src/app/booking/[id]/confirmation/page.tsx`
- Modify: `e2e/booking-flow.spec.ts`

- [ ] **Step 1: Write failing booking summary tests**

Create `src/components/booking/BookingSummaryCard.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";

const booking = {
  id: "booking-1",
  checkIn: "2026-06-01T00:00:00.000Z",
  checkOut: "2026-08-01T00:00:00.000Z",
  months: 2,
  guests: 1,
  total: 50000,
  status: "PENDING",
  paymentStatus: "PENDING",
  hostel: {
    name: "North Campus Hostel",
    slug: "north-campus-hostel",
    city: "Lahore",
    area: "Gulberg",
    coverImage: null,
  },
};

describe("BookingSummaryCard", () => {
  it("renders total, dates, status, and payment hint", () => {
    const markup = renderToStaticMarkup(
      <BookingSummaryCard booking={booking} showStatus showPaymentHint />,
    );

    expect(markup).toContain("North Campus Hostel");
    expect(markup).toContain("PKR 50,000");
    expect(markup).toContain("Pending");
    expect(markup).toContain("Payment pending");
  });
});
```

- [ ] **Step 2: Run failing booking summary tests**

Run: `npx vitest run src/components/booking/BookingSummaryCard.test.tsx`

Expected: FAIL because `showPaymentHint` is not supported.

- [ ] **Step 3: Add payment hints to summary card**

Modify `BookingSummaryCardProps`:

```tsx
interface BookingSummaryCardProps {
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    months: number;
    guests: number;
    total: number;
    status: string;
    paymentStatus: string;
    hostel: {
      name: string;
      slug: string;
      city: string;
      area?: string | null;
      coverImage?: string | null;
    };
  };
  showStatus?: boolean;
  showPaymentHint?: boolean;
}
```

Add this helper above `BookingSummaryCard`:

```tsx
function paymentHint(paymentStatus: string) {
  switch (paymentStatus) {
    case "PAID":
      return "Payment received";
    case "FAILED":
      return "Payment failed - retry from payment step";
    case "REFUNDED":
      return "Payment refunded";
    default:
      return "Payment pending";
  }
}
```

Render the hint below the total row:

```tsx
{showPaymentHint && (
  <p className="pt-2 text-[var(--text-caption)] text-[var(--color-text-muted)]">
    {paymentHint(booking.paymentStatus)}
  </p>
)}
```

- [ ] **Step 4: Update booking review, payment, and confirmation pages**

In `src/app/booking/[id]/review/page.tsx`, change:

```tsx
<BookingSummaryCard booking={booking} />
```

to:

```tsx
<BookingSummaryCard booking={booking} showPaymentHint />
```

Change review subcopy to:

```tsx
<p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
  Confirm your dates, room, guests, and total before moving to secure payment.
</p>
```

In `src/app/booking/[id]/payment/page.tsx`, change the fetch error render to:

```tsx
<RecoveryNotice
  tone="error"
  title="Payment details could not load"
  message={fetchErr}
  primaryAction={
    <button
      onClick={() => window.location.reload()}
      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] px-4 text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)]"
    >
      Try again
    </button>
  }
/>
```

Add `RecoveryNotice` to the import from `@/components/ui/shared`.

In `src/app/booking/[id]/confirmation/page.tsx`, change the pending timeout message to:

```tsx
<RecoveryNotice
  tone="warning"
  title="Payment pending"
  message="Your payment is being processed. Check your bookings page for the latest status; it usually updates within a minute."
  primaryAction={
    <Link
      href="/dashboard/bookings"
      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] px-5 text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)]"
    >
      View my bookings
    </Link>
  }
/>
```

Add `RecoveryNotice` to the import from `@/components/ui/shared`.

- [ ] **Step 5: Extend booking E2E confidence assertions**

In `e2e/booking-flow.spec.ts`, inside `"review page shows correct summary and links to payment"`, add:

```ts
await expect(page.getByText(/secure payment|payment pending/i).first()).toBeVisible();
```

- [ ] **Step 6: Run booking tests**

Run: `npx vitest run src/components/booking/BookingSummaryCard.test.tsx`

Expected: PASS.

Run: `npx playwright test e2e/booking-flow.spec.ts`

Expected: PASS when the local test database and payment mocks are healthy.

- [ ] **Step 7: Commit booking confidence changes**

Run:

```bash
git add -- src/components/booking/BookingSummaryCard.tsx src/components/booking/BookingSummaryCard.test.tsx src/app/booking/[id]/review/page.tsx src/app/booking/[id]/payment/page.tsx src/app/booking/[id]/confirmation/page.tsx e2e/booking-flow.spec.ts
git commit -m "Improve booking confidence and recovery states"
```

Expected: commit includes only the six files listed above.

---

### Task 7: Phase 1 Verification Pass

**Files:**
- Modify only files that fail verification and belong to Tasks 1-6.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
npx vitest run src/components/ui/shared.test.tsx src/app/page.test.tsx src/components/hostel/HostelCard.test.tsx src/components/hostel/TrustSummary.test.tsx src/components/booking/BookingSummaryCard.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run public-flow E2E tests**

Run:

```bash
npx playwright test e2e/homepage.spec.ts e2e/search.spec.ts e2e/booking-flow.spec.ts
```

Expected: PASS when the local test database and global setup are healthy.

- [ ] **Step 3: Run lint on changed files**

Run:

```bash
npx eslint src/components/ui/shared.tsx src/components/ui/shared.test.tsx src/app/page.tsx src/app/page.test.tsx src/app/hostels/SearchPageClient.tsx src/components/hostel/HostelCard.tsx src/components/hostel/HostelCard.test.tsx src/components/hostel/TrustSummary.tsx src/components/hostel/TrustSummary.test.tsx src/app/hostels/[slug]/page.tsx src/components/booking/BookingSummaryCard.tsx src/components/booking/BookingSummaryCard.test.tsx src/app/booking/[id]/review/page.tsx src/app/booking/[id]/payment/page.tsx src/app/booking/[id]/confirmation/page.tsx
```

Expected: exit code 0.

- [ ] **Step 4: Check desktop and mobile public screens**

Start the app:

```bash
npm run dev
```

Open these routes in a browser at desktop and mobile widths:

- `/`
- `/hostels`
- `/hostels?city=Lahore`
- `/hostels/e2e-test-hostel`

Expected:

- Search remains the first practical action on the homepage.
- Trust proof does not crowd the hero search on mobile.
- Search result controls do not overlap or wrap into unreadable text.
- Hostel cards keep stable dimensions when ratings or safety are missing.
- Detail trust summary wraps cleanly on mobile.
- Booking step CTAs remain visible and do not fight the mobile navigation.

- [ ] **Step 5: Final commit for verification fixes**

If Step 1, 2, 3, or 4 required fixes, commit only those fixes:

```bash
git add -- src/components/ui/shared.tsx src/components/ui/shared.test.tsx src/app/page.tsx src/app/page.test.tsx src/app/hostels/SearchPageClient.tsx src/components/hostel/HostelCard.tsx src/components/hostel/HostelCard.test.tsx src/components/hostel/TrustSummary.tsx src/components/hostel/TrustSummary.test.tsx src/app/hostels/[slug]/page.tsx src/components/booking/BookingSummaryCard.tsx src/components/booking/BookingSummaryCard.test.tsx src/app/booking/[id]/review/page.tsx src/app/booking/[id]/payment/page.tsx src/app/booking/[id]/confirmation/page.tsx e2e/homepage.spec.ts e2e/search.spec.ts e2e/booking-flow.spec.ts
git commit -m "Polish phase 1 UI UX verification issues"
```

If no files changed during Task 7, do not create a commit.

---

## Plan Self-Review

Spec coverage for this phase:

- Trust-led conversion: Tasks 2, 3, 4, 5, and 6.
- Shared component contracts: Task 1.
- Homepage and search-first public surface: Tasks 2 and 3.
- Hostel detail trust dossier: Task 5.
- Booking and payment confidence: Task 6.
- Testing and verification: Task 7.

Intentional gaps deferred to follow-up plans:

- Student account continuity across saved, messages, notifications, price alerts, verification, and settings.
- Owner operations across dashboard, listings, listing wizard, blocked dates, bookings, reviews, analytics, subscription, and settings.
- Admin throughput across listing review, student verification, reviews, bookings, search sync, and review drawers.
- Final full-app cross-device QA after all phases are implemented.

No new API contract is required for this phase. If implementation reveals a missing trust field, stop and add a small API/data task before using client-side inference.
