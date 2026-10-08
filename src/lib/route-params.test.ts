import { describe, expect, it } from "vitest";
import {
  isBoundedRouteParam,
  MAX_HOSTEL_ROUTE_PARAM_LENGTH,
  MAX_ROUTE_ID_LENGTH,
} from "./route-params";

describe("isBoundedRouteParam", () => {
  it("accepts non-empty IDs up to the configured maximum", () => {
    expect(isBoundedRouteParam("cuid_like_id")).toBe(true);
    expect(isBoundedRouteParam("x".repeat(MAX_ROUTE_ID_LENGTH))).toBe(true);
    expect(isBoundedRouteParam("x".repeat(MAX_HOSTEL_ROUTE_PARAM_LENGTH), MAX_HOSTEL_ROUTE_PARAM_LENGTH)).toBe(true);
  });

  it("rejects empty and overlong route parameters", () => {
    expect(isBoundedRouteParam("")).toBe(false);
    expect(isBoundedRouteParam("x".repeat(MAX_ROUTE_ID_LENGTH + 1))).toBe(false);
    expect(isBoundedRouteParam("x".repeat(MAX_HOSTEL_ROUTE_PARAM_LENGTH + 1), MAX_HOSTEL_ROUTE_PARAM_LENGTH)).toBe(false);
  });
});
