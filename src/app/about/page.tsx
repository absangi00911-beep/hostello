import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata = {
  title: "About HostelLo",
  description:
    "Learn how HostelLo helps students find verified hostels and helps owners reach the right residents.",
};

const VALUES = [
  {
    title: "Built for students",
    description:
      "Search by city, price, gender, amenities, and nearby universities so you can compare options that fit your life.",
    icon: Users,
  },
  {
    title: "Trust comes first",
    description:
      "Verified listings, transparent details, and reviews help you make a more confident decision before booking.",
    icon: ShieldCheck,
  },
  {
    title: "Better connections",
    description:
      "We bring students and hostel owners together through a simpler, more reliable booking experience.",
    icon: CheckCircle2,
  },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]">
          <div className="container-app py-14 md:py-20">
            <p className="mb-3 text-[var(--text-label)] font-[600] uppercase tracking-[0.08em] text-[var(--color-primary-deep)]">
              About HostelLo
            </p>
            <h1 className="max-w-[720px] font-heading text-[var(--text-h1)] font-[700] leading-tight text-[var(--color-text-heading)]">
              Finding a place to live should feel simple.
            </h1>
            <p className="mt-5 max-w-[620px] text-[var(--text-body)] leading-relaxed text-[var(--color-text-muted)]">
              HostelLo is a student accommodation marketplace for Pakistan. We
              help students discover suitable hostels and help owners connect
              with residents who are ready to find their next home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/hostels"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-action)] px-5 text-[var(--text-body-sm)] font-[600] text-white transition-colors hover:bg-[var(--color-action-dark)]"
              >
                Explore hostels
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link
                href="/list-your-hostel"
                className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)] transition-colors hover:bg-[var(--color-bg-overlay)]"
              >
                List your hostel
              </Link>
            </div>
          </div>
        </section>

        <section className="container-app py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <h2 className="font-heading text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]">
                A clearer way to choose your next hostel
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-body)] leading-relaxed text-[var(--color-text-body)]">
              <p>
                Moving to a new city for university is a major step. HostelLo
                gives students one place to compare accommodation details,
                understand their options, and begin a booking request online.
              </p>
              <p>
                Our goal is to make the process more transparent for everyone:
                students can search with useful information, while owners can
                present their properties to the people they are best equipped
                to serve.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]">
          <div className="container-app py-12 md:py-16">
            <h2 className="font-heading text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]">
              What matters to us
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {VALUES.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5"
                >
                  <Icon
                    size={24}
                    strokeWidth={1.6}
                    className="text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                  <h3 className="mt-5 text-[var(--text-body)] font-[700] text-[var(--color-text-heading)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-app py-12 text-center md:py-16">
          <h2 className="font-heading text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]">
            Ready to find your place?
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[var(--text-body)] text-[var(--color-text-muted)]">
            Browse verified hostels and start comparing options in your city.
          </p>
          <Link
            href="/hostels"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-action)] px-5 text-[var(--text-body-sm)] font-[600] text-white transition-colors hover:bg-[var(--color-action-dark)]"
          >
            Start exploring
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}
