import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";
// Path: src/app/api/hostels/[param]/route.ts
//
// This file previously contained a byte-for-byte duplicate of
// [param]/availability/route.ts (wrong content at this path — the actual
// availability logic correctly lives at [param]/availability/route.ts).
// This route serves hostel detail by id/slug (GET), owner listing edits and
// status changes (PATCH). It replaced a duplicate availability handler that
// previously occupied this path.

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { isBoundedRouteParam, MAX_HOSTEL_ROUTE_PARAM_LENGTH } from "@/lib/route-params";
import { rateLimit } from "@/lib/rate-limit";
import { hostelIdOrSlugWhere } from "@/lib/hostel-service";
import { hostelCreateSchema } from "@hostello/shared";
import { removeHostelIndex } from "@/lib/typesense-sync";

// Owners can only move their own listing between these two states from
// this endpoint — ACTIVE<->PENDING_REVIEW and SUSPENDED are admin-only,
// handled by the separate /api/admin/hostels endpoint.
const OWNER_ALLOWED_TRANSITIONS: Record<string, string> = {
  ACTIVE: "DRAFT",
  DRAFT:  "PENDING_REVIEW",
};

const OWNER_HOSTEL_PATCHES_PER_HOUR = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { param } = await params;
    if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
      return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
    }

    const hostel = await db.hostel.findFirst({
      where: hostelIdOrSlugWhere(param),
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        area: true,
        address: true,
        gender: true,
        pricePerMonth: true,
        rooms: true,
        capacity: true,
        description: true,
        amenities: true,
        images: true,
        coverImage: true,
        rules: true,
        verified: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
            createdAt: true,
            _count: { select: { hostels: true } },
          },
        },
        rooms_rel: {
          select: { id: true, name: true, pricePerMonth: true, capacity: true },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    return NextResponse.json({ data: hostel });
  } catch (err) {
    console.error("[GET /api/hostels/[param]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = await rateLimit(`hostel-edit:${session.user.id}`, {
      limit: OWNER_HOSTEL_PATCHES_PER_HOUR,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many listing changes. Try again later." }, { status: 429 });
    }

    const { param } = await params;
    if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
      return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
    }
    const body = await readBoundedJson(req, 64 * 1024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const bodyData = body.data as Record<string, unknown>;
    const isListingEdit = "name" in bodyData;
    const requestedStatus = bodyData.status;

    const hostel = await db.hostel.findFirst({
      where: hostelIdOrSlugWhere(param),
      select: { id: true, ownerId: true, status: true, slug: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (hostel.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isListingEdit) {
      if (hostel.status === "SUSPENDED") {
        return NextResponse.json({ error: "Suspended listings cannot be edited." }, { status: 409 });
      }

      const parsed = hostelCreateSchema.safeParse(bodyData);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed.", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const listing = parsed.data;
      const result = await db.hostel.updateMany({
        where: { id: hostel.id, ownerId: session.user.id, status: hostel.status },
        data: {
          name: listing.name,
          description: listing.description,
          city: listing.city,
          area: listing.area ?? null,
          address: listing.address,
          latitude: listing.latitude ?? null,
          longitude: listing.longitude ?? null,
          pricePerMonth: listing.pricePerMonth,
          rooms: listing.rooms,
          capacity: listing.capacity,
          gender: listing.gender,
          minStay: listing.minStay,
          maxStay: listing.maxStay ?? null,
          amenities: listing.amenities,
          rules: listing.rules ?? [],
          images: listing.images ?? [],
          coverImage: listing.coverImage ?? listing.images?.[0] ?? null,
          status: "PENDING_REVIEW",
        },
      });
      if (result.count !== 1) {
        return NextResponse.json(
          { error: "This listing has changed. Refresh and try again." },
          { status: 409 },
        );
      }

      const updated = { id: hostel.id, slug: hostel.slug, name: listing.name, status: "PENDING_REVIEW" as const };

      if (hostel.status === "ACTIVE") {
        void removeHostelIndex(hostel.id).catch((err) => {
          console.error("[PATCH /api/hostels/[param]] Search removal failed:", getSafeErrorSummary(err));
        });
      }

      return NextResponse.json({ data: updated, message: "Listing updated and submitted for review." });
    }

    const allowedNext = OWNER_ALLOWED_TRANSITIONS[hostel.status];
    if (!allowedNext || requestedStatus !== allowedNext) {
      return NextResponse.json(
        { error: `Can't move a listing from ${hostel.status} to ${requestedStatus ?? "(none)"} here.` },
        { status: 400 }
      );
    }

    const result = await db.hostel.updateMany({
      where: { id: hostel.id, ownerId: session.user.id, status: hostel.status },
      data: { status: allowedNext as "DRAFT" | "PENDING_REVIEW" },
    });
    if (result.count !== 1) {
      return NextResponse.json(
        { error: "This listing has changed. Refresh and try again." },
        { status: 409 },
      );
    }

    return NextResponse.json({ data: { id: hostel.id, status: allowedNext } });
  } catch (err) {
    console.error("[PATCH /api/hostels/[param]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
