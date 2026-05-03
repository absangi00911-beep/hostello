import Link from "next/link";
import type { Hostel, User } from "@prisma/client";
import { HostelCard } from "@/components/features/hostels/hostel-card";
import { ArrowRight } from "lucide-react";

type FeaturedHostel = Pick<
  Hostel,
  | "id"
  | "name"
  | "slug"
  | "city"
  | "area"
  | "pricePerMonth"
  | "gender"
  | "amenities"
  | "coverImage"
  | "images"
  | "verified"
  | "rating"
  | "reviewCount"
  | "createdAt"
> & {
  owner: Pick<User, "id" | "name" | "avatar">;
};

export function FeaturedHostels({ hostels }: { hostels: FeaturedHostel[] }) {
  if (hostels.length === 0) return null;

  return (
    <section className="py-24 sm:py-32 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-14">
          <p className="text-sm font-bold tracking-widest text-[var(--color-brand-600)] uppercase mb-3">
            Top Rated Hostels
          </p>
          <div className="flex items-end justify-between">
            <div>
              <h2
                className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Hostels worth booking
              </h2>
              <p className="text-lg text-[var(--color-ink-muted)]">
                Verified by our team, loved by students
              </p>
            </div>
            <Link
              href="/hostels"
              className="hidden sm:flex items-center gap-2 text-base font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
            >
              Browse all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>

        <div className="mt-10 sm:hidden">
          <Link
            href="/hostels"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-[var(--color-border)] text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors btn-press"
          >
            Browse all hostels
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
