/** Same limit as `MAX_REASON_LENGTH` in the blocked-dates API route. */
export const REASON_MAX_LENGTH = 250;

export interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface BlockedRangesPage {
  data: BlockedRange[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface BlockedRangeInput {
  startDate: string;
  endDate: string;
  reason: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function parseBlockedRange(value: unknown): BlockedRange | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isValidDateString(value.startDate) ||
    !isValidDateString(value.endDate) ||
    !(value.reason == null || typeof value.reason === "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    startDate: value.startDate,
    endDate: value.endDate,
    reason: typeof value.reason === "string" ? value.reason : null,
  };
}

/** Parses `GET .../blocked-dates`; null when the shape is unexpected. */
export function parseBlockedRangesPage(value: unknown): BlockedRangesPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseBlockedRange);
  if (data.some((range) => range === null)) return null;
  return {
    data: data as BlockedRange[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

/** Reads `{ data }` from the POST response. */
export function parseCreatedRange(value: unknown): BlockedRange | null {
  return isRecord(value) ? parseBlockedRange(value.data) : null;
}

export function readBlockedDatesError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function validateBlockedRange(values: BlockedRangeInput): string | null {
  if (!DATE_ONLY.test(values.startDate) || !DATE_ONLY.test(values.endDate)) {
    return "Choose a start and end date.";
  }
  if (values.endDate < values.startDate) {
    return "The end date must be on or after the start date.";
  }
  if (values.reason.trim().length > REASON_MAX_LENGTH) {
    return `Reason can be at most ${REASON_MAX_LENGTH} characters.`;
  }
  return null;
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/**
 * Ranges are whole calendar days stored at UTC midnight and the end day is
 * blocked too, so they are formatted in UTC to avoid shifting by a day.
 */
export function formatBlockedRange(startDate: string, endDate: string): string {
  const start = dateFormatter.format(new Date(startDate));
  const end = dateFormatter.format(new Date(endDate));
  return start === end ? start : `${start} – ${end}`;
}
