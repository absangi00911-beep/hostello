import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { StudentVerificationPage } from "@/components/student/StudentVerificationPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Student verification" };

export default async function StudentVerificationRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/profile/verification")}`);
  }

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
      <StudentVerificationPage />
      <MobileTabNavigation activeTab="profile" role="STUDENT" />
    </>
  );
}
