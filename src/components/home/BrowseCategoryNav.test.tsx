import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { BrowseCategoryNav } from "./BrowseCategoryNav";

describe("BrowseCategoryNav", () => {
  it("renders existing categories and the selected state", () => {
    const markup = renderToStaticMarkup(
      <BrowseCategoryNav category="women" onSelectCategory={() => {}} />,
    );

    expect(markup).toContain('aria-label="Browse categories"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("All stays");
    expect(markup).toContain("Women-only");
    expect(markup).toContain("Top rated");
    expect(markup).toContain("Under PKR 20k");
  });

  it("uses Tailwind utilities for desktop category layout and selected state", () => {
    const markup = renderToStaticMarkup(
      <BrowseCategoryNav category="women" onSelectCategory={() => {}} />,
    );

    expect(markup).toContain("h-20");
    expect(markup).toContain("min-w-[70px]");
    expect(markup).toContain("aria-pressed:text-ink");
  });

  it("uses responsive Tailwind utilities for the mobile category strip", () => {
    const markup = renderToStaticMarkup(
      <BrowseCategoryNav
        category="women"
        onSelectCategory={() => {}}
        variant="mobile"
      />,
    );

    expect(markup).toContain("hidden");
    expect(markup).toContain("min-h-[50px]");
    expect(markup).toContain("min-h-[44px]");
  });

  it("calls the existing category handler with the selected category", () => {
    const onSelectCategory = vi.fn();
    const navigation = BrowseCategoryNav({
      category: "all",
      onSelectCategory,
    });
    const buttons = navigation.props
      .children as ReactElement<{ onClick: () => void }>[];

    buttons[1].props.onClick();

    expect(onSelectCategory).toHaveBeenCalledWith("women");
  });
});
