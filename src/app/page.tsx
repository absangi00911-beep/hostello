import ProductHome from "@/components/home/ProductHome";
import { auth } from "@/lib/auth/config";

export default async function HomePage() {
  const session = await auth();
  const accountUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return <ProductHome accountUser={accountUser} />;
}
