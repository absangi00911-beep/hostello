export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
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
