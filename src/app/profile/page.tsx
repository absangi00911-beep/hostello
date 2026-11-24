import { notFound, redirect } from "next/navigation";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProfilePage } from "@/components/student/ProfilePage";
import { auth } from "@/lib/auth/config";

export default async function ProfileRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  if (session.user.role !== "STUDENT") {
    notFound();
  }

  return (
    <>
      <SiteHeader
        hideOnMobile={false}
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <ProfilePage />
      <MobileTabNavigation activeTab="profile" role="STUDENT" />
    </>
  );
}
