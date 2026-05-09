import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// ─── GET /api/profile ────────────────────────────────────────────────────────
//
// Returns the authenticated user's own profile.
// Never exposes password, tokenVersion, or internal session fields.
//
// Response shape:
// {
//   data: {
//     id, name, email, emailVerified, phone, phoneVerified,
//     avatar, role, bio, city, createdAt,
//     _count: { hostels, bookings, reviews, favorites, priceAlerts }
//   }
// }

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id:            true,
        name:          true,
        email:         true,
        emailVerified: true,  // DateTime | null — truthy = verified
        phone:         true,
        phoneVerified: true,  // DateTime | null — truthy = verified
        avatar:        true,
        role:          true,
        bio:           true,
        city:          true,
        createdAt:     true,
        _count: {
          select: {
            hostels:    true, // owner: how many listings they have
            bookings:   true, // student: total booking history
            reviews:    true, // total reviews written
            favorites:  true, // saved hostels
            priceAlerts: true,
          },
        },
      },
    });

    // Deleted mid-session edge case
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
//
// Updates editable profile fields for the authenticated user.
// Avatar updates go through /api/upload separately.

const updateSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number")
    .optional()
    .or(z.literal("")),
  bio:   z.string().max(500).optional(),
  city:  z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...parsed.data,
        // Empty string clears the phone; null means not set.
        phone: parsed.data.phone || null,
      },
      select: {
        id:    true,
        name:  true,
        email: true,
        phone: true,
        bio:   true,
        city:  true,
      },
    });

    return NextResponse.json({ data: updated, message: "Profile updated." });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}