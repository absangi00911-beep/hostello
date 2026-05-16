// Path: src/app/dashboard/price-alerts/loading.tsx
import { SkeletonDashboardRow } from "@/components/ui/shared";

export default function PriceAlertsLoading() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading price alerts">
      <div
        className="skeleton rounded-[var(--radius-sm)]"
        style={{ width: 160, height: 16 }}
      />
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonDashboardRow key={i} />
        ))}
      </div>
    </div>
  );
}