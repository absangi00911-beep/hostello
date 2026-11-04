import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { BookingDetailPage } from "@/components/student/BookingDetailPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Booking | HostelLo" };

export default async function BookingDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/bookings/${id}`)}`);
  }

  // Owner and admin booking screens belong to their own workspaces.
  if (session.user.role !== "STUDENT") {
    notFound();
  }

  return (
    <>
      <SiteHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <BookingDetailPage
        bookingId={id}
        paymentCode={typeof payment === "string" ? payment : null}
      />
      <MobileTabNavigation activeTab="trips" role="STUDENT" />
    </>
  );
}
