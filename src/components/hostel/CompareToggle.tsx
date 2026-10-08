"use client";

// Path: src/components/hostel/CompareToggle.tsx

import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  isSelected: boolean;
  isDisabled: boolean;  // when 3 already selected and this one isn't
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Deliberately unpositioned — no absolute/inset classes here. This has to
 * compose as a sibling of HostelCard's <Link> (never nested inside it,
 * since a <button> inside an <a> is invalid HTML), so wherever it's used
 * owns the positioning via className. See HostelCard's `extraActions` prop.
 */
export function CompareToggle({ name, isSelected, isDisabled, onToggle, className }: Props) {
  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      aria-label={isSelected ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-full)] border text-[11px] font-[500] shadow-[var(--shadow-xs)] transition-all duration-[150ms]",
        isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[color:var(--color-text-inverse)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[color:var(--color-text-muted)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:border-[var(--color-primary)] hover:text-[color:var(--color-primary-deep)]",
        isDisabled && !isSelected && "pointer-events-none opacity-30",
        className
      )}
    >
      {isSelected
        ? <><Check size={11} strokeWidth={2.5} aria-hidden="true" /> Added</>
        : <><Plus  size={11} strokeWidth={2.5} aria-hidden="true" /> Compare</>}
    </button>
  );
}
