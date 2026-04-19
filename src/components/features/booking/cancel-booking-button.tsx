"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
  /** compact = just an icon+text link, full = full-width danger button */
  variant?: "compact" | "full";
}

export function CancelBookingButton({
  bookingId,
  variant = "compact",
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Cancellation failed");
      toast.success("Booking cancelled.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {confirmed ? "Tap again to confirm cancellation" : "Cancel booking"}
      </button>
    );
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {confirmed ? "Confirm cancel?" : "Cancel"}
    </button>
  );
}
