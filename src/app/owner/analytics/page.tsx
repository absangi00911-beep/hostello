import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AnalyticsPage } from "@/components/owner/AnalyticsPage";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OWNER_WORKSPACE_NAVIGATION } from "@/components/owner/ownerNavigation";
import { auth } from "@/lib/auth/config";

export default async function OwnerAnalyticsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/analytics")}`);
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    notFound();
  }

  if (session.user.role === "ADMIN") {
    return <AnalyticsPage />;
  }

  return (
    <WorkspaceShell
      activeHref="/owner/analytics"
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
      <AnalyticsPage />
    </WorkspaceShell>
  );
}
