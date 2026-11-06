import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingForm, ListingSubmitted, type ListingFormProps } from "./ListingForm";
import { ListingRoomsEditor } from "./ListingRoomsEditor";
import type { ListingFormValues } from "./listing-form";
import { ListingPhotosField, validateImageFile } from "./ListingPhotosField";
import { emptyRoom, roomFieldKey } from "./listing-form";

const hookHarness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  states: [] as unknown[],
}));
const fetchMock = vi.hoisted(() => vi.fn());

// Vitest uses Node without a DOM renderer, so drive the component's real submit handler directly.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const useState = ((initial: unknown) => {
    if (!hookHarness.active) return actual.useState(initial as never);

    const index = hookHarness.cursor++;
    if (index >= hookHarness.states.length) {
      hookHarness.states[index] =
        typeof initial === "function" ? (initial as () => unknown)() : initial;
    }

    return [
      hookHarness.states[index],
      (next: unknown) => {
        hookHarness.states[index] =
          typeof next === "function"
            ? (next as (previous: unknown) => unknown)(hookHarness.states[index])
            : next;
      },
    ];
  }) as typeof actual.useState;
  const useRef = ((initial: unknown) => {
    if (!hookHarness.active) return actual.useRef(initial);

    const index = hookHarness.cursor++;
    if (index >= hookHarness.states.length) {
      hookHarness.states[index] = { current: initial };
    }
    return hookHarness.states[index];
  }) as typeof actual.useRef;

  return {
    ...actual,
    useState,
    useRef,
    useEffect: (...args: Parameters<typeof actual.useEffect>) => {
      if (!hookHarness.active) actual.useEffect(...args);
    },
  };
});

beforeEach(() => {
  hookHarness.active = false;
  hookHarness.cursor = 0;
  hookHarness.states = [];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderListingForm(
  props: ListingFormProps = {},
  initialValues?: ListingFormValues,
) {
  if (initialValues) hookHarness.states[0] = initialValues;
  hookHarness.cursor = 0;
  hookHarness.active = true;
  try {
    return ListingForm(props);
  } finally {
    hookHarness.active = false;
  }
}

function findElements(
  node: unknown,
  predicate: (element: React.ReactElement<Record<string, unknown>>) => boolean,
): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findElements(child, predicate));
  }
  if (!React.isValidElement(node)) return [];

  const element = node as React.ReactElement<Record<string, unknown>>;
  return [
    ...(predicate(element) ? [element] : []),
    ...findElements(element.props.children, predicate),
  ];
}

async function submitForm(tree: ReturnType<typeof renderListingForm>) {
  const preventDefault = vi.fn();
  await (tree.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault });
  return preventDefault;
}

function findAlert(tree: ReturnType<typeof renderListingForm>) {
  return findElements(tree, (element) => element.props.role === "alert")[0];
}

function textContent(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textContent).join("");
  return React.isValidElement(node)
    ? textContent((node.props as { children?: unknown }).children)
    : "";
}

function validCreateValues(): ListingFormValues {
  return {
    name: "Green Hostel",
    description:
      "A quiet, student-friendly hostel close to the university campus with study areas.",
    gender: "MIXED",
    city: "Faisalabad",
    area: "",
    address: "Street 4, Satiana Road, Faisalabad",
    rooms: [
      {
        name: "Double room",
        description: "",
        pricePerMonth: "15000",
        capacity: "2",
        facilities: "",
      },
    ],
    amenities: ["wifi"],
    images: [],
    minStay: "1",
    maxStay: "",
    cancellationPolicy: "STANDARD",
    rules: "No smoking indoors\nQuiet after 10pm",
  };
}

