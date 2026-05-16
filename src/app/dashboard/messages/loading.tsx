// Path: src/app/dashboard/messages/loading.tsx
import { SkeletonDashboardRow } from "@/components/ui/shared";

export default function MessagesLoading() {
  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden animate-pulse"
      aria-label="Loading messages"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonDashboardRow key={i} />
      ))}
    </div>
  );
}