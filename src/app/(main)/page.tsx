import type { Metadata } from "next";
import { HeroSection } from "@/components/features/home/hero-section";
import { CityCards } from "@/components/features/home/city-cards";
import { FeaturedHostels } from "@/components/features/home/featured-hostels";
import { HowItWorks } from "@/components/features/home/how-it-works";
import { TrustBanner } from "@/components/features/home/trust-banner";
import { CtaSection } from "@/components/features/home/cta-section";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "HostelLo — Find Student Hostels in Pakistan",
};

export const revalidate = 3600;

async function getFeaturedHostels() {
  return db.hostel.findMany({
    where: { status: "ACTIVE", featured: true },
    take: 6,
    orderBy: { rating: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      area: true,
      pricePerMonth: true,
      gender: true,
      amenities: true,
      coverImage: true,
      images: true,
      verified: true,
      rating: true,
      reviewCount: true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
}

async function getCityStats() {
  const cities = [
    "Lahore",
    "Islamabad",
    "Karachi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Rawalpindi",
    "Quetta",
    "Bahawalpur",
  ];

  // Single query to get counts for all cities
  const rows = await db.hostel.groupBy({
    by: ["city"],
    where: { city: { in: cities }, status: "ACTIVE" },
    _count: { id: true },
  });

  const countMap = Object.fromEntries(rows.map((r) => [r.city, r._count.id]));
  return cities.map((city) => ({ city, count: countMap[city] ?? 0 }));
}

/** Real counts fetched from the database at build/revalidation time */
async function getPlatformStats() {
  const [hostelCount, bookingCount] = await Promise.all([
    db.hostel.count({ where: { status: "ACTIVE" } }),
    db.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
  ]);

  return { hostelCount, bookingCount };
}

export default async function HomePage() {
  const [featured, cityStats, stats] = await Promise.all([
    getFeaturedHostels(),
    getCityStats(),
    getPlatformStats(),
  ]);

  return (
    <>
      <HeroSection
        hostelCount={stats.hostelCount}
        studentsHoused={stats.bookingCount}
      />
      <TrustBanner />
      <CityCards stats={cityStats} />
      <FeaturedHostels hostels={featured} />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
