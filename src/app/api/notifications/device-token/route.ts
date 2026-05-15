// Path: src/app/api/notifications/device-token/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const deviceTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["ios", "android"], { errorMap: () => ({ message: "Platform must be 'ios' or 'android'" }) }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deviceTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, platform } = parsed.data;

    // Register or update the device token.
    // We use upsert on the token itself (which is @unique in schema)
    // to handle cases where a user reinstalls the app or multiple users use the same device.
    const deviceToken = await db.deviceToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        platform,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        platform,
      },
    });

    return NextResponse.json({
      data: deviceToken,
      message: "Device token registered successfully",
    });
  } catch (err) {
    console.error("[POST /api/notifications/device-token]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Only allow users to delete their own device tokens
    const deviceToken = await db.deviceToken.findUnique({
      where: { token },
      select: { userId: true },
    });

    if (!deviceToken) {
      return NextResponse.json({ message: "Token not found" });
    }

    if (deviceToken.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.deviceToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "Device token deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/notifications/device-token]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
