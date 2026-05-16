// Path: src/app/dashboard/notifications/loading.tsx
import { SkeletonDashboardRow } from "@/components/ui/shared";

export default function NotificationsLoading() {
  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden animate-pulse"
      aria-label="Loading notifications"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonDashboardRow key={i} />
      ))}
    </div>
  );
}