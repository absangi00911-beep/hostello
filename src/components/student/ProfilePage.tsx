"use client";

import {
  ChevronRight,
  type HostelloIcon,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Clock,
  MapPin,
  Message,
} from "@/components/icons/HostelloIcons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const VERIFICATION_STATUSES = [
  "NONE",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

interface StudentProfile {
  name: string;
  avatar: string | null;
  city: string | null;
  bio?: string;
  verificationStatus?: VerificationStatus;
  createdAt: string;
  counts: {
    bookings: number;
    favorites: number;
    reviews: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseProfile(value: unknown): StudentProfile | null {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    typeof value.data.name !== "string" ||
    (typeof value.data.avatar !== "string" && value.data.avatar !== null) ||
    (typeof value.data.city !== "string" && value.data.city !== null) ||
    typeof value.data.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.data.createdAt)) ||
    !isRecord(value.data._count)
  ) {
    return null;
  }

  const { bookings, favorites, reviews } = value.data._count;
  if (
    typeof bookings !== "number" ||
    !Number.isInteger(bookings) ||
    bookings < 0 ||
    typeof favorites !== "number" ||
    !Number.isInteger(favorites) ||
    favorites < 0 ||
    typeof reviews !== "number" ||
    !Number.isInteger(reviews) ||
    reviews < 0
  ) {
    return null;
  }

  const bio =
    typeof value.data.bio === "string" && value.data.bio.trim()
      ? value.data.bio.trim()
      : undefined;
  const rawStatus = value.data.verificationStatus;
  const verificationStatus = VERIFICATION_STATUSES.find(
    (status) => status === rawStatus,
  );

  return {
    name: value.data.name,
    avatar: value.data.avatar,
    city: value.data.city,
    bio,
    verificationStatus,
    createdAt: value.data.createdAt,
    counts: { bookings, favorites, reviews },
  };
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : null;
}

async function loadProfile(signal: AbortSignal): Promise<StudentProfile> {
  const response = await fetch("/api/profile", { signal });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readApiError(payload) ?? "Could not load your profile.");
  }

  const profile = parseProfile(payload);
  if (!profile) {
    throw new Error("The profile response was invalid. Please try again.");
  }

  return profile;
}

const memberSinceFormatter = new Intl.DateTimeFormat("en-PK", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "H"
  );
}

const verificationCopy: Record<
  VerificationStatus,
  { title: string; body: string; action: string; icon: HostelloIcon; tone: string }
> = {
  NONE: {
    title: "Student verification",
    body: "Verify your student status to earn a verified badge.",
    action: "Verify",
    icon: ShieldCheck,
    tone: "bg-brand-soft text-brand-dark",
  },
  PENDING: {
    title: "Verification in review",
    body: "We're checking your documents. This usually doesn't take long.",
    action: "View status",
    icon: Clock,
    tone: "bg-warn-soft text-warn-ink",
  },
  APPROVED: {
    title: "You're a verified student",
    body: "Your verified badge is showing on your profile.",
    action: "View details",
    icon: ShieldCheck,
    tone: "bg-brand-soft text-brand-dark",
  },
  REJECTED: {
    title: "Verification needs another look",
    body: "We couldn't verify your last submission. You can send it again.",
    action: "Resubmit",
    icon: ShieldAlert,
    tone: "bg-warn-soft text-warn-ink",
  },
};

const shortcuts: { label: string; hint: string; href: string; icon: HostelloIcon }[] =
  [
    {
      label: "Messages",
      hint: "Chat with hosts",
      href: "/messages",
      icon: Message,
    },
    {
      label: "Availability alerts",
      hint: "Get told when a room opens up",
      href: "/student/availability-alerts",
      icon: Bell,
    },
    {
      label: "Notifications",
      hint: "Updates on your bookings",
      href: "/notifications",
      icon: Bell,
    },
  ];

const cardStatus: Record<VerificationStatus, string> = {
  NONE: "Not verified",
  PENDING: "In review",
  APPROVED: "Verified",
  REJECTED: "Not verified",
};

const HERO_SHELL =
  "overflow-hidden rounded-xl border border-line bg-surface lg:grid lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]";

