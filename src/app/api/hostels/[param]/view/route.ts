import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/hostels/[slug]/view
 *
 * Increments the viewCount for a hostel when a real user views it.
 * This runs on the client-side only (not during ISR revalidation).
 *
 * Since this is a fire-and-forget operation from the client,
 * we don't require authentication and don't mind if it fails silently.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const { param: slug } = await params;

    // Increment viewCount for the hostel
    // Using fire-and-forget pattern since this is a non-critical stat
    await db.hostel
      .update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        // Silently ignore failures (e.g., hostel not found, DB connection error)
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error but don't expose to client
    console.error("[hostels/view] Error incrementing view count:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
