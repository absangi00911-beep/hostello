import { notFound, redirect } from "next/navigation";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
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
      <ProfilePage />
      <MobileTabNavigation activeTab="profile" />
    </>
  );
}
