import { notFound, redirect } from "next/navigation";
import { WishlistsPage } from "@/components/student/WishlistsPage";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { auth } from "@/lib/auth/config";

export default async function WishlistsRoute() {
  const session = await auth();

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent("/wishlists")}`,
    );
  }

  if (session.user.role !== "STUDENT") {
    notFound();
  }

  return (
    <>
      <WishlistsPage />
      <MobileTabNavigation activeTab="wishlists" />
    </>
  );
}
