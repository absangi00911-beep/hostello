import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("framer-motion", async () => {
  const React = await import("react");

  return {
    useReducedMotion: () => motionState.reduced,
    motion: {
      div: ({
        children,
        initial,
        whileInView,
      }: {
        children: React.ReactNode;
        initial: unknown;
        whileInView: unknown;
      }) =>
        React.createElement(
          "div",
          {
            "data-initial": initial === false ? "static" : "animated",
            "data-while-in-view": whileInView ? "animated" : "none",
          },
          children,
        ),
    },
  };
});

describe("Reveal", () => {
  beforeEach(() => {
    motionState.reduced = false;
  });

  it("shows content without movement when reduced motion is requested", () => {
    motionState.reduced = true;

    const markup = renderToStaticMarkup(
      createElement(Reveal, null, "Section content"),
    );

    expect(markup).toContain('data-initial="static"');
    expect(markup).toContain('data-while-in-view="none"');
    expect(markup).toContain("Section content");
  });
});
