"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Flag,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

interface ListingStats {
  totalListings: number;
  pendingApproval: number;
  flaggedCount: number;
  newlyPublished: number;
  newlyPublishedWindowDays: number;
}

interface VerificationQueue {
  total: number;
}

const QUEUE_LINKS = [
  { href: "/admin/listings", label: "Review listings", detail: "Check new submissions and listing quality.", icon: Building2 },
  { href: "/admin/verifications", label: "Verify students", detail: "Review private student documents.", icon: ShieldCheck },
  { href: "/admin/bookings", label: "Bookings & refunds", detail: "Inspect payment status and resolve booking issues.", icon: CalendarDays },
  { href: "/admin/payouts", label: "Owner payouts", detail: "Generate batches and record completed transfers.", icon: Wallet },
  { href: "/admin/reviews", label: "Moderate reviews", detail: "Keep guest feedback useful and trustworthy.", icon: Star },
  { href: "/admin/roommate-reports", label: "Roommate reports", detail: "Review reports about community posts.", icon: Flag },
  { href: "/admin/search", label: "Search index", detail: "Rebuild after bulk listing changes.", icon: Search },
];

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Building2;
  tone?: "neutral" | "warning" | "error";
}) {
  return (
    <article className={`admin-overview-stat admin-overview-stat-${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <p>{label}</p>
        <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

export default function AdminDashboardPage() {
  const listingsQuery = useQuery<{ data: ListingStats }>({
    queryKey: ["admin-dashboard-listing-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/listings/stats");
      if (!response.ok) throw new Error("Could not load listing statistics");
      return response.json();
    },
    staleTime: 60_000,
  });

  const verificationsQuery = useQuery<VerificationQueue>({
    queryKey: ["admin-dashboard-verification-queue"],
    queryFn: async () => {
      const response = await fetch("/api/admin/verifications?status=PENDING&limit=1");
      if (!response.ok) throw new Error("Could not load the verification queue");
      return response.json();
    },
    staleTime: 60_000,
  });

  const stats = listingsQuery.data?.data;
  const countValue = (value: number | undefined, loading: boolean, failed: boolean) =>
    loading ? "…" : failed ? "—" : (value ?? 0).toLocaleString("en-PK");

  return (
    <div className="admin-dashboard-page space-y-8">
      <section className="admin-overview-stats" aria-label="Marketplace overview">
        <StatCard
          label="Listings awaiting review"
          value={countValue(stats?.pendingApproval, listingsQuery.isLoading, listingsQuery.isError)}
          note="Submissions from hostel owners"
          icon={ClipboardCheck}
          tone="warning"
        />
        <StatCard
          label="Flagged for completion"
          value={countValue(stats?.flaggedCount, listingsQuery.isLoading, listingsQuery.isError)}
          note="Pending listings below the quality threshold"
          icon={AlertTriangle}
          tone="error"
        />
        <StatCard
          label="Student verifications"
          value={countValue(verificationsQuery.data?.total, verificationsQuery.isLoading, verificationsQuery.isError)}
          note="Private documents waiting for a decision"
          icon={ShieldCheck}
          tone="neutral"
        />
        <StatCard
          label="Published this week"
          value={countValue(stats?.newlyPublished, listingsQuery.isLoading, listingsQuery.isError)}
          note={`Newly published in the last ${stats?.newlyPublishedWindowDays ?? 7} days`}
          icon={Building2}
          tone="neutral"
        />
      </section>

      {(listingsQuery.isError || verificationsQuery.isError) && (
        <p className="admin-dashboard-error" role="status">
          Some overview counts are unavailable right now. The queues below remain open.
        </p>
      )}

      <section className="admin-queue-board" aria-labelledby="admin-queue-heading">
        <div className="admin-queue-heading">
          <div>
            <p className="admin-queue-kicker">OPERATIONS / QUICK ACCESS</p>
            <h3 id="admin-queue-heading">Choose a queue</h3>
          </div>
          <span>08 AREAS</span>
        </div>
        <div className="admin-queue-grid">
          {QUEUE_LINKS.map(({ href, label, detail, icon: Icon }, index) => (
            <Link key={href} href={href} className="admin-queue-link">
              <span className="admin-queue-index">0{index + 1}</span>
              <span className="admin-queue-icon"><Icon size={17} strokeWidth={1.5} aria-hidden="true" /></span>
              <span className="admin-queue-copy">
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight size={15} className="admin-queue-arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
