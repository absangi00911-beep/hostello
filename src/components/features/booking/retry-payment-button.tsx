"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RetryPaymentButtonProps {
  bookingId: string;
  amount: number;
  variant?: "full" | "outline";
}

export function RetryPaymentButton({
  bookingId,
  amount,
  variant = "outline",
}: RetryPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetryPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment setup failed");

      // Handle different response types
      if (json.type === "redirect") {
        window.location.href = json.redirectUrl;
      } else if (json.type === "form") {
        // For JazzCash/EasyPaisa form submission
        const form = document.createElement("form");
        form.method = "POST";
        form.action = json.formUrl;

        Object.entries(json.params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment setup failed");
    } finally {
      setLoading(false);
    }
  }

  const buttonClass = variant === "full"
    ? "w-full py-2.5 bg-[var(--color-brand-700)] text-white font-semibold rounded-xl hover:bg-[var(--color-brand-800)] transition-colors"
    : "w-full py-2.5 border border-[var(--color-brand-700)] text-[var(--color-brand-700)] font-semibold rounded-xl hover:bg-[var(--color-brand-50)] transition-colors";

  return (
    <button
      onClick={handleRetryPayment}
      disabled={loading}
      className={`flex items-center justify-center gap-2 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <CreditCard className="w-4 h-4" />
      {loading ? "Processing..." : "Retry Payment"}
    </button>
  );
}
