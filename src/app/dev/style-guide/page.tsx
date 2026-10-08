// Path: src/app/dev/style-guide/page.tsx
/**
 * Internal token sanity-check page — available in development only.
 * It is not linked from any nav and returns a 404 in production. Renders every re-valued token from
 * globals.css so the new direction is checkable in one glance before we
 * touch a single real page.
 *
 * Uses inline style={{ fontSize: 'var(--text-x)' }} for sizes outside the
 * plain h1–h6 tags, since this codebase doesn't expose text-h5/text-body-lg
 * etc. as class names (only as CSS custom properties) — matching the same
 * text-[length:var(--text-x)] arbitrary-value pattern used in owner/admin shells.
 */

import { Heart, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/shared";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted font-normal" style={{ fontSize: "var(--text-h5)" }}>
      {children}
    </h2>
  );
}

function Swatch({ label, varName, textOn }: { label: string; varName: string; textOn?: "light" | "dark" }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-default flex items-end p-2"
        style={{ backgroundColor: `var(${varName})` }}
      >
        <span
          className={`font-mono ${textOn === "dark" ? "text-white" : "text-[#222]"}`}
          style={{ fontSize: "11px", opacity: 0.7 }}
        >
          {varName}
        </span>
      </div>
      <p className="text-muted" style={{ fontSize: "var(--text-body-sm)" }}>{label}</p>
    </div>
  );
}

function RadiusBox({ label, varName }: { label: string; varName: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-20 w-20 bg-primary" style={{ borderRadius: `var(${varName})` }} />
      <p className="text-muted font-mono" style={{ fontSize: "var(--text-body-sm)" }}>{varName}</p>
      <p className="text-placeholder" style={{ fontSize: "var(--text-caption)" }}>{label}</p>
    </div>
  );
}

function ShadowBox({ label, varName }: { label: string; varName: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-20 w-20 rounded-lg bg-card" style={{ boxShadow: `var(${varName})` }} />
      <p className="text-muted font-mono" style={{ fontSize: "var(--text-body-sm)" }}>{varName}</p>
      <p className="text-placeholder" style={{ fontSize: "var(--text-caption)" }}>{label}</p>
    </div>
  );
}

