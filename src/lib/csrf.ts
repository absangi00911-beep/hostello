import { type NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Validates the `Origin` header for state-mutating API requests.
 *
 * Returns a 403 NextResponse if the check fails; null if the request may
 * proceed. Apply this before any authentication or business logic.
 *
 * Rules:
 *   - Safe methods (GET/HEAD/OPTIONS) are always allowed.
 *   - Production: Origin must be present and match the configured app URL.
 *   - Development: a missing Origin is permitted (curl, Postman, etc.); a
 *     present but mismatched Origin is still rejected.
 */
export function verifyCsrfOrigin(req: NextRequest): NextResponse | null {
  const method = req.method ?? "GET";
  if (SAFE_METHODS.has(method)) return null;

  let appOrigin: string;
  try {
    appOrigin = new URL(getAppUrl()).origin;
  } catch {
    // If we can't determine the app URL, fail-safe: block the request.
    return NextResponse.json(
      { error: "Server misconfiguration — request blocked." },
      { status: 500 },
    );
  }

  const origin = req.headers.get("origin");

  if (!origin) {
    if (process.env.NODE_ENV !== "production") return null;
    return NextResponse.json(
      { error: "Missing Origin header." },
      { status: 403 },
    );
  }

  if (origin !== appOrigin) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 },
    );
  }

  return null;
}