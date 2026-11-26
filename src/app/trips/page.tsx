import { redirect } from "next/navigation";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { TripsPage } from "@/components/student/TripsPage";
import { auth } from "@/lib/auth/config";

export default async function TripsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/trips")}`);
  }

  if (session.user.role !== "STUDENT") {
    redirect(session.user.role === "OWNER" ? "/owner" : "/admin");
  }

  return (
    <>
      <DesktopAccountHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <TripsPage />
      <MobileTabNavigation activeTab="trips" role="STUDENT" />
    </>
  );
}
