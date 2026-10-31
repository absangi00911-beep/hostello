"use client";

import { GraduationCap, Minus, Plus } from "lucide-react";

interface SearchStudentPickerProps {
  count: number;
  onChange: (count: number) => void;
  onDone: () => void;
}

export function SearchStudentPicker({
  count,
  onChange,
  onDone,
}: SearchStudentPickerProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-[#f5f5f4] text-ink">
            <GraduationCap aria-hidden="true" size={19} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Students</span>
            <span className="mt-1 block text-xs text-muted">
              Looking for a monthly stay
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Decrease students"
            className="grid size-9 place-items-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2! focus-visible:outline-brand!"
            disabled={count <= 1}
            onClick={() => onChange(Math.max(1, count - 1))}
            type="button"
          >
            <Minus aria-hidden="true" size={15} />
          </button>
          <span aria-live="polite" className="w-5 text-center text-sm font-medium">
            {count}
          </span>
          <button
            aria-label="Increase students"
            className="grid size-9 place-items-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2! focus-visible:outline-brand!"
            disabled={count >= 8}
            onClick={() => onChange(Math.min(8, count + 1))}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
      <p className="mt-3 mb-4 text-xs text-muted">Search for 1-8 students.</p>
      <button
        className="ml-auto block min-h-9 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2! focus-visible:outline-brand focus-visible:outline-offset-2!"
        onClick={onDone}
        type="button"
      >
        Done
      </button>
    </div>
  );
}
