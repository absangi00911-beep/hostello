import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRoommateReportsPage } from "@/components/admin/AdminRoommateReportsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Roommate reports | HostelLo" };

export default async function AdminRoommateReportsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/roommate-reports")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <AdminRoommateReportsPage />
    </>
  );
}
