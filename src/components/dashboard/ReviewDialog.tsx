// Path: src/components/dashboard/ReviewDialog.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inputCls } from "@/components/auth/AuthCardLayout";

interface ReviewDialogProps {
  hostelId: string;
  hostelName: string;
  open: boolean;
  onClose: () => void;
}

const SUBCATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "location",    label: "Location" },
  { key: "value",       label: "Value" },
  { key: "safety",      label: "Safety" },
] as const;

type SubcategoryKey = typeof SUBCATEGORIES[number]["key"];

/* -- Star rating picker ------------------------------------ */
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
    <div
      className="flex gap-1"
      role="group"
      aria-label={`${label} rating`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className="transition-transform duration-[var(--transition-fast)] hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-1 rounded-sm"
        >
          <Star
            size={20}
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

export function ReviewDialog({
  hostelId,
  hostelName,
  open,
  onClose,
}: ReviewDialogProps) {
  const queryClient = useQueryClient();

  const [rating,      setRating]      = useState(0);
  const [title,       setTitle]       = useState("");
  const [comment,     setComment]     = useState("");
  const [subcategory, setSubcategory] = useState<Record<SubcategoryKey, number>>({
    cleanliness: 0,
    location:    0,
    value:       0,
    safety:      0,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          hostelId,
          rating,
          title:   title.trim() || undefined,
          comment: comment.trim(),
          ...subcategory,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit review");
      return json;
    },
    onSuccess: () => {
      toast.success("Review submitted. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = rating > 0 && comment.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[520px] rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border-default)] shadow-[var(--shadow-xl)] p-7">
        <DialogHeader className="mb-5">
          <DialogTitle
            className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] text-left"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Review {hostelName}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
          className="space-y-5"
        >
          {/* Overall rating */}
          <div className="space-y-2">
            <p className="text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">
              Overall rating <span className="text-[var(--color-error)]">*</span>
            </p>
            <StarPicker value={rating} onChange={setRating} label="Overall rating" />
          </div>

          {/* Subcategory scores */}
          <div className="grid grid-cols-2 gap-3">
            {SUBCATEGORIES.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <p className="text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)]">
                  {label}
                </p>
                <StarPicker
                  value={subcategory[key]}
                  onChange={(v) =>
                    setSubcategory((prev) => ({ ...prev, [key]: v }))
                  }
                  label={label}
                />
              </div>
            ))}
          </div>

          {/* Title (optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="review-title"
              className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
            >
              Title{" "}
              <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] font-[400]">
                (optional)
              </span>
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean and well-located"
              maxLength={100}
              className={inputCls}
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label
              htmlFor="review-comment"
              className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
            >
              Review <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience — what was good, what could be better?"
              rows={4}
              required
              minLength={10}
              className={`${inputCls} h-auto resize-none py-2.5`}
            />
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] text-right">
              {comment.length} / 10 min
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitMutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending && (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              )}
              {submitMutation.isPending ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
