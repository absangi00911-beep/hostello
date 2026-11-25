import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminListingsPage } from "@/components/admin/AdminListingsPage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_WORKSPACE_NAVIGATION } from "@/components/admin/adminNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Listing review" };

export default async function AdminListingsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/listings")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/admin/listings"
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
      <AdminListingsPage />
    </WorkspaceShell>
  );
}
