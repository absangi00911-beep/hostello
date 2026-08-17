// Path: src/app/owner/reviews/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Star,
  MessageSquare,
  Trash2,
  Loader2,
  Search,
  MessagesSquare,
  ThumbsUp,
  Smile,
} from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
} from "@/components/ui/shared";
import { inputCls } from "@/components/ui/input";

type Filter = "all" | "pending" | "replied" | "flagged";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  cleanliness: number;
  location: number;
  value: number;
  safety: number;
  ownerReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  hostel?: { name: string; slug: string };
  user: { name: string; avatar?: string | null };
  stay: { checkIn: string; checkOut: string; months: number } | null;
}

interface Stats {
  total: number;
  newThisWeek: number;
  avgRating: number | null;
  responseRate: number | null;
  repliedCount: number;
  sentiment: string | null;
}

const SUBCATEGORIES: { key: keyof Pick<Review, "cleanliness" | "location" | "value" | "safety">; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "location",    label: "Location" },
  { key: "value",       label: "Value" },
  { key: "safety",      label: "Safety" },
];

/* -- Stat card ------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Star;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-muted)]">{label}</p>
        <Icon size={17} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
      </div>
      <p className="mt-1.5 flex items-baseline gap-1.5 font-heading text-[1.75rem] font-[800] text-[var(--color-text-heading)]">
        {value}
        {sub && <span className="text-[var(--text-caption)] font-[600] text-[var(--color-text-muted)]">{sub}</span>}
      </p>
    </div>
  );
}

/* -- Reply form -------------------------------------------- */
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
      toast.success(existing ? "Reply updated." : "Reply posted.");
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
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] p-4 space-y-3">
      <p className="flex items-center gap-1.5 text-[var(--text-body-sm)] font-[700] text-[var(--color-text-heading)]">
        <MessageSquare size={14} strokeWidth={1.5} aria-hidden="true" />
        {existing ? "Edit Reply" : "Draft Response"}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply to this review…"
        rows={3}
        autoFocus
        className={`${inputCls} h-auto resize-none py-2.5 bg-[var(--color-bg-card)]`}
        aria-label="Reply to review"
      />
      <div className="flex items-center justify-end gap-2">
        {existing && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="mr-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] text-[var(--text-caption)] font-[500] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
          >
            <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
            Remove
          </button>
        )}
        <button
          onClick={onDone}
          className="h-9 px-3 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
        >
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!text.trim() || saveMutation.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[600] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50"
        >
          {saveMutation.isPending && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
          {existing ? "Update Reply" : "Post Reply"}
        </button>
      </div>
    </div>
  );
}

