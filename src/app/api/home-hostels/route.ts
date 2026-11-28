// Path: src/app/api/home-hostels/route.ts
//
// The home page's listings for a category tab, built per city so every city row gets its
// share (see src/lib/home-hostels.ts). The server render of the opening tab uses the same
// loader. Cached briefly per category: every visitor gets the same answer.
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import type { Category } from "@/components/home/BrowseCategoryNav";
import { HOME_HOSTELS_REVALIDATE_SECONDS, loadHomeHostelsByCity } from "@/lib/home-hostels";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { getIp, rateLimit } from "@/lib/rate-limit";

const CATEGORIES: readonly Category[] = ["all", "women", "top-rated", "budget"];
const MAX_REQUESTS_PER_MINUTE = 120;

const getCachedHomeHostels = unstable_cache(
  (category: Category) => loadHomeHostelsByCity(category),
  ["home-hostels-by-category"],
  { revalidate: HOME_HOSTELS_REVALIDATE_SECONDS, tags: ["home-hostels"] },
);

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") ?? "all";
    if (!CATEGORIES.includes(category as Category)) {
      return NextResponse.json({ error: "Unknown category." }, { status: 400 });
    }

    const limit = await rateLimit(`home-hostels:${getIp(req)}`, {
      limit: MAX_REQUESTS_PER_MINUTE,
      windowMs: 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    return NextResponse.json(await getCachedHomeHostels(category as Category));
  } catch (err) {
    console.error("[GET /api/home-hostels]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Unable to load hostels. Please try again." }, { status: 500 });
  }
}
