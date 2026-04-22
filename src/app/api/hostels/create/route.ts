import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { hostelCreateSchema } from "@/lib/validations";
import { createHostelRecord } from "@/lib/hostel-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Sign in to list a hostel." }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners can list hostels." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = hostelCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const hostel = await createHostelRecord(
      session.user.id,
      session.user.name,
      session.user.email,
      data,
      body
    );

    return NextResponse.json(
      { data: hostel, message: "Hostel created for review. We'll notify you once it's approved." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
