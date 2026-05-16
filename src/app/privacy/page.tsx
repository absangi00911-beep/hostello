// Path: src/app/privacy/page.tsx
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
  title: "Privacy policy",
  description: "How HostelLo collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
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
            Privacy policy
          </h1>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            Last updated: {updated}
          </p>
        </div>

        <div className="space-y-8 prose-body">
          <Section title="What this policy covers">
            <p>
              HostelLo operates a student accommodation marketplace in Pakistan.
              This policy explains what personal data we collect when you use
              the platform, how we use it, and the rights you have over it.
            </p>
            <p>
              By creating an account or using HostelLo, you agree to the
              collection and use of information described here.
            </p>
          </Section>

          <Section title="Data we collect">
            <p>
              <strong className="font-[500] text-[var(--color-text-heading)]">Account data</strong> — name, email address, phone number (optional), and bcrypt-hashed password. We never store your password in plain text.
            </p>
            <p>
              <strong className="font-[500] text-[var(--color-text-heading)]">Profile data</strong> — city, short bio, and profile photo (uploaded to Cloudflare R2).
            </p>
            <p>
              <strong className="font-[500] text-[var(--color-text-heading)]">Booking data</strong> — check-in and check-out dates, room selections, guest count, and payment records. Payment card details are processed by Safepay and never stored on HostelLo servers.
            </p>
            <p>
              <strong className="font-[500] text-[var(--color-text-heading)]">Usage data</strong> — hostel views, search queries, favorites saved, and in-app messages. This data helps us improve search results and notify you of relevant price changes.
            </p>
            <p>
              <strong className="font-[500] text-[var(--color-text-heading)]">Device data</strong> — IP address (used for rate limiting only, not stored long-term), browser type, and session tokens stored in HTTP-only cookies.
            </p>
          </Section>

          <Section title="How we use your data">
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account</li>
              <li>Process booking requests and payments</li>
              <li>Send transactional emails (booking confirmations, password resets, price alerts)</li>
              <li>Connect students and hostel owners via in-app messaging</li>
              <li>Moderate listings and reviews for quality and safety</li>
              <li>Prevent fraud and abuse through rate limiting</li>
            </ul>
            <p>
              We do not sell your personal data to third parties. We do not use
              your data for advertising or marketing profiling.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>HostelLo shares data with the following services to operate:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="font-[500]">Neon (PostgreSQL)</strong> — stores all platform data on US-based servers</li>
              <li><strong className="font-[500]">Cloudflare R2</strong> — stores hostel and profile photos</li>
              <li><strong className="font-[500]">Resend</strong> — delivers transactional emails</li>
              <li><strong className="font-[500]">Twilio</strong> — delivers SMS verification codes</li>
              <li><strong className="font-[500]">Safepay</strong> — processes card payments; governed by Safepay's own privacy policy</li>
              <li><strong className="font-[500]">Upstash</strong> — Redis-based rate limiting; no personal data stored</li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>
              We retain your data for as long as your account is active. When
              you delete your account, all personal data is permanently removed
              from our systems immediately, including bookings, reviews,
              messages, favorites, and price alerts.
            </p>
            <p>
              Anonymised, aggregated statistics (total booking counts, average
              ratings) may be retained for platform analytics after account
              deletion.
            </p>
          </Section>

          <Section title="Your rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="font-[500]">Access</strong> — request a copy of all personal data we hold about you</li>
              <li><strong className="font-[500]">Correction</strong> — update inaccurate data via your profile settings</li>
              <li><strong className="font-[500]">Erasure</strong> — permanently delete your account and all associated data (GDPR Article 17)</li>
              <li><strong className="font-[500]">Portability</strong> — request your data in a machine-readable format</li>
            </ul>
            <p>
              To exercise these rights, use the account deletion feature in
              Settings or contact us at{" "}
              <a href="mailto:privacy@hostello.pk" className="text-[var(--color-text-link)] hover:underline">
                privacy@hostello.pk
              </a>
              .
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              HostelLo uses one HTTP-only session cookie to keep you signed in.
              This cookie is strictly necessary and cannot be disabled while
              using the platform. We do not use advertising or tracking cookies.
            </p>
          </Section>

          <Section title="Children">
            <p>
              HostelLo is intended for users aged 17 and above. We do not
              knowingly collect data from children under 13. If you believe a
              child has created an account, contact us at{" "}
              <a href="mailto:privacy@hostello.pk" className="text-[var(--color-text-link)] hover:underline">
                privacy@hostello.pk
              </a>{" "}
              and we will delete it immediately.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy when we add new features or comply with
              new regulations. Significant changes will be communicated by email.
              Continued use of the platform after an update constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about privacy? Email{" "}
              <a href="mailto:privacy@hostello.pk" className="text-[var(--color-text-link)] hover:underline">
                privacy@hostello.pk
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