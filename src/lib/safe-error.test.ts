import { describe, expect, it } from "vitest";
import { getSafeErrorSummary } from "@/lib/safe-error";

describe("getSafeErrorSummary", () => {
  it("keeps diagnostic fields and omits request credentials and error text", () => {
    const summary = getSafeErrorSummary({
      name: "AxiosError",
      code: "ENOTFOUND",
      message: "request failed with api-key=private-value",
      config: { headers: { "X-TYPESENSE-API-KEY": "private-value" } },
      response: {
        status: 503,
        data: { error: "private response details" },
      },
    });

    expect(summary).toEqual({
      name: "AxiosError",
      code: "ENOTFOUND",
      status: 503,
    });
    expect(JSON.stringify(summary)).not.toContain("private-value");
    expect(JSON.stringify(summary)).not.toContain("private response details");
  });

  it("omits malformed diagnostic values and handles non-errors", () => {
    expect(
      getSafeErrorSummary({
        name: "Error with token",
        code: "PRIVATE_VALUE",
        status: 999,
      }),
    ).toEqual({ name: "Error" });
    expect(getSafeErrorSummary("private error text")).toEqual({
      name: "UnknownError",
    });
  });
});
