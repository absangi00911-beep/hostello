import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailRow } from "./layout";
import { getAppUrl } from "@/lib/app-url";

const APP_URL = getAppUrl();

interface BookingEmailProps {
  studentName: string;
  studentEmail: string;
  ownerName: string;
  ownerEmail: string;
  hostelName: string;
  hostelSlug: string;
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  months: number;
  total: number;
  paymentMethod: string;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Email sent to the OWNER when a student makes a booking request.
 * They need to see: who booked, which hostel, dates, total.
 */
export function bookingNotificationEmail(props: BookingEmailProps) {
  const {
    studentName, hostelName,
    checkIn, checkOut, months, total, paymentMethod,
  } = props;

  const escapedStudentName = escapeHtml(studentName);
  const escapedHostelName = escapeHtml(hostelName);

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1A1209;">
      New booking request
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      <strong>${escapedStudentName}</strong> has requested to book <strong>${escapedHostelName}</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAF7F0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        ${emailRow("Student", escapedStudentName)}
        ${emailRow("Hostel", escapedHostelName)}
        ${emailRow("Check-in", formatDate(checkIn))}
        ${emailRow("Check-out", formatDate(checkOut))}
        ${emailRow("Duration", `${months} month${months !== 1 ? "s" : ""}`)}
        ${emailRow("Total", formatPrice(total))}
        ${emailRow("Payment via", paymentMethod)}
      </tbody>
    </table>

    <p style="margin:0 0 4px 0;font-size:14px;color:#6B6354;">
      Log in to your dashboard to confirm or decline this booking.
    </p>

    ${emailButton("View booking", `${APP_URL}/dashboard`)}

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />
    <p style="margin:0;font-size:12px;color:#A68B5B;">
      You received this because a student booked your hostel on HostelLo.
    </p>
  `;

  return {
    to: props.ownerEmail,
    subject: `New booking request for ${escapedHostelName}`,
    html: emailLayout(content, `${escapedStudentName} wants to book ${escapedHostelName}`),
  };
}

/**
 * Email sent to the STUDENT confirming their booking request was received.
 * They need: reference ID, hostel name, dates, what happens next.
 */
export function bookingConfirmationEmail(props: BookingEmailProps) {
  const {
    studentName, hostelName,
    bookingId, checkIn, checkOut, months, total, paymentMethod,
  } = props;

  const firstName = escapeHtml(studentName.split(" ")[0]);
  const shortId = bookingId.slice(-8).toUpperCase();
  const escapedHostelName = escapeHtml(hostelName);

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1A1209;">
      Booking request sent ✓
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, your request for <strong>${escapedHostelName}</strong> has been sent to the owner.
      You'll get another email once they confirm.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAF7F0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        ${emailRow("Reference", `#${shortId}`)}
        ${emailRow("Hostel", escapedHostelName)}
        ${emailRow("Check-in", formatDate(checkIn))}
        ${emailRow("Check-out", formatDate(checkOut))}
        ${emailRow("Duration", `${months} month${months !== 1 ? "s" : ""}`)}
        ${emailRow("Total", formatPrice(total))}
        ${emailRow("Payment via", paymentMethod)}
      </tbody>
    </table>

    <p style="margin:0 0 4px 0;font-size:14px;color:#6B6354;">
      The owner typically responds within 24 hours. You can view or cancel this booking in your account.
    </p>

    ${emailButton("View booking", `${APP_URL}/bookings/${bookingId}`)}

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />
    <p style="margin:0;font-size:12px;color:#A68B5B;">
      Questions? Reply to this email or visit our
      <a href="${APP_URL}/help" style="color:#0D3B2E;">Help Centre</a>.
    </p>
  `;

  return {
    to: props.studentEmail,
    subject: `Your booking request for ${escapedHostelName} — ref #${shortId}`,
    html: emailLayout(content, `Your booking request has been sent.`),
  };
}
