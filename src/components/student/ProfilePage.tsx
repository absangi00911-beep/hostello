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
    <main className="student-page">
      <div className="student-page-shell">
        <header className="student-page-header">
          <h1>Profile</h1>
          <p>Your Hostello account at a glance.</p>
        </header>

        {isLoading ? (
          <section aria-busy="true" className="student-page-state" role="status">
            <p>Loading profile...</p>
          </section>
        ) : error ? (
          <section className="student-page-error" role="alert">
            <p>{error}</p>
            <button onClick={onRetry} type="button">
              Try again
            </button>
          </section>
        ) : profile ? (
          <>
            <section aria-label="Profile summary" className="student-profile-summary">
              {profile.avatar ? (
                <Image
                  alt=""
                  className="student-profile-avatar"
                  height={88}
                  src={profile.avatar}
                  unoptimized
                  width={88}
                />
              ) : (
                <span aria-hidden="true" className="student-profile-avatar-fallback">
                  {initials(profile.name)}
                </span>
              )}
              <div className="student-profile-identity">
                <h2>{profile.name}</h2>
                {profile.city && <p>{profile.city}</p>}
                <p>
                  Member since{" "}
                  {memberSinceFormatter.format(new Date(profile.createdAt))}
                </p>
              </div>
            </section>

            <section aria-label="Your activity" className="student-profile-stats">
              <article>
                <strong>{profile.counts.bookings}</strong>
                <span>Bookings</span>
              </article>
              <article>
                <strong>{profile.counts.favorites}</strong>
                <span>Saved hostels</span>
              </article>
              <article>
                <strong>{profile.counts.reviews}</strong>
                <span>Reviews</span>
              </article>
            </section>

            <section className="student-host-entry">
              <div>
                <h2>Have a place to share?</h2>
                <p>Welcome students by listing your hostel on Hostello.</p>
              </div>
              <Link href="/signup?role=OWNER">Become a host</Link>
            </section>
          </>
        ) : (
          <section className="student-page-error" role="alert">
            <p>Could not load your profile. Please try again.</p>
            <button onClick={onRetry} type="button">
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
