import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton } from "./layout";

export function accountDeletedEmail({
  name,
}: {
  name: string;
}) {
  const firstName = escapeHtml(name.split(" ")[0]);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
      Your account has been deleted
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, we're sorry to see you go. Your HostelLo account and all associated data have been permanently deleted as of today.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      <strong>What was deleted:</strong>
    </p>
    <ul style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.8;padding-left:20px;">
      <li>Your profile and personal information</li>
      <li>Booking history and messages</li>
      <li>Reviews and ratings you've left</li>
      <li>Saved favorites and price alerts</li>
      <li>Any hostels you listed (if you were an owner)</li>
    </ul>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Your email address will not be reused for 30 days, after which it may be available for a new account.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      If you have any questions or need further assistance with data deletion compliance, please contact our support team at <a href="mailto:privacy@hostello.pk" style="color:#D97706;text-decoration:none;">privacy@hostello.pk</a>.
    </p>
  `;

  return {
    subject: "Your HostelLo account has been deleted",
    html:    emailLayout(content, "Account deleted"),
  };
}
