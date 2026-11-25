import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OwnerSubscriptionPage } from "@/components/owner/OwnerSubscriptionPage";
import { parseReturnState } from "@/components/owner/ownerSubscription";
import { OWNER_WORKSPACE_NAVIGATION } from "@/components/owner/ownerNavigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Subscription" };

export default async function OwnerSubscriptionRoute({
  searchParams,
}: {
  searchParams: Promise<{
    upgraded?: string | string[];
    cancelled?: string | string[];
  }>;
}) {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/subscription")}`);
  }

  // The subscription API is owner-only.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  return (
    <WorkspaceShell
      activeHref="/owner/subscription"
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
      <OwnerSubscriptionPage returnState={parseReturnState(await searchParams)} />
    </WorkspaceShell>
  );
}
