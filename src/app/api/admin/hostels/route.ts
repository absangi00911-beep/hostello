import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { listingApprovedEmail, listingSuspendedEmail } from "@/lib/email-templates/listing-status";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { z } from "zod";

const schema = z.object({
  hostelId: z.string().cuid(),
  action:   z.enum(["verify", "suspend", "activate"]),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { hostelId, action } = parsed.data;

  const data: Record<string, unknown> =
    action === "verify"   ? { verified: true, status: "ACTIVE" } :
    action === "suspend"  ? { status: "SUSPENDED" } :
                            { status: "ACTIVE" };

  try {
    const hostel = await db.hostel.update({
      where:  { id: hostelId },
      data,
      select: { 
        id: true, 
        status: true, 
        verified: true,
        name: true,
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Sync to Typesense based on action
    if (action === "verify" || action === "activate") {
      // Index the hostel when it becomes ACTIVE
      await indexSingleHostel(hostel.id).catch((err) =>
        console.error(`[typesense] Failed to index hostel ${hostel.id}:`, err)
      );
    } else if (action === "suspend") {
      // Remove from index when suspended
      await removeHostelIndex(hostel.id).catch((err) =>
        console.error(`[typesense] Failed to remove hostel ${hostel.id}:`, err)
      );
    }

    // Send owner notification email based on action
    if (action === "verify" || action === "activate") {
      void sendEmail(
        listingApprovedEmail({
          ownerEmail: hostel.owner.email,
          ownerName: hostel.owner.name,
          hostelName: hostel.name,
          hostelId: hostel.id,
          status: "APPROVED",
        })
      ).catch(() => {
        // Silently ignore email failures but log them
        console.error(`[email] Failed to send listing approved email to ${hostel.owner.email} for hostel ${hostel.id}`);
      });
    } else if (action === "suspend") {
      void sendEmail(
        listingSuspendedEmail({
          ownerEmail: hostel.owner.email,
          ownerName: hostel.owner.name,
          hostelName: hostel.name,
          hostelId: hostel.id,
          status: "SUSPENDED",
        })
      ).catch(() => {
        // Silently ignore email failures but log them
        console.error(`[email] Failed to send listing suspended email to ${hostel.owner.email} for hostel ${hostel.id}`);
      });
    }

    return NextResponse.json({ 
      data: {
        id: hostel.id,
        status: hostel.status,
        verified: hostel.verified,
      }
    });
  } catch (err) {
    console.error("[PATCH /api/admin/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
