// Path: src/app/api/auth/delete-account/route.ts
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { accountDeletedEmail } from "@/lib/email-templates/account-deleted";
import { NextResponse } from "next/server";

/**
 * DELETE /api/auth/delete-account
 * 
 * Permanently deletes user account and all associated data.
 * GDPR/PECA Compliant: Removes all personal data, bookings, reviews, messages, favorites.
 * 
 * Request: { password: string }
 * Response: { success: boolean }
 */
export async function POST(request: Request) {
  try {
    // 1. Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate request
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // 3. Fetch user with password hash
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 4. Verify password
    if (!user.password || !await compare(password, user.password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 403 }
      );
    }

    // 5. Delete all user data in a single transaction for atomicity
    await db.$transaction(async (tx) => {
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // Delete conversation participants
      await tx.conversationParticipant.deleteMany({ where: { userId } });

      // Delete messages
      await tx.message.deleteMany({ where: { senderId: userId } });

      // Delete favorites
      await tx.favorite.deleteMany({ where: { userId } });

      // Delete price alerts
      await tx.priceAlert.deleteMany({ where: { userId } });

      // Delete reviews (but preserve hostel rating stats for now)
      await tx.review.deleteMany({ where: { userId } });

      // Delete bookings
      await tx.booking.deleteMany({ where: { userId } });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({ where: { userId } });

      // Delete phone verification tokens
      await tx.phoneVerificationToken.deleteMany({ where: { userId } });

      // Delete sessions and accounts (OAuth)
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // For owners: Delete hostels with batch operations
      const userHostels = await tx.hostel.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (userHostels.length > 0) {
        const hostelIds = userHostels.map(h => h.id);

        await tx.booking.deleteMany({ where: { hostelId: { in: hostelIds } } });
        await tx.review.deleteMany({ where: { hostelId: { in: hostelIds } } });

        await tx.hostel.deleteMany({ where: { ownerId: userId } });
      }

      // Finally: Delete the user account
      await tx.user.delete({ where: { id: userId } });
    });

    // 6. Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        ...accountDeletedEmail({ name: user.name }),
      });
    } catch (emailError) {
      console.error("Failed to send account deletion email:", emailError);
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: "Account permanently deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
