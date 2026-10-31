"use client";

import { Search } from "lucide-react";
import type {
  FormEvent,
  KeyboardEvent,
  ReactNode,
} from "react";

export type SearchPillPanel = "where" | "date" | "students" | null;

interface SearchPillFormProps {
  activePanel: SearchPillPanel;
  children: ReactNode;
  destination: string;
  inDialog: boolean;
  moveInDate: string;
  studentCount: number;
  onClearDestination: () => void;
  onDestinationChange: (value: string) => void;
  onDestinationFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLFormElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleDate: () => void;
  onToggleStudents: () => void;
}

function formatMoveInDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function SearchPillForm({
  activePanel,
  children,
  destination,
  inDialog,
  moveInDate,
  studentCount,
  onClearDestination,
  onDestinationChange,
  onDestinationFocus,
  onKeyDown,
  onSubmit,
  onToggleDate,
  onToggleStudents,
}: SearchPillFormProps) {
  const dateSummary = moveInDate ? formatMoveInDate(moveInDate) : "Add dates";

  return (
    <form
      className={`relative mx-auto grid min-h-16 w-[min(640px,100%)] grid-cols-3 items-stretch gap-0 rounded-full border border-[#ededed] bg-[#f4f4f4] p-1 shadow-[0_2px_8px_rgb(0_0_0/7%)] transition-shadow duration-[180ms] focus-within:shadow-[0_3px_10px_rgb(0_0_0/10%)] [@media(max-width:960px)]:w-[min(640px,100%)] [@media(max-width:720px)]:grid-cols-2 [@media(max-width:720px)]:rounded-[23px]${inDialog ? " [@media(max-width:720px)]:mx-0" : " [@media(max-width:720px)]:hidden"}`}
      onKeyDown={onKeyDown}
      onSubmit={onSubmit}
      role="search"
    >
      <div className={`peer/where group/where flex min-h-14 min-w-0 cursor-text flex-col justify-center gap-px rounded-full px-5 transition-[background-color,box-shadow] duration-150 [@media(hover:hover)]:hover:bg-white [@media(hover:hover)]:hover:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-within:bg-white focus-within:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-within:ring-2 focus-within:ring-brand/30 motion-reduce:transition-none${activePanel === "where" ? " bg-white shadow-[0_1px_4px_rgb(0_0_0/12%)]" : ""} [@media(max-width:720px)]:col-span-full [@media(max-width:720px)]:min-h-12 [@media(max-width:720px)]:rounded-full [@media(max-width:720px)]:border-b [@media(max-width:720px)]:border-line [@media(max-width:720px)]:pb-[7px]`}>
        <label
          className="text-[0.68rem] leading-[1.3] font-semibold text-ink"
          htmlFor={inDialog ? "mobile-destination" : "desktop-destination"}
        >
          Where
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <input
            aria-label="Destination"
            autoComplete="off"
            className="w-full min-w-0 border-0 bg-transparent p-0 text-[0.76rem] leading-[1.4] text-muted outline-none focus-visible:outline-none! placeholder:text-muted placeholder:opacity-100"
            id={inDialog ? "mobile-destination" : "desktop-destination"}
            onChange={(event) => onDestinationChange(event.target.value)}
            onFocus={onDestinationFocus}
            placeholder="Search destinations"
            type="search"
            value={destination}
          />
          {destination && (
            <button
              aria-label="Clear destination"
              className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-muted underline underline-offset-2 focus-visible:outline-2! focus-visible:outline-brand!"
              onClick={onClearDestination}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className={`peer/move-in group/move-in relative flex min-h-14 min-w-0 cursor-pointer flex-col justify-center gap-px rounded-full px-5 transition-[background-color,box-shadow] duration-150 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-px before:bg-line before:transition-opacity peer-hover/where:before:opacity-0 peer-focus/where:before:opacity-0 [@media(hover:hover)]:hover:bg-white [@media(hover:hover)]:hover:before:opacity-0 [@media(hover:hover)]:hover:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-within:bg-white focus-within:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-within:ring-2 focus-within:ring-brand/30 motion-reduce:transition-none${activePanel === "date" ? " bg-white shadow-[0_1px_4px_rgb(0_0_0/12%)] before:opacity-0" : ""} [@media(max-width:720px)]:min-h-12 [@media(max-width:720px)]:pl-3 [@media(max-width:720px)]:before:opacity-0`}>
        <span className="text-[0.68rem] leading-[1.3] font-semibold text-ink">
          Move-in
        </span>
        <button
          aria-expanded={activePanel === "date"}
          aria-label="Move-in date"
          className="min-h-[21px] w-full cursor-pointer border-0 bg-transparent p-0 text-left text-[0.76rem] leading-[1.4] text-muted outline-none focus-visible:outline-none!"
          onClick={onToggleDate}
          type="button"
        >
          {dateSummary}
        </button>
      </div>
      <div
        aria-label="Guests and search"
        className={`relative flex min-h-14 min-w-0 items-center justify-between rounded-full pr-1 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-px before:bg-line before:transition-opacity peer-hover/move-in:before:opacity-0 peer-focus/move-in:before:opacity-0${activePanel === "students" ? " bg-white shadow-[0_1px_4px_rgb(0_0_0/12%)] before:opacity-0" : ""} [@media(max-width:720px)]:min-h-12 [@media(max-width:720px)]:before:top-3 [@media(max-width:720px)]:before:bottom-3`}
        role="group"
      >
        <button
          aria-expanded={activePanel === "students"}
          aria-label="Guests"
          className={`flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col justify-center gap-px rounded-full border-0 bg-transparent px-5 text-left transition-[background-color,box-shadow] duration-150 hover:bg-white hover:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-visible:bg-white focus-visible:shadow-[0_1px_4px_rgb(0_0_0/12%)] focus-visible:outline-2! focus-visible:outline-brand! motion-reduce:transition-none${activePanel === "students" ? " bg-white shadow-[0_1px_4px_rgb(0_0_0/12%)]" : ""} [@media(max-width:720px)]:min-h-11 [@media(max-width:720px)]:px-3`}
          onClick={onToggleStudents}
          type="button"
        >
          <span className="text-[0.68rem] leading-[1.3] font-semibold text-ink">
            Guests
          </span>
          <span className="truncate text-[0.76rem] leading-[1.4] text-muted">
            {studentCount} {studentCount === 1 ? "student" : "students"}
          </span>
        </button>
        <button
          aria-label="Search hostels"
          className="search-pill-submit grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-brand text-white transition-[background-color,transform] duration-[160ms] hover:scale-[1.04] hover:bg-brand-dark active:scale-[0.94] [@media(max-width:720px)]:h-10 [@media(max-width:720px)]:w-10 motion-reduce:hover:transform-none! motion-reduce:active:transform-none!"
          type="submit"
        >
          <Search aria-hidden="true" size={18} />
        </button>
      </div>
      {children}
    </form>
  );
}
