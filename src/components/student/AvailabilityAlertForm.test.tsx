import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AvailabilityAlertForm,
} from "@/components/student/AvailabilityAlertForm";
import { AvailabilityAlertsPage } from "@/components/student/AvailabilityAlertsPage";
import {
  buildAvailabilityAlertInput,
  type AvailabilityAlertFormValues,
} from "@/components/student/availability-alert-form-model";

const stay = {
  checkIn: "2030-03-20",
  checkOut: "2030-03-22",
  guests: "2",
};

function formValues(
  overrides: Partial<AvailabilityAlertFormValues> = {},
): AvailabilityAlertFormValues {
  return {
    type: "SEARCH",
    hostelId: "",
    q: "",
    city: "Lahore",
    gender: "FEMALE",
    minPrice: "10000",
    maxPrice: "20000",
    amenities: ["wifi"],
    verified: false,
    latitude: "",
    longitude: "",
    ...stay,
    ...overrides,
  };
}

describe("buildAvailabilityAlertInput", () => {
  it("keeps only supported search filters and the exact date range", () => {
    expect(
      buildAvailabilityAlertInput(formValues({ q: "Near campus" })),
    ).toEqual({
      type: "SEARCH",
      criteria: {
        q: "Near campus",
        city: "Lahore",
        gender: "FEMALE",
        minPrice: 10_000,
        maxPrice: 20_000,
        amenities: ["wifi"],
      },
      ...stay,
      guests: 2,
    });
  });

  it("requires a complete stay and supported guest count", () => {
    expect(() =>
      buildAvailabilityAlertInput(formValues({ checkOut: "" })),
    ).toThrow("Choose valid check-in and check-out dates.");
    expect(() =>
      buildAvailabilityAlertInput(formValues({ guests: "5" })),
    ).toThrow("Guest count must be between 1 and 4.");
  });

  it("requires nearby coordinates as a complete, explicitly supplied pair", () => {
    expect(() =>
      buildAvailabilityAlertInput(
        formValues({ latitude: "31.52", longitude: "" }),
      ),
    ).toThrow("Enter both nearby coordinates.");

    expect(
      buildAvailabilityAlertInput(
        formValues({
          city: "",
          latitude: "31.52",
          longitude: "74.36",
        }),
      ),
    ).toMatchObject({
      type: "SEARCH",
      criteria: { nearby: { latitude: 31.52, longitude: 74.36 } },
    });
  });

  it("creates a hostel alert from a selected hostel and stay", () => {
    expect(
      buildAvailabilityAlertInput(
        formValues({
          type: "HOSTEL",
          hostelId: "hostel_1",
        }),
      ),
    ).toEqual({
      type: "HOSTEL",
      hostelId: "hostel_1",
      ...stay,
      guests: 2,
    });
  });

  it("renders a prefilled search alert with explicit date and guest controls", () => {
    const markup = renderToStaticMarkup(
      <AvailabilityAlertForm
        initial={{
          type: "SEARCH",
          criteria: { city: "Lahore", amenities: ["wifi"] },
          checkIn: "2030-03-20",
          checkOut: "2030-03-22",
          guests: 2,
        }}
        onCancel={() => {}}
        onSaved={() => {}}
        onUncertain={() => {}}
      />,
    );

    expect(markup).toContain('aria-label="Create availability alert"');
    expect(markup).toContain("Lahore");
    expect(markup).toContain('value="2030-03-20"');
    expect(markup).toContain('value="2030-03-22"');
    expect(markup).toContain("Guests (1–4)");
  });

  it("renders the student management loading state and prefilled form", () => {
    const markup = renderToStaticMarkup(
      <AvailabilityAlertsPage
        initial={{
          type: "HOSTEL",
          hostelId: "hostel_1",
          checkIn: "2030-03-20",
          checkOut: "2030-03-22",
          guests: 2,
        }}
      />,
    );

    expect(markup).toContain("Availability alerts");
    expect(markup).toContain('aria-label="Loading availability alerts"');
    expect(markup).toContain("hostel_1");
    expect(markup).toContain("Create alert");
  });
});
