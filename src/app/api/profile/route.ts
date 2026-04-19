import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^(\+92|0)[0-9]{10}$/).optional().or(z.literal("")),
  bio:   z.string().max(500).optional(),
  city:  z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...parsed.data,
        phone: parsed.data.phone || null,
      },
      select: { id: true, name: true, email: true, phone: true, bio: true, city: true },
    });

    return NextResponse.json({ data: updated, message: "Profile updated." });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
