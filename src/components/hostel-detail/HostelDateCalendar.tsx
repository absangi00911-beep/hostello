"use client";

import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { isStayWithinBounds } from "@/lib/hostel-date-selection";
import { useHostelDateSelection } from "./HostelDateSelectionProvider";

interface HostelDateCalendarProps {
  minStay: number;
  maxStay: number | null;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateInputValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function HostelDateCalendar({
  minStay,
  maxStay,
}: HostelDateCalendarProps) {
  const { checkIn, checkOut, selectMoveIn, setMoveOut } =
    useHostelDateSelection();
  const [firstMonth, setFirstMonth] = useState(() => startOfMonth(new Date()));
  const [today] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const todayValue = toDateInputValue(today);
  const minimumStay = `${minStay} ${minStay === 1 ? "month" : "months"}`;
  const maximumStay =
    maxStay === null
      ? null
      : `${maxStay} ${maxStay === 1 ? "month" : "months"}`;

  function renderMonth(month: Date) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const leadingDays = getDay(monthStart);
    const monthDays = monthEnd.getDate();
    const days = Array.from({ length: monthDays }, (_, index) => index + 1);
    const dateCells = [
      ...Array.from({ length: leadingDays }, () => null),
      ...days,
    ];

    return (
      <div
        className=""
        key={monthStart.toISOString()}
      >
        <h3 className="m-0 mb-4 text-base leading-6 font-[650]">
          {format(monthStart, "MMMM yyyy")}
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
          aria-label={`${format(monthStart, "MMMM yyyy")} dates`}
          className="grid grid-cols-7 justify-items-center gap-y-1"
          role="group"
        >
          {dateCells.map((day, index) => {
            if (day === null) {
              return (
                <span
                  aria-hidden="true"
                  className="aspect-square w-[min(100%,40px)]"
                  key={`empty-${index}`}
                />
              );
            }

            const date = new Date(
              monthStart.getFullYear(),
              monthStart.getMonth(),
              day,
            );
            const dateValue = toDateInputValue(date);
            const isWaitingForMoveOut = Boolean(checkIn && !checkOut);
            const canChooseMoveIn =
              !isWaitingForMoveOut || dateValue <= checkIn;
            const canChooseMoveOut =
              isWaitingForMoveOut &&
              dateValue > checkIn &&
              isStayWithinBounds(
                checkIn,
                dateValue,
                minStay,
                maxStay,
              );
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
              "grid aspect-square w-[min(100%,40px)] cursor-pointer place-items-center border-0 text-sm tabular-nums text-ink aria-[current=date]:border aria-[current=date]:border-brand-dark aria-[pressed=false]:hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40",
              dateStyle,
              isMoveIn ? "is-move-in" : "",
              isMoveOut ? "is-move-out" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                aria-current={dateValue === todayValue ? "date" : undefined}
                aria-label={`Select ${action} date ${format(date, "MMMM d, yyyy")}`}
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
            Select move-in and move-out dates. Minimum stay: {minimumStay}
            {maximumStay ? `; maximum stay: ${maximumStay}` : ""}.
          </p>
        </div>
        <div className="flex flex-[0_0_auto] items-center gap-2 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:justify-end">
          {(checkIn || checkOut) && (
            <button
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2!"
              onClick={() => selectMoveIn("")}
              type="button"
            >
              Clear dates
            </button>
          )}
          <button
            aria-label="Previous month"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink hover:enabled:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2! disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50"
            disabled={
              firstMonth.getFullYear() === today.getFullYear() &&
              firstMonth.getMonth() <= today.getMonth()
            }
            onClick={() =>
              setFirstMonth((month) => startOfMonth(addMonths(month, -1)))
            }
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Next month"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-surface-muted focus-visible:outline-2! focus-visible:outline-brand-dark! focus-visible:outline-offset-2!"
            onClick={() =>
              setFirstMonth((month) => startOfMonth(addMonths(month, 1)))
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 [@media(max-width:720px)]:grid-cols-1">
        {[0, 1].map((offset) =>
          renderMonth(addMonths(firstMonth, offset)),
        )}
      </div>
    </section>
  );
}