/* -- Review card ------------------------------------------- */
function ReviewCard({ review }: { review: Review }) {
  const [replying, setReplying] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
  const hasSubratings = SUBCATEGORIES.some(({ key }) => review[key] > 0);
  const initials = review.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <article className={`rounded-[var(--radius-lg)] border bg-[var(--color-bg-card)] p-5 space-y-3 ${
      !review.ownerReply ? "border-l-[3px] border-l-[var(--color-primary)] border-y-[var(--color-border-subtle)] border-r-[var(--color-border-subtle)]" : "border-[var(--color-border-subtle)]"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-faint)] text-[13px] font-[700] text-[var(--color-primary-deep)]">
            {initials}
          </div>
          <div>
            <p className="text-[var(--text-body-sm)] font-[700] text-[var(--color-text-heading)]">
              {review.user.name}
            </p>
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              {review.stay
                ? `Stayed ${format(new Date(review.stay.checkIn), "MMM d")} – ${format(new Date(review.stay.checkOut), "MMM d")} · ${review.stay.months} ${review.stay.months === 1 ? "month" : "months"}`
                : timeAgo}
              {review.hostel && <> · {review.hostel.name}</>}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[var(--text-caption)] font-[600] ${
          review.ownerReply
            ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
            : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
        }`}>
          {review.ownerReply ? "Replied" : "Pending Reply"}
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={14}
              strokeWidth={1.5}
              className={n <= review.rating ? "text-[var(--color-primary)] fill-[var(--color-primary)]" : "text-[var(--color-border-strong)]"}
            />
          ))}
        </div>
        <span className="text-[var(--text-body-sm)] font-[700] text-[var(--color-text-body)]">{review.rating.toFixed(1)} Overall</span>
      </div>

      {/* Content */}
      {review.title && (
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{review.title}</p>
      )}
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">{review.comment}</p>

      {/* Subratings — only the categories your review model actually has */}
      {hasSubratings && (
        <div className="flex flex-wrap gap-2 pt-1">
          {SUBCATEGORIES.filter(({ key }) => review[key] > 0).map(({ key, label }) => (
            <span
              key={key}
              className="rounded-full bg-[var(--color-bg-sidebar)] px-2.5 py-1 text-[var(--text-caption)] text-[var(--color-text-body)]"
            >
              {label}: <strong className="font-[700] text-[var(--color-primary)]">{review[key]}/5</strong>
            </span>
          ))}
        </div>
      )}

      {/* Existing reply */}
      {review.ownerReply && !replying && (
        <div className="ml-4 pl-4 border-l-2 border-[var(--color-border-default)] space-y-1">
          <p className="text-[var(--text-caption)] font-[700] text-[var(--color-text-muted)] uppercase tracking-wide">Your reply</p>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">{review.ownerReply}</p>
        </div>
      )}

      {/* Reply form / trigger */}
      {replying ? (
        <ReplyForm reviewId={review.id} existing={review.ownerReply} onDone={() => setReplying(false)} />
      ) : (
        <button
          onClick={() => setReplying(true)}
          className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <MessageSquare size={14} strokeWidth={1.5} aria-hidden="true" />
          {review.ownerReply ? "Edit reply" : "Reply"}
        </button>
      )}
    </article>
  );
}

/* -- Page --------------------------------------------------- */
export default function OwnerReviewsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery<{ data: Review[]; stats: Stats }>({
    queryKey: ["owner-reviews", filter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("filter", filter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/reviews/mine?${params}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
  });

  if (isLoading) return <PageSpinner label="Loading reviews…" />;
  if (isError)   return <InlineError message="Couldn't load reviews. Please refresh." />;

  const reviews = data?.data ?? [];
  const stats = data?.stats;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "pending", label: "Pending Reply" },
    { key: "replied", label: "Replied" },
    { key: "flagged", label: "Flagged" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Monitor and respond to student feedback across your properties.
      </p>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={MessagesSquare}
            label="Total Reviews"
            value={stats.total}
            sub={stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : undefined}
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"}
            sub={stats.avgRating !== null ? "/ 5.0" : undefined}
          />
          <StatCard
            icon={ThumbsUp}
            label="Response Rate"
            value={stats.responseRate !== null ? `${stats.responseRate.toFixed(0)}%` : "—"}
            sub={stats.responseRate !== null && stats.responseRate < 80 ? <span className="text-[var(--color-error)]">Needs attention</span> : undefined}
          />
          <StatCard
            icon={Smile}
            label="Rating Trend"
            value={stats.sentiment ?? "—"}
          />
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-9 px-3.5 rounded-full text-[var(--text-body-sm)] font-[600] transition-colors duration-[var(--transition-fast)] ${
                filter === key
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border-default)] text-[var(--color-text-body)] hover:bg-[var(--color-bg-overlay)]"
              }`}
            >
              {label}{key === "pending" && stats ? ` (${stats.total - stats.repliedCount})` : ""}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-[260px]">
          <Search size={14} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reviews…"
            aria-label="Search reviews"
            className="w-full rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-1.5 pl-8 pr-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          heading={search || filter !== "all" ? "No matching reviews" : "No reviews yet"}
          description={search || filter !== "all" ? "Try a different filter or search." : "Student reviews for your hostels will appear here after completed stays."}
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
