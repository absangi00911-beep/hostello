import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  hostelId: z.string().cuid(),
  action:   z.enum(["verify", "suspend", "activate"]),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { hostelId, action } = parsed.data;

  const data: Record<string, unknown> =
    action === "verify"   ? { verified: true, status: "ACTIVE" } :
    action === "suspend"  ? { status: "SUSPENDED" } :
                            { status: "ACTIVE" };

  try {
    const hostel = await db.hostel.update({
      where:  { id: hostelId },
      data,
      select: { id: true, status: true, verified: true },
    });
    return NextResponse.json({ data: hostel });
  } catch {
    return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
  }
}
