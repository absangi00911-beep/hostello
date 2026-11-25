import { describe, expect, it } from "vitest";
import { OWNER_WORKSPACE_NAVIGATION } from "./ownerNavigation";

describe("OWNER_WORKSPACE_NAVIGATION", () => {
  it("uses only stable owner destinations", () => {
    expect(OWNER_WORKSPACE_NAVIGATION.map(({ href }) => href)).toEqual([
      "/owner",
      "/owner/listings/new",
      "/owner/bookings",
      "/owner/reviews",
      "/owner/analytics",
      "/owner/earnings",
      "/owner/subscription",
    ]);
  });
});
