import { auth } from "@/lib/auth/config";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import SearchPageClient from "./SearchPageClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string | string[];
    nearby?: string | string[];
    moveInDate?: string | string[];
    guests?: string | string[];
  }>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const city = typeof params.city === "string" ? params.city.trim() : "";
  const nearby = params.nearby === "true" && !city;
  const dateValue = params.moveInDate;
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
    typeof params.guests === "string" && /^[1-8]$/.test(params.guests)
      ? Number(params.guests)
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
    />
  );
}
