// Path: src/app/admin/listings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  Search,
} from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
} from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";
import { RejectReasonModal } from "@/components/admin/RejectReasonModal";
import { HostelReviewDrawer } from "@/components/admin/HostelReviewDrawer";
import { FLAGGED_THRESHOLD } from "@/lib/listingCompleteness";

type StatusTab = "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";
type HostelStatusBadgeVariant = "pending_review" | "active" | "suspended";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "ACTIVE",         label: "Active" },
  { value: "SUSPENDED",      label: "Suspended" },
];

const PAGE_SIZE = 20;

const HOSTEL_STATUS_BADGES: Record<StatusTab, HostelStatusBadgeVariant> = {
  PENDING_REVIEW: "pending_review",
  ACTIVE: "active",
  SUSPENDED: "suspended",
};

interface AdminHostel {
  id: string;
  name: string;
  slug: string;
  status: StatusTab;
  city: string;
  verified: boolean;
  createdAt: string;
  completeness: number;
  owner: { name: string; email: string };
}

interface ListingStats {
  totalListings: number;
  pendingApproval: number;
  flaggedCount: number;
  newlyPublished: number;
  newlyPublishedWindowDays: number;
}

type PendingAction = {
  hostelId: string;
  hostelName: string;
  action: "suspend" | "activate";
} | null;

/* -- Completeness bar --------------------------------------- */
function CompletenessBar({ score }: { score: number }) {
  const color = score >= 70 ? "var(--color-success)" : score >= FLAGGED_THRESHOLD ? "var(--color-warning)" : "var(--color-error)";
  return (
    <div className="flex items-center gap-2 w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-[var(--color-bg-overlay)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[var(--transition-base)]"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[var(--text-caption)] font-[600] text-[var(--color-text-body)] w-8 text-right">
        {score}%
      </span>
    </div>
  );
}

