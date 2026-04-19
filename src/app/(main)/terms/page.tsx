import type { Metadata } from "next";

export const revalidate = false; // static — built once, never re-rendered

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "HostelLo terms and conditions for students and hostel owners.",
};

const LAST_UPDATED = "1 January 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-lg font-bold text-[var(--color-text)] mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="text-sm text-[var(--color-muted)] leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8">
          <Section title="1. About HostelLo">
            <p>
              HostelLo is an online marketplace that connects students looking for accommodation
              with hostel owners in Pakistan. By using HostelLo you agree to these terms. If you
              don't agree, don't use the platform.
            </p>
          </Section>

          <Section title="2. Accounts">
            <p>
              You must be 18 or older to create an account. You are responsible for keeping your
              login credentials secure. If you suspect unauthorised access to your account, contact
              us immediately at support@hostello.pk.
            </p>
            <p>
              We may suspend or terminate accounts that violate these terms, engage in fraud, or
              post false information.
            </p>
          </Section>

          <Section title="3. Listings">
            <p>
              Hostel owners are responsible for the accuracy of their listings. Listings must not
              contain false information, misleading photos, or discriminatory content. We reserve
              the right to remove any listing that violates these terms or applicable law.
            </p>
            <p>
              Listings are not live until reviewed and approved by HostelLo. Approved listings may
              be removed at any time if they no longer meet our standards.
            </p>
          </Section>

          <Section title="4. Bookings and payments">
            <p>
              A booking is confirmed only when the owner accepts and payment is collected. Payment
              amounts are validated server-side — the amount you see is the amount charged.
            </p>
            <p>
              Cancellation refunds depend on timing: full refund if cancelled more than 7 days
              before check-in; 50% refund within 7 days; no refund within 48 hours of check-in.
              Owners who cancel confirmed bookings are subject to a penalty fee.
            </p>
          </Section>

          <Section title="5. Reviews">
            <p>
              Reviews may only be submitted by users who completed a stay booked through HostelLo.
              Reviews must be honest and based on personal experience. We do not allow paid reviews
              or review manipulation.
            </p>
          </Section>

          <Section title="6. Liability">
            <p>
              HostelLo is a marketplace — we are not a party to the accommodation contract between
              students and owners. We are not liable for the quality, safety, or legality of listed
              properties. We are not liable for any loss or damage arising from use of the platform
              beyond the amount paid for the relevant booking.
            </p>
          </Section>

          <Section title="7. Governing law">
            <p>
              These terms are governed by the laws of Pakistan. Disputes shall be resolved in the
              courts of Lahore, Pakistan.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Legal queries:{" "}
              <a
                href="mailto:legal@hostello.pk"
                className="text-[var(--color-primary-700)] hover:underline"
              >
                legal@hostello.pk
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
