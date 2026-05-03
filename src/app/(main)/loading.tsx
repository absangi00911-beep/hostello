import { Skeleton, SkeletonText, SkeletonGrid } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="h-screen bg-[var(--color-ground)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-48 space-y-6">
          <Skeleton variant="circle" width="w-48" height="h-4" />
          <div className="space-y-3">
            <Skeleton variant="text" height="h-14" width="w-2/3" />
            <Skeleton variant="text" height="h-14" width="w-1/2" />
          </div>
          <Skeleton variant="text" height="h-5" width="w-96 max-w-full" />
          <div className="flex gap-3 mt-6">
            <Skeleton variant="rect" height="h-12" width="flex-1 max-w-md" />
            <Skeleton variant="rect" height="h-12" width="w-36" />
            <Skeleton variant="rect" height="h-12" width="w-28" />
          </div>
        </div>
      </div>

      {/* Trust banner skeleton */}
      <div className="py-14 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton variant="circle" width="w-10" height="h-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" height="h-4" width="w-28" />
                <Skeleton variant="text" height="h-3" width="w-full" />
                <Skeleton variant="text" height="h-3" width="w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
