export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Adds calendar months in UTC, clamping month-end dates (for example Jan 31 + 1 month = Feb 28). */
export function addCalendarMonths(date: Date, monthsToAdd: number): Date {
  const result = new Date(date);
  const targetMonth = result.getUTCMonth() + monthsToAdd;
  const targetYear = result.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const originalDay = result.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();

  result.setUTCDate(1);
  result.setUTCFullYear(targetYear, normalizedMonth, Math.min(originalDay, lastDayOfTargetMonth));
  return result;
}

/** Returns true only for an exact positive whole-calendar-month stay. */
export function isWholeMonthStay(checkIn: Date, checkOut: Date): boolean {
  if (!Number.isFinite(checkIn.getTime()) || !Number.isFinite(checkOut.getTime()) || checkOut <= checkIn) {
    return false;
  }
  const months =
    (checkOut.getUTCFullYear() - checkIn.getUTCFullYear()) * 12 +
    (checkOut.getUTCMonth() - checkIn.getUTCMonth());
  return months >= 1 && addCalendarMonths(checkIn, months).getTime() === checkOut.getTime();
}

export function calculateMonths(checkIn: Date, checkOut: Date): number {
  const months =
    (checkOut.getUTCFullYear() - checkIn.getUTCFullYear()) * 12 +
    (checkOut.getUTCMonth() - checkIn.getUTCMonth());
  return Math.max(1, months);
}

export function getPakistanCalendarDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}
