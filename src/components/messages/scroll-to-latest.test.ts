import { describe, expect, it } from "vitest";
import { shouldScrollToLatest } from "./scroll-to-latest";

const base = {
  previousConversationId: "c1",
  previousLastMessageId: "m1",
  conversationId: "c1",
  lastMessageId: "m1",
  lastMessageIsOwn: false,
};

describe("shouldScrollToLatest", () => {
  it("scrolls when a conversation is first shown with messages", () => {
    expect(
      shouldScrollToLatest({ ...base, previousConversationId: null, previousLastMessageId: null }),
    ).toBe(true);
    expect(shouldScrollToLatest({ ...base, previousConversationId: "c0" })).toBe(true);
  });

  it("does not scroll while a conversation has no messages yet", () => {
    expect(
      shouldScrollToLatest({ ...base, previousConversationId: null, lastMessageId: null }),
    ).toBe(false);
  });

  it("scrolls after the person sends a message", () => {
    expect(
      shouldScrollToLatest({ ...base, lastMessageId: "m2", lastMessageIsOwn: true }),
    ).toBe(true);
  });

  it("leaves the reader alone when someone else's message arrives", () => {
    expect(
      shouldScrollToLatest({ ...base, lastMessageId: "m2", lastMessageIsOwn: false }),
    ).toBe(false);
  });

  it("does not scroll when older messages load (newest unchanged)", () => {
    expect(shouldScrollToLatest({ ...base, lastMessageIsOwn: true })).toBe(false);
  });
});
