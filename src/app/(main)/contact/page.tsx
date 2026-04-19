import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/features/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the HostelLo team.",
};

export const revalidate = false;

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Contact us
          </h1>
          <p className="mt-3 text-base text-[var(--color-muted)]">
            We reply within 24 hours on weekdays. For urgent issues, email{" "}
            <a
              href="mailto:support@hostello.pk"
              className="font-medium text-[var(--color-primary-700)] hover:underline"
            >
              support@hostello.pk
            </a>{" "}
            directly.
          </p>
        </div>

        <ContactForm />

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a href="mailto:support@hostello.pk" className="hover:text-[var(--color-text)] transition-colors">
              support@hostello.pk
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a href="mailto:owners@hostello.pk" className="hover:text-[var(--color-text)] transition-colors">
              owners@hostello.pk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
