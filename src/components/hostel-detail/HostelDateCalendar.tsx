"use client";

import {
  addCalendarMonths,
  getPakistanCalendarDate,
  MAX_BOOKING_MONTHS,
} from "@hostello/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  areStayBoundsValid,
  getEffectiveMaxStay,
  isStayWithinBounds,
} from "@/lib/hostel-date-selection";
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
  const maximumStay = effectiveMaxStay === null
    ? null
    : `${effectiveMaxStay} ${effectiveMaxStay === 1 ? "month" : "months"}`;

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
      <div
        className="[@media(max-width:720px)]:-mx-5 [@media(max-width:720px)]:w-[calc(100%_+_40px)]"
        key={toDateInputValue(monthStart)}
      >
        <h3 className="m-0 mb-4 px-5 text-base leading-6 font-[650]">
          {monthLabel}
        </h3>
        <div
          aria-hidden="true"
          className="mb-[6px] grid grid-cols-7 justify-items-center text-xs font-semibold text-muted"
        >
          {weekDays.map((day) => (
            <span className="py-[5px]" key={day}>
              {day}
            </span>
          ))}
        </div>
        <div
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
            const isWaitingForMoveOut = Boolean(checkIn && !checkOut);
            const canChooseMoveIn =
              !isWaitingForMoveOut || dateValue <= checkIn;
            const canChooseMoveOut =
              validStayBounds &&
              isWaitingForMoveOut &&
              dateValue > checkIn &&
              isStayWithinBounds(checkIn, dateValue, minStay, maxStay);
            const action = canChooseMoveIn ? "move-in" : "move-out";
            const isDisabled =
              dateValue < todayValue ||
              (!canChooseMoveIn && !canChooseMoveOut);
            const isMoveIn = dateValue === checkIn;
            const isMoveOut = dateValue === checkOut;
            const isInRange =
              Boolean(checkIn && checkOut) &&
              dateValue > checkIn &&
              dateValue < checkOut;
            const dateStyle =
              isMoveIn || isMoveOut
                ? "rounded-full bg-brand-dark text-white"
                : isInRange
                  ? "is-in-range rounded-none bg-surface-muted"
                  : "rounded-full bg-transparent";
            const className = [
              "grid aspect-square w-[min(100%,44px)] cursor-pointer place-items-center border-0 text-sm tabular-nums text-ink aria-[current=date]:border aria-[current=date]:border-brand-dark aria-[pressed=false]:hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40",
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
                disabled={isDisabled}
                key={dateValue}
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
      className="border-t border-line pt-5"
      role="region"
    >
      <div className="mb-4 flex items-start justify-between gap-4 [@media(max-width:720px)]:flex-col">
        <div>
          <h2
            className="m-0 text-xl leading-[1.35] font-semibold tracking-[-0.02em]"
            id="hostel-date-calendar-title"
          >
            Choose your dates
          </h2>
          <p className="mt-[6px] mb-0 text-sm leading-[1.5] text-muted">
            Choose move-in first, then a move-out date exactly {minimumStay} or
            more later. Monthly anniversaries clamp to the last day of shorter
            months; maximum stay: {maximumStay ?? `${MAX_BOOKING_MONTHS} months`}.
            Global maximum: {MAX_BOOKING_MONTHS} months.
          </p>
          {!validStayBounds && (
            <p className="mt-2 mb-0 text-sm leading-[1.5] text-[#8b2525]" role="alert">
              This listing&apos;s stay requirements are invalid, so booking is unavailable.
            </p>
          )}
        </div>
        <div className="flex flex-[0_0_auto] items-center gap-2 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:justify-end">
          {(checkIn || checkOut) && (
            <button
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! btn-secondary"
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
        {[0, 1].map((offset) =>
          renderMonth(monthStartPlus(firstMonth, offset)),
        )}
      </div>
    </section>
  );
}
