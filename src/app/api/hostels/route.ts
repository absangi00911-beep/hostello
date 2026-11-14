// Path: src/app/api/hostels/route.ts

import { findUntrustedListingImage, UNTRUSTED_LISTING_IMAGE_ERROR } from "@/lib/listing-images";
import { type NextRequest, NextResponse } from "next/server";
import { hostelCreateSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { fetchHostelSearchResults } from "@/lib/hostel-search-response";
import { parseHostelSearchParams } from "@/lib/hostel-search-params";
import { createHostelRecord, notifyAdminOfNewListing } from "@/lib/hostel-service";
import { PLANS } from "@/config/plans";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { createOperationalLogContext } from "@/lib/operational-logger";
import { isProEntitled } from "@/lib/pro-subscription";

// This file was missing entirely — SearchPageClient.tsx has always called
// fetch(`/api/hostels?...`), but nothing implemented that endpoint. The
// actual search/filter/sort logic already existed and was tested in
// src/lib/hostel-search.ts (searchHostelsWithFallback); this route's job
// is just to call it and shape the response the client expects.

const MAX_QUERY_LENGTH = 4_096;
const MAX_SEARCH_REQUESTS_PER_MINUTE = 120;
const MAX_LISTING_TRANSACTION_ATTEMPTS = 3;

function isSerializableTransactionConflict(error: unknown) {
  return error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2034";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can create listings." }, { status: 403 });
    }

    const createLimit = await rateLimit(`hostel-create:${session.user.id}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!createLimit.ok) {
      return NextResponse.json(
        { error: "Too many listing submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((createLimit.resetAt - Date.now()) / 1000))),
          },
        },
      );
    }

    const body = await readBoundedJson(req, 64 * 1024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const bodyData = body.data;
    if (!bodyData || typeof bodyData !== "object" || Array.isArray(bodyData)) {
      return NextResponse.json({ error: "Validation failed." }, { status: 400 });
    }
    const parsed = hostelCreateSchema.safeParse(bodyData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const untrustedImage = findUntrustedListingImage(parsed.data.images, parsed.data.coverImage);
    if (untrustedImage) {
      return NextResponse.json({ error: UNTRUSTED_LISTING_IMAGE_ERROR }, { status: 400 });
    }

    let result:
      | { kind: "owner_missing" }
      | { kind: "deleting" }
      | { kind: "limit_reached" }
      | {
          kind: "created";
          ownerName: string;
          ownerEmail: string;
          hostel: Awaited<ReturnType<typeof createHostelRecord>>;
        }
      | undefined;

    for (let attempt = 0; attempt < MAX_LISTING_TRANSACTION_ATTEMPTS; attempt++) {
      try {
        result = await db.$transaction(async (tx) => {
          const owner = await tx.user.findUnique({
            where: { id: session.user.id },
            select: {
              name: true,
              email: true,
              plan: true,
              deletionRequestedAt: true,
              subscription: { select: { status: true, endDate: true } },
            },
          });
          if (!owner) return { kind: "owner_missing" } as const;
          if (owner.deletionRequestedAt) return { kind: "deleting" } as const;

          const listingCount = await tx.hostel.count({ where: { ownerId: session.user.id } });
          const effectivePlan = owner.plan === "PRO" && isProEntitled(
            owner.subscription?.status,
            owner.subscription?.endDate,
          ) ? "PRO" : "FREE";
          if (listingCount >= PLANS[effectivePlan].maxListings) {
            return { kind: "limit_reached" } as const;
          }

          const hostel = await createHostelRecord(tx, session.user.id, parsed.data);
          return {
            kind: "created",
            ownerName: owner.name,
            ownerEmail: owner.email,
            hostel,
          } as const;
        }, { isolationLevel: "Serializable" });
        break;
      } catch (error) {
        if (!isSerializableTransactionConflict(error) || attempt + 1 === MAX_LISTING_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }

    if (!result) throw new Error("Listing submission transaction did not return a result.");
    if (result.kind === "owner_missing") {
      return NextResponse.json({ error: "Owner not found." }, { status: 404 });
    }
    if (result.kind === "deleting") {
      return NextResponse.json({ error: "Account deletion is being processed." }, { status: 409 });
    }
    if (result.kind === "limit_reached") {
      return NextResponse.json(
        { error: "You've reached your listing limit.", code: "QUOTA_EXCEEDED" },
        { status: 403 },
      );
    }

    notifyAdminOfNewListing(result.ownerName, result.ownerEmail, result.hostel);

    return NextResponse.json({ data: result.hostel, message: "Listing submitted for review." }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/hostels]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
    }

    const searchLimit = await rateLimit(`hostel-search:${getIp(req)}`, {
      limit: MAX_SEARCH_REQUESTS_PER_MINUTE,
      windowMs: 60 * 1000,
    });
    if (!searchLimit.ok) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((searchLimit.resetAt - Date.now()) / 1000))),
          },
        },
      );
    }

    const parsed = parseHostelSearchParams(params);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const { page, limit } = parsed.search;

    const { hostelIds, total, isSearchDegraded } = await searchHostelsWithFallback(
      parsed.search,
      createOperationalLogContext(req),
    );

    const orderedHostels = await fetchHostelSearchResults(hostelIds);

    return NextResponse.json({
      data: orderedHostels,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      isSearchDegraded,
    });
  } catch (err) {
    console.error("[GET /api/hostels]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
