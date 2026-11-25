import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminBookingsPage } from "@/components/admin/AdminBookingsPage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_WORKSPACE_NAVIGATION } from "@/components/admin/adminNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/bookings")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/admin/bookings"
      navigation={ADMIN_WORKSPACE_NAVIGATION}
      header={
        <AdminPageHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image,
            role: session.user.role,
          }}
        />
      }
    >
      <AdminBookingsPage />
    </WorkspaceShell>
  );
}
