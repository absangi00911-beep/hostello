import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { MessagesInbox } from "./MessagesInbox";
import {
  applyThreadPageResponse,
  getSelectedThread,
} from "./thread-state";
import {
  PENDING_INQUIRY_STORAGE_KEY,
  deliverPendingInquiry,
  fetchConversation,
  fetchConversationList,
  sendMessageAndRefresh,
} from "@/lib/messages-inbox";
import type { ConversationThread as ConversationThreadData } from "@/lib/messages-inbox";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const conversation = {
  id: "conversation-1",
  hostelName: "Canal View Hostel",
  hostel: {
    name: "Canal View Hostel",
    slug: "canal-view",
    coverImage: null,
  },
  participants: [],
  messages: [
    {
      content: "Could I move in next month?",
      read: false,
      senderId: "host-1",
      createdAt: "2026-10-26T12:00:00.000Z",
    },
  ],
  unreadCount: 2,
  updatedAt: "2026-10-26T12:00:00.000Z",
};

function response(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  } as Response;
}

function thread(
  id: string,
  messageId: string,
  messagePage: number,
): ConversationThreadData {
  return {
    ...conversation,
    id,
    messages: [
      {
        id: messageId,
        content: messageId,
        read: true,
        senderId: "student-1",
        sender: { id: "student-1", name: "Student", avatar: null },
        createdAt: "2026-10-26T12:00:00.000Z",
      },
    ],
    booking: null,
    messageTotal: messagePage,
    messagePage,
    messageLimit: 50,
    messageHasMore: messagePage > 1,
  };
}

