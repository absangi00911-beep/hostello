// Path: src/app/hostels/page.tsx
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SearchPageClient } from "./SearchPageClient";
import { CITIES } from "@hostello/shared";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type GenderFilter = "" | "MALE" | "FEMALE" | "MIXED";
type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

const VALID_GENDERS = new Set(["MALE", "FEMALE", "MIXED"]);
const VALID_SORTS = new Set(["newest", "price_asc", "price_desc", "rating"]);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function textParam(value: string | string[] | undefined): string {
  return first(value)?.trim() ?? "";
}

function normalizeCity(value: string | string[] | undefined): string {
  const raw = textParam(value);
  if (!raw) return "";

  return CITIES.find((city) => city.toLowerCase() === raw.toLowerCase()) ?? "";
}

function numberParam(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(first(value));
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = textParam(params.q);
  const city = normalizeCity(params.city);
  const titleParts = ["Student hostels"];

  if (city) titleParts.push(`in ${city}`);
  if (q) titleParts.push(`for ${q}`);

  return {
    title: `${titleParts.join(" ")} | HostelLo`,
    description:
      "Search verified student hostels by city, price, gender, and amenities.",
  };
}

export default async function HostelsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const genderRaw = textParam(params.gender);
  const sortRaw = textParam(params.sort);
  const initialMinPrice = numberParam(params.minPrice, 0, 0, 50_000);
  const initialMaxPrice = numberParam(
    params.maxPrice,
    50_000,
    initialMinPrice,
    50_000
  );

  return (
    <PublicLayout noFooter>
      <SearchPageClient
        initialQ={textParam(params.q)}
        initialCity={normalizeCity(params.city)}
        initialGender={
          VALID_GENDERS.has(genderRaw) ? (genderRaw as GenderFilter) : ""
        }
        initialMinPrice={initialMinPrice}
        initialMaxPrice={initialMaxPrice}
        initialAmenities={all(params.amenities).map((item) => item.trim()).filter(Boolean)}
        initialSort={VALID_SORTS.has(sortRaw) ? (sortRaw as SortOption) : "newest"}
        initialPage={numberParam(params.page, 1, 1, 1_000)}
      />
    </PublicLayout>
  );
}
