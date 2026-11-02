import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminOverviewPage } from "@/components/admin/AdminOverviewPage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Admin | HostelLo" };

export default async function AdminRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  // Everything behind this page is admin-only; other roles see a 404 rather
  // than a hint that an admin area exists.
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
      <AdminOverviewPage />
    </>
  );
}
