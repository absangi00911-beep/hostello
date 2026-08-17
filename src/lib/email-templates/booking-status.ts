// Path: src/lib/email-templates/booking-status.ts
import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton } from "./layout";
import { getAppUrl } from "@/lib/app-url";

const APP_URL = getAppUrl();

interface BookingStatusEmailProps {
  studentName:  string;
  studentEmail: string;
  hostelName:   string;
  hostelSlug:   string;
  bookingId:    string;
  status:       "CONFIRMED" | "CANCELLED";
}

/**
 * Sent to the student when the hostel owner confirms or declines their request.
 */
export function bookingStatusEmail({
  studentName, studentEmail, hostelName,
  bookingId, status,
}: BookingStatusEmailProps) {
  const firstName = escapeHtml(studentName.split(" ")[0]);
  const shortId   = bookingId.slice(-8).toUpperCase();
  const escapedHostelName = escapeHtml(hostelName);
  const confirmed = status === "CONFIRMED";

  const content = confirmed
    ? `
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
        Your booking is confirmed ✓
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
        Hi ${firstName}, the owner of <strong>${escapedHostelName}</strong> has confirmed your stay.
        Your reference is <strong>#${shortId}</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B6354;line-height:1.6;">
        The owner will contact you with move-in details. If you have questions,
        reply to this email or check your booking page.
      </p>
      ${emailButton("View booking", `${APP_URL}/bookings/${bookingId}`)}
    `
    : `
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
        Booking request declined
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
        Hi ${firstName}, the owner of <strong>${escapedHostelName}</strong> wasn't able to
        accommodate your request for ref <strong>#${shortId}</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B6354;line-height:1.6;">
        This sometimes happens when a room was booked by another student at the same time.
        There are other verified hostels nearby — browse and send a new request.
      </p>
      ${emailButton("Browse hostels", `${APP_URL}/hostels`)}
    `;

  return {
    to:      studentEmail,
    subject: confirmed
      ? `Booking confirmed — ${escapedHostelName} (#${shortId})`
      : `Booking request declined — ${escapedHostelName} (#${shortId})`,
    html: emailLayout(content),
  };
}

interface BookingRefundedEmailProps {
  studentName:  string;
  studentEmail: string;
  hostelName:   string;
  bookingId:    string;
  amount:       number;
}

/**
 * Sent to the student once an admin processes a refund for a cancelled,
 * previously-paid booking. See src/lib/refunds.ts.
 */
export function bookingRefundedEmail({
  studentName, studentEmail, hostelName, bookingId, amount,
}: BookingRefundedEmailProps) {
  const firstName = escapeHtml(studentName.split(" ")[0]);
  const shortId = bookingId.slice(-8).toUpperCase();
  const escapedHostelName = escapeHtml(hostelName);
  const formattedAmount = `PKR ${Math.round(amount).toLocaleString("en-PK")}`;

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
      Your refund has been processed
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, your refund of <strong>${formattedAmount}</strong> for the cancelled booking
      at <strong>${escapedHostelName}</strong> (ref <strong>#${shortId}</strong>) has been processed.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#6B6354;line-height:1.6;">
      It can take a few business days to appear back in your original payment method, depending on
      your bank. If you don't see it after a week, reply to this email and we'll look into it.
    </p>
    ${emailButton("View booking", `${APP_URL}/bookings/${bookingId}`)}
  `;

  return {
    to: studentEmail,
    subject: `Refund processed — ${escapedHostelName} (#${shortId})`,
    html: emailLayout(content),
  };
}
