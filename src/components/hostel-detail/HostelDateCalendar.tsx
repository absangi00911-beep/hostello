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
        className="hostel-date-calendar-month"
        key={monthStart.toISOString()}
      >
        <h3>{format(monthStart, "MMMM yyyy")}</h3>
        <div aria-hidden="true" className="hostel-date-calendar-weekdays">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div
          aria-label={`${format(monthStart, "MMMM yyyy")} dates`}
          className="hostel-date-calendar-days"
          role="group"
        >
          {dateCells.map((day, index) => {
            if (day === null) {
              return (
                <span
                  aria-hidden="true"
                  className="hostel-date-calendar-empty"
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
            const className = [
              "hostel-date-calendar-day",
              isMoveIn ? "is-move-in" : "",
              isMoveOut ? "is-move-out" : "",
              isInRange ? "is-in-range" : "",
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
      className="hostel-date-calendar"
      role="region"
    >
      <div className="hostel-date-calendar-heading">
        <div>
          <h2 id="hostel-date-calendar-title">Choose your dates</h2>
          <p>
            Select move-in and move-out dates. Minimum stay: {minimumStay}
            {maximumStay ? `; maximum stay: ${maximumStay}` : ""}.
          </p>
        </div>
        <div className="hostel-date-calendar-controls">
          {(checkIn || checkOut) && (
            <button
              className="hostel-date-calendar-clear"
              onClick={() => selectMoveIn("")}
              type="button"
            >
              Clear dates
            </button>
          )}
          <button
            aria-label="Previous month"
            className="hostel-date-calendar-nav"
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
            className="hostel-date-calendar-nav"
            onClick={() =>
              setFirstMonth((month) => startOfMonth(addMonths(month, 1)))
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <div className="hostel-date-calendar-months">
        {[0, 1].map((offset) =>
          renderMonth(addMonths(firstMonth, offset)),
        )}
      </div>
    </section>
  );
}
