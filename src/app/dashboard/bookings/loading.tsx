// Path: src/app/dashboard/bookings/loading.tsx
import { SkeletonBookingRow } from "@/components/ui/shared";

export default function BookingsLoading() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading bookings">
      {/* Tab strip */}
      <div className="flex gap-2 mb-2">
        {[60, 40, 70, 60, 80].map((w, i) => (
          <div
            key={i}
            className="skeleton h-8 rounded-full"
            style={{ width: w }}
          />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBookingRow key={i} />
      ))}
    </div>
  );
}