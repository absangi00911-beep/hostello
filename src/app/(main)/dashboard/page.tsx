import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Heart, Building2, TrendingUp, Bell,
  CheckCircle2, Plus, Eye, Star, ChevronRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS = {
  PENDING:   { label: "Pending",   cls: "text-amber-700  bg-amber-50   border-amber-200"  },
  CONFIRMED: { label: "Confirmed", cls: "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]" },
  CANCELLED: { label: "Cancelled", cls: "text-red-700     bg-red-50     border-red-200"    },
  COMPLETED: { label: "Completed", cls: "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRow {
  id: string; checkIn: Date; checkOut: Date; total: number; status: string;
  hostel: { name: string; slug: string };
  user?: { name: string; avatar: string | null } | null;
}

interface OwnerHostel {
  id: string; name: string; slug: string; city: string; status: string;
  coverImage: string | null; images: string[]; verified: boolean;
  rating: number; reviewCount: number; pricePerMonth: number; viewCount: number;
  _count: { bookings: number };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isOwner = session.user.role === "OWNER";

  if (isOwner) {
    const [hostels, recentBookings] = await Promise.all([
      db.hostel.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, slug: true, city: true, status: true,
          coverImage: true, images: true, verified: true, rating: true,
          reviewCount: true, pricePerMonth: true, viewCount: true,
          _count: { select: { bookings: true } },
        },
      }),
      db.booking.findMany({
        where: { hostel: { ownerId: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          hostel: { select: { name: true, slug: true } },
          user:   { select: { name: true, avatar: true } },
        },
      }),
    ]);

    const revenue = await db.booking.aggregate({
      where: { hostel: { ownerId: session.user.id }, paymentStatus: "PAID" },
      _sum: { total: true },
    });

    return (
      <OwnerDashboard
        user={session.user}
        hostels={hostels}
        recentBookings={recentBookings}
        totalRevenue={revenue._sum.total ?? 0}
      />
    );
  }

  const [bookings, favorites] = await Promise.all([
    db.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        hostel: { select: { id: true, name: true, slug: true, coverImage: true, city: true } },
      },
    }),
    db.favorite.count({ where: { userId: session.user.id } }),
  ]);

  return <StudentDashboard user={session.user} bookings={bookings} favoritesCount={favorites} />;
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({
  user, bookings, favoritesCount,
}: {
  user: { name: string; email: string };
  bookings: (BookingRow & { hostel: BookingRow["hostel"] & { id: string; coverImage: string | null; city: string } })[];
  favoritesCount: number;
}) {
  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Student account
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hey, {firstName}.
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <Stat label="Bookings" value={bookings.length} icon={BookOpen} />
          <Stat label="Saved" value={favoritesCount} icon={Heart} />
          <Stat label="Confirmed" value={bookings.filter((b) => b.status === "CONFIRMED").length} icon={CheckCircle2} accent />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-10">
          <Link
            href="/hostels"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
          >
            Browse hostels
          </Link>
          <Link
            href="/favorites"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Heart className="w-4 h-4" /> Saved
          </Link>
          <Link
            href="/dashboard/price-alerts"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Bell className="w-4 h-4" /> Alerts
          </Link>
        </div>

        {/* Recent bookings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent bookings
            </h2>
            <Link href="/bookings" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
              View all →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <Empty icon={BookOpen} message="No bookings yet" cta={{ href: "/hostels", label: "Find a hostel" }} />
          ) : (
            <div className="space-y-2.5">
              {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────

function OwnerDashboard({
  user, hostels, recentBookings, totalRevenue,
}: {
  user: { name: string; email: string };
  hostels: OwnerHostel[];
  recentBookings: BookingRow[];
  totalRevenue: number;
}) {
  const firstName   = user.name.split(" ")[0];
  const activeCount = hostels.filter((h) => h.status === "ACTIVE").length;
  const totalViews  = hostels.reduce((s, h) => s + h.viewCount, 0);
  const pendingCount = recentBookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between py-10">
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
              Owner account
            </p>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hey, {firstName}.
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">{user.email}</p>
          </div>
          <Link
            href="/dashboard/hostels/new"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] transition-colors"
          >
            <Plus className="w-4 h-4" /> List hostel
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <Stat label="Active listings"   value={activeCount}                   icon={Building2}  />
          <Stat label="Pending requests"  value={pendingCount}                  icon={BookOpen}   accent={pendingCount > 0} />
          <Stat label="Total views"       value={totalViews.toLocaleString()}   icon={Eye}        />
          <Stat label="Revenue received"  value={formatPrice(totalRevenue)}     icon={TrendingUp} small />
        </div>

        {/* Listings */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your listings
            </h2>
            <Link
              href="/dashboard/hostels/new"
              className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add new
            </Link>
          </div>

          {hostels.length === 0 ? (
            <Empty icon={Building2} message="No hostels listed yet" cta={{ href: "/dashboard/hostels/new", label: "List your first hostel" }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hostels.map((h) => <HostelCard key={h.id} hostel={h} />)}
            </div>
          )}
        </section>

        {/* Recent booking requests */}
        {recentBookings.length > 0 && (
          <section>
            <h2
              className="text-lg font-extrabold text-[var(--color-ink)] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Booking requests
            </h2>
            <div className="space-y-2.5">
              {recentBookings.map((b) => <BookingCard key={b.id} booking={b} showUser />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({
  label, value, icon: Icon, accent = false, small = false,
}: {
  label: string; value: string | number;
  icon: React.ElementType; accent?: boolean; small?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
        accent
          ? "bg-[var(--color-brand-500)]"
          : "bg-[var(--color-ground)] border border-[var(--color-border)]"
      }`}>
        <Icon className={`w-4 h-4 ${accent ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`} />
      </div>
      <p
        className={`font-extrabold text-[var(--color-ink)] ${small ? "text-base" : "text-2xl"}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--color-muted)] mt-0.5">{label}</p>
    </div>
  );
}

function BookingCard({
  booking, showUser = false,
}: {
  booking: BookingRow; showUser?: boolean;
}) {
  const status = STATUS[booking.status as keyof typeof STATUS];

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-ink)] transition-colors group"
    >
      {showUser && booking.user && (
        <div className="w-9 h-9 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {booking.user.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
          {booking.hostel.name}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          {showUser && booking.user ? `${booking.user.name} · ` : ""}
          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          {formatPrice(booking.total)}
        </span>
        {status && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
            {status.label}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-ink)] transition-colors" />
      </div>
    </Link>
  );
}

function HostelCard({ hostel }: { hostel: OwnerHostel }) {
  const img = hostel.coverImage ?? hostel.images?.[0];

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex gap-4 hover:border-[var(--color-ink)] transition-colors">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--color-ground)] relative">
        {img && (
          <Image src={img} alt={hostel.name} fill sizes="64px" className="object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--color-ink)] truncate">{hostel.name}</p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{hostel.city}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{hostel._count.bookings}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{hostel.viewCount}</span>
          {hostel.rating > 0 && (
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[var(--color-accent-500)] text-[var(--color-accent-500)]" />{hostel.rating.toFixed(1)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            hostel.status === "ACTIVE"
              ? "text-[var(--color-brand-700)] bg-[var(--color-brand-50)]"
              : "text-[var(--color-muted)] bg-[var(--color-ground)]"
          }`}
        >
          {hostel.status === "ACTIVE" ? "Live" : hostel.status.toLowerCase()}
        </span>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/dashboard/hostels/${hostel.id}/edit`}
            className="text-xs font-bold text-[var(--color-brand-700)] hover:underline"
          >
            Edit
          </Link>
          <Link
            href={`/hostels/${hostel.slug}`}
            className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Empty({
  icon: Icon, message, cta,
}: {
  icon: React.ElementType; message: string; cta: { href: string; label: string };
}) {
  return (
    <div className="py-14 text-center rounded-2xl border border-dashed border-[var(--color-border)]">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-ground)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-[var(--color-muted)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">{message}</p>
      <Link
        href={cta.href}
        className="mt-3 inline-block text-sm font-bold text-[var(--color-brand-700)] hover:underline"
      >
        {cta.label} →
      </Link>
    </div>
  );
}
