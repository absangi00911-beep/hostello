import { LucideIcon, AlertCircle, Loader2 } from "lucide-react";

/* ── EmptyState ──────────────────────────────────────────── */
interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon
        size={40}
        strokeWidth={1.5}
        className="text-[var(--color-text-muted)] mb-4"
        aria-hidden="true"
      />
      <h3 className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] mb-2"
          style={{ fontFamily: "var(--font-body)" }}>
        {heading}
      </h3>
      {description && (
        <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-[55ch] mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── PageSpinner ─────────────────────────────────────────── */
export function PageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label={label}>
      <Loader2
        size={24}
        strokeWidth={1.5}
        className="animate-spin text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/* ── InlineError ─────────────────────────────────────────── */
export function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3"
    >
      <AlertCircle
        size={16}
        strokeWidth={1.5}
        className="text-[var(--color-error)] shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)]">{message}</p>
    </div>
  );
}

/* ── StatusBadge ─────────────────────────────────────────── */
type BadgeVariant =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "active"
  | "draft"
  | "pending_review"
  | "suspended"
  | "paid"
  | "refunded"
  | "failed"
  | "verified"
  | "male"
  | "female"
  | "mixed";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  pending:        "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  confirmed:      "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  cancelled:      "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  completed:      "bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  active:         "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  draft:          "bg-[var(--color-bg-sidebar)] text-[var(--color-text-muted)]",
  pending_review: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  suspended:      "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  paid:           "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  refunded:       "bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  failed:         "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  verified:       "bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)]",
  male:           "bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  female:         "bg-[oklch(0.97_0.02_340)] text-[oklch(0.45_0.12_340)]",
  mixed:          "bg-[var(--color-bg-sidebar)] text-[var(--color-text-muted)]",
};

const BADGE_LABELS: Record<BadgeVariant, string> = {
  pending:        "Pending",
  confirmed:      "Confirmed",
  cancelled:      "Cancelled",
  completed:      "Completed",
  active:         "Active",
  draft:          "Draft",
  pending_review: "Pending review",
  suspended:      "Suspended",
  paid:           "Paid",
  refunded:       "Refunded",
  failed:         "Failed",
  verified:       "Verified",
  male:           "Male",
  female:         "Female",
  mixed:          "Mixed",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-[600] shrink-0 ${BADGE_STYLES[variant]}`}
    >
      {label ?? BADGE_LABELS[variant]}
    </span>
  );
}

/* ── SkeletonLine / SkeletonCard ─────────────────────────── */
export function SkeletonLine({ width = "100%", height = "16px" }: { width?: string; height?: string }) {
  return (
    <span
      aria-hidden="true"
      className="skeleton block rounded-[var(--radius-sm)]"
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden"
    >
      <div className="skeleton aspect-video w-full" />
      <div className="p-4 space-y-3">
        <SkeletonLine width="70%" height="20px" />
        <SkeletonLine width="40%" height="14px" />
        <SkeletonLine width="55%" height="14px" />
      </div>
    </div>
  );
}

/* ── SearchDegradedNotice ────────────────────────────────── */
export function SearchDegradedNotice() {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-[oklch(0.68_0.15_72_/_0.25)] px-4 py-3 mb-4"
    >
      <AlertCircle
        size={16}
        strokeWidth={1.5}
        className="text-[var(--color-warning)] shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
        Search is running in fallback mode. Results may be slower.
      </p>
    </div>
  );
}

/* ── PKR formatter ───────────────────────────────────────── */
export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}