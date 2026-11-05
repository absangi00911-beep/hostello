import { auth } from "@/lib/auth/config";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { AMENITIES } from "@hostello/shared";
import SearchPageClient from "./SearchPageClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string | string[];
    nearby?: string | string[];
    moveInDate?: string | string[];
    guests?: string | string[];
    gender?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    amenities?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const firstString = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : "";
  const city = firstString(params.city).trim();
  const nearby = params.nearby === "true" && !city;
  const dateValue = firstString(params.moveInDate);
  const parsedDate =
    typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T00:00:00.000Z`)
      : null;
  const moveInDate =
    parsedDate && !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === dateValue
      ? dateValue
      : "";
  const guests =
    /^[1-8]$/.test(firstString(params.guests))
      ? Number(firstString(params.guests))
      : 1;
  const genderValue = firstString(params.gender);
  const gender =
    genderValue === "MALE" || genderValue === "FEMALE" || genderValue === "MIXED"
      ? genderValue
      : "";
  const parsePrice = (value: string | string[] | undefined) => {
    const raw = firstString(value);
    if (!raw || !/^\d{1,8}$/.test(raw)) return "";
    const price = Number(raw);
    return Number.isSafeInteger(price) ? String(price) : "";
  };
  const minPrice = parsePrice(params.minPrice);
  const maxPrice = parsePrice(params.maxPrice);
  const validPriceRange =
    !minPrice || !maxPrice || Number(minPrice) <= Number(maxPrice);
  const amenitiesValues = Array.isArray(params.amenities)
    ? params.amenities
    : params.amenities
      ? [params.amenities]
      : [];
  const amenities = [...new Set(amenitiesValues)].filter((value) =>
    AMENITIES.some((amenity) => amenity.id === value),
  );
  const sortValue = firstString(params.sort);
  const sort =
    sortValue === "rating" ||
    sortValue === "price_asc" ||
    sortValue === "price_desc" ||
    sortValue === "newest"
      ? sortValue
      : "newest";
  const pageValue = firstString(params.page);
  const page =
    /^\d{1,6}$/.test(pageValue) && Number(pageValue) > 0
      ? Number(pageValue)
      : 1;
  const accountUser: BrowseAccountUser | null = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <SearchPageClient
      accountUser={accountUser}
      initialCity={city}
      initialNearby={nearby}
      initialMoveInDate={moveInDate}
      initialGuests={guests}
      initialFilters={{
        gender,
        minPrice: validPriceRange ? minPrice : "",
        maxPrice: validPriceRange ? maxPrice : "",
        amenities,
        sort,
      }}
      initialPage={page}
    />
  );
}
