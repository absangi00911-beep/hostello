import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoomTypeCard } from "./RoomTypeCard";

describe("RoomTypeCard", () => {
  it("links to room details without showing room photos on the hostel overview", () => {
    const markup = renderToStaticMarkup(
      <RoomTypeCard
        hostelSlug="green-view"
        room={{
          id: "room-gv-1",
          name: "Standard Double",
          pricePerMonth: 8500,
          capacity: 2,
          available: 1,
          images: ["https://images.hostello.test/room.jpg"],
        }}
      />,
    );

    expect(markup).toContain("/hostels/green-view/rooms/room-gv-1");
    expect(markup).toContain("View room details");
    expect(markup).toContain("1 spot available");
    expect(markup).not.toContain("room.jpg");
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("Request booking");
    expect(markup).not.toContain("payment");
  });

  it("keeps full rooms accessible for details while showing their status", () => {
    const markup = renderToStaticMarkup(
      <RoomTypeCard
        hostelSlug="green-view"
        room={{
          id: "room-gv-full",
          name: "Premium Triple",
          pricePerMonth: 9500,
          capacity: 3,
          available: 0,
          images: [],
        }}
      />,
    );

    expect(markup).toContain("Currently full");
    expect(markup).toContain("/hostels/green-view/rooms/room-gv-full");
  });
});
