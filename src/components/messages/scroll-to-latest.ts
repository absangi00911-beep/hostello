/**
 * Decides whether a conversation thread should scroll its newest message into view.
 * Scroll when a conversation is first shown with messages, and when the person has just sent a
 * message. Never scroll for a message that arrived while they may be reading older ones, and
 * never for "load older messages" (the newest message does not change).
 */
export function shouldScrollToLatest({
  previousConversationId,
  previousLastMessageId,
  conversationId,
  lastMessageId,
  lastMessageIsOwn,
}: {
  previousConversationId: string | null;
  previousLastMessageId: string | null;
  conversationId: string;
  lastMessageId: string | null;
  lastMessageIsOwn: boolean;
}): boolean {
  if (!lastMessageId) return false;
  if (previousConversationId !== conversationId) return true;
  return previousLastMessageId !== lastMessageId && lastMessageIsOwn;
}