describe("MessagesInbox API behavior", () => {
  it.each([
    ["refresh", "replace", 1],
    ["load older", "append", 2],
    ["send", "replace", 1],
  ] as const)(
    "ignores a stale %s response after switching conversations",
    (_requestType, mode, responsePage) => {
      const selectedThread = thread("conversation-b", "b-newest", 1);
      const currentPages = { 1: selectedThread };
      const staleResponse = thread("conversation-a", "a-stale", responsePage);

      const updatedPages = applyThreadPageResponse(
        currentPages,
        { conversationId: "conversation-a", requestId: 1 },
        "conversation-b",
        2,
        staleResponse,
        mode,
      );

      expect(updatedPages).toBe(currentPages);
      expect(getSelectedThread(updatedPages, "conversation-b")).toBe(
        selectedThread,
      );
    },
  );

  it("ignores_a_request_from_an_earlier_selection_of_the_same_conversation", () => {
    const selectedThread = thread("conversation-a", "a-current", 1);
    const currentPages = { 1: selectedThread };

    const updatedPages = applyThreadPageResponse(
      currentPages,
      { conversationId: "conversation-a", requestId: 1 },
      "conversation-a",
      3,
      thread("conversation-a", "a-stale", 1),
      "replace",
    );

    expect(updatedPages).toBe(currentPages);
    expect(getSelectedThread(updatedPages, "conversation-a")).toBe(
      selectedThread,
    );
  });

  it("applies_a_response_for_the_current_thread_selection", () => {
    const previousThread = thread("conversation-b", "b-old", 1);
    const refreshedThread = thread("conversation-b", "b-new", 1);

    const updatedPages = applyThreadPageResponse(
      { 1: previousThread },
      { conversationId: "conversation-b", requestId: 2 },
      "conversation-b",
      2,
      refreshedThread,
      "replace",
    );

    expect(updatedPages[1]).toBe(refreshedThread);
    expect(getSelectedThread(updatedPages, "conversation-b")).toBe(
      refreshedThread,
    );
  });

  it("does_not_expose_a_stale_thread_to_the_selected_conversation_composer", () => {
    const staleThread = thread("conversation-a", "a-message", 1);
    const selectedThread = getSelectedThread(
      { 1: staleThread },
      "conversation-b",
    );
    const markup = renderToStaticMarkup(
      <ConversationThread
        conversationId="conversation-b"
        currentUserId="student-1"
        error=""
        loading={true}
        message=""
        messages={selectedThread?.messages ?? []}
        onLoadOlder={vi.fn()}
        onMessageChange={vi.fn()}
        onRefresh={vi.fn()}
        onRetry={vi.fn()}
        onSend={vi.fn()}
        pendingInquiry={false}
        refreshing={false}
        sendError=""
        sending={false}
        thread={selectedThread}
      />,
    );

    expect(selectedThread).toBeUndefined();
    expect(markup).not.toContain('id="messages-compose-input"');
  });

  it("renders_an_accessible_inbox_shell_without_a_selected_thread", () => {
    const markup = renderToStaticMarkup(
      <MessagesInbox currentUserId="student-1" />,
    );

    expect(markup).toContain("<h1>Messages</h1>");
    expect(markup).toContain('aria-label="Conversation list"');
    expect(markup).toContain("Select a conversation");
    expect(markup).toContain("Loading conversations");
  });

  it("renders_paginated_conversations_and_unread_counts", async () => {
    const request = vi.fn().mockResolvedValue(
      response({
        data: [conversation],
        total: 21,
        page: 2,
        limit: 20,
        hasMore: true,
      }),
    );

    const page = await fetchConversationList(2, request);

    expect(request).toHaveBeenCalledWith("/api/conversations?page=2&limit=20");
    expect(page.data[0].unreadCount).toBe(2);
    expect(page).toMatchObject({ total: 21, page: 2, hasMore: true });

    const markup = renderToStaticMarkup(
      <ConversationList
        conversations={page.data}
        currentUserId="student-1"
        error=""
        loading={false}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
        onSelect={vi.fn()}
        page={page}
        paging={false}
        selectedConversationId={null}
      />,
    );
    expect(markup).toContain('aria-label="2 unread messages"');
    expect(markup).toContain("Load more conversations");
  });

  it("loads_selected_thread_and_marks_incoming_messages_read", async () => {
    const thread = {
      ...conversation,
      messages: [
        {
          id: "message-1",
          content: "Could I move in next month?",
          read: true,
          senderId: "host-1",
          sender: { id: "host-1", name: "Host", avatar: null },
          createdAt: "2026-10-26T12:00:00.000Z",
        },
      ],
      messageTotal: 1,
      messagePage: 1,
      messageLimit: 50,
      messageHasMore: false,
      booking: null,
    };
    const request = vi.fn().mockResolvedValue(response({ data: thread }));

    const result = await fetchConversation("conversation-1", 1, request);

    expect(request).toHaveBeenCalledWith(
      "/api/conversations/conversation-1?page=1&limit=50",
    );
    expect(result.messages[0]).toMatchObject({ read: true, senderId: "host-1" });
  });

  it("sends_message_and_refreshes_thread", async () => {
    const refreshedThread = {
      ...conversation,
      messages: [
        {
          id: "message-2",
          content: "Thanks for the details.",
          read: false,
          senderId: "student-1",
          sender: { id: "student-1", name: "Student", avatar: null },
          createdAt: "2026-10-26T12:01:00.000Z",
        },
      ],
      messageTotal: 2,
      messagePage: 1,
      messageLimit: 50,
      messageHasMore: false,
      booking: null,
    };
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          data: {
            id: "message-2",
            content: "Thanks for the details.",
          },
        }),
      )
      .mockResolvedValueOnce(response({ data: refreshedThread }));

    const result = await sendMessageAndRefresh(
      "conversation-1",
      "Thanks for the details.",
      request,
    );

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/conversations/conversation-1",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Thanks for the details." }),
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/conversations/conversation-1?page=1&limit=50",
    );
    expect(result.messages[0].content).toBe("Thanks for the details.");
  });

  it("shows_retryable_load_and_send_errors", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(response({ error: "Temporary load failure" }, false))
      .mockResolvedValueOnce(response({ data: [conversation], total: 1, page: 1, limit: 20, hasMore: false }))
      .mockResolvedValueOnce(response({ error: "Temporary send failure" }, false))
      .mockResolvedValueOnce(
        response({
          data: {
            id: "message-3",
            content: "Please send details.",
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          data: {
            ...conversation,
            messages: [],
            messageTotal: 1,
            messagePage: 1,
            messageLimit: 50,
            messageHasMore: false,
            booking: null,
          },
        }),
      );

    await expect(fetchConversationList(1, request)).rejects.toThrow(
      "Temporary load failure",
    );
    await expect(fetchConversationList(1, request)).resolves.toMatchObject({
      total: 1,
    });
    await expect(
      sendMessageAndRefresh("conversation-1", "Please send details.", request),
    ).rejects.toThrow("Temporary send failure");
    await expect(
      sendMessageAndRefresh("conversation-1", "Please send details.", request),
    ).resolves.toMatchObject({ messageTotal: 1 });

    const thread = {
      ...conversation,
      messages: [
        {
          id: "message-1",
          content: "Earlier message",
          read: true,
          senderId: "host-1",
          sender: { id: "host-1", name: "Host", avatar: null },
          createdAt: "2026-10-25T12:00:00.000Z",
        },
      ],
      booking: null,
      messageTotal: 1,
      messagePage: 1,
      messageLimit: 50,
      messageHasMore: false,
    };
    const markup = renderToStaticMarkup(
      <ConversationThread
        conversationId="conversation-1"
        currentUserId="student-1"
        error="Temporary load failure"
        loading={false}
        message="Please send details."
        messages={thread.messages}
        onLoadOlder={vi.fn()}
        onMessageChange={vi.fn()}
        onRefresh={vi.fn()}
        onRetry={vi.fn()}
        onSend={vi.fn()}
        pendingInquiry={false}
        refreshing={false}
        sendError="Temporary send failure"
        sending={false}
        thread={thread}
      />,
    );
    expect(markup).toContain("Temporary load failure");
    expect(markup).toContain("Temporary send failure");
    expect(markup).toContain("Retry");
    expect(markup).toContain(">Please send details.</textarea>");
  });

  it("loads_older_messages_in_order", async () => {
    const olderThread = {
      ...conversation,
      messages: [
        {
          id: "message-old",
          content: "Earlier message",
          read: true,
          senderId: "host-1",
          sender: { id: "host-1", name: "Host", avatar: null },
          createdAt: "2026-10-25T12:00:00.000Z",
        },
        {
          id: "message-newer",
          content: "Later message",
          read: true,
          senderId: "student-1",
          sender: { id: "student-1", name: "Student", avatar: null },
          createdAt: "2026-10-25T12:01:00.000Z",
        },
      ],
      messageTotal: 100,
      messagePage: 2,
      messageLimit: 50,
      messageHasMore: true,
      booking: null,
    };
    const request = vi.fn().mockResolvedValue(response({ data: olderThread }));

    const result = await fetchConversation("conversation-1", 2, request);

    expect(request).toHaveBeenCalledWith(
      "/api/conversations/conversation-1?page=2&limit=50",
    );
    expect(result.messages.map((message) => message.id)).toEqual([
      "message-old",
      "message-newer",
    ]);
  });

  it("delivers_matching_pending_inquiry_before_selecting_thread", async () => {
    const draft = {
      hostelId: "hostel-1",
      hostelName: "Canal View Hostel",
      message: "Could I move in next month?",
    };
    const storage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify(draft)),
      removeItem: vi.fn(),
    };
    const request = vi.fn().mockResolvedValue(
      response({ data: { id: "conversation-42" } }),
    );

    const result = await deliverPendingInquiry(storage, request);

    expect(request).toHaveBeenCalledWith(
      "/api/conversations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          hostelId: "hostel-1",
          initialMessage: draft.message,
        }),
      }),
    );
    expect(result).toEqual({ conversationId: "conversation-42" });
    expect(storage.removeItem).toHaveBeenCalledWith(
      PENDING_INQUIRY_STORAGE_KEY,
    );
  });

  it("preserves invalid drafts for retry or explicit cancellation", async () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({ hostelId: "", hostelName: "Canal View Hostel", message: "Hello" }),
      ),
      removeItem: vi.fn(),
    };
    const request = vi.fn();

    await expect(deliverPendingInquiry(storage, request)).rejects.toThrow(
      "saved inquiry",
    );
    expect(request).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("keeps a valid draft when the delivery API rejects the hostel", async () => {
    const draft = {
      hostelId: "missing-hostel",
      hostelName: "Unavailable Hostel",
      message: "Is a room available?",
    };
    const storage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify(draft)),
      removeItem: vi.fn(),
    };
    const request = vi.fn().mockResolvedValue(
      response({ error: "Hostel not found." }, false),
    );

    await expect(deliverPendingInquiry(storage, request)).rejects.toThrow(
      "Hostel not found.",
    );
    expect(storage.getItem).toHaveBeenCalledWith(PENDING_INQUIRY_STORAGE_KEY);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
