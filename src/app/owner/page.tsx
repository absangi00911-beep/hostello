import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OWNER_WORKSPACE_NAVIGATION } from "@/components/owner/ownerNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Host dashboard" };

export default async function OwnerDashboardRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner")}`);
  }

  // The listings API returns every owner's listings to admins, so this
  // owner-facing dashboard is limited to owners; admins get their own console.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  const displayName =
    session.user.name?.trim() || session.user.email?.split("@")[0] || "host";

  return (
    <WorkspaceShell
      activeHref="/owner"
      navigation={OWNER_WORKSPACE_NAVIGATION}
      header={
        <OwnerPageHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image,
            role: session.user.role,
          }}
        />
      }
    >
      <OwnerDashboard ownerName={displayName} />
    </WorkspaceShell>
  );
}
