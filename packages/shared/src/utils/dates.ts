export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateMonths(checkIn: Date, checkOut: Date): number {
  const months =
    (checkOut.getFullYear() - checkIn.getFullYear()) * 12 +
    (checkOut.getMonth() - checkIn.getMonth());
  return Math.max(1, months);
}
