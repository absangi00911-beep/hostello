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
    expect(markup).toContain("Try again");
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
