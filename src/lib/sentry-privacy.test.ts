import { describe, expect, it } from "vitest";
import { scrubSentryEvent, scrubSentrySpan } from "@/lib/sentry-privacy";

describe("Sentry privacy scrubbing", () => {
  it("removes request data and redacts credentials and direct identifiers", () => {
    const event = {
      message: "Request failed for user@example.com on 03001234567 token=private-token",
      request: {
        method: "POST",
        url: "https://hostello.example/api/auth?token=private-token",
        headers: { authorization: "Bearer private-token" },
        data: { email: "user@example.com", password: "private-password" },
      },
      user: { email: "user@example.com", id: "private-user-id" },
      extra: { apiKey: "private-api-key", operation: "booking.create" },
    };

    const result = scrubSentryEvent(event) as Record<string, unknown>;
    const serialized = JSON.stringify(result);

    expect(result.request).toEqual({ method: "POST" });
    expect(result.user).toBeUndefined();
    expect(serialized).not.toContain("private-token");
    expect(serialized).not.toContain("private-password");
    expect(serialized).not.toContain("private-api-key");
    expect(serialized).not.toContain("user@example.com");
    expect(serialized).not.toContain("03001234567");
    expect(serialized).toContain("booking.create");
  });

  it("redacts sensitive span attributes and strips query strings", () => {
    const result = scrubSentrySpan({
      description: "GET https://hostello.example/search?q=private-search",
      data: {
        "http.url": "https://hostello.example/search?q=private-search",
        "user.email": "user@example.com",
        "http.method": "GET",
      },
    }) as Record<string, unknown>;

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("private-search");
    expect(serialized).not.toContain("user@example.com");
    expect(serialized).toContain("http.method");
  });
});
