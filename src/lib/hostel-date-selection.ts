import {
  addCalendarMonths,
  MAX_BOOKING_MONTHS,
} from "@hostello/shared";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateInputValue(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Use UTC date-only values throughout; JavaScript Date.UTC maps years 0000 through 0099 into 1900 through 1999.
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function areStayBoundsValid(minStay: number, maxStay: number | null): boolean {
  return (
    Number.isSafeInteger(minStay) &&
    minStay >= 1 &&
    minStay <= MAX_BOOKING_MONTHS &&
    (maxStay === null ||
      (Number.isSafeInteger(maxStay) && maxStay >= minStay))
  );
}

export function getEffectiveMaxStay(
  minStay: number,
  maxStay: number | null,
): number | null {
  if (!areStayBoundsValid(minStay, maxStay)) return null;
  return Math.min(maxStay ?? MAX_BOOKING_MONTHS, MAX_BOOKING_MONTHS);
}

export interface WholeMonthTerm {
  months: number;
  isMonthEndClamped: boolean;
}

export function getWholeMonthTerm(
  checkIn: string,
  checkOut: string,
): WholeMonthTerm | null {
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  const start = parseDateInputValue(checkIn);
  const end = parseDateInputValue(checkOut);
  if (!start || !end) return null;

  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (
    months < 1 ||
    months > MAX_BOOKING_MONTHS ||
    addCalendarMonths(start, months).getTime() !== end.getTime()
  ) {
    return null;
  }

  const unclampedAnniversaryDay = start.getUTCDate();
  return {
    months,
    isMonthEndClamped: end.getUTCDate() < unclampedAnniversaryDay,
  };
}

export function isStayWithinBounds(
  checkIn: string,
  checkOut: string,
  minStay: number,
  maxStay: number | null,
): boolean {
  if (!areStayBoundsValid(minStay, maxStay)) return false;
  const term = getWholeMonthTerm(checkIn, checkOut);
  const effectiveMaxStay = getEffectiveMaxStay(minStay, maxStay);
  return (
    term !== null &&
    effectiveMaxStay !== null &&
    term.months >= minStay &&
    term.months <= effectiveMaxStay
  );
}
