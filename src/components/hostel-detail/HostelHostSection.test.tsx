import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { HostelHostSection } from "./HostelHostSection";

const baseProps = {
  hostelId: "hostel-1",
  hostelName: "Canal View Hostel",
  host: {
    name: "Amina Khan",
    avatar: null,
    bio: "I love helping students feel at home.",
    city: "Lahore",
    createdAt: new Date("2021-10-01T00:00:00.000Z"),
    responseSummary: {
      guestStartedThreadCount: 4,
      repliedThreadCount: 3,
      medianResponseSeconds: 120,
    },
  },
  isOwner: false,
  viewerRole: "STUDENT" as const,
};

describe("HostelHostSection", () => {
  it("shows public host details and persisted response metrics", () => {
    const markup = renderToStaticMarkup(
      <HostelHostSection {...baseProps} />,
    );

    expect(markup).toContain("Meet your host");
    expect(markup).toContain("Amina Khan");
    expect(markup).toContain("I love helping students feel at home.");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("October 2021");
    expect(markup).toContain("75%");
    expect(markup).toContain("2 minutes");
    expect(markup).not.toContain("email");
    expect(markup).not.toContain("phone");
  });

  it("omits response metrics when the host has no guest-started threads", () => {
    const markup = renderToStaticMarkup(
      <HostelHostSection
        {...baseProps}
        host={{
          ...baseProps.host,
          responseSummary: {
            guestStartedThreadCount: 0,
            repliedThreadCount: 0,
            medianResponseSeconds: null,
          },
        }}
      />,
    );

    expect(markup).not.toContain("response rate");
    expect(markup).not.toContain("response time");
  });

  it("shows a zero response rate without response time when nobody has replied", () => {
    const markup = renderToStaticMarkup(
      <HostelHostSection
        {...baseProps}
        host={{
          ...baseProps.host,
          responseSummary: {
            guestStartedThreadCount: 2,
            repliedThreadCount: 0,
            medianResponseSeconds: null,
          },
        }}
      />,
    );

    expect(markup).toContain("0%");
    expect(markup).not.toContain("response time");
  });

  it.each([
    { isOwner: true, viewerRole: "STUDENT" as const },
    { isOwner: false, viewerRole: "OWNER" as const },
    { isOwner: false, viewerRole: "ADMIN" as const },
  ])("hides the message action for owners and other signed-in roles", (viewer) => {
    const markup = renderToStaticMarkup(
      <HostelHostSection {...baseProps} {...viewer} />,
    );

    expect(markup).not.toContain("Message the host");
  });
});
