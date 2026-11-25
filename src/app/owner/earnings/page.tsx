import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { OwnerEarningsPage } from "@/components/owner/OwnerEarningsPage";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OWNER_WORKSPACE_NAVIGATION } from "@/components/owner/ownerNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Earnings" };

export default async function OwnerEarningsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/earnings")}`);
  }

  // Bank details can only be saved by owners (PATCH /api/owner/earnings), and
  // payouts belong to the owner, so this page is owner-only.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/owner/earnings"
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
      <OwnerEarningsPage />
    </WorkspaceShell>
  );
}
