import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PhotoImage } from "./PhotoImage";

describe("PhotoImage", () => {
  it("renders the room-scene fallback beneath its image with an accessible description", () => {
    const markup = renderToStaticMarkup(
      <PhotoImage
        src="https://images.example.test/room.jpg"
        alt="A shared hostel room"
        width={600}
        height={400}
      />,
    );

    expect(markup).toContain("data-image-fallback");
    expect(markup).toContain('alt="A shared hostel room"');
  });

  it("supports decorative images with an empty alternative text", () => {
    const markup = renderToStaticMarkup(
      <PhotoImage
        src="https://images.example.test/room.jpg"
        alt=""
        width={600}
        height={400}
      />,
    );

    expect(markup).toContain('alt=""');
    expect(markup).toContain("data-image-fallback");
  });
});
