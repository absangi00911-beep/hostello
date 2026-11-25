import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminVerificationsPage } from "@/components/admin/AdminVerificationsPage";
import { ADMIN_WORKSPACE_NAVIGATION } from "@/components/admin/adminNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Student verification" };

export default async function AdminVerificationsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/verifications")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/admin/verifications"
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
      <AdminVerificationsPage />
    </WorkspaceShell>
  );
}
