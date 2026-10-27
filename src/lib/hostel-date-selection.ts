import { calculateMonths } from "@/lib/utils";

function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

export function isStayWithinBounds(
  checkIn: string,
  checkOut: string,
  minStay: number,
  maxStay: number | null,
): boolean {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;

  const start = parseDateInputValue(checkIn);
  const end = parseDateInputValue(checkOut);
  if (!start || !end) return false;

  const months = calculateMonths(start, end);
  return months >= minStay && (maxStay === null || months <= maxStay);
}
