import { emailLayout, emailButton } from "./layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk";

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
  hostelSlug, bookingId, status,
}: BookingStatusEmailProps) {
  const firstName = studentName.split(" ")[0];
  const shortId   = bookingId.slice(-8).toUpperCase();
  const confirmed = status === "CONFIRMED";

  const content = confirmed
    ? `
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
        Your booking is confirmed ✓
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
        Hi ${firstName}, the owner of <strong>${hostelName}</strong> has confirmed your stay.
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
        Hi ${firstName}, the owner of <strong>${hostelName}</strong> wasn't able to
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
      ? `Booking confirmed — ${hostelName} (#${shortId})`
      : `Booking request declined — ${hostelName} (#${shortId})`,
    html: emailLayout(content),
  };
}