function StudentCard({ profile }: { profile: StudentProfile }) {
  const status = profile.verificationStatus ?? "NONE";

  return (
    <section
      aria-label="Profile summary"
      className="relative flex min-h-[236px] w-full max-w-[420px] flex-col justify-between gap-5 overflow-hidden rounded-xl bg-ink p-5 pt-8 text-white md:p-6 md:pt-9"
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-3 h-1.5 w-14 -translate-x-1/2 rounded-full bg-surface-muted"
      />
      <div className="flex items-center justify-between text-label">
        <span className="font-semibold tracking-[-0.01em]">Hostello</span>
        <span className="text-white/60">Student</span>
      </div>

      <div className="flex items-center gap-4">
        {profile.avatar ? (
          <Image
            alt=""
            className="h-[88px] w-[72px] flex-none rounded-lg object-cover ring-1 ring-white/10 sm:h-[104px] sm:w-[88px]"
            height={104}
            src={profile.avatar}
            unoptimized
            width={88}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-[88px] w-[72px] flex-none place-items-center rounded-lg bg-white text-headline font-bold text-ink sm:h-[104px] sm:w-[88px] sm:text-display"
          >
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="line-clamp-2 break-words text-headline font-semibold leading-[1.15] tracking-[-0.02em]">
            {profile.name}
          </h2>
          {profile.city ? (
            <p className="mt-1 flex items-center gap-1.5 text-body text-white/70">
              <MapPin aria-hidden="true" className="flex-none" size={15} />
              {profile.city}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-3.5">
        <div>
          <p className="text-meta text-white/50">Member since</p>
          <p className="text-body font-medium">
            {memberSinceFormatter.format(new Date(profile.createdAt))}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-label font-medium text-white/85">
            {cardStatus[status]}
          </span>
          {status === "APPROVED" ? (
            <span
              aria-label="Verified student"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink"
              role="img"
            >
              <ShieldCheck aria-hidden="true" size={20} strokeWidth={2} />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-white/40 text-white/60"
            >
              {status === "PENDING" ? <Clock size={18} /> : null}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function LedgerRow({
  count,
  hint,
  href,
  label,
}: {
  count: number;
  hint?: string;
  href?: string;
  label: string;
}) {
  const content = (
    <>
      <strong className="text-display font-semibold leading-none tracking-[-0.04em] tabular-nums text-ink md:text-display">
        {count}
      </strong>
      <span className="min-w-0">
        <span className="block text-body font-semibold text-ink">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-label text-muted">{hint}</span>
        ) : null}
      </span>
      {href ? (
        <ChevronRight
          aria-hidden="true"
          className="flex-none text-muted motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
          size={18}
        />
      ) : (
        <span />
      )}
    </>
  );
  const layout =
    "grid grid-cols-[minmax(3.5rem,auto)_minmax(0,1fr)_auto] items-center gap-x-4 py-5";

  return (
    <li>
      {href ? (
        <Link
          className={`group -mx-3 rounded-xl px-3 ${layout} hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
          href={href}
        >
          {content}
        </Link>
      ) : (
        <div className={`-mx-3 px-3 ${layout}`}>{content}</div>
      )}
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <section aria-busy="true" role="status">
      <p className="sr-only">Loading profile...</p>
      <div
        aria-hidden="true"
        className={`${HERO_SHELL} motion-safe:animate-pulse`}
      >
        <div className="bg-surface-muted p-6 md:p-8">
          <div className="h-[236px] max-w-[420px] rounded-xl bg-line" />
        </div>
        <div className="grid content-start gap-4 p-6 md:p-8">
          {[0, 1, 2].map((key) => (
            <div className="h-16 rounded-xl bg-surface-muted" key={key} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileDetails({ profile }: { profile: StudentProfile }) {
  const verification = verificationCopy[profile.verificationStatus ?? "NONE"];
  const VerificationIcon = verification.icon;
  const { bookings, favorites, reviews } = profile.counts;

  return (
    <>
      <div className={HERO_SHELL}>
        <div className="grid content-start gap-6 bg-surface-muted p-6 md:p-8">
          <StudentCard profile={profile} />
          {profile.bio ? (
            <p className="m-0 max-w-[420px] text-body leading-[1.55] text-ink">
              {profile.bio}
            </p>
          ) : null}
          <section
            aria-label="Student verification"
            className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 flex-none place-items-center rounded-full ${verification.tone}`}
              >
                <VerificationIcon size={20} strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 text-body font-semibold text-ink">
                  {verification.title}
                </h2>
                <p className="mt-0.5 m-0 text-body text-muted">
                  {verification.body}
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 flex-none items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 font-semibold text-ink btn-secondary"
              href="/profile/verification"
            >
              {verification.action}
            </Link>
          </section>
        </div>

        <div className="p-6 md:p-8">
          <section aria-label="Your activity">
            <ul className="m-0 list-none divide-y divide-line p-0">
              <LedgerRow
                count={bookings}
                hint={bookings ? "See your trips" : "Find your first hostel"}
                href={bookings ? "/trips" : "/search"}
                label="Bookings"
              />
              <LedgerRow
                count={favorites}
                hint={
                  favorites ? "See your wishlists" : "Save hostels as you browse"
                }
                href={favorites ? "/wishlists" : "/search"}
                label="Saved hostels"
              />
              <LedgerRow count={reviews} label="Reviews" />
            </ul>
          </section>

          <nav
            aria-label="Account shortcuts"
            className="mt-2 border-t border-line pt-3"
          >
            <ul className="-mx-3 grid list-none p-0">
              {shortcuts.map(({ label, hint, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    className="flex min-h-14 items-center gap-4 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-surface-muted"
                    href={href}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 flex-none place-items-center rounded-full bg-surface-muted text-ink"
                    >
                      <Icon size={19} strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">
                        {label}
                      </span>
                      <span className="block text-label text-muted">
                        {hint}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="flex-none text-muted"
                      size={18}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

    </>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="rounded-xl border border-danger bg-surface p-7 text-danger"
      role="alert"
    >
      <p className="m-0 text-body">{message}</p>
      <button
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current btn-secondary"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}

export function ProfilePageContent({
  error,
  isLoading,
  onRetry,
  profile,
}: {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  profile: StudentProfile | null;
}) {
  return (
    <main
      id="main-content"
      className="min-h-dvh bg-canvas pt-8 pb-28 md:py-14"
    >
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),640px)] md:w-[min(1040px,calc(100%-var(--page-gutter-total)))]">
        <header className="mb-6 md:mb-8">
          <h1 className="m-0 text-display font-semibold tracking-[-0.035em] text-ink">
            Profile
          </h1>
          <p className="mt-2 m-0 text-body text-muted">
            Your Hostello account at a glance.
          </p>
        </header>

        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={onRetry} />
        ) : profile ? (
          <ProfileDetails profile={profile} />
        ) : (
          <ErrorPanel
            message="Could not load your profile. Please try again."
            onRetry={onRetry}
          />
        )}
      </div>
    </main>
  );
}

export function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void loadProfile(controller.signal)
      .then(setProfile)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load your profile. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  return (
    <ProfilePageContent
      error={error}
      isLoading={isLoading}
      onRetry={() => setRetryCount((count) => count + 1)}
      profile={profile}
    />
  );
}
