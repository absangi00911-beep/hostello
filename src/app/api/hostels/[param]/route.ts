// Path: src/app/api/hostels/[param]/route.ts
//
// This file previously contained a byte-for-byte duplicate of
// [param]/availability/route.ts (wrong content at this path — the actual
// availability logic correctly lives at [param]/availability/route.ts).
// This route is meant to be hostel-detail-by-id-or-slug (GET, used by
// HostelReviewDrawer.tsx for admin review) and status-toggle (PATCH, used
// by the owner listings page) — neither existed here. Replaced with both.

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

// Owners can only move their own listing between these two states from
// this endpoint — ACTIVE<->PENDING_REVIEW and SUSPENDED are admin-only,
// handled by the separate /api/admin/hostels endpoint.
const OWNER_ALLOWED_TRANSITIONS: Record<string, string> = {
  ACTIVE: "DRAFT",
  DRAFT:  "PENDING_REVIEW",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const { param } = await params;

    const hostel = await db.hostel.findFirst({
      where: { OR: [{ id: param }, { slug: param }] },
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
    console.error("[GET /api/hostels/[param]]", err);
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

    const { param } = await params;
    const body = await req.json().catch(() => ({}));
    const requestedStatus = body?.status;

    const hostel = await db.hostel.findFirst({
      where: { OR: [{ id: param }, { slug: param }] },
      select: { id: true, ownerId: true, status: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (hostel.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedNext = OWNER_ALLOWED_TRANSITIONS[hostel.status];
    if (!allowedNext || requestedStatus !== allowedNext) {
      return NextResponse.json(
        { error: `Can't move a listing from ${hostel.status} to ${requestedStatus ?? "(none)"} here.` },
        { status: 400 }
      );
    }

    const updated = await db.hostel.update({
      where: { id: hostel.id },
      data: { status: allowedNext as "DRAFT" | "PENDING_REVIEW" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}