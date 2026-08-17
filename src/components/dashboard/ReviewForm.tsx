// Path: src/components/dashboard/ReviewForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Star, Loader2, Building2, MapPin } from "lucide-react";
import { inputCls } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    hostel: { id: string; name: string; slug: string; city: string; coverImage: string | null };
  };
  existingReview: {
    rating: number;
    title: string;
    comment: string;
    cleanliness: number;
    location: number;
    value: number;
    safety: number;
    wouldRecommend: boolean | null;
  } | null;
}

// Real subcategories only — matches the Review model exactly. The mockup
// also shows "Social Vibe" and "Staff", but nothing stores those anywhere,
// so they'd be silently discarded on submit. Paired to fill the same
// 2-column rhythm the mockup uses.
const SUBCATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "safety",      label: "Safety" },
  { key: "location",    label: "Location" },
  { key: "value",       label: "Value for Money" },
] as const;
type SubcategoryKey = typeof SUBCATEGORIES[number]["key"];

function StarPicker({
  value,
  onChange,
  label,
  size = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label={`${label} rating`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className="rounded-sm transition-transform duration-[var(--transition-fast)] hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-1"
        >
          <Star
            size={size}
            strokeWidth={1.5}
            className={`transition-colors duration-[var(--transition-fast)] ${
              n <= (hovered || value)
                ? "text-[var(--color-primary)] fill-[var(--color-primary)]"
                : "text-[var(--color-border-strong)]"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ booking, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const { hostel } = booking;

  const [rating,      setRating]      = useState(existingReview?.rating ?? 0);
  const [title,       setTitle]       = useState(existingReview?.title ?? "");
  const [comment,     setComment]     = useState(existingReview?.comment ?? "");
  const [recommend,   setRecommend]   = useState<boolean>(existingReview?.wouldRecommend ?? true);
  const [subcategory, setSubcategory] = useState<Record<SubcategoryKey, number>>({
    cleanliness: existingReview?.cleanliness ?? 0,
    location:    existingReview?.location ?? 0,
    value:       existingReview?.value ?? 0,
    safety:      existingReview?.safety ?? 0,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelId: hostel.id,
          rating,
          title:   title.trim() || undefined,
          comment: comment.trim(),
          wouldRecommend: recommend,
          ...subcategory,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit review");
      return json;
    },
    onSuccess: () => {
      toast.success(existingReview ? "Review updated. Thank you!" : "Review submitted. Thank you!");
      router.push("/dashboard/bookings");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = rating > 0 && comment.trim().length >= 10;

  return (
    <div>
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
      >
        <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
        Back to Bookings
      </Link>

      <h1 className="mt-3 font-heading text-[var(--text-h1)] font-[800] text-[var(--color-text-heading)]">
        {existingReview ? "Edit Your Review" : "Leave a Review"}
      </h1>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Your feedback helps fellow students find their perfect stay.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
        className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] items-start"
      >
        {/* -- Hostel context card -------------------------- */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
          <div className="relative h-40 bg-[var(--color-bg-overlay)]">
            {hostel.coverImage ? (
              <Image src={hostel.coverImage} alt={hostel.name} fill className="object-cover" sizes="280px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-[var(--text-body)] font-[700] text-[var(--color-text-heading)]">{hostel.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[var(--text-caption)] text-[var(--color-text-muted)]">
              <MapPin size={11} strokeWidth={2} aria-hidden="true" />
              {hostel.city}
            </p>
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] divide-y divide-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[var(--text-caption)] font-[600] uppercase tracking-wide text-[var(--color-text-muted)]">Check-in</span>
                <span className="text-[var(--text-caption)] font-[700] text-[var(--color-text-heading)]">{format(new Date(booking.checkIn), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[var(--text-caption)] font-[600] uppercase tracking-wide text-[var(--color-text-muted)]">Check-out</span>
                <span className="text-[var(--text-caption)] font-[700] text-[var(--color-text-heading)]">{format(new Date(booking.checkOut), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* -- Main form ------------------------------------ */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 sm:p-7 space-y-6">
          {/* Overall */}
          <div className="space-y-2">
            <h2 className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]">Overall Experience</h2>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">How would you rate your stay overall?</p>
            <div className="pt-1">
              <StarPicker value={rating} onChange={setRating} label="Overall rating" size={30} />
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-6 space-y-3">
            <h3 className="text-[var(--text-label)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
              Detailed Ratings
            </h3>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {SUBCATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">{label}</span>
                  <StarPicker
                    value={subcategory[key]}
                    onChange={(v) => setSubcategory((prev) => ({ ...prev, [key]: v }))}
                    label={label}
                    size={16}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-6 space-y-2">
            <h3 className="text-[var(--text-body)] font-[600] text-[var(--color-text-heading)]">Tell us about your stay</h3>
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Share your favorite moments, what could be improved, and tips for future students.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="I loved the common room, but the wifi was a bit slow…"
              rows={5}
              required
              minLength={10}
              className={`${inputCls} h-auto resize-none py-2.5`}
            />
            <p className="text-right text-[var(--text-caption)] text-[var(--color-text-muted)]">{comment.length} / 10 min</p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a short title (optional) — e.g. Clean and well-located"
              maxLength={100}
              className={inputCls}
            />
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">Recommend to others?</p>
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">Would you suggest this hostel to a friend?</p>
            </div>
            <button
              type="button"
              onClick={() => setRecommend((v) => !v)}
              role="switch"
              aria-checked={recommend}
              aria-label={recommend ? "Recommends this hostel" : "Does not recommend this hostel"}
              className={`relative flex h-6 w-10 shrink-0 items-center rounded-full border-0 transition-colors duration-[150ms] ease-out focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 ${recommend ? "bg-[var(--color-action)]" : "bg-[var(--color-border-strong)]"}`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-[150ms] ease-out ${recommend ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-6 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/bookings"
              className="inline-flex h-10 items-center px-4 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
            >
              Cancel
            </Link>
            <Button type="submit" size="lg" disabled={!canSubmit} loading={submitMutation.isPending}>
              {existingReview ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
