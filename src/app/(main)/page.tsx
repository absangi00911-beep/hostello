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

export const revalidate = 3600; // revalidate hourly

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

  // Single query instead of 8 separate COUNT calls
  const rows = await db.hostel.groupBy({
    by: ["city"],
    where: { city: { in: cities }, status: "ACTIVE" },
    _count: { id: true },
  });

  const countMap = Object.fromEntries(rows.map((r) => [r.city, r._count.id]));
  return cities.map((city) => ({ city, count: countMap[city] ?? 0 }));
}

export default async function HomePage() {
  const [featured, cityStats] = await Promise.all([
    getFeaturedHostels(),
    getCityStats(),
  ]);

  return (
    <>
      <HeroSection />
      <TrustBanner />
      <CityCards stats={cityStats} />
      <FeaturedHostels hostels={featured} />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
