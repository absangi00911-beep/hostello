// Path: src/app/hostels/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  SearchPageClient,
  type SearchPageClientProps,
} from "./SearchPageClient";
import { PageSpinner } from "@/components/ui/shared";

/* -- Metadata ----------------------------------------------- */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const city = typeof params.city === "string" ? params.city : undefined;
  return {
    title: city ? `Hostels in ${city}` : "Find hostels",
    description: city
      ? `Browse verified student hostels in ${city}. Compare prices, amenities, and book online.`
      : "Search verified student hostels across Pakistan. Filter by city, gender, price, and amenities.",
  };
}

/* -- Page --------------------------------------------------- */
export default async function HostelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Parse every param the API accepts
  const initialQ =
    typeof params.q === "string" ? params.q : "";

  const initialCity =
    typeof params.city === "string" ? params.city : "";

  const initialGender =
    params.gender === "MALE" ||
    params.gender === "FEMALE" ||
    params.gender === "MIXED"
      ? params.gender
      : ("" as const);

  const initialMinPrice = params.minPrice
    ? Math.max(0, parseInt(String(params.minPrice), 10) || 0)
    : 0;

  const initialMaxPrice = params.maxPrice
    ? Math.min(50_000, parseInt(String(params.maxPrice), 10) || 50_000)
    : 50_000;

  const initialAmenities = Array.isArray(params.amenities)
    ? params.amenities.filter(Boolean)
    : typeof params.amenities === "string"
    ? [params.amenities]
    : [];

  const sortRaw = typeof params.sort === "string" ? params.sort : "newest";
  const initialSort =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "rating" ||
    sortRaw === "newest"
      ? sortRaw
      : ("newest" as const);

  const initialPage = params.page
    ? Math.max(1, parseInt(String(params.page), 10) || 1)
    : 1;

  const clientProps: SearchPageClientProps = {
    initialQ,
    initialCity,
    initialGender,
    initialMinPrice,
    initialMaxPrice,
    initialAmenities,
    initialSort,
    initialPage,
  };

  return (
    <PublicLayout noFooter>
      <Suspense
        fallback={
          <div className="container-app py-10">
            <PageSpinner label="Loading hostels…" />
          </div>
        }
      >
        <SearchPageClient {...clientProps} />
      </Suspense>
    </PublicLayout>
  );
}
