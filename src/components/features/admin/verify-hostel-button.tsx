"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, Loader2 } from "lucide-react";

export function VerifyHostelButton({ hostelId }: { hostelId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hostels", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hostelId, action: "verify" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Hostel verified.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handle} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink)] text-xs font-bold hover:bg-[var(--color-brand-400)] disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
      Verify
    </button>
  );
}
