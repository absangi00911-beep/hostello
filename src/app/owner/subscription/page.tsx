import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OwnerSubscriptionPage } from "@/components/owner/OwnerSubscriptionPage";
import { parseReturnState } from "@/components/owner/ownerSubscription";
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
    <>
      <OwnerPageHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <OwnerSubscriptionPage returnState={parseReturnState(await searchParams)} />
    </>
  );
}
