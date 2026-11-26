"use client";

interface SearchCalendarMonthProps {
  month: Date;
  selectedDate: string;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCalendarDays(month: Date): (Date | null)[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
  ).getDate();
  return [
    ...Array.from({ length: firstDay.getDay() }, () => null),
    ...Array.from(
      { length: dayCount },
      (_, index) =>
        new Date(firstDay.getFullYear(), firstDay.getMonth(), index + 1),
    ),
  ];
}

export function SearchCalendarMonth({
  month,
  selectedDate,
  onSelect,
}: SearchCalendarMonthProps) {
  const today = toDateKey(new Date());
  const monthDays = getCalendarDays(month);

  return (
    <section
      aria-label={MONTH_FORMATTER.format(month)}
      className="mx-auto w-full max-w-[390px] min-w-0"
    >
      <h3 className="mb-3 text-left text-label font-semibold text-ink">
        {MONTH_FORMATTER.format(month)}
      </h3>
      <div
        aria-label={`${MONTH_FORMATTER.format(month)} calendar`}
        className="grid grid-cols-7 gap-y-1.5 text-center"
      >
        {WEEKDAYS.map((weekday) => (
          <span
            aria-hidden="true"
            className="min-h-9 pb-2 text-label font-medium text-muted"
            key={weekday}
          >
            {weekday}
          </span>
        ))}
        {monthDays.map((day, index) =>
          day ? (
            <button
              aria-label={DAY_FORMATTER.format(day)}
              aria-current={today === toDateKey(day) ? "date" : undefined}
              aria-pressed={selectedDate === toDateKey(day)}
              className="mx-auto grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-label font-medium text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand-dark aria-[current=date]:border aria-[current=date]:border-brand aria-pressed:bg-brand aria-pressed:text-white aria-pressed:hover:bg-brand-dark aria-pressed:hover:text-white disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted/45 disabled:hover:bg-transparent disabled:hover:text-muted/45 focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-2!"
              disabled={toDateKey(day) < today}
              key={toDateKey(day)}
              onClick={() => onSelect(toDateKey(day))}
              type="button"
            >
              {day.getDate()}
            </button>
          ) : (
            <span aria-hidden="true" key={`empty-${index}`} />
          ),
        )}
      </div>
    </section>
  );
}
