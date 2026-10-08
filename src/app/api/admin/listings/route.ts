import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";
import { computeListingCompleteness } from "@/lib/listingCompleteness";
import { parsePagination } from "@/lib/pagination";

const VALID_STATUSES = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED"] as const;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 200;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readLimitResponse = await enforceAdminReadLimit(session.user.id);
  if (readLimitResponse) return readLimitResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const { page, limit } = parsePagination(url.searchParams, { defaultLimit: 20, maxLimit: MAX_LIMIT });
  const search = url.searchParams.get("search")?.trim();
  const skip = (page - 1) * limit;

  if (url.search.length > 4_096 || (search !== undefined && search.length > MAX_SEARCH_LENGTH)) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const where: any = { status };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [hostels, total] = await Promise.all([
    db.hostel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        city: true,
        verified: true,
        createdAt: true,
        description: true,
        images: true,
        amenities: true,
        rules: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.hostel.count({ where }),
  ]);

  const data = hostels.map((hostel) => ({
    ...hostel,
    completeness: Math.round(
      computeListingCompleteness({
        images: hostel.images ?? [],
        description: hostel.description ?? "",
        amenities: hostel.amenities ?? [],
        rules: hostel.rules ?? [],
      }).score,
    ),
  }));

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
}
