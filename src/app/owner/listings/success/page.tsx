// Path: src/app/owner/listings/success/page.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { PartyPopper, CalendarClock, MessageCircleMore, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Listing submitted" };

const NEXT_STEPS = [
  {
    icon: CalendarClock,
    title: "Manage your availability",
    body: "Block out dates when rooms aren't free so students only ever see accurate openings.",
    href: "/owner/listings",
  },
  {
    icon: MessageCircleMore,
    title: "Watch for booking requests",
    body: "Reply quickly once you're approved — students tend to book whoever answers first.",
    href: "/owner/messages",
  },
  {
    icon: Zap,
    title: "Go Pro for more visibility",
    body: "Unlimited listings and featured placement in search, for PKR 3,000/month.",
    href: "/owner/subscription",
  },
] as const;

export default async function ListingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; name?: string }>;
}) {
  const { slug, name } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl py-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
        <PartyPopper
          size={36}
          strokeWidth={1.5}
          className="text-[var(--color-primary)]"
          aria-hidden="true"
        />
      </div>

      <h1 className="mt-6 font-heading text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)]">
        {name ? `${name} has been submitted!` : "Your listing has been submitted!"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--text-body)] text-[var(--color-text-muted)]">
        Our team reviews every listing before it goes live. You'll get an email as soon as it's approved and visible to students searching HostelLo.
      </p>

      <div className="mt-10 text-left">
        <h2 className="text-[var(--text-label)] font-[700] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
          While you wait
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map(({ icon: Icon, title, body, href }) => (
            <Link
              key={title}
              href={href}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 text-left transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)]">
                <Icon
                  size={17}
                  strokeWidth={1.5}
                  className="text-[var(--color-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                {title}
              </p>
              <p className="mt-1 text-[var(--text-caption)] leading-relaxed text-[var(--color-text-muted)]">
                {body}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/owner">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={slug ? `/hostels/${slug}` : "/owner/listings"}>
            {slug ? "Preview my listing" : "View my listings"}
          </Link>
        </Button>
      </div>
      {slug && (
        <p className="mt-3 text-[var(--text-caption)] text-[var(--color-text-muted)]">
          The preview link works now, but students won't see it in search until it's approved.
        </p>
      )}
    </div>
  );
}
