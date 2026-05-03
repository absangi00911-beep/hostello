import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import BookingDetail from "@/components/features/dashboard/booking-detail";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Booking Details - Owner Dashboard",
  description: "View booking details and manage status",
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch booking with related data
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      hostel: { select: { id: true, name: true, ownerId: true } },
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      room: { select: { id: true, name: true } },
    },
  });

  if (!booking) {
    redirect("/dashboard/bookings");
  }

  // Check ownership
  if (booking.hostel.ownerId !== session.user.id) {
    redirect("/dashboard/bookings");
  }

  return (
    <main>
      <BookingDetail booking={booking} />
    </main>
  );
}
