interface PriceAlertEmailProps {
  userName: string;
  hostelName: string;
  hostelUrl: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
}

export function priceAlertEmail({
  userName,
  hostelName,
  hostelUrl,
  oldPrice,
  newPrice,
  targetPrice,
}: PriceAlertEmailProps) {
  const { subject, html } = layout({
    preheader: `${hostelName} price just dropped!`,
    body: `
      <p>Hi ${userName},</p>
      
      <p>Great news! The monthly price for <strong>${hostelName}</strong> has dropped below your target of <strong>PKR ${targetPrice.toLocaleString()}</strong>.</p>
      
      <table role="presentation" cellspacing="0" cellpadding="15" style="width: 100%; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
        <tr>
          <td style="color: #666; font-size: 14px;">Old price</td>
          <td style="color: #333; font-weight: bold; text-align: right;">PKR ${oldPrice.toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid #ddd;">
          <td style="color: #666; font-size: 14px;">New price</td>
          <td style="color: #27ae60; font-weight: bold; text-align: right; font-size: 18px;">PKR ${newPrice.toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid #ddd;">
          <td style="color: #666; font-size: 14px;">Your target</td>
          <td style="color: #3498db; font-weight: bold; text-align: right;">PKR ${targetPrice.toLocaleString()}</td>
        </tr>
      </table>
      
      <p style="margin: 20px 0;">
        <a href="${hostelUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Hostel
        </a>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This alert was triggered by your price monitor on Hostello. You can manage your alerts in your profile settings.
      </p>
    `,
  });

  return { subject, html };
}

// Re-export layout for use in this template
export { layout } from "./layout";
