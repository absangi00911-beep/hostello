import type { ReactNode } from "react";

export type StatusTone = "info" | "warning" | "danger" | "neutral";

/**
 * Status colours follow DESIGN.md: warning and danger share the warn-soft surface and differ
 * in text colour, so the label itself must always say what the status is. Never rely on the
 * colour alone, and always pass the human-readable status as children.
 */
const toneClassNames: Record<StatusTone, string> = {
  info: "bg-brand-soft text-brand-dark",
  warning: "bg-warn-soft text-warn-ink",
  danger: "bg-warn-soft text-danger",
  neutral: "bg-surface-muted text-muted",
};

export function StatusBadge({
  children,
  status,
  tone,
}: {
  children: ReactNode;
  /** Lower-case machine status exposed as `data-status` for tests and styling hooks. */
  status?: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md px-2.5 text-meta font-semibold ${toneClassNames[tone]}`}
      data-status={status}
    >
      {children}
    </span>
  );
}

/** One mapping for booking statuses so students and owners see the same colour. */
export const bookingStatusTone = {
  PENDING: "warning",
  CONFIRMED: "info",
  COMPLETED: "neutral",
  CANCELLED: "danger",
} as const satisfies Record<string, StatusTone>;
