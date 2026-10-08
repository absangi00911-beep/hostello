import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const ADMIN_READ_LIMIT = 60;
const ADMIN_READ_WINDOW_MS = 60_000;

/** Share one read budget across sensitive admin queues so changing endpoints does not reset it. */
export async function enforceAdminReadLimit(adminId: string): Promise<NextResponse | null> {
  const limit = await rateLimit(`admin-read:${adminId}`, {
    limit: ADMIN_READ_LIMIT,
    windowMs: ADMIN_READ_WINDOW_MS,
  });

  if (limit.ok) return null;

  return NextResponse.json(
    { error: "Too many admin requests. Please slow down." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) },
    },
  );
}
