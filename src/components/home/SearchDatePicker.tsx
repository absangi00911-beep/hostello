"use client";

import { useState } from "react";
import { SearchCalendarMonth } from "./SearchCalendarMonth";

interface SearchDatePickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

type DateMode = "dates" | "flexible";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function SearchDatePicker({
  selectedDate,
  onSelect,
}: SearchDatePickerProps) {
  const [mode, setMode] = useState<DateMode>("dates");
  const [monthOffset, setMonthOffset] = useState(0);
  const [flexibleMonth, setFlexibleMonth] = useState<Date | null>(null);
  const currentMonth = startOfMonth(new Date());

  return (
    <div>
      <div
        aria-label="Date selection mode"
        className="mb-5 flex w-fit gap-1 rounded-full bg-[#f5f5f4] p-1"
        role="tablist"
      >
        {(["dates", "flexible"] as const).map((option) => (
          <button
            aria-selected={mode === option}
            className="min-h-9 rounded-full px-4 text-sm font-medium capitalize transition-colors aria-selected:bg-white aria-selected:text-ink aria-selected:shadow-[0_1px_3px_rgb(0_0_0_/_10%)] focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-2!"
            key={option}
            onClick={() => setMode(option)}
            role="tab"
            type="button"
          >
            {option === "dates" ? "Dates" : "Flexible"}
          </button>
        ))}
      </div>

      {mode === "dates" ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="m-0 text-sm font-semibold text-ink">Choose a date</p>
            <div className="flex gap-2">
              <button
                aria-label="Previous month"
                className="grid size-9 place-items-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2! focus-visible:outline-brand!"
                disabled={monthOffset === 0}
                onClick={() => setMonthOffset((offset) => offset - 1)}
                type="button"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                aria-label="Next month"
                className="grid size-9 place-items-center rounded-full border border-line text-ink focus-visible:outline-2! focus-visible:outline-brand!"
                onClick={() => setMonthOffset((offset) => offset + 1)}
                type="button"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-7 [@media(max-width:520px)]:grid-cols-1">
            {[monthOffset, monthOffset + 1].map((offset) => (
              <SearchCalendarMonth
                key={offset}
                month={
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + offset,
                    1,
                  )
                }
                onSelect={onSelect}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">
            {flexibleMonth
              ? `Choose a move-in day in ${MONTH_FORMATTER.format(flexibleMonth)}`
              : "Choose a month"}
          </p>
          {!flexibleMonth ? (
            <div
              aria-label="Choose a flexible month"
              className="grid grid-cols-3 gap-2 [@media(max-width:520px)]:grid-cols-2"
            >
              {Array.from({ length: 6 }, (_, index) => {
                const month = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + index,
                  1,
                );
                return (
                  <button
                    className="min-h-12 rounded-lg border border-line px-3 text-left text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2! focus-visible:outline-brand!"
                    key={toDateKey(month)}
                    onClick={() => setFlexibleMonth(month)}
                    type="button"
                  >
                    {MONTH_FORMATTER.format(month)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button
                className="mb-3 min-h-9 rounded-full border border-line px-3 text-xs font-medium text-ink focus-visible:outline-2! focus-visible:outline-brand!"
                onClick={() => setFlexibleMonth(null)}
                type="button"
              >
                Change month
              </button>
              <SearchCalendarMonth
                month={flexibleMonth}
                onSelect={onSelect}
                selectedDate={selectedDate}
              />
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">
            Choose one exact move-in day. Availability is checked for that day.
          </p>
        </div>
      )}
    </div>
  );
}
