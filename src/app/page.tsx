import { CityLinks } from "@/components/city/CityLinks";
import ProductHome from "@/components/home/ProductHome";
import { auth } from "@/lib/auth/config";
import { getCityLinks } from "@/lib/city-links";
import { loadInitialHomeHostels } from "./load-initial-home-hostels";

export default async function HomePage() {
  const [session, cities, initialHostels] = await Promise.all([
    auth(),
    getCityLinks(),
    loadInitialHomeHostels(),
  ]);
  const accountUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <ProductHome
      accountUser={accountUser}
      cityLinks={<CityLinks cities={cities} />}
      initialHostels={initialHostels}
    />
  );
}
