import Link from "next/link";
import { getCityPathForName } from "@/lib/city-pages";

/** Visible breadcrumb: Home / Hostels in {city} / {hostel}. Mirrors the JSON-LD trail. */
export function HostelBreadcrumb({ city, name }: { city: string; name: string }) {
  const cityPath = getCityPathForName(city) ?? `/search?city=${encodeURIComponent(city)}`;

  return (
    <nav aria-label="Breadcrumb" className="pb-3 text-sm text-muted [@media(max-width:720px)]:px-5 [@media(max-width:720px)]:pt-4">
      <Link className="hover:underline" href="/">
        Home
      </Link>
      <span aria-hidden="true"> / </span>
      <Link className="hover:underline" href={cityPath}>
        Hostels in {city}
      </Link>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{name}</span>
    </nav>
  );
}
