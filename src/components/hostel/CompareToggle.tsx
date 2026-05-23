"use client";

import { Check, Plus } from "lucide-react";

interface Props {
  name: string;
  isSelected: boolean;
  isDisabled: boolean;  // when 3 already selected and this one isn't
  onToggle: (e: React.MouseEvent) => void;
}

export function CompareToggle({ name, isSelected, isDisabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      aria-label={isSelected ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
      aria-pressed={isSelected}
      className={`
        absolute top-3 left-3 z-10
        flex items-center gap-1.5 h-7 px-2.5
        rounded-full border text-[11px] font-[500]
        transition-all duration-[150ms]
        opacity-0 group-hover:opacity-100 focus-visible:opacity-100
        ${isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white opacity-100"
          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-deep)]"}
        ${isDisabled && !isSelected ? "pointer-events-none opacity-30" : ""}
      `}
    >
      {isSelected
        ? <><Check size={11} strokeWidth={2.5} aria-hidden="true" /> Added</>
        : <><Plus  size={11} strokeWidth={2.5} aria-hidden="true" /> Compare</>}
    </button>
  );
}
