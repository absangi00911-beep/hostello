// Path: src/app/dashboard/bookings/loading.tsx
export default function BookingsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading bookings">
      <div className="skeleton h-7 w-40 rounded-[var(--radius-sm)]" />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24 rounded-[var(--radius-lg)]" />
        ))}
      </div>

      {/* Tab strip */}
      <div className="flex gap-2">
        {[90, 100, 90].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-[var(--radius-sm)]" style={{ width: w }} />
        ))}
      </div>

      {/* Featured card */}
      <div className="skeleton h-48 rounded-[var(--radius-lg)]" />
    </div>
  );
}
