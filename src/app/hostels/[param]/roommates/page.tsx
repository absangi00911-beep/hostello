import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { RoommatesPage } from "@/components/roommates/RoommatesPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Roommates" };

export default async function RoommatesRoute({
  params,
}: {
  params: Promise<{ param: string }>;
}) {
  const { param } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/hostels/${param}/roommates`)}`,
    );
  }

  // The roommate API is student-only, so other roles never see this page.
  if (session.user.role !== "STUDENT") {
    notFound();
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
      <RoommatesPage currentUserId={session.user.id} hostelParam={param} />
      <MobileTabNavigation activeTab="explore" role="STUDENT" />
    </>
  );
}
