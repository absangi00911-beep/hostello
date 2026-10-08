// Path: src/app/api/cron/cleanup-tokens/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
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
  }, logContext);
}
