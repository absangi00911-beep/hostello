import { describe, expect, it } from "vitest";
import {
  CLIENT_EVENT_SCHEMAS,
  FUNNEL_STEPS,
  SERVER_EVENT_NAMES,
  SESSION_ID_PATTERN,
  isClientEventName,
} from "./events";

const HOSTEL = "cabcdefghij0123456789klm";

describe("client event schemas", () => {
  it("accept exactly the documented properties", () => {
    expect(CLIENT_EVENT_SCHEMAS.search_performed.safeParse({ city: "Lahore", nearby: false, hasDates: true, resultCount: 12 }).success).toBe(true);
    expect(CLIENT_EVENT_SCHEMAS.search_performed.safeParse({ nearby: true, hasDates: false, resultCount: 0 }).success).toBe(true);
    expect(CLIENT_EVENT_SCHEMAS.hostel_viewed.safeParse({ hostelId: HOSTEL }).success).toBe(true);
    expect(CLIENT_EVENT_SCHEMAS.booking_started.safeParse({ hostelId: HOSTEL, roomId: HOSTEL }).success).toBe(true);
    expect(CLIENT_EVENT_SCHEMAS.booking_started.safeParse({ hostelId: HOSTEL }).success).toBe(true);
  });

  it("reject any property that is not listed, so a leak is a deliberate edit", () => {
    for (const [name, props] of [
      ["search_performed", { nearby: false, hasDates: false, resultCount: 1, q: "private search text" }],
      ["hostel_viewed", { hostelId: HOSTEL, email: "a@b.c" }],
      ["booking_started", { hostelId: HOSTEL, userId: "u1" }],
    ] as const) {
      expect(CLIENT_EVENT_SCHEMAS[name].safeParse(props).success, name).toBe(false);
    }
  });

  it("reject malformed values", () => {
    const search = CLIENT_EVENT_SCHEMAS.search_performed;
    expect(search.safeParse({ city: "x".repeat(61), nearby: false, hasDates: false, resultCount: 1 }).success).toBe(false);
    expect(search.safeParse({ nearby: "yes", hasDates: false, resultCount: 1 }).success).toBe(false);
    expect(search.safeParse({ nearby: false, hasDates: false, resultCount: -1 }).success).toBe(false);
    expect(search.safeParse({ nearby: false, hasDates: false, resultCount: 1.5 }).success).toBe(false);
    expect(CLIENT_EVENT_SCHEMAS.hostel_viewed.safeParse({ hostelId: "short" }).success).toBe(false);
    expect(CLIENT_EVENT_SCHEMAS.hostel_viewed.safeParse({ hostelId: "has space in id!" }).success).toBe(false);
  });
});

describe("event names", () => {
  it("only the three client events are accepted from browsers", () => {
    for (const name of ["search_performed", "hostel_viewed", "booking_started"]) expect(isClientEventName(name)).toBe(true);
    // The money steps are recorded by the server only.
    for (const name of [...SERVER_EVENT_NAMES, "toString", "__proto__", "constructor", "", 7, null]) {
      expect(isClientEventName(name), String(name)).toBe(false);
    }
  });

  it("the funnel runs from a search to a confirmed payment, in order, with every step covered", () => {
    expect(FUNNEL_STEPS[0]).toBe("search_performed");
    expect(FUNNEL_STEPS.at(-1)).toBe("payment_confirmed");
    const known = [...Object.keys(CLIENT_EVENT_SCHEMAS), ...SERVER_EVENT_NAMES].sort();
    expect([...FUNNEL_STEPS].sort()).toEqual(known);
  });
});

describe("session id pattern", () => {
  it("accepts a UUID and rejects anything that could carry other data", () => {
    expect(SESSION_ID_PATTERN.test("3f2b8c1e-9a4d-4c6e-8b7a-1d2e3f4a5b6c")).toBe(true);
    for (const bad of ["", "short", "has spaces in it 1234567890", "a@b.com-1234567890123", "x".repeat(65)]) {
      expect(SESSION_ID_PATTERN.test(bad), bad).toBe(false);
    }
  });
});
