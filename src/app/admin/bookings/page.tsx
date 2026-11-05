import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminBookingsPage } from "@/components/admin/AdminBookingsPage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Bookings | HostelLo" };

export default async function AdminBookingsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/bookings")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <AdminBookingsPage />
    </>
  );
}
