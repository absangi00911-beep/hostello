import { HostelCardSkeleton } from "@/components/features/hostels/hostel-card";

export default function HostelsLoading() {
  return (
    <div className="min-h-screen pt-16">
      {/* Header skeleton */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="h-7 w-48 skeleton rounded-lg" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-9 w-full skeleton rounded-lg" />
                </div>
              ))}
            </div>
          </aside>

          {/* Results skeleton */}
          <div className="flex-1 min-w-0">
            <div className="h-4 w-32 skeleton rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <HostelCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
