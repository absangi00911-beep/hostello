"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquare, Loader2, X } from "lucide-react";

const messageSchema = z.object({
  initialMessage: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
});
type MessageInput = z.infer<typeof messageSchema>;

interface ContactOwnerButtonProps {
  hostelId: string;
  hostelName: string;
}

export function ContactOwnerButton({ hostelId, hostelName }: ContactOwnerButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      initialMessage: `Hi! I'm interested in staying at ${hostelName}. Could you tell me more about availability?`,
    },
  });

  function handleClick() {
    if (!session) {
      router.push("/login");
      return;
    }
    setIsOpen(true);
  }

  async function onSubmit(data: MessageInput) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send message");
      toast.success("Message sent to the owner!");
      setIsOpen(false);
      reset();
      router.push("/messages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Message owner
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-[var(--color-border)] shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[var(--color-ink)]">
                Message the owner
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--color-ground)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                  Your message
                </label>
                <textarea
                  {...register("initialMessage")}
                  rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm resize-none outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all"
                />
                {errors.initialMessage && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.initialMessage.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}