"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  hostelId: string;
  hostelSlug: string;
}

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <span className="text-base text-[var(--color-ink-muted)] w-24 flex-shrink-0 font-medium">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 focus:outline-none"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                star <= (hovered || value)
                  ? "text-[var(--color-accent-500)] fill-current"
                  : "text-[var(--color-border)]"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ hostelId, hostelSlug }: ReviewFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      cleanliness: 0,
      location: 0,
      value: 0,
      safety: 0,
    },
  });

  const rating = watch("rating");
  const cleanliness = watch("cleanliness");
  const location = watch("location");
  const value = watch("value");
  const safety = watch("safety");

  async function onSubmit(data: ReviewInput) {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, hostelId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      toast.success("Review submitted. Thank you!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section>
      <h2
        className="text-xl font-bold text-[var(--color-text)] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Write a review
      </h2>

      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6 shadow-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* Overall rating */}
          <div>
            <label className="block text-base font-bold text-[var(--color-ink)] mb-3">
              Overall rating
            </label>
            <StarPicker
              value={rating}
              onChange={(v) => setValue("rating", v, { shouldValidate: true })}
              label=""
            />
            {errors.rating && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.rating.message}</p>
            )}
          </div>

          {/* Sub-ratings */}
          <div className="space-y-3 py-5 border-t border-b border-[var(--color-border)]">
            <p className="text-sm font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mb-4">
              Rate specific aspects
            </p>
            <StarPicker
              value={cleanliness}
              onChange={(v) => setValue("cleanliness", v)}
              label="Cleanliness"
            />
            <StarPicker
              value={location}
              onChange={(v) => setValue("location", v)}
              label="Location"
            />
            <StarPicker
              value={value}
              onChange={(v) => setValue("value", v)}
              label="Value"
            />
            <StarPicker
              value={safety}
              onChange={(v) => setValue("safety", v)}
              label="Safety"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              Title <span className="text-[var(--color-muted)] font-normal">(optional)</span>
            </label>
            <input
              {...register("title")}
              placeholder="Summarise your stay in a few words"
              className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1"
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              Review
            </label>
            <textarea
              {...register("comment")}
              rows={4}
              placeholder="What was it like staying here? Be specific — other students will rely on your experience."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1"
            />
            {errors.comment && (
              <p className="mt-1.5 text-xs text-red-600">{errors.comment.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </section>
  );
}
