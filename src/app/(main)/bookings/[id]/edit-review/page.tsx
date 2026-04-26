import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { EditReviewForm } from "@/components/features/hostels/edit-review-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Review",
};

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  // Fetch the review to edit
  const review = await db.review.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      rating: true,
      title: true,
      comment: true,
      cleanliness: true,
      location: true,
      value: true,
      safety: true,
      hostel: { select: { name: true } },
    },
  });

  if (!review) {
    redirect("/");
  }

  // Verify ownership
  if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <EditReviewForm
      reviewId={id}
      hostelName={review.hostel.name}
      initialData={{
        rating: review.rating,
        title: review.title || "",
        comment: review.comment,
        cleanliness: review.cleanliness || 0,
        location: review.location || 0,
        value: review.value || 0,
        safety: review.safety || 0,
      }}
    />
  );
}
