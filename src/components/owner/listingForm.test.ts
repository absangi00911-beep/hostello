import { hostelCreateSchema } from "@hostello/shared";
import { describe, expect, it } from "vitest";
import {
  buildListingPayload,
  emptyListingForm,
  emptyRoom,
  listingToFormValues,
  readServerFieldErrors,
  roomFieldKey,
  validateListingForm,
  type ListingFormValues,
} from "./listingForm";

function validForm(overrides: Partial<ListingFormValues> = {}): ListingFormValues {
  return {
    name: "Green Hostel",
    description:
      "A quiet, student-friendly hostel close to the university campus with study areas.",
    gender: "FEMALE",
    city: "Faisalabad",
    area: " Satiana Road ",
    address: "Street 4, Satiana Road, Faisalabad",
    rooms: [
      {
        name: "4-seater",
        description: "",
        pricePerMonth: "9000",
        capacity: "4",
        facilities: "Desk, Wardrobe , ,Fan",
      },
      {
        name: "2-seater",
        description: "Quiet room",
        pricePerMonth: "14000",
        capacity: "2",
        facilities: "",
      },
    ],
    amenities: ["wifi", "cctv", "not-a-real-amenity"],
    images: ["https://images.unsplash.com/a.jpg", "https://images.unsplash.com/b.jpg"],
    minStay: "1",
    maxStay: "",
    cancellationPolicy: "STANDARD",
    rules: "No smoking indoors\n\n  Quiet after 10pm  ",
    ...overrides,
  };
}

describe("validateListingForm", () => {
  it("accepts a complete form", () => {
    expect(validateListingForm(validForm())).toEqual({});
  });

  it("flags every required field on an empty form", () => {
    const errors = validateListingForm(emptyListingForm());

    for (const key of [
      "name",
      "description",
      "gender",
      "city",
      "address",
      "amenities",
      "cancellationPolicy",
      roomFieldKey(0, "name"),
      roomFieldKey(0, "pricePerMonth"),
      roomFieldKey(0, "capacity"),
    ]) {
      expect(errors[key], key).toBeTruthy();
    }
  });

  it("applies the server's price and capacity bounds per room", () => {
    const errors = validateListingForm(
      validForm({
        rooms: [
          { ...emptyRoom(), name: "A", pricePerMonth: "999", capacity: "0" },
          { ...emptyRoom(), name: "Room B", pricePerMonth: "100001", capacity: "101" },
          { ...emptyRoom(), name: "Room C", pricePerMonth: "12.5", capacity: "two" },
        ],
      }),
    );

    expect(errors[roomFieldKey(0, "name")]).toBeTruthy();
    for (const index of [0, 1, 2]) {
      expect(errors[roomFieldKey(index, "pricePerMonth")]).toBeTruthy();
      expect(errors[roomFieldKey(index, "capacity")]).toBeTruthy();
    }
    expect(errors[roomFieldKey(1, "name")]).toBeUndefined();
  });

  it("rejects total beds above the hostel limit", () => {
    const rooms = Array.from({ length: 11 }, (_, i) => ({
      ...emptyRoom(),
      name: `Room ${i}`,
      pricePerMonth: "5000",
      capacity: "100",
    }));

    expect(validateListingForm(validForm({ rooms })).rooms).toMatch(/1000/);
  });

  it("checks stay lengths and rule limits", () => {
    const errors = validateListingForm(
      validForm({
        minStay: "6",
        maxStay: "3",
        rules: Array.from({ length: 21 }, (_, i) => `Rule ${i}`).join("\n"),
      }),
    );

    expect(errors.maxStay).toMatch(/shorter/);
    expect(errors.rules).toBeTruthy();
    expect(validateListingForm(validForm({ minStay: "0" })).minStay).toBeTruthy();
    expect(validateListingForm(validForm({ maxStay: "abc" })).maxStay).toBeTruthy();
  });
});

