import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";

const APP_URL = getAppUrl();

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL(`${APP_URL}/login?error=invalid-token`));
    }

    const record = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.redirect(new URL(`${APP_URL}/login?error=invalid-token`));
    }

    if (record.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.deleteMany({ where: { identifier: record.identifier } });
      return NextResponse.redirect(new URL(`${APP_URL}/login?error=expired-token`));
    }

    // Mark email as verified and delete the token atomically
    await db.$transaction([
      db.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.redirect(new URL(`${APP_URL}/login?verified=1`));
  } catch (err) {
    console.error("[GET /api/auth/verify-email]", err);
    return NextResponse.redirect(new URL(`${APP_URL}/login?error=server-error`));
  }
}
