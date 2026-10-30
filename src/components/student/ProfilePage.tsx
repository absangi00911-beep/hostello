"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface StudentProfile {
  name: string;
  avatar: string | null;
  city: string | null;
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

  return {
    name: value.data.name,
    avatar: value.data.avatar,
    city: value.data.city,
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
    <main className="min-h-screen bg-canvas py-12 md:py-16">
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),600px)] md:w-[min(1920px,calc(100%-var(--page-gutter-total)))]">
        <header className="mb-7 md:mb-8">
          <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
            Profile
          </h1>
          <p className="mt-2 m-0 text-[0.95rem] text-muted">
            Your Hostello account at a glance.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-busy="true"
            className="py-8 text-sm text-muted"
            role="status"
          >
            <p className="m-0">Loading profile...</p>
          </section>
        ) : error ? (
          <section
            className="rounded-[14px] border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">{error}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : profile ? (
          <>
            <section
              aria-label="Profile summary"
              className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-6 md:gap-6 md:p-7"
            >
              {profile.avatar ? (
                <Image
                  alt=""
                  className="h-[88px] w-[88px] flex-none overflow-hidden rounded-full object-cover"
                  height={88}
                  src={profile.avatar}
                  unoptimized
                  width={88}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-[88px] w-[88px] flex-none place-items-center overflow-hidden rounded-full bg-brand-soft text-[1.5rem] font-bold text-brand-dark"
                >
                  {initials(profile.name)}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="m-0 text-[1.3rem] font-semibold leading-[1.3] text-ink">
                  {profile.name}
                </h2>
                {profile.city && (
                  <p className="mt-1 mb-0 text-[0.95rem] text-muted">
                    {profile.city}
                  </p>
                )}
                <p className="mt-1 m-0 text-[0.95rem] text-muted">
                  Member since {memberSinceFormatter.format(new Date(profile.createdAt))}
                </p>
              </div>
            </section>

            <section
              aria-label="Your activity"
              className="mt-5 grid grid-cols-3 gap-3 md:gap-3"
            >
              <article className="grid gap-1 rounded-xl border border-line bg-surface p-4 md:p-5">
                <strong className="font-[var(--font-inter),sans-serif] text-[1.35rem] font-semibold text-ink">
                  {profile.counts.bookings}
                </strong>
                <span className="text-[0.88rem] text-muted">Bookings</span>
              </article>
              <article className="grid gap-1 rounded-xl border border-line bg-surface p-4 md:p-5">
                <strong className="font-[var(--font-inter),sans-serif] text-[1.35rem] font-semibold text-ink">
                  {profile.counts.favorites}
                </strong>
                <span className="text-[0.88rem] text-muted">Saved hostels</span>
              </article>
              <article className="grid gap-1 rounded-xl border border-line bg-surface p-4 md:p-5">
                <strong className="font-[var(--font-inter),sans-serif] text-[1.35rem] font-semibold text-ink">
                  {profile.counts.reviews}
                </strong>
                <span className="text-[0.88rem] text-muted">Reviews</span>
              </article>
            </section>

            <section className="mt-7 flex items-center justify-between gap-6 rounded-[14px] border border-line bg-surface p-6">
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
          </>
        ) : (
          <section
            className="rounded-[14px] border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">
              Could not load your profile. Please try again.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
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
