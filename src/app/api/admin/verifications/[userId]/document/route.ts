import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";
import {
  getVerificationDocument,
  isVerificationContentType,
  isVerificationObjectKey,
} from "@/lib/verification-storage";

type Context = { params: Promise<{ userId: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documentLimit = await rateLimit(`admin-verification-document:${session.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!documentLimit.ok) {
    return NextResponse.json(
      { error: "Too many verification documents requested. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((documentLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const { userId } = await params;
  if (!isBoundedRouteParam(userId)) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true, verificationDocUrl: true },
  });
  if (user?.verificationStatus !== "PENDING" || !user.verificationDocUrl) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    if (isVerificationObjectKey(user.verificationDocUrl, userId)) {
      const object = await getVerificationDocument(user.verificationDocUrl);
      if (!object.Body || !isVerificationContentType(object.ContentType)) {
        return NextResponse.json({ error: "Document not found." }, { status: 404 });
      }

      const isPdf = object.ContentType === "application/pdf";
      return new Response(object.Body.transformToWebStream(), {
        headers: {
          "Content-Type": object.ContentType,
          ...(typeof object.ContentLength === "number" ? { "Content-Length": String(object.ContentLength) } : {}),
          "Content-Disposition": isPdf ? "attachment; filename=student-verification.pdf" : "inline",
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
          "Cross-Origin-Resource-Policy": "same-origin",
          "Content-Security-Policy": "default-src 'none'; sandbox",
        },
      });
    }

    const legacyUrl = getAllowedLegacyUrl(user.verificationDocUrl);
    if (!legacyUrl) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const response = await fetch(legacyUrl, { redirect: "error", cache: "no-store" });
    const contentType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase();
    if (!response.ok || !isImageContentType(contentType) || !response.body) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/verifications/[userId]/document]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Document is temporarily unavailable." }, { status: 503 });
  }
}

function getAllowedLegacyUrl(value: string | null | undefined): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || typeof value !== "string") return null;
  try {
    const candidate = new URL(value);
    const publicBase = new URL(publicUrl);
    if (candidate.origin !== publicBase.origin || !/^\/hostels\/[A-Za-z0-9._-]+$/.test(candidate.pathname)) {
      return null;
    }
    return candidate.href;
  } catch {
    return null;
  }
}

function isImageContentType(value: string | null | undefined): value is "image/jpeg" | "image/png" | "image/webp" {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}
