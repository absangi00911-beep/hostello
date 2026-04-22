"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DURATIONS = [1, 2, 3, 4, 5, 6, 9, 12];

const SELECT =
  "h-10 w-full rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all appearance-none cursor-pointer";

interface MoveInPickerProps {
  /** "YYYY-MM" */
  value: string;
  onChange: (v: string) => void;
}

export function MoveInPicker({ value, onChange }: MoveInPickerProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const selectedYear = value ? parseInt(value.split("-")[0], 10) : currentYear;
  const selectedMonth = value ? value.split("-")[1] : "";

  const years = [currentYear, currentYear + 1, currentYear + 2];

  const availableMonths = MONTHS.filter((m) => {
    if (selectedYear > currentYear) return true;
    return parseInt(m.value, 10) >= currentMonth;
  });

  function emit(year: number, month: string) {
    if (month) onChange(`${year}-${month}`);
    else onChange("");
  }

  function handleMonthChange(month: string) {
    emit(selectedYear, month);
  }

  function handleYearChange(yearStr: string) {
    const year = parseInt(yearStr);
    // If the current selected month is no longer valid, reset it
    if (selectedMonth) {
      const monthNum = parseInt(selectedMonth);
      const minMonth = year === currentYear ? currentMonth : 1;
      if (monthNum < minMonth) {
        emit(year, String(minMonth).padStart(2, "0"));
      } else {
        emit(year, selectedMonth);
      }
    } else {
      emit(year, "");
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
        Move-in month
      </label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)] pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={cn(SELECT, "pl-8")}
          >
            <option value="">Month</option>
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className={cn(SELECT, "w-[4.5rem] px-2")}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface DurationPickerProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function DurationPicker({ value, onChange, min = 1, max = 24 }: DurationPickerProps) {
  const options = DURATIONS.filter((d) => d >= min && d <= max);
  // Always include the min if not already present
  if (!options.includes(min)) options.unshift(min);

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
        Duration
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(SELECT, "px-3")}
      >
        {options.map((d) => (
          <option key={d} value={d}>
            {d} month{d !== 1 ? "s" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Convert "YYYY-MM" + duration months → ISO date string for checkOut */
export function addMonths(yearMonth: string, months: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

/** Convert "YYYY-MM" → first day ISO string */
export function monthToDateStr(yearMonth: string): string {
  return `${yearMonth}-01`;
}
