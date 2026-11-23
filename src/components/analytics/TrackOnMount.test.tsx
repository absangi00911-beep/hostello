import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrackOnMount } from "./TrackOnMount";

describe("TrackOnMount", () => {
  it("renders nothing, so a server component can place it anywhere", () => {
    expect(
      renderToStaticMarkup(<TrackOnMount dedupeKey="h1" event="hostel_viewed" properties={{ hostelId: "chostel00000000000000001" }} />),
    ).toBe("");
  });
});
