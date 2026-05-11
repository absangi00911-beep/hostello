import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

export async function POST(req: Request) {
  try {
    // 1. Verify cron request (requires proper setup with QStash/Cron Secret)
    const verificationError = await verifyUpstashRequest(req as any);
    if (verificationError !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Delete expired or used tokens
    const now = new Date();
    
    // Password reset tokens: delete used or expired ones
    const resetTokens = await db.passwordResetToken.deleteMany({
      where: {
        OR: [
          { usedAt: { not: null } },
          { expiresAt: { lt: now } }
        ]
      }
    });

    // Verification tokens: delete expired ones
    const verifTokens = await db.verificationToken.deleteMany({
      where: {
        expires: { lt: now }
      }
    });

    console.log(`[cron] Cleaned up ${resetTokens.count} password reset tokens and ${verifTokens.count} verification tokens.`);

    return NextResponse.json({ success: true, resetTokens: resetTokens.count, verifTokens: verifTokens.count });
  } catch (error) {
    console.error("[cron/cleanup-tokens] Failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
