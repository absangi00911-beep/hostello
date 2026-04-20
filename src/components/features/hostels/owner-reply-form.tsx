"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquare, Pencil, Trash2, Loader2 } from "lucide-react";

const replySchema = z.object({
  ownerReply: z.string().min(10, "Reply must be at least 10 characters").max(1000),
});
type ReplyInput = z.infer<typeof replySchema>;

interface OwnerReplyFormProps {
  reviewId: string;
  existingReply?: string | null;
}

export function OwnerReplyForm({ reviewId, existingReply }: OwnerReplyFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!existingReply);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReplyInput>({
    resolver: zodResolver(replySchema),
    defaultValues: { ownerReply: existingReply ?? "" },
  });

  async function onSubmit(data: ReplyInput) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save reply");
      toast.success("Reply saved.");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to remove reply");
      toast.success("Reply removed.");
      setIsEditing(true);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isEditing && existingReply) {
    return (
      <div className="mt-3 ml-4 p-3 rounded-lg bg-[var(--color-sand-50)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-[var(--color-primary-700)]">Your reply:</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Remove
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text)] leading-relaxed">{existingReply}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 ml-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
        <label className="block text-xs font-semibold text-[var(--color-primary-700)] mb-1">
          {existingReply ? "Edit your reply:" : "Reply to this review:"}
        </label>
        <textarea
          {...register("ownerReply")}
          rows={3}
          placeholder="Write a thoughtful reply to acknowledge the feedback…"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs resize-none outline-none focus:border-[var(--color-primary-700)] focus:ring-2 focus:ring-[var(--color-primary-700)]/20 transition-all"
        />
        {errors.ownerReply && (
          <p className="text-xs text-red-600">{errors.ownerReply.message}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary-900)] text-white text-xs font-semibold hover:bg-[var(--color-primary-800)] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
            {isSubmitting ? "Saving…" : "Save reply"}
          </button>
          {existingReply && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}