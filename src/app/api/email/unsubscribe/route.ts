import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/email/unsubscribe?token=<token>
 *
 * One-click unsubscribe. Token format: base64url(userId + ':' + email).
 * Verifies the token against the User record, then sets
 * emailNotifications = false on that user.
 */

function decodeToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return null;

    const userId = decoded.slice(0, colonIdx);
    const email  = decoded.slice(colonIdx + 1);

    if (!userId || !email || !email.includes('@')) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');

  // ── Missing token ──────────────────────────────────────────────────────
  if (!token) {
    return new NextResponse(
      renderPage('Missing token', 'No unsubscribe token was provided.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // ── Decode ─────────────────────────────────────────────────────────────
  const payload = decodeToken(token);
  if (!payload) {
    return new NextResponse(
      renderPage('Invalid token', 'This unsubscribe link is invalid or has expired.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const { userId, email } = payload;

  // ── Verify user exists and email matches ───────────────────────────────
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id: true, email: true },
  });

  if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
    return new NextResponse(
      renderPage('Invalid token', 'This unsubscribe link is invalid or has expired.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // ── Update user ────────────────────────────────────────────────────────
  await db.user.update({
    where:  { id: userId },
    data:   { emailNotifications: false },
  });

  return new NextResponse(
    renderPage(
      'Unsubscribed',
      "You've been unsubscribed from HostelLo email notifications. You won't receive marketing or update emails from us.",
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

// ---------------------------------------------------------------------------
// Minimal HTML — no React renderer needed for this endpoint
// ---------------------------------------------------------------------------

function renderPage(title: string, message: string): string {
  const icon = title === 'Unsubscribed' ? '✓' : '⚠';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — HostelLo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #FDF8F0;
      color: #2A2318;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #FEFCF8;
      border: 1px solid #E0D4C0;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 12px rgba(42,35,24,0.08);
    }
    .icon { font-size: 2.5rem; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
    p  { font-size: 0.9375rem; color: #857060; line-height: 1.65; margin-bottom: 28px; }
    a  {
      display: inline-block;
      background: #2A6545;
      color: #F9F5EE;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
    }
    a:hover { background: #1F5035; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Back to HostelLo</a>
  </div>
</body>
</html>`;
}