// Path: src/app/hostels/loading.tsx
import { SkeletonCard } from "@/components/ui/shared";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function HostelsLoading() {
  return (
    <PublicLayout noFooter>
      <div className="container-app py-8 animate-pulse">
        {/* Search bar skeleton */}
        <div className="mb-6 flex gap-3">
          <div
            className="skeleton flex-1 rounded-[var(--radius-md)]"
            style={{ height: 44 }}
          />
          <div
            className="skeleton w-24 rounded-[var(--radius-md)]"
            style={{ height: 44 }}
          />
        </div>
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <aside
            className="hidden lg:block shrink-0 space-y-4"
            style={{ width: 240 }}
            aria-hidden="true"
          >
            {[120, 160, 100, 140].map((h, i) => (
              <div
                key={i}
                className="skeleton rounded-[var(--radius-lg)]"
                style={{ height: h }}
              />
            ))}
          </aside>
          {/* Cards grid skeleton */}
          <div className="flex-1">
            <div
              className="skeleton mb-4 rounded-[var(--radius-sm)]"
              style={{ width: 120, height: 16 }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}