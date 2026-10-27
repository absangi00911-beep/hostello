import { auth } from "@/lib/auth/config";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import SearchPageClient from "./SearchPageClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string | string[] }>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const city = typeof params.city === "string" ? params.city.trim() : "";
  const accountUser: BrowseAccountUser | null = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return <SearchPageClient accountUser={accountUser} initialCity={city} />;
}
