// Path: src/app/dashboard/bookings/[id]/review/page.tsx

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ReviewForm } from "@/components/dashboard/ReviewForm";

export const metadata: Metadata = { title: "Leave a review" };

export default async function LeaveReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/dashboard/bookings/${id}/review`);

  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      checkIn: true,
      checkOut: true,
      hostel: {
        select: { id: true, name: true, slug: true, city: true, coverImage: true },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) notFound();
  if (booking.status !== "COMPLETED") {
    // Can't review a stay that hasn't happened (or was cancelled) yet
    redirect("/dashboard/bookings");
  }

  // Pre-fill if they're revisiting an already-submitted review — the API
  // upserts, so this page doubles as "edit my review" with no extra work.
  const existingReview = await db.review.findUnique({
    where: { hostelId_userId: { hostelId: booking.hostel.id, userId: session.user.id } },
  });

  return (
    <div className="mx-auto max-w-5xl py-6">
      <ReviewForm
        booking={{
          id: booking.id,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          hostel: booking.hostel,
        }}
        existingReview={
          existingReview
            ? {
                rating: existingReview.rating,
                title: existingReview.title ?? "",
                comment: existingReview.comment,
                cleanliness: existingReview.cleanliness,
                location: existingReview.location,
                value: existingReview.value,
                safety: existingReview.safety,
                wouldRecommend: existingReview.wouldRecommend,
              }
            : null
        }
      />
    </div>
  );
}