export default function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="container-app py-12 space-y-16">
        <div>
          <p className="text-overline text-primary mb-2">Day 1–2 — Tokens &amp; primitives</p>
          <h1>HostelLo Style Guide</h1>
          <p className="text-muted max-w-2xl mt-2" style={{ fontSize: "var(--text-body-lg)" }}>
            Every re-valued token from <code className="font-mono">globals.css</code>, plus the actual
            Button/Card/Input/Badge/Avatar primitives imported and rendered live — not screenshots,
            not descriptions. If it looks right here, it&apos;s wired correctly.
          </p>
        </div>

        <section className="space-y-4">
          <SectionHeading>Typography — Plus Jakarta Sans + Inter</SectionHeading>
          <div className="space-y-3 border border-subtle rounded-lg p-6 bg-card">
            <p
              aria-hidden="true"
              className="font-heading text-[color:var(--color-text-heading)]"
              style={{ fontSize: "var(--text-h1)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Find your next place, sorted.
            </p>
            <h2>Hostels and PGs near your university</h2>
            <h3>Verified listings, real reviews</h3>
            <h4>Compare up to three at once</h4>
            <p style={{ fontSize: "var(--text-body-lg)" }}>
              Body-lg (18px, Inter) — hero subheads and lead paragraphs.
            </p>
            <p style={{ fontSize: "var(--text-body)" }}>
              Body (16px, Inter) — the default paragraph size across the app, 1.5 line-height for long-form reading.
            </p>
            <p className="text-muted" style={{ fontSize: "var(--text-body-sm)" }}>
              Body-sm (14px, Inter) — metadata rows, captions, helper text under form fields.
            </p>
            <p className="text-overline text-primary">Overline label example</p>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Primary accent — used sparingly</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Swatch label="primary" varName="--color-primary" textOn="dark" />
            <Swatch label="primary-dark (hover)" varName="--color-primary-dark" textOn="dark" />
            <Swatch label="primary-deep (text)" varName="--color-primary-deep" textOn="dark" />
            <Swatch label="primary-light" varName="--color-primary-light" />
            <Swatch label="primary-faint" varName="--color-primary-faint" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Neutral surfaces</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Swatch label="bg-page" varName="--color-bg-page" />
            <Swatch label="bg-card" varName="--color-bg-card" />
            <Swatch label="bg-sidebar" varName="--color-bg-sidebar" />
            <Swatch label="bg-raised" varName="--color-bg-raised" />
            <Swatch label="bg-overlay" varName="--color-bg-overlay" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Swatch label="border-default" varName="--color-border-default" />
            <Swatch label="border-strong" varName="--color-border-strong" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Semantic (unchanged today)</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Swatch label="error" varName="--color-error" textOn="dark" />
            <Swatch label="success" varName="--color-success" textOn="dark" />
            <Swatch label="warning" varName="--color-warning" textOn="dark" />
            <Swatch label="info" varName="--color-info" textOn="dark" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Radius — tightened for Airbnb&apos;s restraint</SectionHeading>
          <div className="flex flex-wrap gap-8">
            <RadiusBox label="chips, small badges" varName="--radius-sm" />
            <RadiusBox label="buttons, inputs" varName="--radius-md" />
            <RadiusBox label="cards (was radius-brand)" varName="--radius-lg" />
            <RadiusBox label="larger containers" varName="--radius-xl" />
            <RadiusBox label="hero moments — was 24px" varName="--radius-brand" />
            <RadiusBox label="pills, avatars" varName="--radius-full" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Shadows — quiet elevation</SectionHeading>
          <div className="flex flex-wrap gap-8 bg-sidebar p-8 rounded-lg">
            <ShadowBox label="resting card border" varName="--shadow-xs" />
            <ShadowBox label="subtle lift" varName="--shadow-sm" />
            <ShadowBox label="hover state" varName="--shadow-md" />
            <ShadowBox label="open dropdown/sheet" varName="--shadow-lg" />
            <ShadowBox label="modal/dialog" varName="--shadow-xl" />
          </div>
        </section>

        {/* Day 2 — primitives, actually imported instead of configured-but-unused */}
        <section className="space-y-6 border-t border-subtle pt-12">
          <div>
            <p className="text-overline text-primary mb-2">Day 2 — Primitives</p>
            <SectionHeading>Button</SectionHeading>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Reserve</Button>
            <Button variant="secondary">Save</Button>
            <Button variant="outline">Contact owner</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Delete listing</Button>
            <Button variant="link">View all photos</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Search"><Search /></Button>
            <Button shape="pill"><Search /> Anywhere · Any week</Button>
            <Button loading>Booking…</Button>
          </div>

          <SectionHeading>Card</SectionHeading>
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Al-Noor Boys Hostel</CardTitle>
              <CardDescription>Gulberg, Lahore · 0.4km from FC College</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: "var(--text-body-sm)" }}>
                No shadow by default, 1px border, radius-lg — a card among many cards, not a floating panel.
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="font-[600]">PKR 18,000<span className="text-muted" style={{ fontSize: "var(--text-body-sm)" }}> /mo</span></span>
              <Button size="sm">View</Button>
            </CardFooter>
          </Card>

          <SectionHeading>Input + Label</SectionHeading>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="sg-city">Move-in city</Label>
            <Input id="sg-city" placeholder="e.g. Lahore" />
          </div>

          <SectionHeading>Badge (tags) vs. StatusBadge (fixed status)</SectionHeading>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>New this week</Badge>
            <Badge variant="primary"><Heart size={11} /> Guest favorite</Badge>
            <Badge variant="outline">WiFi</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge variant="confirmed" />
            <StatusBadge variant="pending_review" />
            <StatusBadge variant="verified" />
            <span className="text-muted" style={{ fontSize: "var(--text-body-sm)" }}>same three, tone=&quot;dot&quot; for tool tables:</span>
            <StatusBadge variant="confirmed" tone="dot" />
            <StatusBadge variant="pending_review" tone="dot" />
          </div>

          <SectionHeading>Avatar</SectionHeading>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/images/placeholder-avatar.svg" alt="" />
              <AvatarFallback>SK</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback>AN</AvatarFallback>
            </Avatar>
            <Avatar className="h-14 w-14">
              <AvatarFallback>HL</AvatarFallback>
            </Avatar>
          </div>
        </section>

        <p className="text-placeholder border-t border-subtle pt-6" style={{ fontSize: "var(--text-caption)" }}>
          Development reference for the redesign tokens and primitives. This route is hidden in production
          and doesn&apos;t touch business logic.
        </p>
      </div>
    </div>
  );
}
