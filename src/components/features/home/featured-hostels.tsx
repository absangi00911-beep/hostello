import Link from "next/link";
import type { Hostel, User } from "@prisma/client";
import { HostelCard } from "@/components/features/hostels/hostel-card";

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
> & {
  owner: Pick<User, "id" | "name" | "avatar">;
};

export function FeaturedHostels({ hostels }: { hostels: FeaturedHostel[] }) {
  if (hostels.length === 0) return null;

  return (
    <section className="py-20 bg-[var(--color-sand-50)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[var(--color-accent-600)] uppercase mb-2">
              Hand-picked
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hostels worth checking out
            </h2>
          </div>
          <Link
            href="/hostels"
            className="hidden sm:block text-sm font-medium text-[var(--color-primary-700)] hover:underline"
          >
            Browse all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/hostels"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-sand-100)] transition-colors"
          >
            Browse all hostels
          </Link>
        </div>
      </div>
    </section>
  );
}
