"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface EditReviewFormProps {
  reviewId: string;
  hostelName: string;
  initialData: ReviewInput;
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
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--color-muted)] w-24 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
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
                "w-5 h-5 transition-colors",
                star <= (hovered || value)
                  ? "text-[var(--color-accent-500)] fill-current"
                  : "text-[var(--color-sand-200)]"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditReviewForm({ reviewId, hostelName, initialData }: EditReviewFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initialData,
  });

  const rating = watch("rating");
  const cleanliness = watch("cleanliness");
  const location = watch("location");
  const value = watch("value");
  const safety = watch("safety");

  async function onSubmit(data: ReviewInput) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      toast.success("Review updated.");
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-[var(--color-primary-700)] hover:underline mb-4"
          >
            ← Back
          </button>
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Edit Review
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Update your review
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {hostelName}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Overall rating */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Overall rating
              </label>
              <StarPicker
                value={rating}
                onChange={(v) => setValue("rating", v, { shouldValidate: true })}
                label=""
              />
              {errors.rating && (
                <p className="mt-1.5 text-xs text-red-600">{errors.rating.message}</p>
              )}
            </div>

            {/* Sub-ratings */}
            <div className="space-y-2.5 py-4 border-t border-b border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-ground)] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-bold hover:bg-[var(--color-primary-800)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? "Updating…" : "Update review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
