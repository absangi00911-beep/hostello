"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";

export function SuspendHostelButton({ hostelId }: { hostelId: string }) {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [confirm,  setConfirm]  = useState(false);

  async function handle() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hostels", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hostelId, action: "suspend" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Hostel suspended.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handle} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
      {confirm ? "Confirm?" : "Suspend"}
    </button>
  );
}
