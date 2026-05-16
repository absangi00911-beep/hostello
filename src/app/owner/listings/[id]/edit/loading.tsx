// Path: src/app/owner/listings/[id]/edit/loading.tsx
export default function EditListingLoading() {
  return (
    <div className="py-2 animate-pulse">
      {/* Heading skeleton */}
      <div className="mb-8 space-y-2">
        <div
          className="h-7 w-36 rounded-[var(--radius-md)]"
          style={{ background: "var(--color-bg-overlay)" }}
        />
        <div
          className="h-4 w-48 rounded-[var(--radius-sm)]"
          style={{ background: "var(--color-bg-overlay)" }}
        />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-8 space-y-2">
        <div
          className="h-1 w-full rounded-full"
          style={{ background: "var(--color-bg-overlay)" }}
        />
        <div
          className="h-3 w-32 rounded-[var(--radius-sm)]"
          style={{ background: "var(--color-bg-overlay)" }}
        />
      </div>

      {/* Form fields skeleton */}
      <div className="mx-auto max-w-[640px] space-y-5">
        {[120, 96, 80, 80].map((h, i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-3 w-24 rounded-[var(--radius-sm)]"
              style={{ background: "var(--color-bg-overlay)" }}
            />
            <div
              className="w-full rounded-[var(--radius-md)]"
              style={{ height: h, background: "var(--color-bg-overlay)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}