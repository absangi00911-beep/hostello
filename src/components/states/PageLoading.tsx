import { siteCopy } from "@/lib/site-copy";

/** Lightweight skeleton shown while a route segment streams in. */
export function PageLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-[min(1120px,calc(100%-40px))] py-10"
      role="status"
    >
      <span className="sr-only">{siteCopy.states.loading}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="h-8 w-2/3 max-w-[360px] rounded-[8px] bg-surface-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-[220px] rounded-[14px] bg-surface-muted" key={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
