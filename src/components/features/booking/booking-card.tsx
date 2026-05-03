"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, ArrowRight, Star, ChevronDown, Info, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/loading";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/payment-methods";
import { MoveInPicker, DurationPicker, addMonths, monthToDateStr } from "./month-picker";

interface BookingCardProps {
  hostelId:     string;
  hostelSlug:   string;
  hostelName:   string;
  pricePerMonth: number;
  minStay:      number;
  maxStay?:     number;
  rating?:      number;
  reviewCount?: number;
}

const STEPS = [
  { n: "1", text: "Owner reviews your request" },
  { n: "2", text: "You get a confirmation email" },
  { n: "3", text: "Pay & collect your move-in details" },
];

/**
 * Programmatically submit a hidden form to the given URL.
 * Used for JazzCash and EasyPaisa which require a browser POST
 * to their checkout pages (not a simple redirect).
 */
function submitPaymentForm(action: string, params: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;

  for (const [name, value] of Object.entries(params)) {
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Detects if pricing may surprise the user based on calendar month boundaries.
 * 
 * Pricing logic: We charge based on calendar month boundaries, not actual duration.
 * Examples:
 * - Jan 1 → Jan 30 = 0 month boundaries → charged as 1 month
 * - Jan 31 → Feb 1 = 1 month boundary → charged as 1 month
 * - Jan 15 → Feb 15 = 1 month boundary → charged as 1 month
 * 
 * This is intentional (Option A from billing.md) but users should understand it.
 * Returns warning text if the calculation might surprise them, null otherwise.
 */
function getPricingWarning(duration: number | null, checkIn: string, checkOut: string, pricePerMonth: number): string | null {
  if (duration === null || !checkIn || !checkOut) return null;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Edge case: checkout is on the 1st of the month
  // Jan 31 → Feb 1 looks like just 2 days but charges as 1 full month
  if (
    checkOutDate.getDate() === 1 &&
    checkInDate.getMonth() !== checkOutDate.getMonth()
  ) {
    return `You'll be charged for the full month (₨${(duration * pricePerMonth).toLocaleString("en-PK")}), even though you're checking out on the 1st.`;
  }

  // Another edge case: same calendar month booking (e.g., Jan 1 → Jan 30)
  // Still charged as 1 full month
  if (
    checkInDate.getMonth() === checkOutDate.getMonth() &&
    checkInDate.getFullYear() === checkOutDate.getFullYear() &&
    duration === 1
  ) {
    const monthName = checkInDate.toLocaleDateString("en-PK", { month: "long" });
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return `You're staying ${days} days in ${monthName}, but you'll be charged for the full month (₨${pricePerMonth.toLocaleString("en-PK")}).`;
  }

  return null;
}

export function BookingCard({
  hostelId,
  hostelSlug,
  hostelName: _hostelName,
  pricePerMonth,
  minStay,
  maxStay,
  rating,
  reviewCount,
}: BookingCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [moveInMonth, setMoveInMonth] = useState("");
  const [duration,    setDuration]    = useState(minStay);
  const [guests,      setGuests]      = useState(1);
  const [payment,     setPayment]     = useState<string>(DEFAULT_PAYMENT_METHOD);
  const [loading,     setLoading]     = useState(false);
  const [showSteps,   setShowSteps]   = useState(false);

  // Prevent double-submission during slow payment redirects
  const requestInFlightRef = useRef(false);

  // ── Availability urgency ──────────────────────────────────────────────────
  const [availableNow, setAvailableNow] = useState<number | null>(null);

  useEffect(() => {
    if (!hostelSlug) return;

    fetch(`/api/hostels/${hostelSlug}/availability`)
      .then((r) => r.json())
      .then((j) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const entry = (j.data ?? []).find(
          (m: { month: string; available: number }) => m.month === currentMonth
        );
        if (entry !== undefined) setAvailableNow(entry.available);
      })
      .catch(() => {});
  }, [hostelSlug]);

  // Derived values
  const checkIn   = moveInMonth ? monthToDateStr(moveInMonth) : "";
  const checkOut  = moveInMonth ? addMonths(moveInMonth, duration) : "";
  const months    = moveInMonth ? duration : null;
  const rentTotal = months !== null ? months * pricePerMonth : null;
  const pricingWarning = getPricingWarning(months, checkIn, checkOut, pricePerMonth);

  const hasRating =
    rating !== undefined && rating > 0 &&
    reviewCount !== undefined && reviewCount > 0;

  async function handleBook() {
    // Prevent double-submission synchronously (before state updates batch)
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    
    // Set loading immediately to disable button visually
    setLoading(true);

    // Validate inputs and exit early if needed
    if (!session) {
      toast.error("Sign in to book");
      setLoading(false);
      requestInFlightRef.current = false;
      router.push("/login");
      return;
    }
    if (!moveInMonth) {
      toast.error("Choose a move-in month");
      setLoading(false);
      requestInFlightRef.current = false;
      return;
    }
    if (months && months < minStay) {
      toast.error(`Minimum stay is ${minStay} month${minStay !== 1 ? "s" : ""}`);
      setLoading(false);
      requestInFlightRef.current = false;
      return;
    }
    if (maxStay && months && months > maxStay) {
      toast.error(`Maximum stay is ${maxStay} months`);
      setLoading(false);
      requestInFlightRef.current = false;
      return;
    }

    try {
      // Step 1: create the booking record
      const res  = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hostelId, checkIn, checkOut, guests, paymentMethod: payment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      const bookingId = data.data.id;

      // Step 2: initiate payment
      const payRes  = await fetch("/api/payment/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId }),
      });
      const payData = await payRes.json();

      if (!payRes.ok) {
        // Payment initiation failed — still show the booking page
        toast.error(payData.error ?? "Payment setup failed. You can retry from your booking.");
        router.push(`/bookings/${bookingId}`);
        return;
      }

      // Redirect-based checkout (Safepay)
      if (payData.type === "redirect" && payData.redirectUrl) {
        toast.success("Redirecting to payment…");
        window.location.href = payData.redirectUrl;
        return;
      }

      // Form-based checkout (JazzCash / EasyPaisa)
      if (payData.type === "form" && payData.formUrl && payData.params) {
        toast.success("Redirecting to payment…");
        submitPaymentForm(payData.formUrl, payData.params);
        return;
      }

      // Fallback: unknown response shape — just show the booking
      toast.success("Booking request sent!");
      router.push(`/bookings/${bookingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      requestInFlightRef.current = false;
    }
  }

  function AvailabilitySignal() {
    if (availableNow === null) return null;

    if (availableNow <= 0) {
      return (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          Fully booked this month
        </p>
      );
    }

    const isLow = availableNow <= 5;
    const isMid = availableNow <= 15;

    return (
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold",
          isLow ? "text-red-600" : isMid ? "text-amber-600" : "text-[var(--color-brand-700)]"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full inline-block",
            isLow ? "bg-red-500" : isMid ? "bg-amber-500" : "bg-[var(--color-brand-500)]"
          )}
        />
        {availableNow} bed{availableNow !== 1 ? "s" : ""} available this month
      </p>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-card">

      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-brand-50)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl font-extrabold text-[var(--color-brand-700)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatPrice(pricePerMonth)}
              </span>
              <span className="text-base text-[var(--color-ink-muted)]">/ month</span>
            </div>
            {minStay > 1 && (
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Min. {minStay} month stay
              </p>
            )}
          </div>
          {hasRating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--color-accent-200)] flex-shrink-0">
              <Star className="w-4 h-4 text-[var(--color-accent-500)] fill-current" />
              <span className="text-sm font-bold text-[var(--color-ink)]">{rating!.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-ink-muted)]">({reviewCount})</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Move-in month */}
        <MoveInPicker value={moveInMonth} onChange={setMoveInMonth} />

        {/* Availability signal */}
        <AvailabilitySignal />

        {/* Duration */}
        <DurationPicker
          value={duration}
          onChange={setDuration}
          min={minStay}
          max={maxStay ?? 24}
        />

        {/* Check-out date display */}
        <div className="rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)] p-4">
          <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-2.5 uppercase tracking-wide">
            Check-out date
          </label>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--color-brand-600)]" />
            <p className="text-base font-semibold text-[var(--color-ink)]">
              {moveInMonth ? (
                new Date(checkOut).toLocaleDateString("en-PK", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              ) : (
                <span className="text-[var(--color-ink-muted)]">Select check-in date & duration</span>
              )}
            </p>
          </div>
          {moveInMonth && (
            <p className="text-sm text-[var(--color-ink-muted)] mt-2">
              {months} month{months !== 1 ? "s" : ""} from{" "}
              <span className="font-semibold text-[var(--color-brand-600)]">
                {new Date(checkIn).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
              </span>
            </p>
          )}
        </div>

        {/* Guests */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-2 uppercase tracking-wide">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-brand-600)] pointer-events-none" />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-[var(--color-border)] text-base font-medium bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-2.5 uppercase tracking-wide">Pay via</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => pm.enabled && setPayment(pm.value)}
                disabled={!pm.enabled}
                title={pm.hint}
                className={cn(
                  "py-3 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1.5",
                  payment === pm.value
                    ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                    : pm.enabled
                      ? "border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]"
                      : "border-[var(--color-border)] text-[var(--color-ink-muted)] opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-lg">{pm.emoji}</span>
                {pm.label}
                <span className="text-[10px] font-medium opacity-75">{pm.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing warning for edge cases */}
        {pricingWarning && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed font-medium">
              {pricingWarning}
            </p>
          </div>
        )}

        {/* Price breakdown with billing disclosure */}
        {months !== null && rentTotal !== null && (
          <div className="space-y-3">
            <div className="rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)] p-4 space-y-2 text-base">
              <div className="flex justify-between text-[var(--color-ink-muted)]">
                <span>{formatPrice(pricePerMonth)} × {months} calendar month{months !== 1 ? "s" : ""}</span>
                <span className="font-semibold">{formatPrice(rentTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-[var(--color-ink)] pt-3 border-t border-[var(--color-border)]">
                <span>Total due at booking</span>
                <span style={{ fontFamily: "var(--font-display)" }} className="text-lg">{formatPrice(rentTotal)}</span>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <Info className="w-4 h-4 text-[var(--color-ink-muted)] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  The owner may collect a refundable security deposit (typically 2 months' rent) directly on move-in day. This is separate from the amount charged here.
                </p>
              </div>
            </div>

            {/* General billing disclosure about calendar months */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 leading-relaxed space-y-1">
                <p className="font-semibold">
                  You&apos;re booking for <span className="font-bold">{months} calendar month{months !== 1 ? "s" : ""}</span>.
                </p>
                <p>
                  Pricing is based on calendar month boundaries. For example, booking from Jan 15 to Feb 15 = 1 calendar month = {formatPrice(pricePerMonth)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleBook}
          disabled={loading || requestInFlightRef.current}
          className="w-full h-13 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover"
        >
          {loading ? (
            <Spinner size="md" />
          ) : (
            <>Request to book <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        {/* What happens next */}
        <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
          >
            <span>What happens after I request?</span>
            <ChevronDown className={cn("w-4 h-4 text-[var(--color-ink-muted)] transition-transform", showSteps && "rotate-180")} />
          </button>
          {showSteps && (
            <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-4 space-y-3">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-brand-600)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{s.text}</p>
                </div>
              ))}
              <p className="text-xs text-[var(--color-ink-muted)] pt-2 border-t border-[var(--color-border)]">
                You won&apos;t be charged until the owner confirms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}