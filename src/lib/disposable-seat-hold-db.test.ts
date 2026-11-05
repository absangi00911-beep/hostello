import { describe, expect, it } from "vitest";
import { getDisposableSeatHoldTestDatabaseUrl } from "./disposable-seat-hold-db";

const confirmation = "I_UNDERSTAND_THIS_DATABASE_IS_DISPOSABLE";
const localUrl = "postgresql://test:test@127.0.0.1:5432/hostello_seat_hold_test";

describe("getDisposableSeatHoldTestDatabaseUrl", () => {
  it("accepts only an explicitly confirmed local disposable test database", () => {
    expect(getDisposableSeatHoldTestDatabaseUrl({
      url: localUrl,
      confirmation,
    })).toBe(localUrl);
  });

  it("rejects shared PostgreSQL hosts even when the database name looks disposable", () => {
    expect(() => getDisposableSeatHoldTestDatabaseUrl({
      url: "postgresql://user:pass@ep-shared.neon.tech/hostello_test",
      confirmation,
    })).toThrow();
  });

  it("rejects the general application database URL", () => {
    expect(() => getDisposableSeatHoldTestDatabaseUrl({
      url: localUrl,
      confirmation,
      applicationDatabaseUrl: localUrl,
    })).toThrow();
  });

  it("rejects the application database when connection options differ", () => {
    const applicationUrl = new URL(localUrl);
    applicationUrl.searchParams.set("schema", "public");

    expect(() => getDisposableSeatHoldTestDatabaseUrl({
      url: localUrl,
      confirmation,
      applicationDatabaseUrl: applicationUrl.toString(),
    })).toThrow();
  });

  it("requires the explicit disposable-database confirmation", () => {
    expect(() => getDisposableSeatHoldTestDatabaseUrl({
      url: localUrl,
      confirmation: undefined,
    })).toThrow();
  });
});
