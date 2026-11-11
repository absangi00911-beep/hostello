import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OwnerBookingsPage } from "@/components/owner/OwnerBookingsPage";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Bookings" };

export default async function OwnerBookingsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/bookings")}`);
  }

  // Booking emails link here. Only owners respond to requests; the list API
  // scopes owners to their own hostels' paid bookings.
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
      <OwnerBookingsPage />
    </>
  );
}
