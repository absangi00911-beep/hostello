import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readBoundedText } from '@/lib/bounded-json';
import { getIp, rateLimit } from '@/lib/rate-limit';

const MAX_TOKEN_LENGTH = 128;
const MAX_QUERY_LENGTH = 256;
const MAX_BODY_BYTES = 512;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return renderResponse('Missing token', 'No unsubscribe token was provided.', 400);
  }
  if (token.length > MAX_TOKEN_LENGTH || req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return renderResponse('Invalid link', 'This unsubscribe link is invalid or has expired.', 400);
  }

  const quota = await rateLimit(`alert-unsubscribe:${getIp(req)}`, { limit: 120, windowMs: 60_000 });
  if (!quota.ok) return rateLimitedResponse(quota.resetAt);

  const alert = await db.priceAlert.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, active: true, hostel: { select: { name: true } } },
  });

  if (!alert) {
    return renderResponse('Invalid link', 'This unsubscribe link is invalid or has already been used.', 400);
  }

  if (!alert.active) {
    return renderResponse('Already inactive', `Your price alert for ${alert.hostel.name} is already off.`, 200);
  }

  return renderResponse(
    'Confirm unsubscribe',
    `Turn off price alert emails for ${alert.hostel.name}?`,
    200,
    token,
  );
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return renderResponse('Invalid link', 'This unsubscribe link is invalid or has expired.', 400);
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    return renderResponse('Invalid request', 'Please use the unsubscribe button in the email.', 400);
  }

  const quota = await rateLimit(`alert-unsubscribe:${getIp(req)}`, { limit: 120, windowMs: 60_000 });
  if (!quota.ok) return rateLimitedResponse(quota.resetAt);

  const body = await readBoundedText(req, MAX_BODY_BYTES);
  if (!body.ok) return renderResponse('Invalid request', body.error, body.status);

  const form = new URLSearchParams(body.text);
  const token = form.get('token');
  if (form.get('confirm') !== 'unsubscribe' || !token || token.length > MAX_TOKEN_LENGTH) {
    return renderResponse('Invalid request', 'Please use the unsubscribe button in the email.', 400);
  }

  const alert = await db.priceAlert.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, active: true, hostel: { select: { name: true } } },
  });

  if (!alert) {
    return renderResponse('Invalid link', 'This unsubscribe link is invalid or has already been used.', 400);
  }

  if (!alert.active) {
    return renderResponse('Already inactive', `Your price alert for ${alert.hostel.name} is already off.`, 200);
  }

  await db.priceAlert.updateMany({
    where: { id: alert.id, unsubscribeToken: token, active: true },
    data: { active: false },
  });

  return renderResponse(
    'Unsubscribed',
    `You won't receive any more price alerts for ${alert.hostel.name}. You can re-enable this alert in your profile.`,
    200,
  );
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

function renderResponse(title: string, message: string, status: number, token?: string) {
  const escapedToken = token ? escapeHtml(token) : null;
  const action = escapedToken
    ? `<form method="post" action="/api/alerts/unsubscribe">
        <input type="hidden" name="token" value="${escapedToken}" />
        <input type="hidden" name="confirm" value="unsubscribe" />
        <button type="submit">Unsubscribe</button>
      </form>`
    : '<a href="/">Back to HostelLo</a>';
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
    </head><body><div class="card">
    <h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>
    ${action}
    </div></body></html>`,
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

function rateLimitedResponse(resetAt: number) {
  const response = renderResponse(
    'Please try again shortly',
    'Too many unsubscribe attempts came from this network. Please wait a moment and try again.',
    429,
  );
  response.headers.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
  return response;
}