describe("buildListingPayload", () => {
  it("derives hostel totals from the rooms and trims text", () => {
    const payload = buildListingPayload(validForm());

    expect(payload.pricePerMonth).toBe(9000);
    expect(payload.rooms).toBe(2);
    expect(payload.capacity).toBe(6);
    expect(payload.area).toBe("Satiana Road");
    expect(payload.rules).toEqual(["No smoking indoors", "Quiet after 10pm"]);
    expect(payload.roomTypes[0]?.facilities).toEqual(["Desk", "Wardrobe", "Fan"]);
    expect(payload.roomTypes[0]).not.toHaveProperty("description");
    expect(payload.roomTypes[1]?.description).toBe("Quiet room");
  });

  it("uses the first photo as the cover and drops unknown amenity ids", () => {
    const payload = buildListingPayload(validForm());

    expect(payload.coverImage).toBe("https://images.unsplash.com/a.jpg");
    expect(payload.amenities).toEqual(["wifi", "cctv"]);
    expect(buildListingPayload(validForm({ images: [] }))).not.toHaveProperty("coverImage");
  });

  it("keeps existing room ids so edits can preserve bookings", () => {
    const form = validForm();
    form.rooms[0] = { ...form.rooms[0]!, id: "room_1" };
    const payload = buildListingPayload(form);

    expect(payload.roomTypes[0]?.id).toBe("room_1");
    expect(payload.roomTypes[1]).not.toHaveProperty("id");
  });

  it("includes maxStay only when provided", () => {
    expect(buildListingPayload(validForm()).maxStay).toBeUndefined();
    expect(buildListingPayload(validForm({ minStay: "2", maxStay: "9" })).maxStay).toBe(9);
  });

  it("produces a body the server's hostelCreateSchema accepts", () => {
    const result = hostelCreateSchema.safeParse(buildListingPayload(validForm()));

    expect(result.success, JSON.stringify(result.error?.flatten())).toBe(true);
  });

  it("agrees with the server schema on rejected input", () => {
    const form = validForm({ name: "ab", address: "short" });
    const clientErrors = validateListingForm(form);
    const serverFields = hostelCreateSchema.safeParse({
      ...buildListingPayload(validForm()),
      name: "ab",
      address: "short",
    });

    expect(clientErrors.name && clientErrors.address).toBeTruthy();
    expect(serverFields.success).toBe(false);
  });
});

describe("readServerFieldErrors", () => {
  it("flattens zod fieldErrors into messages", () => {
    expect(
      readServerFieldErrors({
        error: "Validation failed.",
        details: { fieldErrors: { name: ["Too short"], roomTypes: ["Add at least one room type"] } },
      }),
    ).toEqual(["Too short", "Add at least one room type"]);
  });

  it("tolerates missing or malformed details", () => {
    expect(readServerFieldErrors(null)).toEqual([]);
    expect(readServerFieldErrors({ details: "x" })).toEqual([]);
    expect(readServerFieldErrors({ details: { fieldErrors: { a: [1] } } })).toEqual([]);
  });
});

describe("editing a stored listing", () => {
  const stored = {
    name: "Green Hostel",
    description:
      "A quiet, student-friendly hostel close to the university campus with study areas.",
    gender: "FEMALE",
    city: "Faisalabad",
    area: null,
    address: "Street 4, Satiana Road, Faisalabad",
    latitude: 31.4181,
    longitude: 73.0776,
    amenities: ["wifi", "cctv"],
    images: ["https://cdn.example/cover.jpg"],
    minStay: 2,
    maxStay: null,
    cancellationPolicy: "STANDARD",
    rules: ["No smoking", "Quiet after 10pm"],
    rooms: [
      {
        id: "room1",
        name: "4-seater",
        description: null,
        pricePerMonth: 12000,
        capacity: 4,
        facilities: ["Fan", "Locker"],
        images: ["https://cdn.example/room1.jpg"],
      },
    ],
  };

  it("maps a stored listing into form text fields", () => {
    const values = listingToFormValues(stored);

    expect(values).toMatchObject({
      area: "",
      minStay: "2",
      maxStay: "",
      cancellationPolicy: "STANDARD",
      rules: "No smoking\nQuiet after 10pm",
    });
    expect(values.rooms[0]).toMatchObject({
      id: "room1",
      pricePerMonth: "12000",
      capacity: "4",
      facilities: "Fan, Locker",
    });
    expect(validateListingForm(values)).toEqual({});
  });

  it("keeps room ids, room photos and coordinates in the update payload", () => {
    const payload = buildListingPayload(listingToFormValues(stored));

    expect(payload.roomTypes[0]).toMatchObject({
      id: "room1",
      images: ["https://cdn.example/room1.jpg"],
    });
    expect(payload.latitude).toBe(31.4181);
    expect(payload.longitude).toBe(73.0776);
    expect(hostelCreateSchema.safeParse(payload).success).toBe(true);
  });

  it("omits coordinates when the listing has none", () => {
    const payload = buildListingPayload(
      listingToFormValues({ ...stored, latitude: null, longitude: null }),
    );

    expect(payload).not.toHaveProperty("latitude");
    expect(payload).not.toHaveProperty("longitude");
  });

  it("starts with one empty room when a legacy listing has none, and blanks unknown enums", () => {
    const values = listingToFormValues({
      ...stored,
      rooms: [],
      gender: "OTHER",
      cancellationPolicy: null,
    });

    expect(values.rooms).toHaveLength(1);
    expect(values.rooms[0].id).toBeUndefined();
    expect(values.gender).toBe("");
    expect(values.cancellationPolicy).toBe("");
  });
});
