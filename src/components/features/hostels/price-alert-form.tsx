"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Bell } from "lucide-react";

const schema = z.object({
  targetPrice: z.number().positive("Target price must be positive"),
});
type Input = z.infer<typeof schema>;

interface PriceAlertFormProps {
  hostelId: string;
  hostelName: string;
  currentPrice: number;
  existingAlert?: {
    id: string;
    targetPrice: number;
    active: boolean;
  };
  onSuccess?: () => void;
}

const INPUT =
  "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

export function PriceAlertForm({ hostelId, hostelName, currentPrice, existingAlert, onSuccess }: PriceAlertFormProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetPrice: existingAlert?.targetPrice ?? Math.floor(currentPrice * 0.9), // Default to 10% discount
    },
  });

  async function onSubmit(data: Input) {
    setLoading(true);
    try {
      const method = existingAlert ? "PATCH" : "POST";
      const url = existingAlert ? `/api/price-alerts/${existingAlert.id}` : "/api/price-alerts";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          existingAlert ? data : { hostelId, ...data }
        ),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save alert");
      }

      toast.success(existingAlert ? "Price alert updated." : "Price alert created! We'll notify you when the price drops.");
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingAlert) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/price-alerts/${existingAlert.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete alert");
      }

      toast.success("Price alert deleted.");
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-[var(--color-brand-500)]" />
        <h3
          className="text-base font-extrabold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Price alert for {hostelName}
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="text-sm text-[var(--color-muted)] mb-3">
            Current monthly price: <span className="font-bold text-[var(--color-ink)]">PKR {currentPrice.toLocaleString()}</span>
          </p>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
            Alert me when price drops below
          </label>
          <div className="relative">
            <input
              {...register("targetPrice", { valueAsNumber: true })}
              type="number"
              placeholder="E.g., 5000"
              className={INPUT}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)] pointer-events-none">
              PKR
            </span>
          </div>
          {errors.targetPrice && (
            <p className="mt-1.5 text-xs text-red-600">{errors.targetPrice.message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Saving…" : existingAlert ? "Update alert" : "Create alert"}
          </button>

          {existingAlert && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? "Deleting…" : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </form>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        {existingAlert ? "We'll email you when the price drops below your target." : "Once set, we'll monitor the price and send you an email when it drops."}
      </p>
    </div>
  );
}
