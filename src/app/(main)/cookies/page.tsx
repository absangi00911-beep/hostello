import type { Metadata } from "next";

export const revalidate = false; // static — built once, never re-rendered

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How HostelLo uses cookies.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Cookie Policy
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-10">Last updated: 1 January 2025</p>

        <div className="space-y-8 text-sm text-[var(--color-muted)] leading-relaxed">
          <section>
            <h2
              className="text-lg font-bold text-[var(--color-text)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What cookies we use
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-sand-50)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-text)]">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-text)]">Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-text)]">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-xs">next-auth.session-token</td>
                    <td className="px-4 py-3">Keeps you signed in</td>
                    <td className="px-4 py-3">30 days</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-xs">next-auth.csrf-token</td>
                    <td className="px-4 py-3">Prevents cross-site request forgery</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2
              className="text-lg font-bold text-[var(--color-text)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What we don't use
            </h2>
            <p>
              We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
              We do not share cookie data with advertisers. Vercel Analytics collects anonymised
              performance data at the edge — no cookies are involved.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-bold text-[var(--color-text)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Managing cookies
            </h2>
            <p>
              You can delete cookies in your browser settings at any time. Deleting the session
              cookie will sign you out. You can also browse listings without an account — no
              cookies are set for unauthenticated visitors.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-bold text-[var(--color-text)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Questions
            </h2>
            <p>
              Email{" "}
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
