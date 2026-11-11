import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/owner/ListingForm";
import { ListingStatusActions } from "@/components/owner/ListingStatusActions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { getListingStatusLabel } from "@/components/owner/ownerListings";
import { auth } from "@/lib/auth/config";
import { getOwnerListingForEdit } from "@/lib/owner-listing";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/owner/listings/${id}/edit`)}`,
    );
  }

  // The PATCH route only accepts owners, and listings are scoped by ownerId.
  if (session.user.role !== "OWNER") {
    notFound();
  }

  const listing = await getOwnerListingForEdit(session.user.id, id);
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
      <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-20 pt-8 md:pt-10">
        <Link
          className="text-[0.85rem] font-semibold text-brand hover:underline"
          href="/owner"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
          Edit listing
        </h1>
        <p className="mb-6 mt-2 text-[0.95rem] text-muted">
          {listing.name} · {getListingStatusLabel(listing.status)}
        </p>
        {listing.status === "SUSPENDED" ? (
          <p
            className="rounded-[14px] bg-surface-muted px-4 py-3 text-[0.95rem] text-ink"
            role="note"
          >
            This listing is suspended and can&apos;t be edited.{" "}
            <Link className="font-semibold text-brand hover:underline" href="/contact">
              Contact support
            </Link>{" "}
            to find out why.
          </p>
        ) : (
          <>
            <ListingStatusActions hostelId={listing.id} status={listing.status} />
            <ListingForm existing={{ id: listing.id, listing }} />
          </>
        )}
      </main>
    </>
  );
}
