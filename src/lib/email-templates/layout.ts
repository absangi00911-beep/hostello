// Path: src/lib/email-templates/layout.ts

import { getAppUrl } from "@/lib/app-url";

const APP_URL = getAppUrl();

export const emailTheme = {
  primary: "#0066FF",
  action: "#0052CC",
  link: "#003D99",
  success: "#006A65",
  page: "#F6F2EB",
  card: "#FFFDF8",
  heading: "#222B29",
  body: "#303936",
  muted: "#69716C",
  border: "#E9E1D7",
} as const;

/**
 * Wraps email content in a consistent shell.
 * Email clients need everything inline-styled — no Tailwind, no external CSS.
 */
export function emailLayout(content: string, previewText = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HostelLo</title>
</head>
<body style="margin:0;padding:0;background:${emailTheme.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${emailTheme.page};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <a href="${APP_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:${emailTheme.heading};">Hostel</span><span style="font-size:22px;font-weight:700;color:${emailTheme.link};">Lo</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${emailTheme.card};border-radius:16px;border:1px solid ${emailTheme.border};padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:${emailTheme.muted};">
                © ${new Date().getFullYear()} HostelLo &nbsp;·&nbsp;
                <a href="${APP_URL}/privacy" style="color:${emailTheme.muted};">Privacy</a> &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:${emailTheme.muted};">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A primary CTA button */
export function emailButton(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:${emailTheme.action};color:${emailTheme.card};text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">${label}</a>`;
}

/** A muted label + value row */
export function emailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${emailTheme.muted};width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:${emailTheme.heading};font-weight:500;">${value}</td>
  </tr>`;
}
