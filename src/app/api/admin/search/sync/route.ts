// Path: src/app/api/admin/search/sync/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { syncAllHostelsToTypesense, indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const syncRequestSchema = z.object({
  action: z.enum(["sync-all", "sync-single", "remove"]),
  hostelId: z.string().max(64).optional(),
});

/**
 * POST /api/admin/search/sync - Sync all hostels to Typesense
 * Admin only
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = syncRequestSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const { action, hostelId } = parsed.data;

    const syncLimit = await rateLimit(
      `admin-search-sync:${session.user.id}:${action}`,
      action === "sync-all"
        ? { limit: 2, windowMs: 60 * 60 * 1000 }
        : { limit: 60, windowMs: 60 * 60 * 1000 },
    );
    if (!syncLimit.ok) {
      return NextResponse.json(
        { error: "Too many search-index actions. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((syncLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    if (action === "sync-all") {
      // Sync all hostels
      await syncAllHostelsToTypesense();
      return NextResponse.json({ message: "All hostels synced to Typesense" });
    } else if (action === "sync-single" && hostelId) {
      // Sync a single hostel
      await indexSingleHostel(hostelId);
      return NextResponse.json({ message: `Hostel ${hostelId} synced` });
    } else if (action === "remove" && hostelId) {
      // Remove a hostel from index
      await removeHostelIndex(hostelId);
      return NextResponse.json({ message: `Hostel ${hostelId} removed from index` });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[POST /api/admin/search/sync]", getSafeErrorSummary(error));
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
