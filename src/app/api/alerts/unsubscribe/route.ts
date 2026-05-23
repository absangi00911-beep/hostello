import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return renderResponse('Missing token', 'No unsubscribe token was provided.', 400);
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

  await db.priceAlert.update({
    where: { unsubscribeToken: token },
    data: { active: false },
  });

  return renderResponse(
    'Unsubscribed',
    `You won't receive any more price alerts for ${alert.hostel.name}. You can re-enable this alert in your profile.`,
    200
  );
}

function renderResponse(title: string, message: string, status: number) {
  const ok = status === 200;
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${title} — HostelLo</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#FDF8F0;color:#2A2318;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#FEFCF8;border:1px solid #E0D4C0;border-radius:16px;padding:48px 40px;max-width:440px;width:100%;text-align:center}
    .icon{font-size:2.5rem;margin-bottom:20px}
    h1{font-size:1.5rem;font-weight:700;margin-bottom:12px}
    p{font-size:.9375rem;color:#857060;line-height:1.65;margin-bottom:28px}
    a{display:inline-block;background:#2A6545;color:#F9F5EE;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:.9375rem;font-weight:600}</style>
    </head><body><div class="card">
    <div class="icon">${ok ? '✓' : '⚠'}</div>
    <h1>${title}</h1><p>${message}</p>
    <a href="/">Back to HostelLo</a>
    </div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
