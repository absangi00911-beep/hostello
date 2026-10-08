import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/delete-account/route.ts
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { accountDeletedEmail } from "@/lib/email-templates/account-deleted";
import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";

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

    const limit = await rateLimit(`delete-account:${userId}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    // 2. Parse and validate request
    const body = await readBoundedJson(request, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const password = body.data && typeof body.data === "object" && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>).password
      : undefined;

    if (typeof password !== "string" || password.length < 1 || password.length > 128) {
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

      // Recompute denormalized stats for hostels that remain after this user
      // is deleted. Reviews belonging to hostels owned by this user are
      // removed with those hostels below.
      // Page through the user's reviews on surviving hostels. Delete each
      // bounded batch before recomputing affected aggregates so every update
      // reflects the final review set for that hostel.
      let reviewCursor: string | undefined;
      while (true) {
        const reviewBatch = await tx.review.findMany({
          where: {
            userId,
            hostel: { is: { ownerId: { not: userId } } },
            ...(reviewCursor ? { id: { gt: reviewCursor } } : {}),
          },
          orderBy: { id: "asc" },
          take: 200,
          select: { id: true, hostelId: true },
        });
        if (reviewBatch.length === 0) break;

        await tx.review.deleteMany({
          where: { id: { in: reviewBatch.map((review) => review.id) } },
        });
        for (const hostelId of new Set(reviewBatch.map((review) => review.hostelId))) {
          const aggregate = await tx.review.aggregate({
            where: { hostelId },
            _avg: { rating: true },
            _count: { rating: true },
          });
          const reviewCount = typeof aggregate._count === "number"
            ? aggregate._count
            : aggregate._count.rating;

          await tx.hostel.update({
            where: { id: hostelId },
            data: {
              rating: aggregate._avg.rating ?? 0,
              reviewCount,
            },
          });
        }

        reviewCursor = reviewBatch[reviewBatch.length - 1].id;
        if (reviewBatch.length < 200) break;
      }

      // Reviews on the user's own hostels do not need aggregate updates since
      // those hostels and their remaining bookings are removed below.
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

      // For owners: scope cleanup through the relation instead of loading
      // every owned hostel ID into application memory.
      await tx.booking.deleteMany({ where: { hostel: { is: { ownerId: userId } } } });
      await tx.review.deleteMany({ where: { hostel: { is: { ownerId: userId } } } });
      await tx.hostel.deleteMany({ where: { ownerId: userId } });

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
      console.error("Failed to send account deletion email:", getSafeErrorSummary(emailError));
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: "Account permanently deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", getSafeErrorSummary(error));
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
