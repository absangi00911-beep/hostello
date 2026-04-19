import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { VerifyHostelButton } from "@/components/features/admin/verify-hostel-button";
import { SuspendHostelButton } from "@/components/features/admin/suspend-hostel-button";

export const metadata: Metadata = { title: "Admin — Hostels" };

const STATUS_CLS: Record<string, string> = {
  ACTIVE:         "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]",
  PENDING_REVIEW: "text-amber-700 bg-amber-50 border-amber-200",
  DRAFT:          "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]",
  SUSPENDED:      "text-red-700 bg-red-50 border-red-200",
};

export default async function AdminHostelsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const hostels = await db.hostel.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, city: true, status: true, verified: true,
      pricePerMonth: true, createdAt: true,
      owner: { select: { name: true, email: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="py-10 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">← Admin</Link>
            <h1 className="text-3xl font-extrabold text-[var(--color-ink)] mt-2" style={{ fontFamily: "var(--font-display)" }}>
              Hostels ({hostels.length})
            </h1>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {hostels.map((h) => (
              <div key={h.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/hostels/${h.id}`} className="text-sm font-bold text-[var(--color-ink)] hover:underline">
                      {h.name}
                    </Link>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLS[h.status] ?? ""}`}>
                      {h.status.replace("_", " ")}
                    </span>
                    {h.verified && (
                      <span className="text-xs font-semibold text-[var(--color-brand-700)]">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {h.city} · {h.owner.name} · {formatPrice(h.pricePerMonth)}/mo
                    · {h._count.bookings} bookings · Listed {formatDate(h.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!h.verified && h.status === "ACTIVE" && (
                    <VerifyHostelButton hostelId={h.id} />
                  )}
                  {h.status !== "SUSPENDED" && (
                    <SuspendHostelButton hostelId={h.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