describe("ListingForm", () => {
  const markup = renderToStaticMarkup(<ListingForm />);

  it("renders every section with labelled controls and no initial errors", () => {
    for (const text of [
      "Hostel name",
      "Description",
      "Who is it for?",
      "Full address",
      "Rooms",
      "Amenities",
      "Photos",
      "Minimum stay (months)",
      "House rules (optional)",
      "Cancellation policy",
      "Submit for review",
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).not.toContain('role="alert"');
    expect(markup).not.toContain('aria-invalid="true"');
  });

  it("offers the shared cities, amenities and all three cancellation policies", () => {
    expect(markup).toContain("<option value=\"Faisalabad\">Faisalabad</option>");
    expect(markup).toContain('value="wifi"');
    for (const policy of ["FLEXIBLE", "STANDARD", "STRICT"]) {
      expect(markup).toContain(`value="${policy}"`);
    }
  });

  it("states that new listings are reviewed before going live", () => {
    expect(markup).toContain("reviewed before they become visible");
  });

  it("submits a validated create payload with POST", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await submitForm(renderListingForm({}, validCreateValues()));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Green Hostel",
        description:
          "A quiet, student-friendly hostel close to the university campus with study areas.",
        city: "Faisalabad",
        address: "Street 4, Satiana Road, Faisalabad",
        pricePerMonth: 15000,
        rooms: 1,
        capacity: 2,
        gender: "MIXED",
        cancellationPolicy: "STANDARD",
        minStay: 1,
        amenities: ["wifi"],
        rules: ["No smoking indoors", "Quiet after 10pm"],
        images: [],
        roomTypes: [
          {
            name: "Double room",
            pricePerMonth: 15000,
            capacity: 2,
            facilities: [],
            images: [],
          },
        ],
      }),
    });
  });

  it("blocks an invalid submission before making a request", async () => {
    const preventDefault = await submitForm(renderListingForm());
    const tree = renderListingForm();
    const alert = findAlert(tree);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(alert).toBeDefined();
    expect(textContent(alert?.props.children)).toContain("Please fix the following");
  });

  it("renders a server error after a rejected create request", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "This listing could not be saved." }),
    });

    await submitForm(renderListingForm({}, validCreateValues()));
    const alert = findAlert(renderListingForm());

    expect(alert).toBeDefined();
    expect(textContent(alert?.props.children)).toContain("This listing could not be saved.");
  });
});

describe("ListingSubmitted", () => {
  it("explains the pending-review state and links back to the dashboard", () => {
    const markup = renderToStaticMarkup(<ListingSubmitted onAddAnother={vi.fn()} />);

    expect(markup).toContain("Listing submitted for review");
    expect(markup).toContain("isn&#x27;t visible to students yet");
    expect(markup).toContain('href="/owner"');
  });
});

describe("ListingRoomsEditor", () => {
  it("shows field errors and prevents removing the only room type", () => {
    const markup = renderToStaticMarkup(
      <ListingRoomsEditor
        errors={{ [roomFieldKey(0, "pricePerMonth")]: "Price problem" }}
        onChange={vi.fn()}
        rooms={[emptyRoom()]}
      />,
    );

    expect(markup).toContain("Price problem");
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toMatch(/aria-label="Remove room type 1"[^>]*\sdisabled=""/);
  });

  it("allows removing a room type once there are several", () => {
    const markup = renderToStaticMarkup(
      <ListingRoomsEditor errors={{}} onChange={vi.fn()} rooms={[emptyRoom(), emptyRoom()]} />,
    );

    expect(markup).not.toMatch(/aria-label="Remove room type 1"[^>]*\sdisabled=""/);
    expect(markup).toContain("Room type 2");
  });

  it("adds a new room without changing the existing room entry", () => {
    const existingRoom = { ...emptyRoom(), id: "room-1", name: "Twin room" };
    const onChange = vi.fn();
    const tree = ListingRoomsEditor({
      errors: {},
      onChange,
      rooms: [existingRoom],
    });
    const addButton = findElements(
      tree,
      (element) =>
        element.type === "button" &&
        textContent(element.props.children).includes("Add another room type"),
    )[0];

    expect(addButton).toBeDefined();
    (addButton?.props.onClick as () => void)();

    expect(onChange).toHaveBeenCalledWith([existingRoom, emptyRoom()]);
  });

  it("removes only the selected room and preserves the remaining room ID", () => {
    const rooms = [
      { ...emptyRoom(), id: "room-1", name: "Twin room" },
      { ...emptyRoom(), id: "room-2", name: "Private room" },
    ];
    const onChange = vi.fn();
    const tree = ListingRoomsEditor({ errors: {}, onChange, rooms });
    const removeButton = findElements(
      tree,
      (element) => element.props["aria-label"] === "Remove room type 1",
    )[0];

    expect(removeButton).toBeDefined();
    (removeButton?.props.onClick as () => void)();

    expect(onChange).toHaveBeenCalledWith([rooms[1]]);
    expect((onChange.mock.calls[0]?.[0] as typeof rooms)[0]?.id).toBe("room-2");
  });
});

