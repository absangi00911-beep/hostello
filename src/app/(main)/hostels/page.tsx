import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchFilters } from "@/components/features/search/search-filters";
import { HostelResults } from "@/components/features/search/hostel-results";
import { SearchHeader } from "@/components/features/search/search-header";
import { HostelCardSkeleton } from "@/components/features/hostels/hostel-card";

export const metadata: Metadata = {
  title: "Browse Hostels",
  description:
    "Search verified student hostels across Pakistan. Filter by city, price, gender, and amenities.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function HostelsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen pt-16">
      <SearchHeader params={params} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SearchFilters initialParams={params} />
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
              <HostelResults params={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
