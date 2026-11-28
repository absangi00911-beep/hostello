// Path: src/lib/format-date-only.ts
//
// Displays a calendar date stored as "YYYY-MM-DD" (move-in, move-out, ...) the way the rest of
// the app writes dates: "20 Dec 2026". Read as UTC so the day never shifts with the viewer's
// time zone.
export function formatDateOnlyForDisplay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
