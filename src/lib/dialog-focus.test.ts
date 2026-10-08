import { describe, expect, it } from "vitest";
import { getDialogFocusBoundaryTarget } from "./dialog-focus";

describe("getDialogFocusBoundaryTarget", () => {
  const closeButton = { name: "close" };
  const previousButton = { name: "previous" };
  const nextButton = { name: "next" };
  const focusable = [closeButton, previousButton, nextButton];

  it("wraps Shift+Tab from the first control to the last", () => {
    expect(getDialogFocusBoundaryTarget(closeButton, focusable, true)).toBe(nextButton);
  });

  it("wraps Tab from the last control to the first", () => {
    expect(getDialogFocusBoundaryTarget(nextButton, focusable, false)).toBe(closeButton);
  });

  it("leaves normal movement between dialog controls to the browser", () => {
    expect(getDialogFocusBoundaryTarget(previousButton, focusable, false)).toBeNull();
  });

  it("returns focus to the dialog when focus was moved outside it", () => {
    const outside = { name: "outside" };
    expect(getDialogFocusBoundaryTarget(outside, focusable, false)).toBe(closeButton);
    expect(getDialogFocusBoundaryTarget(outside, focusable, true)).toBe(nextButton);
  });

  it("does nothing when the dialog has no focusable controls", () => {
    expect(getDialogFocusBoundaryTarget(null, [], false)).toBeNull();
  });
});
