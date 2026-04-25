import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailRow } from "./layout";
import { getAppUrl } from "@/lib/app-url";

interface NewListingEmailProps {
  ownerName: string;
  ownerEmail: string;
  hostelName: string;
  hostelId: string;
  city: string;
  pricePerMonth: number;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function newListingAdminEmail(props: NewListingEmailProps) {
  const APP_URL = getAppUrl();
  const { ownerName, ownerEmail, hostelName, city, pricePerMonth } = props;

  const escapedOwnerName = escapeHtml(ownerName);
  const escapedHostelName = escapeHtml(hostelName);
  const escapedCity = escapeHtml(city);

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1A1209;">
      New listing pending review
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      A hostel owner has submitted a new listing that requires your approval
      before it goes live.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAF7F0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        ${emailRow("Hostel", escapedHostelName)}
        ${emailRow("City", escapedCity)}
        ${emailRow("Price", `${formatPrice(pricePerMonth)} / month`)}
        ${emailRow("Owner", escapedOwnerName)}
        ${emailRow("Owner email", ownerEmail)}
      </tbody>
    </table>

    ${emailButton("Review in admin panel", `${APP_URL}/admin/hostels?status=PENDING_REVIEW`)}

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />
    <p style="margin:0;font-size:12px;color:#A68B5B;">
      You received this because you are an admin of HostelLo.
    </p>
  `;

  return {
    to: process.env.SUPPORT_EMAIL ?? "support@hostello.pk",
    subject: `New listing pending review: ${escapedHostelName} (${escapedCity})`,
    html: emailLayout(content, `${escapedHostelName} needs your review`),
  };
}
