import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OwnerReviewsPage } from "@/components/owner/OwnerReviewsPage";
import { OWNER_WORKSPACE_NAVIGATION } from "@/components/owner/ownerNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Reviews" };

export default async function OwnerReviewsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/reviews")}`);
  }

  // Admins can also reach the APIs, but this page is the owner's workspace and
  // replies are written in the owner's voice.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/owner/reviews"
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
      <OwnerReviewsPage />
    </WorkspaceShell>
  );
}
