export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="h-screen bg-[var(--color-primary-950)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-48 space-y-6">
          <div className="h-4 w-48 skeleton rounded-full opacity-30" />
          <div className="space-y-3">
            <div className="h-14 w-2/3 skeleton rounded-xl opacity-20" />
            <div className="h-14 w-1/2 skeleton rounded-xl opacity-20" />
          </div>
          <div className="h-5 w-96 max-w-full skeleton rounded opacity-20" />
          <div className="flex gap-3 mt-6">
            <div className="h-12 flex-1 max-w-md skeleton rounded-xl opacity-20" />
            <div className="h-12 w-36 skeleton rounded-xl opacity-20" />
            <div className="h-12 w-28 skeleton rounded-xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Trust banner skeleton */}
      <div className="py-14 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 skeleton rounded-xl flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 skeleton rounded" />
                <div className="h-3 w-full skeleton rounded" />
                <div className="h-3 w-3/4 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
