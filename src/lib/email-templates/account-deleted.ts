// Path: src/lib/email-templates/account-deleted.ts

import { escapeHtml } from "@/lib/email";
import { emailLayout } from "./layout";

export function accountDeletedEmail({
  name,
}: {
  name: string;
}) {
  const firstName = escapeHtml(name.split(" ")[0]);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
      We received your deletion request
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, your HostelLo account deletion request is being processed. You can no longer sign in while cleanup is underway.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      We remove your profile, messages, saved hostels, alerts, and other account data. Financial booking and payout records are retained where needed for transaction history, with your account details anonymized.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Your email address will be released when processing is complete. If a booking, refund, pending plan payment, or payout still needs attention, processing pauses until it is resolved. Contact privacy@hostello.pk if you need help.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      If you have any questions or need further assistance with data deletion compliance, please contact our support team at <a href="mailto:privacy@hostello.pk" style="color:#D97706;text-decoration:none;">privacy@hostello.pk</a>.
    </p>
  `;

  return {
    subject: "We received your HostelLo account deletion request",
    html:    emailLayout(content, "Deletion request received"),
  };
}
