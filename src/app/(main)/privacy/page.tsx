import type { Metadata } from "next";

export const revalidate = false; // static — built once, never re-rendered

export const metadata: Metadata = {
};

const LAST_UPDATED = "1 January 2025";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-sm max-w-none text-[var(--color-text)] space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              1. What we collect
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              When you create an account we collect your name, email address, and optionally your
              phone number and city. When you make a booking we collect the dates, payment method,
              and transaction reference. When you browse listings we collect standard server logs
              (IP address, browser type, pages visited) which are retained for 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              2. How we use it
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              We use your data to operate the platform — processing bookings, sending booking
              confirmations, enabling communication between students and owners, and improving
              search results. We do not sell your personal data to third parties, and we do not
              use it for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              3. Who we share it with
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              When you book a hostel, we share your name and contact details with the hostel owner
              so they can confirm your stay. We use Resend for transactional email, Twilio for SMS,
              Safepay/JazzCash/EasyPaisa for payment processing, and Cloudflare for CDN and
              security. Each provider is bound by their own privacy commitments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              4. Data storage and security
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Your data is stored on Neon PostgreSQL servers accessible from Pakistan. Passwords are
              hashed with bcrypt (cost factor 12) and never stored in plain text. All traffic is
              encrypted via TLS. We apply rate limiting on authentication endpoints to prevent
              brute-force attacks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              5. Your rights
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              You can view, update, or delete your account data from your Profile page at any time.
              To request a full export or permanent deletion of your data, email{" "}
              <a
                href="mailto:privacy@hostello.pk"
                className="text-[var(--color-primary-700)] hover:underline"
              >
                privacy@hostello.pk
              </a>
              . We will respond within 14 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              6. Cookies
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              We use a single session cookie for authentication (HttpOnly, Secure, SameSite=Lax).
              We do not use advertising or tracking cookies. See our{" "}
              <a href="/cookies" className="text-[var(--color-primary-700)] hover:underline">
                Cookie Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              7. Contact
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Questions about this policy:{" "}
              <a
                href="mailto:privacy@hostello.pk"
                className="text-[var(--color-primary-700)] hover:underline"
              >
                privacy@hostello.pk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
