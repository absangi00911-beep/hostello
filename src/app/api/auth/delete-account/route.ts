import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { accountDeletedEmail } from "@/lib/email-templates/account-deleted";

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
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate request
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return Response.json(
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
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 4. Verify password
    if (!user.password || !await compare(password, user.password)) {
      return Response.json(
        { error: "Invalid password" },
        { status: 403 }
      );
    }

    // 5. Delete all user data (cascade and explicit deletes for GDPR compliance)
    // Note: Prisma cascades are defined in schema.prisma, but we do explicit deletes
    // for critical data to ensure complete removal per GDPR Article 17.
    
    // Delete notifications
    await db.notification.deleteMany({ where: { userId } });

    // Delete conversation participants
    await db.conversationParticipant.deleteMany({ where: { userId } });

    // Delete messages
    await db.message.deleteMany({ where: { senderId: userId } });

    // Delete favorites
    await db.favorite.deleteMany({ where: { userId } });

    // Delete price alerts
    await db.priceAlert.deleteMany({ where: { userId } });

    // Delete reviews (but preserve hostel rating stats for now)
    await db.review.deleteMany({ where: { userId } });

    // Delete bookings
    await db.booking.deleteMany({ where: { userId } });

    // Delete password reset tokens
    await db.passwordResetToken.deleteMany({ where: { userId } });

    // Delete phone verification tokens (if any)
    await db.phoneVerificationToken.deleteMany({ where: { userId } });

    // Delete sessions and accounts (OAuth)
    await db.session.deleteMany({ where: { userId } });
    await db.account.deleteMany({ where: { userId } });

    // For owners: Delete hostels with batch operations (avoid N+1 query)
    // Performance fix: O(1) batch deletes instead of O(hostels × conversations × messages) loop
    const userHostels = await db.hostel.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (userHostels.length > 0) {
      const hostelIds = userHostels.map(h => h.id);

      // Batch delete related records (no cascade configured for these)
      await db.booking.deleteMany({ where: { hostelId: { in: hostelIds } } });
      await db.review.deleteMany({ where: { hostelId: { in: hostelIds } } });

      // Delete hostels in bulk - cascades handle conversations, messages, rooms, favorites
      // Cascade chain: Hostel → Room, Conversation, Favorite, PriceAlert
      // Conversation → ConversationParticipant, Message
      await db.hostel.deleteMany({ where: { ownerId: userId } });
    }

    // Finally: Delete the user account
    await db.user.delete({ where: { id: userId } });

    // 6. Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        ...accountDeletedEmail({ name: user.name }),
      });
    } catch (emailError) {
      console.error("Failed to send account deletion email:", emailError);
      // Don't fail the entire delete if email fails
    }

    // 7. Return success (client should sign out and redirect to homepage)
    return Response.json({
      success: true,
      message: "Account permanently deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return Response.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
