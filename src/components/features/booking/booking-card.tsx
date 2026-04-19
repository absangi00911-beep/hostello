"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, Users, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, calculateMonths } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  hostelId: string;
  hostelName: string;
  pricePerMonth: number;
  minStay: number;
  maxStay?: number;
}

const PAYMENT_METHODS = [
  { value: "jazzcash",  label: "JazzCash",      emoji: "📱" },
  { value: "easypaisa", label: "EasyPaisa",     emoji: "💚" },
  { value: "safepay",   label: "Card",          emoji: "💳" },
] as const;

const DATE_INPUT =
  "w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

export function BookingCard({ hostelId, hostelName, pricePerMonth, minStay, maxStay }: BookingCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests,   setGuests]   = useState(1);
  const [payment,  setPayment]  = useState<string>("jazzcash");
  const [loading,  setLoading]  = useState(false);

  const today  = new Date().toISOString().split("T")[0];
  const months = checkIn && checkOut ? calculateMonths(new Date(checkIn), new Date(checkOut)) : null;
  const total  = months ? months * pricePerMonth : null;

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

      // Initiate Safepay checkout
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
        // Safepay unavailable — still land on booking page
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

      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-ground)]">
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

      <div className="p-5 space-y-4">

        {/* Dates */}
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

        {/* Guests */}
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

        {/* Payment */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Pay via</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPayment(pm.value)}
                className={cn(
                  "py-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1",
                  payment === pm.value
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-ink-soft)]"
                )}
              >
                <span className="text-base">{pm.emoji}</span>
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        {months !== null && total !== null && (
          <div className="rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] p-3.5 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>{formatPrice(pricePerMonth)} × {months} month{months !== 1 ? "s" : ""}</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--color-ink)] pt-2 border-t border-[var(--color-border)]">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-display)" }}>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {/* CTA */}
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

        <p className="text-xs text-center text-[var(--color-muted)]">
          You won't be charged until the owner confirms.
        </p>
      </div>
    </div>
  );
}
