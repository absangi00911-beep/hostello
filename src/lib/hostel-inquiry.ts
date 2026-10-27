export const PENDING_INQUIRY_STORAGE_KEY = "hostello:pending-inquiry:v1";

export interface PendingInquiryDraft {
  hostelId: string;
  hostelName: string;
  message: string;
}

type InquiryOutcome = { destination: string } | { error: "storage" | "delivery" };

interface SubmitHostelInquiryOptions extends PendingInquiryDraft {
  isSignedInStudent: boolean;
  storage?: Pick<Storage, "setItem">;
  request?: typeof fetch;
}

function readConversationId(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("id" in value.data) ||
    typeof value.data.id !== "string" ||
    value.data.id.length === 0
  ) {
    return null;
  }

  return value.data.id;
}

export async function submitHostelInquiry({
  hostelId,
  hostelName,
  message,
  isSignedInStudent,
  storage,
  request = fetch,
}: SubmitHostelInquiryOptions): Promise<InquiryOutcome> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) return { error: "delivery" };

  if (!isSignedInStudent) {
    const draft: PendingInquiryDraft = {
      hostelId,
      hostelName,
      message: trimmedMessage,
    };

    try {
      if (!storage) return { error: "storage" };
      storage.setItem(PENDING_INQUIRY_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      return { error: "storage" };
    }

    return {
      destination: `/login?callbackUrl=${encodeURIComponent("/messages?pendingInquiry=1")}`,
    };
  }

  try {
    const response = await request("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostelId, initialMessage: trimmedMessage }),
    });
    const result: unknown = await response.json().catch(() => null);
    const conversationId = readConversationId(result);

    if (!response.ok || !conversationId) return { error: "delivery" };

    return {
      destination: `/messages?conversationId=${encodeURIComponent(conversationId)}`,
    };
  } catch {
    return { error: "delivery" };
  }
}
