import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readBoundedText } from '@/lib/bounded-json';
import { verifyEmailUnsubscribeToken } from '@/lib/email-unsubscribe-token';

const MAX_QUERY_LENGTH = 2_100;
const MAX_BODY_BYTES = 3_072;
const MAX_TOKEN_LENGTH = 2_048;

/** Render a confirmation page only. Safe methods must not change preferences. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return page('Invalid token', 'This unsubscribe link is invalid or has expired.', 400);
  }
  if (!token) return page('Missing token', 'No unsubscribe token was provided.', 400);

  const resolved = await resolveToken(token);
  if (resolved.kind === 'unavailable') {
    return page('Temporarily unavailable', 'Email preferences could not be updated right now.', 503);
  }
  if (resolved.kind === 'invalid') {
    return page('Invalid token', 'This unsubscribe link is invalid or has expired.', 400);
  }

  return page(
    'Confirm unsubscribe',
    'Turn off optional price alert emails from HostelLo?',
    200,
    token,
  );
}

/** Apply the signed preference change only after an explicit form submission. */
export async function POST(req: NextRequest) {
  if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return page('Invalid token', 'This unsubscribe link is invalid or has expired.', 400);
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    return page('Invalid request', 'Please use the unsubscribe button on the confirmation page.', 400);
  }

  const body = await readBoundedText(req, MAX_BODY_BYTES);
  if (!body.ok) return page('Invalid request', body.error, body.status);

  const form = new URLSearchParams(body.text);
  const token = form.get('token');
  if (form.get('confirm') !== 'unsubscribe' || !token || token.length > MAX_TOKEN_LENGTH) {
    return page('Invalid request', 'Please use the unsubscribe button on the confirmation page.', 400);
  }

  const resolved = await resolveToken(token);
  if (resolved.kind === 'unavailable') {
    return page('Temporarily unavailable', 'Email preferences could not be updated right now.', 503);
  }
  if (resolved.kind === 'invalid') {
    return page('Invalid token', 'This unsubscribe link is invalid or has expired.', 400);
  }

  await db.user.update({
    where: { id: resolved.userId },
    data: { emailNotifications: false },
  });

  return page(
    'Unsubscribed',
    "You've turned off HostelLo price alert emails. You can re-enable them from profile settings.",
    200,
  );
}

async function resolveToken(token: string): Promise<
  | { kind: 'valid'; userId: string }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
> {
  if (!token || token.length > MAX_TOKEN_LENGTH) return { kind: 'invalid' };

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return { kind: 'unavailable' };

  const claims = verifyEmailUnsubscribeToken(token, secret);
  if (!claims) return { kind: 'invalid' };

  const user = await db.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, email: true },
  });
  if (!user || user.email.toLowerCase() !== claims.email.toLowerCase()) {
    return { kind: 'invalid' };
  }

  return { kind: 'valid', userId: user.id };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function page(title: string, message: string, status: 200 | 400 | 413 | 503, token?: string) {
  const safeToken = token ? escapeHtml(token) : null;
  const action = safeToken
    ? `<form method="post" action="/api/email/unsubscribe">
        <input type="hidden" name="token" value="${safeToken}" />
        <input type="hidden" name="confirm" value="unsubscribe" />
        <button type="submit">Unsubscribe</button>
      </form>`
    : '<a href="/">Back to HostelLo</a>';
  const ok = status === 200;

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — HostelLo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #FDF8F0; color: #2A2318; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #FEFCF8; border: 1px solid #E0D4C0; border-radius: 16px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(42,35,24,0.08); }
    .icon { font-size: 2.5rem; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 0.9375rem; color: #857060; line-height: 1.65; margin-bottom: 28px; }
    a, button { display: inline-block; border: 0; background: #2A6545; color: #F9F5EE; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${ok ? '✓' : '⚠'}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${action}
  </div>
</body>
</html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      },
    },
  );
}
