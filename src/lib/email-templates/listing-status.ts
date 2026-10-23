// Path: src/lib/email-templates/listing-status.ts
import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailTheme } from "./layout";
import { getAppUrl } from "@/lib/app-url";

interface ListingStatusEmailProps {
  ownerEmail: string;
  ownerName: string;
  hostelName: string;
  hostelId: string;
  status: "APPROVED" | "SUSPENDED";
  reason?: string;
}

/**
 * Email sent to hostel owner when their listing is approved.
 */
export function listingApprovedEmail({
  ownerEmail,
  ownerName,
  hostelName,
  hostelId,
}: ListingStatusEmailProps) {
  const APP_URL = getAppUrl();
  const firstName = escapeHtml(ownerName.split(" ")[0]);
  const escapedHostelName = escapeHtml(hostelName);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      Your listing is live 🎉
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Hi ${firstName}, your hostel <strong>${escapedHostelName}</strong> has been approved
      and is now visible to students on HostelLo.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${emailTheme.body};line-height:1.6;">
      You can manage bookings, update details, and view inquiries from your dashboard.
      Students can now send booking requests.
    </p>

    ${emailButton("View your listing", `${APP_URL}/dashboard/hostels/${hostelId}`)}

    <hr style="margin:32px 0;border:none;border-top:1px solid ${emailTheme.border};" />
    <p style="margin:0;font-size:12px;color:${emailTheme.muted};">
      Questions? Visit our <a href="${APP_URL}/help" style="color:${emailTheme.link};">Help Centre</a>
      or reply to this email.
    </p>
  `;

  return {
    to: ownerEmail,
    subject: `Your hostel is now live — ${escapedHostelName}`,
    html: emailLayout(content, `Your listing has been approved`),
  };
}

/**
 * Email sent to hostel owner when their listing is suspended.
 */
export function listingSuspendedEmail({
  ownerEmail,
  ownerName,
  hostelName,
  reason = "Your listing did not meet our quality standards.",
}: ListingStatusEmailProps) {
  const APP_URL = getAppUrl();
  const firstName = escapeHtml(ownerName.split(" ")[0]);
  const escapedHostelName = escapeHtml(hostelName);
  const escapedReason = escapeHtml(reason);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      Your listing has been suspended
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Hi ${firstName}, your hostel <strong>${escapedHostelName}</strong> has been suspended
      and is no longer visible to students.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${emailTheme.body};line-height:1.6;">
      <strong>Reason:</strong> ${escapedReason}
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${emailTheme.body};line-height:1.6;">
      If you believe this was a mistake or would like to update your listing, please reach out
      to our support team.
    </p>

    ${emailButton("Contact support", `${APP_URL}/help`)}

    <hr style="margin:32px 0;border:none;border-top:1px solid ${emailTheme.border};" />
    <p style="margin:0;font-size:12px;color:${emailTheme.muted};">
      You received this because your HostelLo listing was suspended.
    </p>
  `;

  return {
    to: ownerEmail,
    subject: `Your listing has been suspended — ${escapedHostelName}`,
    html: emailLayout(content, `Your listing has been suspended`),
  };
}
