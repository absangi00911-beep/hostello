// Path: src/app/terms/page.tsx
import { PublicLayout } from "@/components/layout/PublicLayout";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2
        className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {title}
      </h2>
      <div className="space-y-2 text-[var(--text-body)] text-[var(--color-text-body)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export const metadata = {
  title: "Terms of service",
  description: "The terms and conditions governing use of the HostelLo platform.",
};

export default function TermsPage() {
  const updated = "12 May 2026";

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[720px] px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-[var(--text-h1)] font-[700] text-[var(--color-text-heading)] tracking-[-0.025em] mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Terms of service
          </h1>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            Last updated: {updated}
          </p>
        </div>

        <div className="space-y-8 prose-body">
          <Section title="Overview">
            <p>
              HostelLo is an online marketplace connecting students looking for
              accommodation with hostel owners in Pakistan. By creating an
              account or using any part of the platform, you agree to these
              terms.
            </p>
            <p>
              HostelLo is a marketplace — we facilitate connections between
              students and owners but are not a party to any rental agreement
              between them.
            </p>
          </Section>

          <Section title="Accounts">
            <p>You must be at least 17 years old to create an account.</p>
            <p>
              You are responsible for keeping your login credentials secure.
              Notify us immediately at{" "}
              <a href="mailto:support@hostello.pk" className="text-[var(--color-text-link)] hover:underline">
                support@hostello.pk
              </a>{" "}
              if you suspect unauthorised access.
            </p>
            <p>
              You may not create accounts for others or operate multiple
              accounts to circumvent restrictions.
            </p>
          </Section>

          <Section title="For students">
            <ul className="list-disc pl-5 space-y-1">
              <li>Booking requests are not confirmed until the hostel owner accepts and payment is processed.</li>
              <li>You may cancel a pending booking (before owner confirmation) at any time with no charge.</li>
              <li>After a booking is confirmed, cancellation is subject to the hostel owner's stated terms.</li>
              <li>Reviews may only be submitted after a completed stay. Fabricated reviews will result in account suspension.</li>
              <li>You are responsible for complying with the hostel's house rules.</li>
            </ul>
          </Section>

          <Section title="For hostel owners">
            <ul className="list-disc pl-5 space-y-1">
              <li>All listing information (price, photos, amenities, capacity) must be accurate and current.</li>
              <li>Listings are subject to admin review before going live. HostelLo may reject or remove listings that violate these terms.</li>
              <li>You must respond to booking requests within 24 hours. Repeated non-responses may result in listing suspension.</li>
              <li>You may not list properties you do not own or manage, or collect payment outside the HostelLo platform to avoid fees.</li>
              <li>HostelLo does not currently charge a commission. This may change with 30 days' advance notice.</li>
            </ul>
          </Section>

          <Section title="Payments">
            <p>
              Payments are processed by Safepay, a PCI-DSS compliant gateway.
              HostelLo does not store card details.
            </p>
            <p>
              All prices are in Pakistani Rupees (PKR). Booking totals are
              calculated at the time of request and do not change after
              confirmation.
            </p>
            <p>
              Refunds for cancelled confirmed bookings are subject to the
              hostel owner's cancellation policy. HostelLo will facilitate
              disputes but does not guarantee refunds for confirmed bookings.
            </p>
          </Section>

          <Section title="Prohibited conduct">
            <p>You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Post false, misleading, or defamatory reviews or listing information</li>
              <li>Use the messaging system to send spam or unsolicited commercial messages</li>
              <li>Attempt to move transactions off the platform to avoid paying via HostelLo</li>
              <li>Scrape, crawl, or systematically extract data from the platform</li>
              <li>Attempt to gain unauthorised access to any account or system</li>
              <li>Use the platform to facilitate any unlawful activity under Pakistani law</li>
            </ul>
            <p>
              Violation of these terms may result in immediate account
              suspension and reporting to relevant authorities where required
              by Pakistani law.
            </p>
          </Section>

          <Section title="Content">
            <p>
              You retain ownership of content you upload (photos, descriptions,
              reviews). By uploading content, you grant HostelLo a
              non-exclusive, royalty-free licence to display it on the platform.
            </p>
            <p>
              HostelLo may remove content that violates these terms or
              applicable Pakistani law, including the Pakistan Electronic Crimes
              Act 2016 (PECA).
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              HostelLo provides the platform on an "as is" basis. We do not
              guarantee the accuracy of listing information, the behaviour of
              hostel owners or students, or uninterrupted availability of the
              service.
            </p>
            <p>
              To the maximum extent permitted by Pakistani law, HostelLo is not
              liable for any indirect, incidental, or consequential damages
              arising from use of the platform.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You may delete your account at any time via Settings. HostelLo
              may suspend or terminate accounts that violate these terms, with
              or without notice depending on the severity of the violation.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms to reflect new features or legal
              requirements. Changes will be communicated by email at least 14
              days before taking effect. Continued use after that date
              constitutes acceptance.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the laws of the Islamic Republic of
              Pakistan. Disputes shall be subject to the exclusive jurisdiction
              of the courts of Lahore, Pakistan.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@hostello.pk" className="text-[var(--color-text-link)] hover:underline">
                support@hostello.pk
              </a>{" "}
              or use the{" "}
              <a href="/contact" className="text-[var(--color-text-link)] hover:underline">
                contact form
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </PublicLayout>
  );
}