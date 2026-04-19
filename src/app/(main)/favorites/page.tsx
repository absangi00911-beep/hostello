import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Heart } from "lucide-react";
import Link from "next/link";
import { HostelCard } from "@/components/features/hostels/hostel-card";

export const metadata: Metadata = { title: "Saved Hostels" };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      hostel: {
        select: {
          id: true, name: true, slug: true, city: true, area: true,
          pricePerMonth: true, gender: true, amenities: true,
          coverImage: true, images: true, verified: true,
          rating: true, reviewCount: true,
          owner: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Your list
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Saved hostels
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {favorites.length} {favorites.length === 1 ? "hostel" : "hostels"} saved
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--color-border)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-5">
              <Heart className="w-6 h-6 text-[var(--color-muted)]" />
            </div>
            <p className="text-base font-bold text-[var(--color-ink)] mb-1">
              Nothing saved yet
            </p>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Tap the heart on any hostel listing to save it here.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(({ hostel }) => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
