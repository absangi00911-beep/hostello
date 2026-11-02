import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPayoutsPage } from "@/components/admin/AdminPayoutsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Owner payouts | HostelLo" };

export default async function AdminPayoutsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/payouts")}`);
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
      <AdminPayoutsPage />
    </>
  );
}
