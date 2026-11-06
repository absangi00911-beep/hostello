import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvailabilityAlertCard } from "@/components/student/AvailabilityAlertCard";
import type { AlertRecord } from "@/components/student/availability-alert-types";

const callbacks = {
  onEdit: () => {},
  onToggle: () => {},
  onDelete: () => {},
  onCreateNew: () => {},
};

function alert(overrides: Partial<AlertRecord> = {}): AlertRecord {
  return {
    id: "alert-1",
    type: "SEARCH",
    criteria: { city: "Lahore", amenities: ["wifi"] },
    checkIn: "2030-03-20",
    checkOut: "2030-03-22",
    guests: 2,
    status: "ACTIVE",
    isMatched: true,
    ...overrides,
  };
}

describe("AvailabilityAlertCard", () => {
  it("announces active match state and exposes lifecycle actions", () => {
    const markup = renderToStaticMarkup(
      <AvailabilityAlertCard
        alert={alert()}
        pending={false}
        {...callbacks}
      />,
    );

    expect(markup).toContain("Lahore");
    expect(markup).toContain("Active");
    expect(markup).toContain("Currently matches your availability criteria.");
    expect(markup).toContain(">Edit</button>");
    expect(markup).toContain(">Pause</button>");
    expect(markup).toContain(">Delete</button>");
  });

  it("offers create-new and delete actions for expired alerts", () => {
    const markup = renderToStaticMarkup(
      <AvailabilityAlertCard
        alert={alert({ status: "EXPIRED", isMatched: false })}
        pending={false}
        {...callbacks}
      />,
    );

    expect(markup).toContain("Expired");
    expect(markup).toContain("Create a new alert");
    expect(markup).not.toContain(">Edit</button>");
    expect(markup).not.toContain(">Pause</button>");
    expect(markup).toContain(">Delete</button>");
  });

  it("uses a safe detail route for the associated hostel", () => {
    const markup = renderToStaticMarkup(
      <AvailabilityAlertCard
        alert={alert({
          type: "HOSTEL",
          hostelName: "Hostello House",
          criteria: { hostelId: "hostel_1" },
          isMatched: false,
        })}
        pending={false}
        {...callbacks}
      />,
    );

    expect(markup).toContain("Hostello House");
    expect(markup).toContain('href="/hostels/hostel_1"');
  });
});
