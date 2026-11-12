import { CityLinks } from "@/components/city/CityLinks";
import ProductHome from "@/components/home/ProductHome";
import { auth } from "@/lib/auth/config";
import { getCityLinks } from "@/lib/city-links";

export default async function HomePage() {
  const [session, cities] = await Promise.all([auth(), getCityLinks()]);
  const accountUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return <ProductHome accountUser={accountUser} cityLinks={<CityLinks cities={cities} />} />;
}
