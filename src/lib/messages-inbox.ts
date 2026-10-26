export const PENDING_INQUIRY_STORAGE_KEY = "hostello:pending-inquiry:v1";

export interface ConversationParticipant {
  userId: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
    studentVerified: boolean;
  };
}

export interface ConversationPreview {
  id: string;
  hostelName: string;
  hostel: {
    name: string;
    slug: string;
    coverImage: string | null;
  };
  participants: ConversationParticipant[];
  messages: Array<{
    content: string;
    read: boolean;
    senderId: string;
    createdAt: string;
  }>;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationListPage {
  data: ConversationPreview[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ConversationMessage {
  id: string;
  content: string;
  read: boolean;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

export interface ConversationThread extends ConversationPreview {
  messages: ConversationMessage[];
  booking: null | {
    checkIn: string;
    checkOut: string;
    months: number;
    status: string;
  };
  messageTotal: number;
  messagePage: number;
  messageLimit: number;
  messageHasMore: boolean;
}

type Request = typeof fetch;
type InboxStorage = Pick<Storage, "getItem" | "removeItem">;

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function responseError(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}

function readData<T>(payload: unknown): T | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload)
  ) {
    return null;
  }
  return payload.data as T;
}

export async function fetchConversationList(
  page: number,
  request: Request = fetch,
): Promise<ConversationListPage> {
  const response = await request(`/api/conversations?page=${page}&limit=20`);
  const payload = await readJson(response);
  const data =
    typeof payload === "object" && payload !== null
      ? (payload as ConversationListPage)
      : null;
  if (!response.ok || !data || !Array.isArray(data.data)) {
    throw new Error(responseError(payload, "Couldn't load your conversations."));
  }
  return data;
}

export async function fetchConversation(
  conversationId: string,
  page: number,
  request: Request = fetch,
): Promise<ConversationThread> {
  const response = await request(
    `/api/conversations/${encodeURIComponent(conversationId)}?page=${page}&limit=50`,
  );
  const payload = await readJson(response);
  const data = readData<ConversationThread>(payload);
  if (!response.ok || !data || !Array.isArray(data.messages)) {
    throw new Error(responseError(payload, "Couldn't load this conversation."));
  }
  return data;
}

export class MessagesSendRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessagesSendRefreshError";
  }
}

export async function sendMessageAndRefresh(
  conversationId: string,
  content: string,
  request: Request = fetch,
): Promise<ConversationThread> {
  const response = await request(
    `/api/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  const payload = await readJson(response);
  if (!response.ok || !readData(payload)) {
    throw new Error(responseError(payload, "Couldn't send your message."));
  }

  try {
    return await fetchConversation(conversationId, 1, request);
  } catch {
    throw new MessagesSendRefreshError(
      "Your message was sent, but the conversation couldn't refresh. Refresh the thread to confirm it arrived.",
    );
  }
}

function parsePendingInquiry(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("hostelId" in value) ||
    !("hostelName" in value) ||
    !("message" in value) ||
    typeof value.hostelId !== "string" ||
    typeof value.hostelName !== "string" ||
    typeof value.message !== "string"
  ) {
    return null;
  }

  const hostelId = value.hostelId.trim();
  const hostelName = value.hostelName.trim();
  const message = value.message.trim();
  if (
    hostelId.length === 0 ||
    hostelId.length > 128 ||
    hostelName.length === 0 ||
    message.length === 0 ||
    message.length > 2_000
  ) {
    return null;
  }
  return { hostelId, hostelName, message };
}

export async function deliverPendingInquiry(
  storage: InboxStorage,
  request: Request = fetch,
): Promise<{ conversationId: string }> {
  let draft: ReturnType<typeof parsePendingInquiry>;
  try {
    const stored = storage.getItem(PENDING_INQUIRY_STORAGE_KEY);
    draft = stored ? parsePendingInquiry(JSON.parse(stored)) : null;
  } catch {
    throw new Error("Couldn't read your saved inquiry. Retry or discard it.");
  }

  if (!draft) {
    throw new Error("Your saved inquiry is missing or invalid. Retry or discard it.");
  }

  let response: Response;
  let payload: unknown;
  try {
    response = await request("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostelId: draft.hostelId,
        initialMessage: draft.message,
      }),
    });
    payload = await readJson(response);
  } catch {
    throw new Error("Couldn't send your saved inquiry. Retry or discard it.");
  }

  const data = readData<{ id?: unknown }>(payload);
  if (
    !response.ok ||
    !data ||
    typeof data.id !== "string" ||
    data.id.length === 0
  ) {
    throw new Error(
      responseError(payload, "Couldn't send your saved inquiry. Retry or discard it."),
    );
  }

  try {
    storage.removeItem(PENDING_INQUIRY_STORAGE_KEY);
  } catch {
    throw new Error(
      "Your inquiry was sent, but its saved draft couldn't be cleared. Discard the saved copy before retrying.",
    );
  }
  return { conversationId: data.id };
}

export function displayMessageDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
}

export function participantName(
  participants: ConversationParticipant[],
  userId: string,
) {
  const other = participants.find((participant) => participant.userId !== userId);
  return other?.user.name?.trim() || "Hostello member";
}
