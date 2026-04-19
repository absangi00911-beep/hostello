"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface OwnerBookingActionsProps {
  bookingId: string;
  studentName: string;
}

export function OwnerBookingActions({ bookingId, studentName }: OwnerBookingActionsProps) {
  const router  = useRouter();
  const [loading, setLoading] = useState<"confirm" | "decline" | null>(null);

  async function act(action: "confirm" | "decline") {
    setLoading(action);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");

      toast.success(action === "confirm"
        ? `Booking confirmed. ${studentName} will be notified.`
        : "Booking declined."
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
        Respond to this request
      </p>

      <button
        onClick={() => act("confirm")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === "confirm"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle2 className="w-4 h-4" />
        }
        Confirm booking
      </button>

      <button
        onClick={() => act("decline")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === "decline"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <XCircle className="w-4 h-4 text-[var(--color-muted)]" />
        }
        Decline
      </button>

      <p className="text-xs text-center text-[var(--color-muted)]">
        {studentName} will get an email either way.
      </p>
    </div>
  );
}
