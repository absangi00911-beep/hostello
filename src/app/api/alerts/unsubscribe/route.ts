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
  const ok = status === 200;
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
    body{font-family:system-ui,sans-serif;background:#FDF8F0;color:#2A2318;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#FEFCF8;border:1px solid #E0D4C0;border-radius:16px;padding:48px 40px;max-width:440px;width:100%;text-align:center}
    .icon{font-size:2.5rem;margin-bottom:20px}
    h1{font-size:1.5rem;font-weight:700;margin-bottom:12px}
    p{font-size:.9375rem;color:#857060;line-height:1.65;margin-bottom:28px}
    a,button{display:inline-block;border:0;background:#2A6545;color:#F9F5EE;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:.9375rem;font-weight:600;cursor:pointer}</style>
    </head><body><div class="card">
    <div class="icon">${ok ? '✓' : '⚠'}</div>
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