describe("ListingPhotosField", () => {
  it("marks the first photo as the cover and offers Make cover on the others", () => {
    const markup = renderToStaticMarkup(
      <ListingPhotosField
        images={["https://images.unsplash.com/a.jpg", "https://images.unsplash.com/b.jpg"]}
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("Cover");
    expect(markup.match(/Make cover/g)).toHaveLength(1);
    expect(markup).toContain("2/15 photos");
  });

  it("disables adding once the limit is reached", () => {
    const images = Array.from({ length: 15 }, (_, i) => `https://images.unsplash.com/${i}.jpg`);
    const markup = renderToStaticMarkup(<ListingPhotosField images={images} onChange={vi.fn()} />);

    expect(markup).toMatch(/<button[^>]*\sdisabled=""[^>]*>(?:(?!<\/button>).)*Add photos/s);
  });

  it("keeps adding enabled below the limit", () => {
    const markup = renderToStaticMarkup(
      <ListingPhotosField images={["https://images.unsplash.com/a.jpg"]} onChange={vi.fn()} />,
    );

    expect(markup).not.toMatch(/\sdisabled=""/);
  });
});

describe("validateImageFile", () => {
  it("mirrors the upload API's type and size limits", () => {
    expect(validateImageFile({ type: "image/png", size: 1024 })).toBeNull();
    expect(validateImageFile({ type: "image/gif", size: 1024 })).toMatch(/JPEG/);
    expect(validateImageFile({ type: "image/jpeg", size: 0 })).toMatch(/4MB/);
    expect(validateImageFile({ type: "image/jpeg", size: 4 * 1024 * 1024 + 1 })).toMatch(/4MB/);
  });
});

describe("ListingForm in edit mode", () => {
  const existing = {
    id: "h1",
    listing: {
      name: "Green Hostel",
      description:
        "A quiet, student-friendly hostel close to the university campus with study areas.",
      gender: "MIXED",
      city: "Faisalabad",
      area: "Satiana Road",
      address: "Street 4, Satiana Road, Faisalabad",
      latitude: null,
      longitude: null,
      amenities: ["wifi"],
      images: [],
      minStay: 1,
      maxStay: null,
      cancellationPolicy: "FLEXIBLE",
      rules: [],
      rooms: [
        {
          id: "r1",
          name: "Double room",
          description: null,
          pricePerMonth: 15000,
          capacity: 2,
          facilities: [],
          images: [],
        },
      ],
    },
  };
  const markup = renderToStaticMarkup(<ListingForm existing={existing} />);

  it("prefills the stored values and says saving sends the listing back to review", () => {
    expect(markup).toContain('value="Green Hostel"');
    expect(markup).toContain('value="Double room"');
    expect(markup).toContain("Save and submit for review");
    expect(markup).toContain("sends the listing back to review");
    expect(markup).not.toContain("New listings are reviewed");
  });

  it("submits the stored listing with PATCH and its validated payload", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const tree = renderListingForm({ existing });

    await submitForm(tree);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/hostels/h1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Green Hostel",
        description:
          "A quiet, student-friendly hostel close to the university campus with study areas.",
        city: "Faisalabad",
        area: "Satiana Road",
        address: "Street 4, Satiana Road, Faisalabad",
        pricePerMonth: 15000,
        rooms: 1,
        capacity: 2,
        gender: "MIXED",
        cancellationPolicy: "FLEXIBLE",
        minStay: 1,
        amenities: ["wifi"],
        rules: [],
        images: [],
        roomTypes: [
          {
            id: "r1",
            name: "Double room",
            pricePerMonth: 15000,
            capacity: 2,
            facilities: [],
            images: [],
          },
        ],
      }),
    });
  });

  it("keeps the remaining room's stable ID when another room is removed", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const existingWithRooms = {
      ...existing,
      listing: {
        ...existing.listing,
        rooms: [
          ...existing.listing.rooms,
          {
            id: "r2",
            name: "Private room",
            description: "Quiet room.",
            pricePerMonth: 32000,
            capacity: 1,
            facilities: ["Study desk"],
            images: [],
          },
        ],
      },
    };
    const tree = renderListingForm({ existing: existingWithRooms });
    const editor = findElements(tree, (element) => element.type === ListingRoomsEditor)[0];
    const rooms = editor?.props.rooms as import("./listing-form").RoomFormValues[];
    const onChange = editor?.props.onChange as (
      nextRooms: import("./listing-form").RoomFormValues[],
    ) => void;

    expect(rooms).toHaveLength(2);
    onChange([rooms[1]!]);
    await submitForm(renderListingForm({ existing: existingWithRooms }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/hostels/h1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"id":"r2"'),
      }),
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain('"id":"r1"');
  });

  it("shows the server-confirmed pending-review state after a successful edit", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await submitForm(renderListingForm({ existing }));

    expect(
      renderToStaticMarkup(renderListingForm({ existing })),
    ).toContain("Your listing is pending review again");
  });
});

describe("ListingSubmitted after an edit", () => {
  it("explains the listing is back in review and offers no add-another action", () => {
    const markup = renderToStaticMarkup(<ListingSubmitted updated />);

    expect(markup).toContain("Changes saved and submitted for review");
    expect(markup).toContain("pending review again");
    expect(markup).not.toContain("Add another listing");
  });
});
