export default function HostelDetailLoading() {
  return (
    <div className="min-h-screen pt-16">
      {/* Gallery skeleton */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96">
        <div className="col-span-2 row-span-2 skeleton rounded-l-2xl" />
        <div className="skeleton" />
        <div className="skeleton rounded-tr-2xl" />
        <div className="skeleton" />
        <div className="skeleton rounded-br-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-6 w-20 skeleton rounded-full" />
                <div className="h-6 w-20 skeleton rounded-full" />
              </div>
              <div className="h-9 w-3/4 skeleton rounded-xl" />
              <div className="flex gap-4">
                <div className="h-4 w-32 skeleton rounded" />
                <div className="h-4 w-24 skeleton rounded" />
              </div>
              <div className="h-12 w-44 skeleton rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
                <div className="h-4 w-4/6 skeleton rounded" />
              </div>
            </div>

            {/* Amenities skeleton */}
            <div>
              <div className="h-6 w-36 skeleton rounded mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-12 skeleton rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="h-96 skeleton rounded-2xl" />
            <div className="h-40 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
