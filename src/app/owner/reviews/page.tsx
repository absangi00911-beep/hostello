// Path: src/app/owner/reviews/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Star, MessageSquare, Trash2, Loader2 } from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
} from "@/components/ui/shared";
import { inputCls } from "@/components/auth/AuthCardLayout";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  ownerReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  hostel?: { name: string; slug: string };
  user: { name: string; avatar?: string | null };
}

/* ── Reply form ──────────────────────────────────────────── */
function ReplyForm({
  reviewId,
  existing,
  onDone,
}: {
  reviewId: string;
  existing?: string | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(existing ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ownerReply: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save reply");
      return json;
    },
    onSuccess: () => {
      toast.success(existing ? "Reply updated." : "Reply added.");
      queryClient.invalidateQueries({ queryKey: ["owner-reviews"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reply");
    },
    onSuccess: () => {
      toast.success("Reply removed.");
      queryClient.invalidateQueries({ queryKey: ["owner-reviews"] });
      onDone();
    },
    onError: () => toast.error("Couldn't delete reply."),
  });

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply to this review…"
        rows={3}
        className={`${inputCls} h-auto resize-none py-2.5`}
        aria-label="Reply to review"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!text.trim() || saveMutation.isPending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-caption)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50"
        >
          {saveMutation.isPending && <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
          {existing ? "Update reply" : "Post reply"}
        </button>
        {existing && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-error)] text-[var(--text-caption)] font-[500] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
          >
            <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
            Remove reply
          </button>
        )}
        <button
          onClick={onDone}
          className="text-[var(--text-caption)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Review card ─────────────────────────────────────────── */
function ReviewCard({ review }: { review: Review }) {
  const [replying, setReplying] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
            {review.user.name}
          </p>
          {review.hostel && (
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Re: {review.hostel.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Star size={13} strokeWidth={1.5} className="text-[var(--color-primary)] fill-[var(--color-primary)]" aria-hidden="true" />
            <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)]">{review.rating}</span>
          </div>
          <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{timeAgo}</span>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{review.title}</p>
      )}
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">{review.comment}</p>

      {/* Existing reply */}
      {review.ownerReply && !replying && (
        <div className="ml-4 pl-4 border-l-2 border-[var(--color-border-default)] space-y-1">
          <p className="text-[var(--text-caption)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">Your reply</p>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">{review.ownerReply}</p>
        </div>
      )}

      {/* Reply form */}
      {replying ? (
        <ReplyForm
          reviewId={review.id}
          existing={review.ownerReply}
          onDone={() => setReplying(false)}
        />
      ) : (
        <button
          onClick={() => setReplying(true)}
          className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <MessageSquare size={14} strokeWidth={1.5} aria-hidden="true" />
          {review.ownerReply ? "Edit reply" : "Reply"}
        </button>
      )}
    </article>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function OwnerReviewsPage() {
  const { data, isLoading, isError } = useQuery<{ data: Review[] }>({
    queryKey: ["owner-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews/mine");
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
  });

  if (isLoading) return <PageSpinner label="Loading reviews…" />;
  if (isError)   return <InlineError message="Couldn't load reviews. Please refresh." />;

  const reviews = data?.data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        {reviews.length} review{reviews.length !== 1 ? "s" : ""}
      </p>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          heading="No reviews yet"
          description="Student reviews for your hostels will appear here after completed stays."
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Hostel reviews">
          {reviews.map((r) => (
            <div key={r.id} role="listitem">
              <ReviewCard review={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}