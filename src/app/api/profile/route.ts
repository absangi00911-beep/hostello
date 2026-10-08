import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/profile/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const MAX_PROFILE_BODY_BYTES = 8_192;

// --- GET /api/profile --------------------------------------------------------
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
        emailNotifications: true,
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
    console.error("[GET /api/profile]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// --- PATCH /api/profile -------------------------------------------------------
//
// Updates editable profile fields for the authenticated user.
// Avatar updates go through /api/upload separately. A phone number can only
// be set by the OTP verification endpoint; profile edits may clear it.

const updateSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number")
    .optional()
    .or(z.literal("")),
  bio:   z.string().max(500).optional(),
  city:  z.string().max(100).optional(),
  avatar: z.string().max(2_048).url("Enter a valid profile photo URL").or(z.literal("")).optional(),
  emailNotifications: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(`profile-update:${session.user.id}`, {
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many profile updates. Try again later." }, { status: 429 });
    }

    const body = await readBoundedJson(req, MAX_PROFILE_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = updateSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: {
      name?: string;
      phone?: string | null;
      phoneVerified?: Date | null;
      bio?: string;
      city?: string;
      avatar?: string | null;
      emailNotifications?: boolean;
    } = { ...parsed.data };

    // Only the OTP endpoint may set a phone number. A verified timestamp must
    // never survive a change to an unverified number.
    if ("phone" in parsed.data) {
      if (parsed.data.phone) {
        return NextResponse.json(
          { error: "Verify a phone number with the code before saving it." },
          { status: 400 },
        );
      }
      data.phone = null;
      data.phoneVerified = null;
    }
    // Empty avatar clears it; omitted fields are left unchanged.
    if ("avatar" in parsed.data) {
      data.avatar = parsed.data.avatar || null;
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id:     true,
        name:   true,
        email:  true,
        phone:  true,
        bio:    true,
        city:   true,
        avatar: true,
        emailNotifications: true,
      },
    });

    return NextResponse.json({ data: updated, message: "Profile updated." });
  } catch (err) {
    console.error("[PATCH /api/profile]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
