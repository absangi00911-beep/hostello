import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://hostello.test",
  getAppOrigin: () => "https://hostello.test",
}));

import { bookingConfirmationEmail, bookingNotificationEmail, bookingOwnerReminderEmail } from "./booking";
import { bookingRefundedEmail, bookingStatusEmail } from "./booking-status";
import { emailSubject } from "./layout";
import { listingApprovedEmail, listingSuspendedEmail } from "./listing-status";
import { newListingAdminEmail } from "./new-listing";
import { priceAlertEmail } from "./price-alert";
import { welcomeEmail } from "./welcome";

// Ampersand, apostrophe, tags, and a newline that must never reach a header.
const HOSTEL = "Tom & Jerry's <b>Hostel</b>\r\nBcc: attacker@example.com";
const CLEAN = "Tom & Jerry's <b>Hostel</b> Bcc: attacker@example.com";
const stay = { checkIn: new Date("2026-12-01"), checkOut: new Date("2027-01-01"), months: 1, total: 5000 };

const cases: Array<[string, { subject: string; html: string }]> = [
  ["booking confirmed", bookingStatusEmail({ studentName: "A", studentEmail: "a@b.co", hostelName: HOSTEL, hostelSlug: "s", bookingId: "abcdef12345", status: "CONFIRMED" } as never)],
  ["booking declined", bookingStatusEmail({ studentName: "A", studentEmail: "a@b.co", hostelName: HOSTEL, hostelSlug: "s", bookingId: "abcdef12345", status: "CANCELLED" } as never)],
  ["refund", bookingRefundedEmail({ studentName: "A", studentEmail: "a@b.co", hostelName: HOSTEL, hostelSlug: "s", bookingId: "abcdef12345", amount: 5000 } as never)],
  ["owner notification", bookingNotificationEmail({ ownerName: "O", ownerEmail: "o@b.co", studentName: "S", hostelName: HOSTEL, bookingId: "abcdef12345", paymentMethod: "SAFEPAY", ...stay } as never)],
  ["owner reminder", bookingOwnerReminderEmail({ ownerName: "O", ownerEmail: "o@b.co", studentName: "S", hostelName: HOSTEL, bookingId: "abcdef12345", paymentMethod: "SAFEPAY", responseDueAt: new Date("2026-12-01T10:00:00Z"), ...stay } as never)],
  ["student confirmation", bookingConfirmationEmail({ ownerName: "O", ownerEmail: "o@b.co", studentName: "S", studentEmail: "s@b.co", hostelName: HOSTEL, bookingId: "abcdef12345", paymentMethod: "SAFEPAY", ...stay } as never)],
  ["listing approved", listingApprovedEmail({ ownerName: "A", hostelName: HOSTEL, hostelSlug: "s" } as never)],
  ["listing suspended", listingSuspendedEmail({ ownerName: "A", hostelName: HOSTEL, reason: "r" } as never)],
  ["new listing (admin)", newListingAdminEmail({ ownerName: "O", ownerEmail: "o@b.co", hostelName: HOSTEL, city: "Lahore", pricePerMonth: 5000, hostelSlug: "s" } as never)],
  ["price alert", priceAlertEmail({ userName: "A", userEmail: "a@b.co", hostelName: HOSTEL, hostelSlug: "s", currentPrice: 4000, targetPrice: 4500 } as never)],
];

describe("email subjects with user-controlled names", () => {
  it.each(cases)("%s: plain-text subject, no entities, no header break", (_name, email) => {
    expect(email.subject).toContain(CLEAN);
    expect(email.subject).not.toMatch(/&(?:amp|lt|gt|quot|#39);/);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it.each(cases)("%s: HTML body stays escaped", (_name, email) => {
    expect(email.html).not.toContain("<b>Hostel</b>");
    expect(email.html).not.toContain("Tom & Jerry's");
  });

  it("keeps a first name's apostrophe readable in the welcome subject", () => {
    expect(welcomeEmail({ name: "Aisha O'Brien", role: "STUDENT" } as never).subject)
      .toBe("Welcome to HostelLo, Aisha!");
    expect(welcomeEmail({ name: "O'Brien Khan", role: "STUDENT" } as never).subject)
      .toBe("Welcome to HostelLo, O'Brien!");
  });

  it("escapes values that previously went into the body raw", () => {
    const owner = newListingAdminEmail({ ownerName: "O", ownerEmail: 'x"><i>@evil.example', hostelName: "H", city: "L", pricePerMonth: 1, hostelSlug: "s" } as never);
    expect(owner.html).not.toContain("<i>@evil.example");

    const booking = bookingNotificationEmail({ ownerName: "O", ownerEmail: "o@b.co", studentName: "S", hostelName: "H", bookingId: "abcdef12345", paymentMethod: "<u>cash</u>", ...stay } as never);
    expect(booking.html).not.toContain("<u>cash</u>");
  });

  describe("emailSubject", () => {
    it("removes control characters, collapses whitespace and caps the length", () => {
      expect(emailSubject("a\r\nb\u0000c\t d")).toBe("a b c d");
      expect(emailSubject(` ${"x".repeat(500)} `)).toHaveLength(200);
    });
  });
});
