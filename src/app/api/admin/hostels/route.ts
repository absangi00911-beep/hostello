import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { listingApprovedEmail, listingSuspendedEmail } from "@/lib/email-templates/listing-status";
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

    // Send owner notification email based on action
    if (action === "verify" || action === "activate") {
      await sendEmail(
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
      await sendEmail(
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
  } catch {
    return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
  }
}
