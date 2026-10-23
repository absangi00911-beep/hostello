// Path: src/lib/email-templates/price-alert.ts
import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailTheme } from "./layout";

interface PriceAlertEmailProps {
  userName: string;
  hostelName: string;
  hostelUrl: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
  unsubscribeUrl: string;
  emailPreferencesUrl?: string;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function priceAlertEmail({
  userName,
  hostelName,
  hostelUrl,
  oldPrice,
  newPrice,
  targetPrice,
  unsubscribeUrl,
  emailPreferencesUrl,
}: PriceAlertEmailProps) {
  const escapedUserName = escapeHtml(userName);
  const escapedHostelName = escapeHtml(hostelName);

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      Price alert: ${escapedHostelName}
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Hi ${escapedUserName},<br>
      Great news! The monthly price for <strong>${escapedHostelName}</strong> has dropped below your target.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:${emailTheme.page};border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        <tr style="border-bottom:1px solid ${emailTheme.border};">
          <td style="padding:8px 0;font-size:14px;color:${emailTheme.body};">Old price</td>
          <td style="padding:8px 0;text-align:right;font-size:15px;color:${emailTheme.body};">${formatPrice(oldPrice)}</td>
        </tr>
        <tr style="border-bottom:1px solid ${emailTheme.border};">
          <td style="padding:8px 0;font-size:14px;color:${emailTheme.body};">New price</td>
          <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:700;color:${emailTheme.success};">${formatPrice(newPrice)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${emailTheme.body};">Your target</td>
          <td style="padding:8px 0;text-align:right;font-size:15px;color:${emailTheme.action};">${formatPrice(targetPrice)}</td>
        </tr>
      </tbody>
    </table>

    ${emailButton("View hostel", hostelUrl)}

    <hr style="margin:32px 0;border:none;border-top:1px solid ${emailTheme.border};" />
    <p style="margin:0;font-size:12px;color:${emailTheme.muted};">
      You received this because a hostel matched your price alert on HostelLo. Manage your alerts in your profile settings.
      <a href="${unsubscribeUrl}" style="color:${emailTheme.link};">Unsubscribe from price alerts</a>
      ${emailPreferencesUrl ? `<br><a href="${emailPreferencesUrl}" style="color:${emailTheme.link};">Turn off all price alert emails</a>` : ""}
    </p>
  `;

  return {
    subject: `Price alert: ${escapedHostelName} dropped below your target!`,
    html: emailLayout(content, `${escapedHostelName} price just dropped!`),
  };
}
