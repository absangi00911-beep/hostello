import { describe, expect, it } from "vitest";
import { addMissingCityHostels } from "./seed-hostels";

const existingHostels = [
  ...Array.from({ length: 4 }, () => ({ city: "Lahore" })),
  ...Array.from({ length: 3 }, () => ({ city: "Islamabad" })),
  ...Array.from({ length: 3 }, () => ({ city: "Karachi" })),
  ...Array.from({ length: 2 }, () => ({ city: "Faisalabad" })),
  ...Array.from({ length: 2 }, () => ({ city: "Multan" })),
  ...Array.from({ length: 2 }, () => ({ city: "Peshawar" })),
  ...Array.from({ length: 1 }, () => ({ city: "Quetta" })),
  ...Array.from({ length: 2 }, () => ({ city: "Rawalpindi" })),
];

const ownerIds = {
  Lahore: "owner-lahore",
  Islamabad: "owner-islamabad",
  Karachi: "owner-karachi",
  Faisalabad: "owner-faisalabad",
  Multan: "owner-multan",
  Peshawar: "owner-peshawar",
  Quetta: "owner-quetta",
  Rawalpindi: "owner-rawalpindi",
};

describe("addMissingCityHostels", () => {
  it("brings every seeded city up to 15 hostels without duplicating existing entries", () => {
    const additionalHostels = addMissingCityHostels(existingHostels, ownerIds);
    const allHostels = [...existingHostels, ...additionalHostels];
    const counts = new Map<string, number>();

    for (const hostel of allHostels) {
      counts.set(hostel.city, (counts.get(hostel.city) ?? 0) + 1);
    }

    expect(counts.size).toBe(8);
    expect([...counts.values()].every((count) => count >= 15)).toBe(true);
    expect(additionalHostels).toHaveLength(101);
    expect(new Set(additionalHostels.map((hostel) => hostel.slug)).size).toBe(
      additionalHostels.length,
    );
    expect(
      additionalHostels.every((hostel) => Boolean(hostel.ownerId && hostel.name)),
    ).toBe(true);
  });

  it("does not add listings to cities that already meet the minimum", () => {
    const additionalHostels = addMissingCityHostels(
      [...existingHostels, ...Array.from({ length: 11 }, () => ({ city: "Lahore" }))],
      ownerIds,
    );

    expect(additionalHostels.filter((hostel) => hostel.city === "Lahore")).toHaveLength(0);
  });

  it("fails clearly when existing seed data introduces an unconfigured city", () => {
    expect(() =>
      addMissingCityHostels([...existingHostels, { city: "Sukkur" }], ownerIds),
    ).toThrow("Missing seed locations for Sukkur.");
  });
});
