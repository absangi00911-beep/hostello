import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { syncAllHostelsToTypesense } from "@/lib/typesense-sync";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";

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

    const { action, hostelId } = await req.json();

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
    console.error("[POST /api/admin/search/sync]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
