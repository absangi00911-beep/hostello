import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  parseProfile,
  ProfilePage,
  ProfilePageContent,
} from "./ProfilePage";

describe("ProfilePage", () => {
  it("renders an accessible initial loading state", () => {
    const markup = renderToStaticMarkup(<ProfilePage />);

    expect(markup).toContain("Loading profile...");
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
  });

  it("renders student summary counts and the existing host signup destination", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: "Lahore",
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 2, favorites: 5, reviews: 1 },
        }}
        isLoading={false}
      />,
    );

    expect(markup).toContain("Alex Student");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("Member since");
    expect(markup).toContain("Bookings");
    expect(markup).toContain("Saved hostels");
    expect(markup).toContain("Reviews");
    expect(markup).toContain('href="/signup?role=OWNER"');
    expect(markup).toContain("Become a host");
    expect(markup).not.toContain("student@example.com");
    expect(markup).not.toContain("03001234567");
  });

  it("stacks the host promotion content on narrow screens", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: "Lahore",
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 2, favorites: 5, reviews: 1 },
        }}
        isLoading={false}
      />,
    );

    expect(markup).toContain(
      "flex flex-col items-start justify-between gap-4 rounded-[14px]",
    );
    expect(markup).toContain("sm:flex-row sm:items-center sm:gap-6");
  });

  it("shows a profile retry action after an API error", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error="Profile service unavailable."
        onRetry={() => {}}
        profile={null}
        isLoading={false}
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Profile service unavailable.");
    expect(markup).toContain("border-danger");
    expect(markup).toContain("text-danger");
    expect(markup).not.toContain("#e7c9c4");
    expect(markup).not.toContain("#8c2822");
    expect(markup).toContain("Try again");
  });

  it("uses the semantic danger pattern for the missing-profile fallback", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        onRetry={() => {}}
        profile={null}
        isLoading={false}
      />,
    );

    expect(markup).toContain("Could not load your profile. Please try again.");
    expect(markup).toContain("border-danger");
    expect(markup).toContain("text-danger");
    expect(markup).not.toContain("#e7c9c4");
    expect(markup).not.toContain("#8c2822");
  });

  it("shows the verified badge and bio when the profile has them", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: "Lahore",
          bio: "Final-year CS student.",
          verificationStatus: "APPROVED",
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 2, favorites: 5, reviews: 1 },
        }}
        isLoading={false}
      />,
    );

    expect(markup).toContain("Verified student");
    expect(markup).toContain("Final-year CS student.");
    expect(markup).toContain("You&#x27;re a verified student");
  });

  it("offers to resubmit when verification was rejected", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: null,
          verificationStatus: "REJECTED",
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 0, favorites: 0, reviews: 0 },
        }}
        isLoading={false}
      />,
    );

    expect(markup).toContain("Resubmit");
    expect(markup).toContain('href="/profile/verification"');
    expect(markup).not.toContain("Verified student");
  });

  it("parses optional bio and verification status", () => {
    const parsed = parseProfile({
      data: {
        name: "Alex Student",
        avatar: null,
        city: null,
        bio: "  Hello  ",
        verificationStatus: "PENDING",
        createdAt: "2024-06-10T00:00:00.000Z",
        _count: { bookings: 0, favorites: 0, reviews: 0 },
      },
    });

    expect(parsed?.bio).toBe("Hello");
    expect(parsed?.verificationStatus).toBe("PENDING");
  });

  it("points empty activity rows at hostel search", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        isLoading={false}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: null,
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 0, favorites: 0, reviews: 0 },
        }}
      />,
    );

    expect(markup).toContain('href="/search"');
    expect(markup).toContain("Find your first hostel");
    expect(markup).not.toContain('href="/trips"');
    expect(markup).not.toContain('href="/wishlists"');
  });

  it("links filled activity rows through and keeps the account shortcuts", () => {
    const markup = renderToStaticMarkup(
      <ProfilePageContent
        error={null}
        isLoading={false}
        onRetry={() => {}}
        profile={{
          name: "Alex Student",
          avatar: null,
          city: "Lahore",
          createdAt: "2024-06-10T00:00:00.000Z",
          counts: { bookings: 2, favorites: 5, reviews: 1 },
        }}
      />,
    );

    expect(markup).toContain('href="/trips"');
    expect(markup).toContain('href="/wishlists"');
    expect(markup).toContain('aria-label="Account shortcuts"');
    expect(markup).toContain('href="/messages"');
  });

  it("keeps private profile fields out of the student profile model", () => {
    expect(
      parseProfile({
        data: {
          name: "Alex Student",
          email: "student@example.com",
          phone: "03001234567",
          avatar: null,
          city: "Lahore",
          createdAt: "2024-06-10T00:00:00.000Z",
          _count: { bookings: 2, favorites: 5, reviews: 1 },
        },
      }),
    ).toEqual({
      name: "Alex Student",
      avatar: null,
      city: "Lahore",
      createdAt: "2024-06-10T00:00:00.000Z",
      counts: { bookings: 2, favorites: 5, reviews: 1 },
    });
  });
});