/* -- Inline action buttons --------------------------------- */
function AdminActions({
  hostel,
  onApprove,
  onSuspend,
  onActivate,
  onReview,
  loading,
}: {
  hostel: AdminHostel;
  onApprove:  (id: string) => void;
  onSuspend:  (id: string, name: string) => void;
  onActivate: (id: string, name: string) => void;
  onReview:   (id: string, name: string) => void;
  loading: boolean;
}) {
  const btn = (
    label: string,
    onClick: () => void,
    colorClass: string,
  ) => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border text-[var(--text-caption)] font-[600] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap ${colorClass}`}
    >
      {loading && (
        <Loader2 size={10} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
      )}
      {label}
    </button>
  );

  if (hostel.status === "PENDING_REVIEW") {
    return (
      <div className="flex items-center gap-1.5">
        {btn(
          "Review",
          () => onReview(hostel.id, hostel.name),
          "border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)]",
        )}
        {btn(
          "Approve",
          () => onApprove(hostel.id),
          "border-[var(--color-action)]/40 text-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white hover:border-[var(--color-action)]",
        )}
        {btn(
          "Reject",
          () => onSuspend(hostel.id, hostel.name),
          "border-[oklch(0.52_0.18_22_/_0.4)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white hover:border-[var(--color-error)]",
        )}
      </div>
    );
  }

  if (hostel.status === "ACTIVE") {
    return btn(
      "Suspend",
      () => onSuspend(hostel.id, hostel.name),
      "border-[oklch(0.52_0.18_22_/_0.4)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white hover:border-[var(--color-error)]",
    );
  }

  if (hostel.status === "SUSPENDED") {
    return btn(
      "Reactivate",
      () => onActivate(hostel.id, hostel.name),
      "border-[var(--color-action)]/40 text-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white hover:border-[var(--color-action)]",
    );
  }

  return null;
}

/* -- Page --------------------------------------------------- */
export default function AdminListingsPage() {
  const queryClient = useQueryClient();

  const [tab,  setTab]  = useState<StatusTab>("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Reason modal state — null means closed
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Debounce search input -> search (avoid a request per keystroke)
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: stats } = useQuery<{ data: ListingStats }>({
    queryKey: ["admin-listings-stats"],
    queryFn: () => fetch("/api/admin/listings/stats").then((r) => r.json()),
  });

  // Review drawer state
  const [reviewDrawer, setReviewDrawer] = useState<{
    id: string; name: string; status: StatusTab;
  } | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: AdminHostel[]; total: number;
  }>({
    queryKey: ["admin-listings", tab, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: tab,
        page:   String(page),
        limit:  String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/listings?${params}`);
      if (!res.ok) throw new Error("Failed to load listings");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      hostelId,
      action,
      reason,
    }: {
      hostelId: string;
      action: "verify" | "suspend" | "activate";
      reason?: string;
    }) => {
      setActingId(hostelId);
      const res = await fetch("/api/admin/hostels", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hostelId, action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      return json;
    },
    onSuccess: (_, { action }) => {
      const messages = {
        verify:   "Listing approved and published.",
        suspend:  "Listing suspended. Owner notified by email.",
        activate: "Listing reactivated.",
      };
      toast.success(messages[action]);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      setReviewDrawer(null);
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingId(null),
  });

  // Approve directly — no reason needed
  function handleApprove(hostelId: string) {
    actionMutation.mutate({ hostelId, action: "verify" });
  }

  // Suspend/reject — opens reason modal
  function handleSuspendIntent(hostelId: string, hostelName: string) {
    setPendingAction({ hostelId, hostelName, action: "suspend" });
  }

  // Reactivate — opens confirmation modal (no reason needed but modal confirms intent)
  function handleActivateIntent(hostelId: string, hostelName: string) {
    setPendingAction({ hostelId, hostelName, action: "activate" });
  }

  // Modal confirmed
  function handleModalConfirm(reason: string) {
    if (!pendingAction) return;
    actionMutation.mutate({
      hostelId: pendingAction.hostelId,
      action: pendingAction.action === "suspend" ? "suspend" : "activate",
      reason: reason || undefined,
    });
    setPendingAction(null);
  }

  const hostels    = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[var(--text-h1)] font-[800] text-[var(--color-text-heading)]">
              Hostel Moderation
            </h1>
            <p className="mt-1 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              Pending Reviews ({stats?.data.pendingApproval ?? "…"})
            </p>
          </div>
          <div className="relative w-full max-w-[320px]">
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hostels or owner IDs…"
              aria-label="Search hostels or owner IDs"
              className="w-full rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-2 pl-9 pr-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15"
            />
          </div>
        </div>

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <div className="flex items-start justify-between">
                <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">Total Listings</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary-brand-container)]">
                  <Building2 size={16} strokeWidth={1.5} className="text-[var(--color-secondary-brand)]" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 font-heading text-[2rem] font-[800] text-[var(--color-text-heading)]">{stats.data.totalListings.toLocaleString()}</p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <div className="flex items-start justify-between">
                <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">Pending Approval</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
                  <ClipboardList size={16} strokeWidth={1.5} className="text-[var(--color-primary-deep)]" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 font-heading text-[2rem] font-[800] text-[var(--color-text-heading)]">{stats.data.pendingApproval}</p>
            </div>

            <div className="rounded-[var(--radius-lg)] border-l-[3px] border-l-[var(--color-error)] border-y border-r border-y-[var(--color-border-subtle)] border-r-[var(--color-border-subtle)] bg-[var(--color-error-bg)] p-5">
              <div className="flex items-start justify-between">
                <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-error-text)]">Flagged for Review</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-card)]">
                  <AlertTriangle size={16} strokeWidth={1.5} className="text-[var(--color-error)]" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 font-heading text-[2rem] font-[800] text-[var(--color-error)]">{stats.data.flaggedCount}</p>
              <p className="mt-0.5 text-[var(--text-caption)] text-[var(--color-error-text)]">pending, under {FLAGGED_THRESHOLD}% complete</p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <div className="flex items-start justify-between">
                <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">Newly Published</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
                  <Sparkles size={16} strokeWidth={1.5} className="text-[var(--color-success-text)]" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 font-heading text-[2rem] font-[800] text-[var(--color-text-heading)]">
                +{stats.data.newlyPublished} <span className="text-[1rem] font-[500] text-[var(--color-text-muted)]">last {stats.data.newlyPublishedWindowDays}d</span>
              </p>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)]">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setTab(value); setPage(1); }}
              aria-current={tab === value ? "true" : undefined}
              className={`h-10 px-4 text-[var(--text-body-sm)] font-[500] border-b-2 transition-all duration-[var(--transition-fast)] whitespace-nowrap ${
                tab === value
                  ? "border-[var(--color-primary)] text-[var(--color-text-heading)] font-[600]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {isLoading ? "Loading…" : `${total} listing${total !== 1 ? "s" : ""}`}
        </p>

        {isLoading ? (
          <PageSpinner label="Loading listings…" />
        ) : isError ? (
          <InlineError message="Couldn't load listings. Please refresh." />
        ) : hostels.length === 0 ? (
          <EmptyState
            icon={Building2}
            heading={`No ${tab === "PENDING_REVIEW" ? "pending" : tab.toLowerCase()} listings`}
            description={
              tab === "PENDING_REVIEW"
                ? "No listings are waiting for review right now."
                : `No listings with ${tab.toLowerCase()} status.`
            }
          />
        ) : (
          <>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]" aria-label="Hostel listings">
                  <thead>
                    <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                      {["Hostel","Owner","City","Submitted","Status","Completeness","Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((hostel) => (
                      <tr
                        key={hostel.id}
                        className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/hostels/${hostel.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)] flex items-center gap-1 max-w-[180px] truncate"
                            >
                              {hostel.name}
                              <ExternalLink size={11} strokeWidth={1.5} className="shrink-0 opacity-50" aria-hidden="true" />
                            </Link>
                            {hostel.verified && (
                              <ShieldCheck size={13} strokeWidth={1.5} className="text-[var(--color-primary)] shrink-0" aria-label="Verified" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[140px]">{hostel.owner.name}</p>
                          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate max-w-[140px]">{hostel.owner.email}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">{hostel.city}</span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                            {format(new Date(hostel.createdAt), "d MMM yyyy")}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge variant={HOSTEL_STATUS_BADGES[hostel.status]} />
                        </td>

                        <td className="px-4 py-3.5">
                          <CompletenessBar score={hostel.completeness} />
                        </td>

                        <td className="px-4 py-3.5">
                          <AdminActions
                            hostel={hostel}
                            onApprove={handleApprove}
                            onSuspend={handleSuspendIntent}
                            onActivate={handleActivateIntent}
                            onReview={(id, name) =>
                              setReviewDrawer({ id, name, status: hostel.status })
                            }
                            loading={actingId === hostel.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Reason modal */}
      {pendingAction && (
        <RejectReasonModal
          hostelName={pendingAction.hostelName}
          action={pendingAction.action}
          onConfirm={handleModalConfirm}
          onCancel={() => setPendingAction(null)}
          loading={actionMutation.isPending}
        />
      )}

      {/* Review drawer */}
      {reviewDrawer && (
        <HostelReviewDrawer
          hostelId={reviewDrawer.id}
          hostelName={reviewDrawer.name}
          status={reviewDrawer.status}
          onClose={() => setReviewDrawer(null)}
          onApprove={() => handleApprove(reviewDrawer.id)}
          onSuspend={() => {
            setReviewDrawer(null);
            handleSuspendIntent(reviewDrawer.id, reviewDrawer.name);
          }}
          actionLoading={actingId === reviewDrawer.id}
        />
      )}
    </>
  );
}
