"use client";

import { useRouter } from "next/navigation";
import { X, ArrowRight, BarChart2 } from "lucide-react";

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareTray({ items, onRemove, onClear }: Props) {
  const router = useRouter();
  if (items.length === 0) return null;

  function handleCompare() {
    const ids = items.map((i) => i.id).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  return (
    <div
      role="region"
      aria-label="Hostel comparison tray"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl"
    >
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)] px-4 py-3">
        {/* Icon */}
        <BarChart2 size={18} strokeWidth={1.5} className="text-[var(--color-primary)] shrink-0" aria-hidden="true" />

        {/* Selected hostels */}
        <div className="flex flex-1 flex-wrap gap-2 min-w-0">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-faint)] px-2.5 py-1 text-[11px] font-[500] text-[var(--color-primary-deep)] max-w-[160px]"
            >
              <span className="truncate">{item.name}</span>
              <button
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.name} from comparison`}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={10} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </span>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className="inline-flex h-7 w-24 items-center justify-center rounded-full border border-dashed border-[var(--color-border-default)] text-[11px] text-[var(--color-text-muted)]"
              aria-hidden="true"
            >
              + add hostel
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCompare}
            disabled={items.length < 2}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[12px] font-[500] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-primary-deep)] transition-colors"
          >
            Compare
            <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
