"use client";

import {
  Bell,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock,
  Heart,
  type LucideIcon,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
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

const cardClass =
  "rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgb(15_23_42_/_4%)]";

const verificationCopy: Record<
  VerificationStatus,
  { title: string; body: string; action: string; icon: LucideIcon; tone: string }
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

const shortcuts: { label: string; hint: string; href: string; icon: LucideIcon }[] =
  [
    {
      label: "Messages",
      hint: "Chat with hosts",
      href: "/messages",
      icon: MessageCircle,
    },
    {
      label: "Availability alerts",
      hint: "Get told when a room opens up",
      href: "/student/availability-alerts",
      icon: BellRing,
    },
    {
      label: "Notifications",
      hint: "Updates on your bookings",
      href: "/notifications",
      icon: Bell,
    },
  ];

function StatTile({
  count,
  href,
  icon: Icon,
  label,
}: {
  count: number;
  href?: string;
  icon: LucideIcon;
  label: string;
}) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-dark"
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <strong className="mt-3 block font-[var(--font-inter),sans-serif] text-[1.6rem] font-semibold leading-none tracking-[-0.02em] text-ink">
        {count}
      </strong>
      <span className="mt-1 block text-[0.88rem] text-muted">{label}</span>
    </>
  );
  const className = `${cardClass} block p-4 md:p-5`;

  return href ? (
    <Link
      className={`${className} transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-[0_4px_14px_rgb(15_23_42_/_8%)]`}
      href={href}
    >
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

function ProfileSkeleton() {
  return (
    <section
      aria-busy="true"
      className="grid gap-6 lg:grid-cols-[360px_1fr]"
      role="status"
    >
      <p className="sr-only">Loading profile...</p>
      <div
        aria-hidden="true"
        className={`${cardClass} h-[360px] motion-safe:animate-pulse`}
      />
      <div aria-hidden="true" className="grid content-start gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((key) => (
            <div
              className={`${cardClass} h-[116px] motion-safe:animate-pulse`}
              key={key}
            />
          ))}
        </div>
        <div className={`${cardClass} h-40 motion-safe:animate-pulse`} />
        <div className={`${cardClass} h-24 motion-safe:animate-pulse`} />
      </div>
    </section>
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
      className="rounded-[14px] border border-danger bg-surface p-7 text-danger"
      role="alert"
    >
      <p className="m-0 text-[0.95rem]">{message}</p>
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
  const verification = verificationCopy[profile?.verificationStatus ?? "NONE"];
  const VerificationIcon = verification.icon;

  return (
    <main
      id="main-content"
      className="min-h-dvh bg-canvas pt-8 pb-28 md:py-14"
    >
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),640px)] md:w-[min(1040px,calc(100%-var(--page-gutter-total)))]">
        <header className="mb-6 md:mb-8">
          <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
            Profile
          </h1>
          <p className="mt-2 m-0 text-[0.95rem] text-muted">
            Your Hostello account at a glance.
          </p>
        </header>

        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={onRetry} />
        ) : profile ? (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-start lg:gap-6">
            <section
              aria-label="Profile summary"
              className={`${cardClass} overflow-hidden lg:sticky lg:top-24`}
            >
              <div
                aria-hidden="true"
                className="h-28 bg-[linear-gradient(135deg,var(--brand-dark)_0%,var(--brand)_60%,#60a5fa_100%)]"
              />
              <div className="px-6 pb-6">
                {profile.avatar ? (
                  <Image
                    alt=""
                    className="-mt-12 h-24 w-24 overflow-hidden rounded-full object-cover ring-4 ring-surface"
                    height={96}
                    src={profile.avatar}
                    unoptimized
                    width={96}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="-mt-12 grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-brand-soft text-[1.9rem] font-bold text-brand-dark ring-4 ring-surface"
                  >
                    {initials(profile.name)}
                  </span>
                )}

                <h2 className="mt-4 mb-0 text-[1.4rem] font-semibold leading-[1.25] tracking-[-0.02em] text-ink">
                  {profile.name}
                </h2>

                {profile.verificationStatus === "APPROVED" && (
                  <p className="mt-2 mb-0 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[0.8rem] font-semibold text-brand-dark">
                    <ShieldCheck aria-hidden="true" size={14} strokeWidth={2.2} />
                    Verified student
                  </p>
                )}

                {profile.bio && (
                  <p className="mt-3 mb-0 text-[0.95rem] leading-[1.55] text-ink">
                    {profile.bio}
                  </p>
                )}

                <ul className="m-0 mt-4 grid list-none gap-2 border-t border-line p-0 pt-4 text-[0.92rem] text-muted">
                  {profile.city && (
                    <li className="flex items-center gap-2">
                      <MapPin aria-hidden="true" size={16} />
                      {profile.city}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <CalendarDays aria-hidden="true" size={16} />
                    Member since{" "}
                    {memberSinceFormatter.format(new Date(profile.createdAt))}
                  </li>
                </ul>
              </div>
            </section>

            <div className="grid gap-5">
              <section
                aria-label="Your activity"
                className="grid grid-cols-3 gap-3"
              >
                <StatTile
                  count={profile.counts.bookings}
                  href="/trips"
                  icon={CalendarDays}
                  label="Bookings"
                />
                <StatTile
                  count={profile.counts.favorites}
                  href="/wishlists"
                  icon={Heart}
                  label="Saved hostels"
                />
                <StatTile
                  count={profile.counts.reviews}
                  icon={Star}
                  label="Reviews"
                />
              </section>

              <section
                aria-label="Student verification"
                className={`${cardClass} flex items-center justify-between gap-4 p-5 md:p-6`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={`grid h-11 w-11 flex-none place-items-center rounded-full ${verification.tone}`}
                  >
                    <VerificationIcon size={22} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="m-0 text-[1.05rem] font-semibold text-ink">
                      {verification.title}
                    </h2>
                    <p className="mt-1 m-0 text-[0.92rem] text-muted">
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

              <nav aria-label="Account shortcuts" className={`${cardClass} p-2`}>
                <ul className="m-0 grid list-none p-0">
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
                          <span className="block text-[0.86rem] text-muted">
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

              <section className="flex flex-col items-start justify-between gap-4 rounded-[14px] border border-brand-soft bg-[linear-gradient(135deg,var(--brand-soft),var(--surface)_70%)] p-6 sm:flex-row sm:items-center sm:gap-6">
                <div>
                  <h2 className="m-0 text-[1.15rem] font-semibold text-ink">
                    Have a place to share?
                  </h2>
                  <p className="mt-1 m-0 text-[0.95rem] text-muted">
                    Welcome students by listing your hostel on Hostello.
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-brand px-4 py-2.5 font-semibold text-white"
                  href="/signup?role=OWNER"
                >
                  Become a host
                </Link>
              </section>
            </div>
          </div>
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
