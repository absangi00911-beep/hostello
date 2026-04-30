import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CITIES } from "@/config/amenities";
import { SearchFilters } from "@/components/features/search/search-filters";
import { HostelResults } from "@/components/features/search/hostel-results";
import { SearchHeader } from "@/components/features/search/search-header";
import { HostelCardSkeleton } from "@/components/features/hostels/hostel-card";

interface CityPageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  return CITIES.map((city) => ({
    city: city.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  
  // Normalize city name (capitalize first letter)
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  
  // Validate city exists
  const isValidCity = CITIES.some(
    (c) => c.toLowerCase() === city.toLowerCase()
  );
  
  if (!isValidCity) {
    return {
      title: "City Not Found",
    };
  }

  return {
    title: `Student Hostels in ${cityName} | HostelLo`,
    description: `Find verified student hostels in ${cityName}, Pakistan. Safe, affordable accommodation near universities. Compare prices, amenities, and reviews.`,
    keywords: [
      `hostels in ${cityName}`,
      `student accommodation ${cityName}`,
      `verified hostels ${cityName}`,
      `affordable student housing ${cityName}`,
    ],
    openGraph: {
      title: `Student Hostels in ${cityName} | HostelLo`,
      description: `Find verified student hostels in ${cityName}, Pakistan. Safe, affordable accommodation near universities.`,
      type: "website",
      url: `https://hostello.pk/cities/${city}`,
    },
    alternates: {
      canonical: `https://hostello.pk/cities/${city}`,
    },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: CityPageProps) {
  const { city } = await params;
  const searchParamsData = await searchParams;
  
  // Validate city exists
  const isValidCity = CITIES.some(
    (c) => c.toLowerCase() === city.toLowerCase()
  );
  
  if (!isValidCity) {
    notFound();
  }

  // Normalize city name to match database
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  
  // Set city filter in search params
  const paramsWithCity = {
    ...searchParamsData,
    city: cityName,
  };

  return (
    <div className="min-h-screen pt-16">
      <SearchHeader params={paramsWithCity} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SearchFilters initialParams={paramsWithCity} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <HostelCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <HostelResults params={paramsWithCity} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
