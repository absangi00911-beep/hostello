import { addCalendarMonths } from "@hostello/shared";

const MAX_SCAN_DAYS = 800;

function toDateValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateValue(date);
}

/**
 * Resolves where a calendar key press should move focus, as a YYYY-MM-DD value.
 * Disabled buttons cannot take focus, so the move scans onward in the key's direction
 * until it reaches a date the caller reports as selectable. Returns null when the key
 * is not a navigation key or no selectable date exists in that direction (never moves
 * focus before `today`).
 */
export function getCalendarFocusTarget(
  from: string,
  key: string,
  today: string,
  isDisabled: (dateValue: string) => boolean,
): string | null {
  const weekday = new Date(`${from}T00:00:00.000Z`).getUTCDay();
  const dayStep: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
    Home: -weekday,
    End: 6 - weekday,
  };

  let candidate: string;
  let direction: 1 | -1;
  if (Object.hasOwn(dayStep, key)) {
    candidate = addUtcDays(from, dayStep[key]);
    direction = dayStep[key] < 0 ? -1 : 1;
  } else if (key === "PageUp" || key === "PageDown") {
    direction = key === "PageUp" ? -1 : 1;
    candidate = toDateValue(
      addCalendarMonths(new Date(`${from}T00:00:00.000Z`), direction),
    );
  } else {
    return null;
  }

  for (let scanned = 0; scanned < MAX_SCAN_DAYS; scanned += 1) {
    if (candidate < today) return null;
    if (!isDisabled(candidate)) return candidate === from ? null : candidate;
    candidate = addUtcDays(candidate, direction);
  }
  return null;
}
