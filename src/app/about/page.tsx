import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="about-field-page">
        <section className="about-field-hero border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]">
          <div className="about-field-hero-grid container-app py-12 md:py-16">
            <div className="about-field-copy">
            <p className="about-field-kicker">
              About HostelLo
            </p>
            <h1 className="about-field-title max-w-[720px] text-[color:var(--color-text-heading)]">
              Finding a place to live should feel simple.
            </h1>
            <p className="about-field-description mt-5 max-w-[620px] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
              HostelLo is a student accommodation marketplace for Pakistan. We
              help students discover suitable hostels and help owners connect
              with residents who are ready to find their next home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/hostels">
                  Explore hostels
                  <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/list-your-hostel">List your hostel</Link>
              </Button>
            </div>
            </div>

            <aside className="about-field-note" aria-label="HostelLo's guiding idea">
              <div className="about-note-sun" aria-hidden="true"><span>01</span></div>
              <div className="about-note-content">
                <p className="about-note-kicker">OUR POINT OF VIEW</p>
                <p className="about-note-phrase">Make room<br />for what&apos;s next.</p>
                <div className="about-note-colophon">
                  <span>STUDENTS · OWNERS · PAKISTAN</span>
                  <span>HOSTELLO / PAKISTAN</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="about-purpose-section container-app py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <h2 className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]">
                A clearer way to choose your next hostel
              </h2>
            </div>
            <div className="space-y-4 text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-body)]">
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

        <section className="about-values-section border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]">
          <div className="container-app py-12 md:py-16">
            <h2 className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]">
              What matters to us
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {VALUES.map(({ title, description, icon: Icon }, index) => (
                <Card key={title} className="about-value-card border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
                  <CardContent className="p-0">
                    <p className="about-value-index">{String(index + 1).padStart(2, "0")} / PRINCIPLE</p>
                    <Icon
                      size={24}
                      strokeWidth={1.6}
                      className="text-[color:var(--color-primary)]"
                      aria-hidden="true"
                    />
                    <h3 className="mt-5 text-[length:var(--text-body)] font-[700] text-[color:var(--color-text-heading)]">
                      {title}
                    </h3>
                    <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="about-final-cta container-app py-12 text-center md:py-16">
          <h2 className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]">
            Ready to find your place?
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">
            Browse verified hostels and start comparing options in your city.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/hostels">
              Start exploring
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>
    </PublicLayout>
  );
}
