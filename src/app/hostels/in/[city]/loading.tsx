// Path: src/app/hostels/in/[city]/loading.tsx
export default function CityLandingLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div
        className="border-b border-[var(--color-border-subtle)]"
        style={{ background: "var(--color-bg-raised)" }}
      >
        <div className="container-app py-10 md:py-14 space-y-4">
          <div className="h-3 w-32 rounded-full" style={{ background: "var(--color-bg-overlay)" }} />
          <div className="h-9 w-64 rounded-[var(--radius-md)]" style={{ background: "var(--color-bg-overlay)" }} />
          <div className="h-4 w-80 rounded-[var(--radius-sm)]" style={{ background: "var(--color-bg-overlay)" }} />
          <div className="flex gap-2">
            {[60, 80, 90, 60].map((w, i) => (
              <div key={i} className="h-8 rounded-full" style={{ width: w, background: "var(--color-bg-overlay)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="container-app py-10">
        <div className="h-6 w-40 rounded-[var(--radius-md)] mb-6" style={{ background: "var(--color-bg-overlay)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-xl)] overflow-hidden border"
              style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-card)" }}
            >
              <div className="h-44" style={{ background: "var(--color-bg-overlay)" }} />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded" style={{ background: "var(--color-bg-overlay)" }} />
                <div className="h-5 w-1/3 rounded" style={{ background: "var(--color-bg-overlay)" }} />
                <div className="flex gap-2">
                  {[50, 60, 45].map((w, j) => (
                    <div key={j} className="h-5 rounded-full" style={{ width: w, background: "var(--color-bg-overlay)" }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}