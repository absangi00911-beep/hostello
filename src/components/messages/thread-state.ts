import type { ConversationThread } from "@/lib/messages-inbox";

export interface ThreadRequestContext {
  conversationId: string;
  requestId: number;
}

export type ThreadPages = Record<number, ConversationThread>;

export function getSelectedThread(
  threadPages: ThreadPages,
  selectedConversationId: string | null,
) {
  if (!selectedConversationId) return undefined;
  const selectedThread = threadPages[1];
  return selectedThread?.id === selectedConversationId
    ? selectedThread
    : undefined;
}

export function isCurrentThreadRequest(
  request: ThreadRequestContext,
  selectedConversationId: string | null,
  activeRequestId: number,
) {
  return (
    request.conversationId === selectedConversationId &&
    request.requestId === activeRequestId
  );
}

export function applyThreadPageResponse(
  currentPages: ThreadPages,
  request: ThreadRequestContext,
  selectedConversationId: string | null,
  activeRequestId: number,
  thread: ConversationThread,
  mode: "append" | "replace",
): ThreadPages {
  if (
    !isCurrentThreadRequest(request, selectedConversationId, activeRequestId) ||
    thread.id !== request.conversationId
  ) {
    return currentPages;
  }

  return mode === "replace"
    ? { 1: thread }
    : { ...currentPages, [thread.messagePage]: thread };
}
