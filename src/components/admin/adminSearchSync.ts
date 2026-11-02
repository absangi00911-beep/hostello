import { readAdminError } from "./adminListings";

/** Same cap as the sync route's request schema. */
export const HOSTEL_ID_MAX = 64;

export type SearchSyncAction = "sync-all" | "sync-single" | "remove";

export interface SearchSyncResult {
  ok: boolean;
  /** Text to show the admin: the API's message on success, a safe error otherwise. */
  message: string;
}

export function validateHostelId(value: string): string | null {
  const id = value.trim();
  if (!id) return "Enter a hostel ID.";
  if (id.length > HOSTEL_ID_MAX) {
    return `The hostel ID can be at most ${HOSTEL_ID_MAX} characters.`;
  }
  if (/\s/.test(id)) return "A hostel ID has no spaces.";
  return null;
}

/** Human wording for a Retry-After header value in seconds. */
export function retryAfterLabel(header: string | null): string | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 90) return "about a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `about ${minutes} minutes`;
  return `about ${Math.ceil(minutes / 60)} hours`;
}

export function readSyncMessage(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }
  return null;
}

/** Turns the route's response into something safe to show. */
export function interpretSyncResponse(
  status: number,
  payload: unknown,
  retryAfter: string | null,
): SearchSyncResult {
  if (status >= 200 && status < 300) {
    return {
      ok: true,
      message: readSyncMessage(payload) ?? "Request accepted.",
    };
  }
  if (status === 429) {
    const wait = retryAfterLabel(retryAfter);
    return {
      ok: false,
      message: wait
        ? `You have reached the hourly limit for this action. Try again in ${wait}.`
        : readAdminError(payload, "You have reached the hourly limit for this action."),
    };
  }
  return {
    ok: false,
    message: readAdminError(payload, "Something went wrong. Try again."),
  };
}
