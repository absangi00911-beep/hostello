export default function DashboardLoading() {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-10 space-y-2">
          <div className="h-3 w-28 skeleton rounded" />
          <div className="h-9 w-52 skeleton rounded-xl" />
          <div className="h-3.5 w-40 skeleton rounded" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <div className="w-9 h-9 skeleton rounded-xl mb-3" />
              <div className="h-7 w-14 skeleton rounded mb-1.5" />
              <div className="h-3 w-20 skeleton rounded" />
            </div>
          ))}
        </div>

        {/* Section */}
        <div className="h-5 w-32 skeleton rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex gap-4">
              <div className="w-16 h-16 skeleton rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 skeleton rounded" />
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-3 w-28 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Booking rows */}
        <div className="h-5 w-40 skeleton rounded mb-4" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-4">
              <div className="w-9 h-9 skeleton rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-44 skeleton rounded" />
                <div className="h-3 w-60 skeleton rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 skeleton rounded" />
                <div className="h-6 w-20 skeleton rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
