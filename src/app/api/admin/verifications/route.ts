import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

const updateSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = (req.nextUrl.searchParams.get("status") ?? "PENDING") as (typeof VALID_STATUSES)[number];
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const users = await db.user.findMany({
    where: { verificationStatus: status },
    orderBy: { verificationSubmittedAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      verificationDocUrl: true,
      verificationSubmittedAt: true,
      _count: {
        select: { bookings: true },
      },
    },
  });

  return NextResponse.json({ data: users });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  const updateData: {
    verificationStatus: "APPROVED" | "REJECTED";
    studentVerified: boolean;
    verificationDocUrl?: string | null;
    verifiedById: string;
    verificationDecidedAt: Date;
  } =
    action === "approve"
      ? {
          verificationStatus: "APPROVED",
          studentVerified: true,
          verificationDocUrl: undefined,
          verifiedById: session.user.id,
          verificationDecidedAt: new Date(),
        }
      : {
          verificationStatus: "REJECTED",
          studentVerified: false,
          verificationDocUrl: null,
          verifiedById: session.user.id,
          verificationDecidedAt: new Date(),
        };

  try {
    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    void createNotification({
      userId,
      type: action === "approve" ? "HOSTEL_APPROVED" : "HOSTEL_REJECTED",
      title: action === "approve" ? "Student verification approved" : "Student verification rejected",
      message:
        action === "approve"
          ? "Your student verification has been approved."
          : "Your student verification was not approved. Please review the feedback and resubmit the correct document.",
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/verifications]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
