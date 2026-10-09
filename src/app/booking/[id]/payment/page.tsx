// Path: src/app/booking/[id]/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, Lock } from "lucide-react";
import { BookingStepLayout } from "@/components/booking/BookingStepLayout";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { PageSpinner, RecoveryNotice } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { CANCELLATION_POLICY_DETAILS, cancellationPolicySummary, type CancellationPolicy } from "@/lib/cancellation-policy";

type PaymentMethod = "safepay" | "jazzcash" | "easypaisa";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
}[] = [
  {
    id:          "safepay",
    label:       "Card payment",
    description: "Visa, Mastercard via Safepay",
    enabled:     true,
  },
  {
    id:          "jazzcash",
    label:       "JazzCash",
    description: "Mobile wallet — coming soon",
    enabled:     false,
  },
  {
    id:          "easypaisa",
    label:       "EasyPaisa",
    description: "Mobile wallet — coming soon",
    enabled:     false,
  },
];

export default function PaymentPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const bookingId = params.id;

  const [booking,  setBooking]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [selected, setSelected] = useState<PaymentMethod>("safepay");
  const [paying,   setPaying]   = useState(false);

  /* -- Fetch booking ------------------------------------ */
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Booking not found");

        // Already paid → skip to confirmation
        if (
          json.data.paymentStatus === "PAID" ||
          json.data.status === "CONFIRMED"
        ) {
          router.replace(`/booking/${bookingId}/confirmation`);
          return;
        }
        setBooking(json.data);
      } catch (e: any) {
        setFetchErr(e.message ?? "Failed to load booking");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId, router]);

  /* -- Initiate payment --------------------------------- */
  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    try {
      const res  = await fetch("/api/payment/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          bookingId,
          paymentMethod: selected,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Payment initiation failed.");
        return;
      }

      // Safepay: redirect to checkout URL
      if (json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
        return;
      }

      // JazzCash/EasyPaisa: form-POST handled server-side (future)
      toast.error("This payment method is not yet available.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  /* -- Render states ------------------------------------ */
  if (loading) {
    return (
      <BookingStepLayout step={2} backHref={`/booking/${bookingId}/review`}>
        <PageSpinner label="Loading payment details…" />
      </BookingStepLayout>
    );
  }

  if (fetchErr) {
    return (
      <BookingStepLayout step={2} backHref={`/booking/${bookingId}/review`}>
        <RecoveryNotice
          tone="error"
          title="Payment details unavailable"
          message={fetchErr}
          primaryAction={
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
          }
        />
      </BookingStepLayout>
    );
  }

  return (
    <BookingStepLayout
      step={2}
      backHref={`/booking/${bookingId}/review`}
    >
      {/* Heading */}
      <div className="mb-6">
        <h1
          className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)] mb-1"

        >
          Choose payment method
        </h1>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          Select how you'd like to pay for your booking.
        </p>
      </div>

      {/* Booking summary — compact */}
      <BookingSummaryCard booking={booking} />

      {/* Payment method pills */}
      <div className="mt-6 space-y-2.5" role="radiogroup" aria-label="Payment method">
        {PAYMENT_OPTIONS.map(({ id, label, description, enabled }) => {
          const isSelected = selected === id;
          return (
            <label
              key={id}
              className={`
                flex items-center gap-4 rounded-[var(--radius-lg)] border-2 p-4 cursor-pointer
                transition-all duration-[var(--transition-base)]
                ${!enabled ? "opacity-50 cursor-not-allowed" : ""}
                ${
                  isSelected && enabled
                    ? "border-[var(--color-action)] bg-[var(--color-action-light)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]"
                }
              `}
            >
              {/* Custom radio */}
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-[var(--transition-fast)]
                  ${
                    isSelected && enabled
                      ? "border-[var(--color-action)] bg-[var(--color-action)]"
                      : "border-[var(--color-border-strong)] bg-[var(--color-bg-card)]"
                  }
                `}
              >
                {isSelected && enabled && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>

              <input
                type="radio"
                name="paymentMethod"
                value={id}
                checked={isSelected}
                onChange={() => enabled && setSelected(id)}
                disabled={!enabled}
                className="sr-only"
              />

              {/* Icon */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)]">
                <CreditCard
                  size={18}
                  strokeWidth={1.5}
                  className="text-[color:var(--color-text-muted)]"
                  aria-hidden="true"
                />
              </span>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
                  {label}
                </p>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                  {description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Safepay redirect notice */}
      {selected === "safepay" && (
        <p className="mt-4 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] text-center">
          You'll be redirected to Safepay to complete payment securely.
        </p>
      )}

      {/* Cancellation policy */}
      <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] px-4 py-3">
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] leading-relaxed">
          <strong className="font-[600] text-[color:var(--color-text-heading)]">
            {(booking?.cancellationPolicy as CancellationPolicy | undefined)
              ? `${CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy as CancellationPolicy].label} cancellation policy. `
              : "Cancellation policy unavailable. "}
          </strong>
          {booking?.cancellationPolicy
            ? cancellationPolicySummary(booking.cancellationPolicy as CancellationPolicy)
            : "Please contact the owner before paying."} Approved refunds are initiated within 1 business day; banks may take 3–10 business days to post them. Your request is also sent to the owner after payment. They have 24 hours to respond; if they decline or do not respond, you receive a full refund.
        </p>
      </div>

      {/* Trust row */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <Lock size={12} strokeWidth={1.5} aria-hidden="true" />
          Encrypted
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} strokeWidth={1.5} aria-hidden="true" />
          Secured by Safepay
        </span>
      </div>

      {/* Pay button */}
      <div className="mt-8">
        <Button
          onClick={handlePay}
          loading={paying}
          disabled={!PAYMENT_OPTIONS.find((o) => o.id === selected)?.enabled}
          className="w-full h-12 text-[length:var(--text-body)]"
        >
          {paying ? "Redirecting to Safepay…" : "Proceed to payment"}
        </Button>
      </div>
    </BookingStepLayout>
  );
}
