import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/** GET — list all pending verifications */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await db.user.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { verificationSubmittedAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      verificationDocUrl: true,
      verificationSubmittedAt: true,
      _count: { select: { bookings: true } },
    },
  });

  return NextResponse.json({ data: pending });
}

/** PUT — approve or reject a verification */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await req.json().catch(() => ({}));
  if (!userId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "userId and action (approve|reject) required" }, { status: 400 });
  }

  const approved = action === "approve";

  await db.user.update({
    where: { id: userId },
    data: {
      verificationStatus: approved ? "APPROVED" : "REJECTED",
      studentVerified:    approved,
      // Clear doc URL on rejection so student can resubmit cleanly
      verificationDocUrl: approved ? undefined : null,
    },
  });

  // Notify the student
  createNotification({
    userId,
    type:    approved ? "HOSTEL_APPROVED" : "HOSTEL_REJECTED",  // reuse closest type
    title:   approved ? "Student ID verified ✓" : "Verification not approved",
    message: approved
      ? "Your student ID has been verified. Your profile now shows a verified badge."
      : "Your submitted document couldn't be verified. Please resubmit with a clearer image of your university ID or enrolment letter.",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
