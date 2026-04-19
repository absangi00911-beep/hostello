import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Users, Building2, BookOpen, TrendingUp, ChevronRight, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const [
    totalUsers,
    totalHostels,
    pendingHostels,
    totalBookings,
    pendingBookings,
    revenue,
    recentHostels,
    recentBookings,
  ] = await Promise.all([
    db.user.count(),
    db.hostel.count({ where: { status: "ACTIVE" } }),
    db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
    db.booking.count(),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.hostel.findMany({
      where:   { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take:    5,
      select:  { id: true, name: true, city: true, createdAt: true, owner: { select: { name: true } } },
    }),
    db.booking.findMany({
      where:   { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take:    5,
      include: {
        hostel: { select: { name: true } },
        user:   { select: { name: true } },
      },
    }),
  ]);

  const totalRevenue = revenue._sum.total ?? 0;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">Admin</p>
          <h1
            className="text-3xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Platform overview
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat icon={Users}     label="Users"           value={totalUsers} />
          <Stat icon={Building2} label="Active listings" value={totalHostels}
            badge={pendingHostels > 0 ? `${pendingHostels} pending` : undefined} accent={pendingHostels > 0} />
          <Stat icon={BookOpen}  label="Bookings"        value={totalBookings}
            badge={pendingBookings > 0 ? `${pendingBookings} pending` : undefined} accent={pendingBookings > 0} />
          <Stat icon={TrendingUp} label="Revenue"        value={formatPrice(totalRevenue)} small />
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { href: "/admin/hostels", label: "Manage hostels",  sub: "Verify or suspend listings", icon: Building2 },
            { href: "/admin/users",   label: "Manage users",    sub: "View and manage accounts",   icon: Users     },
            { href: "/admin/bookings",label: "All bookings",    sub: "Monitor booking activity",   icon: BookOpen  },
          ].map(({ href, label, sub, icon: Icon }) => (
            <Link
              key={href} href={href}
              className="flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-ink)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[var(--color-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--color-ink)]">{label}</p>
                <p className="text-xs text-[var(--color-muted)]">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-ink)] transition-colors" />
            </Link>
          ))}
        </div>

        {/* Pending hostels */}
        {recentHostels.length > 0 && (
          <Section title="Needs review" link="/admin/hostels?status=PENDING_REVIEW">
            {recentHostels.map((h) => (
              <Row key={h.id}
                title={h.name}
                sub={`${h.city} · by ${h.owner.name}`}
                right={<Link href={`/admin/hostels?status=PENDING_REVIEW#${h.id}`} className="text-xs font-bold text-[var(--color-brand-700)] hover:underline">Review</Link>}
              />
            ))}
          </Section>
        )}

        {/* Pending bookings */}
        {recentBookings.length > 0 && (
          <Section title="Pending bookings" link="/admin/bookings">
            {recentBookings.map((b) => (
              <Row key={b.id}
                title={b.hostel.name}
                sub={`${b.user.name} · ${formatPrice(b.total)}`}
                right={<span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/>Pending</span>}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, badge, accent = false, small = false }: {
  icon: React.ElementType; label: string; value: string | number;
  badge?: string; accent?: boolean; small?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-ground)] border border-[var(--color-border)]"}`}>
        <Icon className={`w-4 h-4 ${accent ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`} />
      </div>
      <p className={`font-extrabold text-[var(--color-ink)] ${small ? "text-base" : "text-2xl"}`} style={{ fontFamily: "var(--font-display)" }}>{value}</p>
      <p className="text-xs text-[var(--color-muted)] mt-0.5">{label}</p>
      {badge && <span className="mt-1.5 inline-block text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{badge}</span>}
    </div>
  );
}

function Section({ title, link, children }: { title: string; link: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        <Link href={link} className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">View all →</Link>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {children}
      </div>
    </section>
  );
}

function Row({ title, sub, right }: { title: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{title}</p>
        <p className="text-xs text-[var(--color-muted)]">{sub}</p>
      </div>
      {right}
    </div>
  );
}
