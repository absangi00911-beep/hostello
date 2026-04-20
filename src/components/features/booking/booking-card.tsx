"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, Users, ArrowRight, Loader2, Star, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, calculateMonths } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/payment-methods";

interface BookingCardProps {
  hostelId: string;
  hostelName: string;
  pricePerMonth: number;
  minStay: number;
  maxStay?: number;
  /** Pass from the hostel record so the card can show social proof */
  rating?: number;
  reviewCount?: number;
}

// Security deposit is 2 months rent — standard practice across Pakistan
const SECURITY_DEPOSIT_MONTHS = 2;

const DATE_INPUT =
  "w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

const STEPS = [
  { n: "1", text: "Owner reviews your request" },
  { n: "2", text: "You get a confirmation email" },
  { n: "3", text: "Pay & collect your move-in details" },
];

export function BookingCard({
  hostelId,
  hostelName: _hostelName,
  pricePerMonth,
  minStay,
  maxStay,
  rating,
  reviewCount,
}: BookingCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests,   setGuests]   = useState(1);
  const [payment,  setPayment]  = useState<string>(DEFAULT_PAYMENT_METHOD);
  const [loading,  setLoading]  = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const today  = new Date().toISOString().split("T")[0];
  const months = checkIn && checkOut ? calculateMonths(new Date(checkIn), new Date(checkOut)) : null;
  const rentTotal    = months ? months * pricePerMonth : null;
  const depositTotal = pricePerMonth * SECURITY_DEPOSIT_MONTHS;
  const grandTotal   = rentTotal !== null ? rentTotal + depositTotal : null;

  const hasRating = rating !== undefined && rating > 0 && reviewCount !== undefined && reviewCount > 0;

  async function handleBook() {
    if (!session) { toast.error("Sign in to book"); router.push("/login"); return; }
    if (!checkIn || !checkOut) { toast.error("Pick your move-in and move-out dates"); return; }
    if (months && months < minStay) { toast.error(`Minimum stay is ${minStay} month${minStay !== 1 ? "s" : ""}`); return; }
    if (maxStay && months && months > maxStay) { toast.error(`Maximum stay is ${maxStay} months`); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId, checkIn, checkOut, guests, paymentMethod: payment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      const bookingId = data.data.id;

      const payRes = await fetch("/api/payment/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId }),
      });
      const payData = await payRes.json();

      if (payRes.ok && payData.redirectUrl) {
        toast.success("Redirecting to payment…");
        window.location.href = payData.redirectUrl;
      } else {
        toast.success("Booking request sent!");
        router.push(`/bookings/${bookingId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-ground)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-extrabold text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatPrice(pricePerMonth)}
              </span>
              <span className="text-sm text-[var(--color-muted)]">/ month</span>
            </div>
            {minStay > 1 && (
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Min. {minStay} month stay
              </p>
            )}
          </div>

          {/* Rating badge */}
          {hasRating && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-accent-500)]/10 border border-[var(--color-accent-500)]/20 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-[var(--color-accent-500)] fill-current" />
              <span className="text-sm font-bold text-[var(--color-ink)]">{rating!.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-muted)]">({reviewCount})</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ── Dates ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Move in</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)] pointer-events-none" />
              <input type="date" value={checkIn} min={today}
                onChange={(e) => setCheckIn(e.target.value)} className={DATE_INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Move out</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)] pointer-events-none" />
              <input type="date" value={checkOut} min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)} className={DATE_INPUT} />
            </div>
          </div>
        </div>

        {/* ── Guests ── */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)] pointer-events-none" />
            <select
              value={guests} onChange={(e) => setGuests(Number(e.target.value))}
              className={cn(DATE_INPUT, "appearance-none cursor-pointer")}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Payment ── */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Pay via</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => pm.enabled && setPayment(pm.value)}
                disabled={!pm.enabled}
                title={pm.hint}
                className={cn(
                  "py-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1",
                  payment === pm.value
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : pm.enabled
                      ? "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-ink-soft)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)] opacity-55 cursor-not-allowed"
                )}
              >
                <span className="text-base">{pm.emoji}</span>
                {pm.label}
                <span className="text-[10px] font-medium uppercase tracking-wide">
                  {pm.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Price breakdown ── */}
        {months !== null && rentTotal !== null && (
          <div className="rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] p-3.5 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>{formatPrice(pricePerMonth)} × {months} month{months !== 1 ? "s" : ""}</span>
              <span>{formatPrice(rentTotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span className="flex items-center gap-1">
                Security deposit
                <span className="text-[10px] bg-[var(--color-border)] text-[var(--color-muted)] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                  refundable
                </span>
              </span>
              <span>{formatPrice(depositTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--color-ink)] pt-2 border-t border-[var(--color-border)]">
              <span>Total due now</span>
              <span style={{ fontFamily: "var(--font-display)" }}>{formatPrice(grandTotal!)}</span>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={handleBook}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Request to book <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        {/* ── What happens next ── */}
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-ground)] transition-colors"
          >
            <span>What happens after I request?</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[var(--color-muted)] transition-transform", showSteps && "rotate-180")} />
          </button>
          {showSteps && (
            <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 space-y-2.5">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{s.text}</p>
                </div>
              ))}
              <p className="text-[10px] text-[var(--color-muted)] pt-1">
                You won&apos;t be charged until the owner confirms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}