import { getSafeErrorSummary } from "@/lib/safe-error";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppOrigin } from "@/lib/app-url";
import { readBoundedText } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";

const MAX_TOKEN_LENGTH = 64;
const MAX_QUERY_LENGTH = 128;
const MAX_BODY_BYTES = 256;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!isValidToken(token) || req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return redirectToLogin({ error: "invalid-token" });
  }

  const quota = await rateLimit(`verify-email:get:${getIp(req)}`, { limit: 120, windowMs: 60_000 });
  if (!quota.ok) return rateLimitedMessage(quota.resetAt);

  try {
    const record = await db.verificationToken.findFirst({
      where: { token: { in: tokenLookupValues(token) } },
      select: { expires: true },
    });

    if (!record) return redirectToLogin({ error: "invalid-token" });
    if (record.expires < new Date()) return redirectToLogin({ error: "expired-token" });

    return renderConfirmation(token);
  } catch (err) {
    console.error("[GET /api/auth/verify-email]", getSafeErrorSummary(err));
    return redirectToLogin({ error: "server-error" });
  }
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return renderMessage("Invalid link", "This verification link is invalid or has expired.", 400);
  }

  const quota = await rateLimit(`verify-email:post:${getIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!quota.ok) return rateLimitedMessage(quota.resetAt);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return renderMessage("Invalid request", "Please use the confirmation button in the email link.", 400);
  }

  const body = await readBoundedText(req, MAX_BODY_BYTES);
  if (!body.ok) return renderMessage("Invalid request", body.error, body.status);

  const form = new URLSearchParams(body.text);
  const token = form.get("token");
  if (form.get("confirm") !== "verify" || !isValidToken(token)) {
    return renderMessage("Invalid request", "Please use the confirmation button in the email link.", 400);
  }

  try {
    const record = await db.verificationToken.findFirst({
      where: { token: { in: tokenLookupValues(token) } },
      select: { token: true, identifier: true, expires: true },
    });

    if (!record) return redirectToLogin({ error: "invalid-token" });
    if (record.expires < new Date()) return redirectToLogin({ error: "expired-token" });

    const now = new Date();
    const verified = await db.$transaction(async (tx) => {
      // Claim the one-time token first. The conditional delete makes concurrent
      // submissions idempotent and prevents a stale read from verifying an
      // address after the token has expired or been replaced.
      const claimed = await tx.verificationToken.deleteMany({
        where: { token: record.token, identifier: record.identifier, expires: { gt: now } },
      });
      if (claimed.count !== 1) return false;

      const updated = await tx.user.updateMany({
        where: { email: record.identifier, emailVerified: null },
        data: { emailVerified: now },
      });
      if (updated.count === 1) return true;

      // If another valid verification completed first, consuming this token
      // is still safe and the user should see the normal success page.
      const user = await tx.user.findUnique({
        where: { email: record.identifier },
        select: { emailVerified: true },
      });
      if (user?.emailVerified) return true;

      throw new Error("Email verification user was not found.");
    });

    return redirectToLogin(verified ? { verified: "1" } : { error: "invalid-token" });
  } catch (err) {
    console.error("[POST /api/auth/verify-email]", getSafeErrorSummary(err));
    return redirectToLogin({ error: "server-error" });
  }
}

function isValidToken(token: string | null): token is string {
  return Boolean(token && token.length === MAX_TOKEN_LENGTH && TOKEN_PATTERN.test(token));
}

function tokenLookupValues(token: string): string[] {
  // Accept the raw-token format used before digests were stored so already
  // delivered verification links continue to work through their expiry.
  return [hashOneTimeToken(token), token];
}

function redirectToLogin(query: Record<string, string>) {
  const url = new URL("/login", getAppOrigin());
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

function renderConfirmation(token: string) {
  return renderMessage(
    "Verify your email",
    "Confirm your email address to finish setting up your HostelLo account.",
    200,
    token,
  );
}

function renderMessage(title: string, message: string, status: number, token?: string) {
  const escapedToken = token ? escapeHtml(token) : null;
  const action = escapedToken
    ? `<form method="post" action="/api/auth/verify-email">
        <input type="hidden" name="token" value="${escapedToken}" />
        <input type="hidden" name="confirm" value="verify" />
        <button type="submit">Verify email</button>
      </form>`
    : '<a href="/login">Go to sign in</a>';

  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${escapeHtml(title)} — HostelLo</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f8fb;color:#0f172a;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:40px 32px;max-width:440px;width:100%;text-align:center}
    h1{font-size:1.5rem;line-height:1.25;font-weight:700;margin-bottom:12px}
    p{font-size:1rem;color:#586579;line-height:1.55;margin-bottom:24px}
    a,button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;border:0;background:#2563eb;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:.875rem;line-height:1.25;font-weight:600;cursor:pointer}
    a:focus-visible,button:focus-visible{outline:3px solid #2563eb;outline-offset:3px}</style>
    </head><body><main class="card">
    <h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>
    ${action}
    </main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      },
    },
  );
}

function rateLimitedMessage(resetAt: number) {
  const response = renderMessage(
    "Please try again shortly",
    "Too many email verification attempts came from this network. Please wait a moment and try again.",
    429,
  );
  response.headers.set("Retry-After", String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
  return response;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
