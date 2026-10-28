import { notFound, redirect } from "next/navigation";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { TripsPage } from "@/components/student/TripsPage";
import { auth } from "@/lib/auth/config";

export default async function TripsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/trips")}`);
  }

  if (session.user.role !== "STUDENT") {
    notFound();
  }

  return (
    <>
      <TripsPage />
      <MobileTabNavigation activeTab="trips" />
    </>
  );
}
