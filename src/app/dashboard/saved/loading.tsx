// Path: src/app/dashboard/saved/loading.tsx
import { SkeletonCard } from "@/components/ui/shared";

export default function SavedLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading saved hostels">
      <div
        className="skeleton mb-6 rounded-[var(--radius-sm)]"
        style={{ width: 100, height: 16 }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}