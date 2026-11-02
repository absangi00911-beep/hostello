import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OwnerBlockedDatesPage } from "@/components/owner/OwnerBlockedDatesPage";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { auth } from "@/lib/auth/config";
import { getOwnerListingSummary } from "@/lib/owner-listing";

export const metadata: Metadata = { title: "Blocked dates | HostelLo" };

export default async function OwnerBlockedDatesRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/owner/listings/${id}/blocked-dates`)}`,
    );
  }

  // The blocked-dates API only accepts owners, scoped to their own listings.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  const listing = await getOwnerListingSummary(session.user.id, id);
  if (!listing) {
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
      <OwnerBlockedDatesPage hostelId={listing.id} listingName={listing.name} />
    </>
  );
}
