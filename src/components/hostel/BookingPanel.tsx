// Path: src/components/hostel/BookingPanel.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPKR } from "@/components/ui/shared";

interface Room {
  id: string;
  name: string;
  pricePerMonth: number;
  capacity: number;
  available: number;
}

interface BookingPanelProps {
  hostelId: string;
  hostelSlug: string;
  hostelName: string;
  ownerId: string;
  basePricePerMonth: number;
  rooms: Room[];
}

/* ── Months between two dates (rounded up) ───────────────── */
function monthsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (d2 <= d1) return 0;
  const months =
    (d2.getFullYear() - d1.getFullYear()) * 12 +
    (d2.getMonth() - d1.getMonth());
  return Math.max(1, months);
}

/* ── Booking form ────────────────────────────────────────── */
function BookingForm({
  hostelId,
  hostelSlug,
  basePricePerMonth,
  rooms,
  onSuccess,
}: {
  hostelId: string;
  hostelSlug: string;
  basePricePerMonth: number;
  rooms: Room[];
  onSuccess: (bookingId: string) => void;
}) {
  const { data: session } = useSession();
  const [roomId, setRoomId]     = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests]     = useState(1);
  const [loading, setLoading]   = useState(false);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const pricePerMonth = selectedRoom?.pricePerMonth ?? basePricePerMonth;
  const months  = monthsBetween(checkIn, checkOut);
  const total   = months * pricePerMonth;

  // Tomorrow as ISO date string for min check-in
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!session) {
      toast.error("Sign in to book a hostel.");
      return;
    }
    if (!session.user.emailVerified) {
      toast.error("Verify your email before booking.");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Choose your check-in and check-out dates.");
      return;
    }
    if (months < 1) {
      toast.error("Minimum stay is 1 month.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelId,
          roomId: roomId || undefined,
          checkIn:  new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          months,
          guests,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Booking failed. Please try again.");
        return;
      }

      toast.success("Booking request sent!");
      onSuccess(json.data.id);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)]";

  const labelCls =
    "block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Room selector */}
      {rooms.length > 1 && (
        <div>
          <label htmlFor="room-select" className={labelCls}>
            Room type
          </label>
          <select
            id="room-select"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={`${inputCls} appearance-none`}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id} disabled={r.available === 0}>
                {r.name} — {formatPKR(r.pricePerMonth)}/mo
                {r.available === 0 ? " (full)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="check-in" className={labelCls}>
            Check-in
          </label>
          <input
            id="check-in"
            type="date"
            value={checkIn}
            min={tomorrow}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut("");
            }}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="check-out" className={labelCls}>
            Check-out
          </label>
          <input
            id="check-out"
            type="date"
            value={checkOut}
            min={checkIn || tomorrow}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <label htmlFor="guests" className={labelCls}>
          Guests
        </label>
        <input
          id="guests"
          type="number"
          min={1}
          max={selectedRoom?.capacity ?? 10}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
          className={inputCls}
        />
      </div>

      {/* Total */}
      {months > 0 && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            <span>{formatPKR(pricePerMonth)} × {months} month{months !== 1 ? "s" : ""}</span>
            <span>{formatPKR(total)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] pt-1 border-t border-[var(--color-border-subtle)]">
            <span>Total</span>
            <span>{formatPKR(total)}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        type="submit"
        disabled={loading || !checkIn || !checkOut || months < 1}
        className="inline-flex w-full items-center justify-center gap-2 h-12 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body)] font-[600] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
      >
        {loading ? (
          <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        ) : null}
        {loading ? "Sending request…" : "Request booking"}
      </button>
    </form>
  );
}

/* ── Main BookingPanel ───────────────────────────────────── */
export function BookingPanel({
  hostelId,
  hostelSlug,
  hostelName,
  ownerId,
  basePricePerMonth,
  rooms,
}: BookingPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleBookingSuccess(bookingId: string) {
    setSheetOpen(false);
    router.push(`/booking/${bookingId}/review`);
  }

  async function startConversation() {
    if (!session) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelId,
          initialMessage: "Hi, I'm interested in booking a room at your hostel.",
        }),
      });
      const json = await res.json();
      if (res.ok) router.push(`/dashboard/messages?conversation=${json.data.id}`);
      else toast.error("Couldn't start conversation. Try again.");
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <>
      {/* ── Desktop sticky panel ─────────────────────────── */}
      <aside
        className="hidden lg:block sticky top-24 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-md)]"
        aria-label="Booking panel"
      >
        {/* Price */}
        <div className="mb-5">
          <p
            className="text-[var(--text-h3)] font-[700] text-[var(--color-primary-deep)] leading-none"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {formatPKR(basePricePerMonth)}
            <span className="text-[var(--text-body)] font-[400] text-[var(--color-text-muted)]">
              {" "}/ month
            </span>
          </p>
        </div>

        <BookingForm
          hostelId={hostelId}
          hostelSlug={hostelSlug}
          basePricePerMonth={basePricePerMonth}
          rooms={rooms}
          onSuccess={handleBookingSuccess}
        />

        {/* Message owner */}
        <button
          onClick={startConversation}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-transparent text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)]"
        >
          <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          Message owner
        </button>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-4 py-3">
        <div>
          <p className="text-[var(--text-h5)] font-[700] text-[var(--color-primary-deep)] leading-none">
            {formatPKR(basePricePerMonth)}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">per month</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={startConversation}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
            aria-label="Message owner"
          >
            <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="h-10 px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]">
                Request booking
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-[var(--radius-xl)] bg-[var(--color-bg-card)] border-t border-[var(--color-border-default)] max-h-[90dvh] overflow-y-auto p-5"
            >
              <SheetHeader className="mb-5">
                <SheetTitle
                  className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] text-left"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Request booking — {hostelName}
                </SheetTitle>
              </SheetHeader>
              <BookingForm
                hostelId={hostelId}
                hostelSlug={hostelSlug}
                basePricePerMonth={basePricePerMonth}
                rooms={rooms}
                onSuccess={handleBookingSuccess}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}