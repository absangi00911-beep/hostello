// Path: src/app/api/cron/cleanup-tokens/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";

export async function POST(req: Request) {
  const verificationError = await verifyUpstashRequest(req as any);
  if (verificationError !== true) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCronJob("cleanup-tokens", async () => {
    const now = new Date();

    const [resetTokens, verifTokens] = await Promise.all([
      db.passwordResetToken.deleteMany({
        where: { OR: [{ usedAt: { not: null } }, { expiresAt: { lt: now } }] },
      }),
      db.verificationToken.deleteMany({
        where: { expires: { lt: now } },
      }),
    ]);

    return {
      message:     "Tokens cleaned up",
      count:       resetTokens.count + verifTokens.count,
      resetTokens: resetTokens.count,
      verifTokens: verifTokens.count,
    };
  });
}