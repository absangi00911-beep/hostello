import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton } from "./layout";

interface PriceAlertEmailProps {
  userName: string;
  hostelName: string;
  hostelUrl: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
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
}: PriceAlertEmailProps) {
  const escapedUserName = escapeHtml(userName);
  const escapedHostelName = escapeHtml(hostelName);

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1A1209;">
      Price alert: ${escapedHostelName}
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${escapedUserName},<br>
      Great news! The monthly price for <strong>${escapedHostelName}</strong> has dropped below your target.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAF7F0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        <tr style="border-bottom:1px solid #EAE0D0;">
          <td style="padding:8px 0;font-size:14px;color:#6B6354;">Old price</td>
          <td style="padding:8px 0;text-align:right;font-size:15px;color:#6B6354;">${formatPrice(oldPrice)}</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE0D0;">
          <td style="padding:8px 0;font-size:14px;color:#6B6354;">New price</td>
          <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:700;color:#27ae60;">${formatPrice(newPrice)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6B6354;">Your target</td>
          <td style="padding:8px 0;text-align:right;font-size:15px;color:#3498db;">${formatPrice(targetPrice)}</td>
        </tr>
      </tbody>
    </table>

    ${emailButton("View hostel", hostelUrl)}

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />
    <p style="margin:0;font-size:12px;color:#A68B5B;">
      You received this because a hostel matched your price alert on HostelLo. Manage your alerts in your profile settings.
    </p>
  `;

  return {
    subject: `Price alert: ${escapedHostelName} dropped below your target!`,
    html: emailLayout(content, `${escapedHostelName} price just dropped!`),
  };
}
