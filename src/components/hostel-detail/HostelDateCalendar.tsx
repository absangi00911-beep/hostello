"use client";

import {
  addCalendarMonths,
  getPakistanCalendarDate,
  MAX_BOOKING_MONTHS,
} from "@hostello/shared";
import {
  ChevronLeft,
  ChevronRight,
} from "@/components/icons/HostelloIcons";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  areStayBoundsValid,
  getEffectiveMaxStay,
  isStayWithinBounds,
} from "@/lib/hostel-date-selection";
import { getCalendarFocusTarget } from "@/lib/calendar-keyboard";
import { useHostelDateSelection } from "./HostelDateSelectionProvider";

interface HostelDateCalendarProps {
  minStay: number;
  maxStay: number | null;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatUtcMonth(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatUtcDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function monthStartPlus(month: Date, offset: number): Date {
  return addCalendarMonths(startOfUtcMonth(month), offset);
}

function monthDateValues(month: Date): string[] {
  const monthStart = startOfUtcMonth(month);
  const monthDays = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Array.from({ length: monthDays }, (_, index) =>
    toDateInputValue(
      new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), index + 1),
      ),
    ),
  );
}

export function HostelDateCalendar({
  minStay,
  maxStay,
}: HostelDateCalendarProps) {
  const { checkIn, checkOut, selectMoveIn, setMoveOut } =
    useHostelDateSelection();
  const [firstMonth, setFirstMonth] = useState(() =>
    startOfUtcMonth(getPakistanCalendarDate()),
  );
  const todayValue = toDateInputValue(getPakistanCalendarDate());
  const validStayBounds = areStayBoundsValid(minStay, maxStay);
  const effectiveMaxStay = getEffectiveMaxStay(minStay, maxStay);
  const minimumStay = `${minStay} ${minStay === 1 ? "month" : "months"}`;
  const maximumMonths = effectiveMaxStay ?? MAX_BOOKING_MONTHS;
  const maximumStay = `${maximumMonths} ${maximumMonths === 1 ? "month" : "months"}`;
  const hintId = useId();
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const isWaitingForMoveOut = Boolean(checkIn && !checkOut);

  function getDateState(dateValue: string) {
    const canChooseMoveIn = !isWaitingForMoveOut || dateValue <= checkIn;
    const canChooseMoveOut =
      validStayBounds &&
      isWaitingForMoveOut &&
      dateValue > checkIn &&
      isStayWithinBounds(checkIn, dateValue, minStay, maxStay);
    return {
      canChooseMoveIn,
      canChooseMoveOut,
      isDisabled:
        dateValue < todayValue || (!canChooseMoveIn && !canChooseMoveOut),
    };
  }

  const visibleMonths = [0, 1].map((offset) => monthStartPlus(firstMonth, offset));
  const enabledVisibleDates = visibleMonths
    .flatMap(monthDateValues)
    .filter((dateValue) => !getDateState(dateValue).isDisabled);
  // One tab stop for the whole grid (roving tabindex); arrow keys move inside it.
  const tabStopDate =
    [focusedDate, checkOut, checkIn].find(
      (dateValue) => dateValue && enabledVisibleDates.includes(dateValue),
    ) ??
    enabledVisibleDates[0] ??
    null;

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    document
      .querySelector<HTMLButtonElement>(`[data-calendar-date="${target}"]`)
      ?.focus();
  });

  function moveFocus(from: string, event: KeyboardEvent<HTMLButtonElement>) {
    const target = getCalendarFocusTarget(
      from,
      event.key,
      todayValue,
      (dateValue) => getDateState(dateValue).isDisabled,
    );
    if (event.key.startsWith("Arrow") || event.key.startsWith("Page") ||
        event.key === "Home" || event.key === "End") {
      event.preventDefault();
    }
    if (!target) return;

    const targetMonth = startOfUtcMonth(new Date(`${target}T00:00:00.000Z`));
    const secondMonth = monthStartPlus(firstMonth, 1);
    if (targetMonth < startOfUtcMonth(firstMonth)) {
      setFirstMonth(targetMonth);
    } else if (targetMonth > secondMonth) {
      setFirstMonth(addCalendarMonths(targetMonth, -1));
    }
    pendingFocus.current = target;
    setFocusedDate(target);
  }

  const selectionStatus = !checkIn
    ? "Choose a move-in date."
    : !checkOut
      ? `Move-in ${formatUtcDate(new Date(`${checkIn}T00:00:00.000Z`))}. Now choose a move-out date at least ${minimumStay} later.`
      : `Move-in ${formatUtcDate(new Date(`${checkIn}T00:00:00.000Z`))}. Move-out ${formatUtcDate(new Date(`${checkOut}T00:00:00.000Z`))}.`;

  function renderMonth(month: Date) {
    const monthStart = startOfUtcMonth(month);
    const leadingDays = monthStart.getUTCDay();
    const monthDays = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const dateCells = [
      ...Array.from({ length: leadingDays }, () => null),
      ...Array.from({ length: monthDays }, (_, index) => index + 1),
    ];
    const monthLabel = formatUtcMonth(monthStart);

    return (
      <div className="mx-auto w-full max-w-[390px]" key={toDateInputValue(monthStart)}>
        <h3 className="m-0 mb-4 text-body leading-6 font-[650]">
          {monthLabel}
        </h3>
        <div
          aria-hidden="true"
          className="mb-[6px] grid grid-cols-7 justify-items-center text-meta font-semibold text-muted"
        >
          {weekDays.map((day) => (
            <span className="py-[5px]" key={day}>
              {day}
            </span>
          ))}
        </div>
        <div
          aria-describedby={hintId}
          aria-label={`${monthLabel} dates`}
          className="grid grid-cols-7 justify-items-center gap-y-1"
          role="group"
        >
          {dateCells.map((day, index) => {
            if (day === null) {
              return (
                <span
                  aria-hidden="true"
                  className="aspect-square w-[min(100%,44px)]"
                  key={`empty-${index}`}
                />
              );
            }

            const date = new Date(
              Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day),
            );
            const dateValue = toDateInputValue(date);
            const { canChooseMoveIn, canChooseMoveOut, isDisabled } =
              getDateState(dateValue);
            const action = canChooseMoveIn ? "move-in" : "move-out";
            const isMoveIn = dateValue === checkIn;
            const isMoveOut = dateValue === checkOut;
            const isInRange =
              Boolean(checkIn && checkOut) &&
              dateValue > checkIn &&
              dateValue < checkOut;
            const dateStyle =
              isMoveIn || isMoveOut
                ? "rounded-full bg-brand text-white font-semibold"
                : isInRange
                  ? "is-in-range rounded-none bg-brand-soft text-brand-dark"
                  : "rounded-full bg-transparent";
            const className = [
              "grid aspect-square w-[min(100%,44px)] cursor-pointer place-items-center border-0 text-label font-medium tabular-nums transition-colors duration-150 aria-[current=date]:border aria-[current=date]:border-brand-dark aria-[pressed=false]:hover:bg-brand-soft aria-[pressed=false]:hover:text-brand-dark aria-[pressed=true]:hover:bg-brand-dark focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40",
              dateStyle,
              isMoveIn ? "is-move-in" : "",
              isMoveOut ? "is-move-out" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                aria-current={dateValue === todayValue ? "date" : undefined}
                aria-label={`Select ${action} date ${formatUtcDate(date)}`}
                aria-pressed={isMoveIn || isMoveOut}
                className={className}
                data-calendar-date={dateValue}
                disabled={isDisabled}
                key={dateValue}
                onFocus={() => setFocusedDate(dateValue)}
                onKeyDown={(event) => moveFocus(dateValue, event)}
                tabIndex={dateValue === tabStopDate ? 0 : -1}
                onClick={() => {
                  if (canChooseMoveIn) {
                    selectMoveIn(dateValue);
                  } else if (canChooseMoveOut) {
                    setMoveOut(dateValue);
                  }
                }}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="hostel-date-calendar-title"
      className="rounded-xl border border-line bg-white px-1 py-4 sm:px-4 sm:py-6"
      role="region"
    >
      <div className="mb-4 flex items-start justify-between gap-4 [@media(max-width:720px)]:flex-col">
        <div>
          <h2
            className="m-0 text-title leading-[1.35] font-semibold tracking-[-0.02em]"
            id="hostel-date-calendar-title"
          >
            Choose your dates
          </h2>
          <p className="mt-[6px] mb-0 max-w-prose text-label leading-[1.5] text-muted">
            Choose move-in first, then a move-out date exactly {minimumStay} or
            more later. Monthly anniversaries clamp to the last day of shorter
            months. Maximum stay: {maximumStay}.
          </p>
          <p
            className="mt-3 mb-0 text-label leading-[1.5] font-semibold text-ink"
            role="status"
          >
            {validStayBounds ? selectionStatus : null}
          </p>
          <p className="sr-only" id={hintId}>
            Use the arrow keys to move between dates, Home and End for the start
            and end of the week, and Page Up and Page Down to change month.
          </p>
          {!validStayBounds && (
            <p className="mt-2 mb-0 text-label leading-[1.5] text-danger" role="alert">
              This listing&apos;s stay requirements are invalid, so booking is unavailable.
            </p>
          )}
        </div>
        <div className="flex flex-[0_0_auto] items-center gap-2 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:justify-end">
          {(checkIn || checkOut) && (
            <button
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-label font-semibold text-ink hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! btn-secondary"
              onClick={() => selectMoveIn("")}
              type="button"
            >
              Clear dates
            </button>
          )}
          <button
            aria-label="Previous month"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:enabled:border-line-strong hover:enabled:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50 btn-secondary"
            disabled={
              firstMonth.getUTCFullYear() === Number(todayValue.slice(0, 4)) &&
              firstMonth.getUTCMonth() <= Number(todayValue.slice(5, 7)) - 1
            }
            onClick={() =>
              setFirstMonth((month) => addCalendarMonths(month, -1))
            }
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Next month"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-line-strong hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! btn-secondary"
            onClick={() =>
              setFirstMonth((month) => addCalendarMonths(month, 1))
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 [@media(max-width:720px)]:grid-cols-1">
        {visibleMonths.map((month) => renderMonth(month))}
      </div>
    </section>
  );
}
