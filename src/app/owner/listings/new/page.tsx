import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/owner/ListingForm";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Add a listing | HostelLo" };

export default async function NewListingRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/listings/new")}`);
  }

  // Only owners can create listings (POST /api/hostels rejects everyone else).
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
      <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-20 pt-8 md:pt-10">
        <h1 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
          Add a listing
        </h1>
        <p className="mb-6 mt-2 text-[0.95rem] text-muted">
          Tell students about your hostel. You can submit once the details and
          at least one room type are filled in.
        </p>
        <ListingForm />
      </main>
    </>
  );
}
