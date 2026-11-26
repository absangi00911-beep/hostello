import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminOverviewPage } from "@/components/admin/AdminOverviewPage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_WORKSPACE_NAVIGATION } from "@/components/admin/adminNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  // Everything behind this page is admin-only; other roles go to their account area.
  if (session.user.role !== "ADMIN") {
    redirect(session.user.role === "OWNER" ? "/owner" : "/profile");
  }

  return (
    <WorkspaceShell
      activeHref="/admin"
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
      <AdminOverviewPage />
    </WorkspaceShell>
  );
}
