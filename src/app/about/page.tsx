import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata = {
  title: "About HostelLo",
  description:
    "HostelLo helps students in Pakistan find hostel listings and helps owners share their rooms with prospective residents.",
};

const VALUES = [
  {
    title: "Built for students",
    description:
      "Search by city, rent, gender, amenities, and nearby universities. Review listing details before contacting an owner.",
    icon: Users,
  },
  {
    title: "Clear listing details",
    description:
      "Listings marked as verified have been reviewed by our team. Check the photos, room details, and reviews, and ask the owner about anything unclear.",
    icon: ShieldCheck,
  },
  {
    title: "Contact hostel owners",
    description:
      "Students can contact hostel owners and submit booking requests through HostelLo.",
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
              Find student hostels in Pakistan.
            </h1>
            <p className="about-field-description mt-5 max-w-[620px] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
              HostelLo is a directory where students can find hostel
              listings by city, rent, location, and amenities. Hostel owners
              can add their rooms and contact details for students to review.
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
                  <p className="about-note-kicker">WHAT YOU CAN DO</p>
                  <p className="about-note-phrase">Find a room.<br />Contact owners.</p>
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
                Find a hostel
              </h2>
            </div>
            <div className="space-y-4 text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-body)]">
              <p>
                Moving for university means finding a place to stay. HostelLo
                lets students browse hostel listings, check prices and
                amenities, and send a booking request online.
              </p>
              <p>
                Owners can add room information, prices, photos, and contact
                details. Students can review those details and contact the
                hostel directly through the site.
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
            Looking for a hostel?
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">
            Browse hostel listings and review the details in your city.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/hostels">
              Browse hostels
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>
    </PublicLayout>
  );
}
