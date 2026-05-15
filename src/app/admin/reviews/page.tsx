// Path: src/app/admin/reviews/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Star, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
} from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";

const PAGE_SIZE = 20;

interface AdminReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  ownerReply?: string | null;
  verified: boolean;
  createdAt: string;
  hostel: { id: string; name: string; slug: string };
  user:   { id: string; name: string; email: string };
}

/* ── Delete confirmation — two-tap pattern per DESIGN.md ──── */
function DeleteButton({
  reviewId,
  onDelete,
  loading,
}: {
  reviewId: string;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => { onDelete(reviewId); setArmed(false); }}
          disabled={loading}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--color-error)] text-[var(--text-caption)] font-[600] text-white hover:bg-[oklch(0.44_0.17_22)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
        >
          {loading && <Loader2 size={10} className="animate-spin" aria-hidden="true" />}
          Delete
        </button>
        <button
          onClick={() => setArmed(false)}
          className="text-[var(--text-caption)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setArmed(true)}
      disabled={loading}
      aria-label="Delete review"
      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
    >
      <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/* ── Review row ──────────────────────────────────────────── */
function ReviewRow({
  review,
  onDelete,
  deleting,
}: {
  review: AdminReview;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <tr className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]">
      {/* Hostel */}
      <td className="px-4 py-3.5">
        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate max-w-[150px]">
          {review.hostel.name}
        </p>
      </td>

      {/* Student */}
      <td className="px-4 py-3.5">
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[120px]">
          {review.user.name}
        </p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate max-w-[120px]">
          {review.user.email}
        </p>
      </td>

      {/* Rating */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Star size={13} strokeWidth={1.5} className="text-[var(--color-primary)] fill-[var(--color-primary)]" aria-hidden="true" />
          <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)]">{review.rating}</span>
        </div>
      </td>

      {/* Comment preview */}
      <td className="px-4 py-3.5 max-w-[220px]">
        {review.title && (
          <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate">{review.title}</p>
        )}
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] line-clamp-2">
          {review.comment}
        </p>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{timeAgo}</span>
      </td>

      {/* Delete */}
      <td className="px-4 py-3.5">
        <DeleteButton
          reviewId={review.id}
          onDelete={onDelete}
          loading={deleting}
        />
      </td>
    </tr>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page,       setPage]       = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: AdminReview[]; total: number;
  }>({
    queryKey: ["admin-reviews", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      return json;
    },
    onSuccess: () => {
      toast.success("Review deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setDeletingId(null),
  });

  const reviews    = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) return <PageSpinner label="Loading reviews…" />;
  if (isError)   return <InlineError message="Couldn't load reviews. Please refresh." />;

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        {total} review{total !== 1 ? "s" : ""} across all hostels
      </p>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          heading="No reviews yet"
          description="Reviews from verified stays will appear here."
        />
      ) : (
        <>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]" aria-label="All reviews">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Hostel","Student","Rating","Review","Date",""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <ReviewRow
                      key={r.id}
                      review={r}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      deleting={deletingId === r.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}